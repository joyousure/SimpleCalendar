/**
 * Desktop / Mobile / WebView compatible native OS file & folder picker + download helpers.
 * Connects export/import actions to native OS file & directory pickers where supported,
 * and gracefully handles iframe SecurityError, mobile Share Sheets, and Android WebView downloads.
 */

export interface SaveFileResult {
  ok: boolean;
  method: 'capacitor' | 'picker' | 'directory' | 'share' | 'download' | 'clipboard';
  pathHint?: string;
  error?: string;
}

export interface PickFileOptions {
  accept?: string;
  mimeTypes?: string[];
  description?: string;
}

interface CapacitorWindowLike {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    Plugins?: {
      Filesystem?: {
        writeFile?: (opts: {
          path: string;
          data: string;
          directory?: string;
          encoding?: string;
          recursive?: boolean;
        }) => Promise<{ uri?: string }>;
      };
      Share?: {
        share?: (opts: { title?: string; text?: string; url?: string; files?: string[] }) => Promise<unknown>;
      };
    };
  };
}

interface FileSystemWritableLike {
  write: (data: Blob | BufferSource | string) => Promise<void>;
  close: () => Promise<void>;
}

interface FileSystemFileHandleLike {
  name?: string;
  getFile?: () => Promise<File>;
  createWritable: () => Promise<FileSystemWritableLike>;
}

interface FileSystemDirectoryHandleLike {
  name: string;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandleLike>;
}

interface FileSystemWindowLike {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<FileSystemFileHandleLike>;
  showDirectoryPicker?: (options?: {
    mode?: 'read' | 'readwrite';
  }) => Promise<FileSystemDirectoryHandleLike>;
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    excludeAcceptAllOption?: boolean;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<FileSystemFileHandleLike[]>;
}

function getFsWindow(): FileSystemWindowLike | null {
  if (typeof window === 'undefined') return null;
  return window as unknown as FileSystemWindowLike;
}

export function supportsSystemFilePicker(): boolean {
  const fsWin = getFsWindow();
  return Boolean(fsWin && typeof fsWin.showSaveFilePicker === 'function');
}

export function supportsSystemDirectoryPicker(): boolean {
  const fsWin = getFsWindow();
  return Boolean(fsWin && typeof fsWin.showDirectoryPicker === 'function');
}

function buildPickerTypes(
  filenameOrAccept: string,
  mimeType: string,
  description?: string
): Array<{ description?: string; accept: Record<string, string[]> }> | undefined {
  const cleanMime = (mimeType || '').split(';')[0].trim() || 'application/octet-stream';
  const extMatch = filenameOrAccept.match(/\.[a-z0-9]+$/i);
  if (extMatch) {
    return [
      {
        description: description || `${extMatch[0].toUpperCase()} File`,
        accept: {
          [cleanMime]: [extMatch[0].toLowerCase()],
        },
      },
    ];
  }
  return undefined;
}

function buildOpenPickerTypes(opts?: PickFileOptions):
  | Array<{ description?: string; accept: Record<string, string[]> }>
  | undefined {
  if (!opts?.accept) return undefined;
  const exts = opts.accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.startsWith('.'));
  const mimes = (opts.mimeTypes && opts.mimeTypes.length > 0)
    ? opts.mimeTypes
    : opts.accept.includes('image/*')
      ? ['image/*']
      : ['application/octet-stream'];

  if (exts.length > 0) {
    const acceptMap: Record<string, string[]> = {};
    mimes.forEach((m) => {
      acceptMap[m] = exts;
    });
    return [{ description: opts.description || 'Supported Files', accept: acceptMap }];
  }
  if (opts.accept.includes('image/*')) {
    return [
      {
        description: opts.description || 'Images',
        accept: {
          'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'],
        },
      },
    ];
  }
  return undefined;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = res.indexOf(',');
      resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to encode file'));
    reader.readAsDataURL(blob);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Empty data URL'));
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Prompts the user to pick an OS target folder directly via showDirectoryPicker,
 * writing the exported file right inside that folder. Falls back automatically
 * to saveFileToDevice() when showDirectoryPicker is unsupported or blocked in an iframe.
 */
export async function saveFileToChosenDirectory(
  filename: string,
  content: string | Blob,
  mimeType: string = 'application/octet-stream'
): Promise<SaveFileResult> {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], { type: mimeType });

  const fsWin = getFsWindow();
  if (fsWin?.showDirectoryPicker) {
    try {
      const dirHandle = await fsWin.showDirectoryPicker({ mode: 'readwrite' });
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return {
        ok: true,
        method: 'directory',
        pathHint: `${dirHandle.name}/${filename}`,
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { ok: false, method: 'directory', error: 'cancelled' };
      }
      // SecurityError / NotAllowedError in sandboxed iframe -> fall back gracefully
    }
  }

  return saveFileToDevice(filename, blob, mimeType);
}

export async function saveFileToDevice(
  filename: string,
  content: string | Blob,
  mimeType: string = 'application/octet-stream'
): Promise<SaveFileResult> {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], { type: mimeType });

  const capWin = typeof window !== 'undefined' ? (window as unknown as CapacitorWindowLike) : null;
  const isNativeCap = Boolean(capWin?.Capacitor?.isNativePlatform?.());
  const isAndroidWebView =
    typeof navigator !== 'undefined' &&
    (/Android/i.test(navigator.userAgent) && (/; wv\)/i.test(navigator.userAgent) || isNativeCap));

  // 1. Native Capacitor Filesystem + Share sheet (best UX on Android/iOS APK)
  const fsPlugin = capWin?.Capacitor?.Plugins?.Filesystem;
  const sharePlugin = capWin?.Capacitor?.Plugins?.Share;
  if (isNativeCap && fsPlugin?.writeFile) {
    try {
      const base64 = await blobToBase64(blob);
      const written = await fsPlugin.writeFile({
        path: filename,
        data: base64,
        directory: 'CACHE',
        recursive: true,
      });
      if (written?.uri && sharePlugin?.share) {
        await sharePlugin.share({
          title: filename,
          url: written.uri,
        });
        return { ok: true, method: 'capacitor', pathHint: written.uri };
      }
      await fsPlugin.writeFile({
        path: `CalendarApp/${filename}`,
        data: base64,
        directory: 'DOCUMENTS',
        recursive: true,
      });
      return { ok: true, method: 'capacitor', pathHint: `Documents/CalendarApp/${filename}` };
    } catch {
      // Fall through to OS Save Picker / Web Share / anchor download
    }
  }

  // 2. Desktop / Chrome / Edge File System Access API (opens native OS folder + Save As dialog)
  const fsWin = getFsWindow();
  if (!isAndroidWebView && fsWin?.showSaveFilePicker) {
    try {
      const handle = await fsWin.showSaveFilePicker({
        suggestedName: filename,
        types: buildPickerTypes(filename, mimeType),
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return {
        ok: true,
        method: 'picker',
        pathHint: handle.name || filename,
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { ok: false, method: 'picker', error: 'cancelled' };
      }
      // SecurityError in iframe or unsupported context -> fall through cleanly
    }
  }

  // 3. Android WebView / mobile Safari Web Share with File object (OS Save to Files / Share sheet)
  if (
    (isAndroidWebView || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '')) &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof File !== 'undefined'
  ) {
    try {
      const fileObj = new File([blob], filename, { type: mimeType || blob.type || 'application/octet-stream' });
      const navShare = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (!navShare.canShare || navShare.canShare({ files: [fileObj] })) {
        await navigator.share({
          title: filename,
          files: [fileObj],
        });
        return { ok: true, method: 'share' };
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { ok: false, method: 'share', error: 'cancelled' };
      }
    }
  }

  // 4. Anchor download (data: URL for <= 1.8MB in Android WebView; blob: URL with delayed cleanup elsewhere)
  try {
    let href: string;
    let shouldRevoke = false;

    if (isAndroidWebView && blob.size <= 1_800_000) {
      href = await blobToDataUrl(blob);
    } else {
      href = URL.createObjectURL(blob);
      shouldRevoke = true;
    }

    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.rel = 'noopener noreferrer';
    a.style.position = 'fixed';
    a.style.opacity = '0';
    a.style.pointerEvents = 'none';
    document.body.appendChild(a);
    a.click();

    window.setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch {}
      if (shouldRevoke) {
        try {
          URL.revokeObjectURL(href);
        } catch {}
      }
    }, 15_000);

    return { ok: true, method: 'download' };
  } catch (err) {
    return {
      ok: false,
      method: 'download',
      error: err instanceof Error ? err.message : 'Download failed',
    };
  }
}

/**
 * Opens native OS file picker (`window.showOpenFilePicker`) first so users can browse system folders,
 * and falls back cleanly to a body-attached `<input type="file">` dialog on mobile/WebView/iframes.
 * Returns `null` when user cancels.
 */
export async function pickFileFromDevice(opts?: PickFileOptions): Promise<File | null> {
  const fsWin = getFsWindow();
  if (fsWin?.showOpenFilePicker) {
    try {
      const types = buildOpenPickerTypes(opts);
      const handles = await fsWin.showOpenFilePicker({
        multiple: false,
        excludeAcceptAllOption: false,
        ...(types ? { types } : {}),
      });
      const firstHandle = handles?.[0];
      if (firstHandle?.getFile) {
        return await firstHandle.getFile();
      }
      return null;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return null;
      }
      // SecurityError or NotAllowedError in iframe -> fall back to hidden <input type="file">
    }
  }

  return new Promise<File | null>((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    if (opts?.accept) input.accept = opts.accept;
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '-9999px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);

    let settled = false;
    const cleanup = (file: File | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('focus', handleWindowFocus, true);
      window.setTimeout(() => {
        try {
          document.body.removeChild(input);
        } catch {}
      }, 200);
      resolve(file);
    };

    const handleWindowFocus = () => {
      window.setTimeout(() => {
        if (!settled && (!input.files || input.files.length === 0)) {
          cleanup(null);
        }
      }, 350);
    };

    input.addEventListener(
      'change',
      () => {
        const picked = input.files?.[0] || null;
        cleanup(picked);
      },
      { once: true }
    );

    input.addEventListener(
      'cancel',
      () => {
        cleanup(null);
      },
      { once: true }
    );

    window.addEventListener('focus', handleWindowFocus, true);
    input.click();
  });
}

/**
 * Resizes & compresses user-selected images cleanly for offline storage
 * (avoids silent localStorage 5MB quota overflow from high-res mobile camera photos).
 */
export async function compressImageFileToDataUrl(
  file: File,
  maxDimension: number = 1280,
  quality: number = 0.8
): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result) {
        resolve(reader.result);
      } else {
        reject(new Error('Empty file data'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('File read error'));
    reader.readAsDataURL(file);
  });

  if (file.type === 'image/svg+xml' || file.size <= 180_000) {
    return rawDataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (!w || !h) {
          resolve(rawDataUrl);
          return;
        }
        const scale = Math.min(1, maxDimension / Math.max(w, h));
        const targetW = Math.max(1, Math.round(w * scale));
        const targetH = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed && compressed.length < rawDataUrl.length ? compressed : rawDataUrl);
      } catch {
        resolve(rawDataUrl);
      }
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}
