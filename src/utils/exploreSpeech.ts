export type SpeechAccent = 'en-GB' | 'en-US';

export type PlaybackResultStatus = 'ok' | 'offline_no_tts' | 'failed';

export interface SpeakOptions {
  text: string;
  accent: SpeechAccent;
  rate: number;
  offlineMode?: boolean;
  onStart?: () => void;
  onEnd?: (status: PlaybackResultStatus) => void;
}

export interface DialogueSessionResult {
  transcript: string;
  matchScore: number | null;
  spokenSeconds: number;
  fluencyScore: number;
  recordingUrl: string | null;
  usedTranscript: boolean;
  errorCode?: 'permission_denied' | 'no_microphone' | 'insecure_context' | 'failed';
}

export interface DialogueSessionOptions {
  accent: SpeechAccent;
  expectedText: string;
  onLevel?: (level0To100: number) => void;
  onInterimTranscript?: (text: string) => void;
  onComplete: (result: DialogueSessionResult) => void;
}

export interface DialogueSessionHandle {
  stop: () => void;
}

let sharedAudio: HTMLAudioElement | null = null;
let activeSessionAbort: (() => void) | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesListenerAttached = false;

function refreshVoicesCache(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
  }
  if (!voicesListenerAttached && typeof window.speechSynthesis.addEventListener === 'function') {
    voicesListenerAttached = true;
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      cachedVoices = window.speechSynthesis.getVoices();
    });
  }
  return cachedVoices;
}

function pickBestEnglishVoice(accent: SpeechAccent, preferLocal = false): SpeechSynthesisVoice | null {
  const voices = refreshVoicesCache();
  if (voices.length === 0) return null;
  const targetLower = accent.toLowerCase();
  if (preferLocal) {
    return (
      voices.find((v) => v.lang.toLowerCase() === targetLower && v.localService) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en-gb') && v.localService) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en-us') && v.localService) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en') && v.localService) ||
      voices.find((v) => v.lang.toLowerCase() === targetLower) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      null
    );
  }
  return (
    voices.find((v) => v.lang.toLowerCase() === targetLower && v.localService) ||
    voices.find((v) => v.lang.toLowerCase() === targetLower) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('en-gb')) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('en-us')) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
    null
  );
}

function getSharedAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

function splitIntoChunks(text: string, maxLen = 220): string[] {
  const clean = text.trim();
  if (clean.length <= maxLen) return [clean];
  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length <= maxLen) {
        current = s;
      } else {
        chunks.push(s.slice(0, maxLen));
        current = '';
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [clean.slice(0, maxLen)];
}

export function stopAllExploreSpeech(): void {
  if (activeSessionAbort) {
    activeSessionAbort();
    activeSessionAbort = null;
  }
  try {
    if (typeof window !== 'undefined') {
      window.__onNativeTtsEnd = undefined;
      if (window.AndroidExploreSpeech?.stopSpeak) {
        window.AndroidExploreSpeech.stopSpeak();
      }
    }
  } catch {}
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {}
  if (sharedAudio) {
    try {
      sharedAudio.pause();
      sharedAudio.removeAttribute('src');
      sharedAudio.load();
    } catch {}
  }
}

async function playAudioUrlChain(
  urls: string[],
  rate: number,
  isCancelled: () => boolean
): Promise<boolean> {
  const audio = getSharedAudio();
  for (const url of urls) {
    if (isCancelled()) return false;
    const ok = await new Promise<boolean>((resolve) => {
      let settled = false;
      const done = (success: boolean) => {
        if (settled) return;
        settled = true;
        audio.onended = null;
        audio.onerror = null;
        resolve(success);
      };
      const timer = window.setTimeout(() => done(false), 12000);
      audio.onended = () => {
        window.clearTimeout(timer);
        done(true);
      };
      audio.onerror = () => {
        window.clearTimeout(timer);
        done(false);
      };
      try {
        audio.src = url;
        audio.playbackRate = Math.min(1.5, Math.max(0.65, rate));
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            window.clearTimeout(timer);
            done(false);
          });
        }
      } catch {
        window.clearTimeout(timer);
        done(false);
      }
    });
    if (ok) return true;
  }
  return false;
}

async function playChunkedOnlineAudio(
  text: string,
  accent: SpeechAccent,
  rate: number,
  isCancelled: () => boolean
): Promise<boolean> {
  const chunks = splitIntoChunks(text);
  const typeParam = accent === 'en-GB' ? '1' : '2';
  for (const chunk of chunks) {
    if (isCancelled()) return false;
    const encoded = encodeURIComponent(chunk);
    const urls = [
      `https://dict.youdao.com/dictvoice?audio=${encoded}&type=${typeParam}`,
      `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${accent}&q=${encoded}`,
    ];
    const ok = await playAudioUrlChain(urls, rate, isCancelled);
    if (!ok) return false;
  }
  return true;
}

function tryWebSpeechSynthesis(
  text: string,
  accent: SpeechAccent,
  rate: number,
  isCancelled: () => boolean,
  preferLocal = false
): Promise<'ok' | 'unsupported_or_failed'> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve('unsupported_or_failed');
      return;
    }

    const synth = window.speechSynthesis;
    const wasSpeaking = synth.speaking || synth.pending;
    try {
      if (wasSpeaking) synth.cancel();
      if (synth.paused) synth.resume();
    } catch {}

    const runUtter = () => {
      if (isCancelled()) {
        resolve('ok');
        return;
      }

      const voice = pickBestEnglishVoice(accent, preferLocal);
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = accent;
      utter.rate = Math.min(1.5, Math.max(0.6, rate));
      if (voice) {
        utter.voice = voice;
      }

      let started = false;
      let finished = false;

      const finish = (status: 'ok' | 'unsupported_or_failed') => {
        if (finished) return;
        finished = true;
        window.clearTimeout(startWatchdog);
        window.clearTimeout(maxTimeout);
        resolve(status);
      };

      // Android WebView & some mobile ROMs silently drop utterances without firing onerror
      const startWatchdog = window.setTimeout(() => {
        if (!started) {
          try {
            synth.cancel();
          } catch {}
          finish('unsupported_or_failed');
        }
      }, 1400);

      const maxTimeout = window.setTimeout(() => {
        finish('ok');
      }, Math.max(6000, text.length * 140));

      utter.onstart = () => {
        started = true;
        window.clearTimeout(startWatchdog);
      };
      utter.onend = () => finish('ok');
      utter.onerror = () => finish('unsupported_or_failed');

      try {
        synth.speak(utter);
      } catch {
        finish('unsupported_or_failed');
      }
    };

    if (wasSpeaking) {
      window.setTimeout(runUtter, 45);
    } else {
      runUtter();
    }
  });
}

export async function speakEnglishAudio({
  text,
  accent,
  rate,
  offlineMode = false,
  onStart,
  onEnd,
}: SpeakOptions): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) return;

  stopAllExploreSpeech();

  let cancelled = false;
  activeSessionAbort = () => {
    cancelled = true;
  };
  onStart?.();

  // Tier 1: Native Android Capacitor Bridge (real Android APK TTS engine, works offline + WebView)
  try {
    const bridge = typeof window !== 'undefined' ? window.AndroidExploreSpeech : undefined;
    const isAvail = bridge?.isAvailable ? String(bridge.isAvailable()) === 'true' : false;
    if (bridge && isAvail && bridge.speak) {
      const nativeOk = await new Promise<boolean>((resolve) => {
        let settled = false;
        const done = (ok: boolean) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(fallbackTimer);
          window.__onNativeTtsEnd = undefined;
          resolve(ok);
        };
        const estimatedMs = Math.min(
          28000,
          Math.max(2500, (cleanText.length * 95) / Math.max(0.6, rate) + 1800)
        );
        const fallbackTimer = window.setTimeout(() => done(true), estimatedMs);
        window.__onNativeTtsEnd = (ok: boolean) => done(ok);
        try {
          bridge.speak?.(cleanText, accent, rate);
        } catch {
          done(false);
        }
      });
      if (cancelled) return;
      if (nativeOk) {
        onEnd?.('ok');
        return;
      }
    }
  } catch {}

  const isActuallyOffline =
    offlineMode || (typeof navigator !== 'undefined' && navigator.onLine === false);

  // Tier 2: Browser Web Speech API with voice & mobile queue hardening
  const webResult = await tryWebSpeechSynthesis(
    cleanText,
    accent,
    rate,
    () => cancelled,
    isActuallyOffline
  );
  if (cancelled) return;
  if (webResult === 'ok') {
    onEnd?.('ok');
    return;
  }

  // Tier 3: Real studio/TTS MP3 stream via HTML5 Audio (skipped immediately when offline)
  if (isActuallyOffline) {
    onEnd?.('offline_no_tts');
    return;
  }

  const audioOk = await playChunkedOnlineAudio(cleanText, accent, rate, () => cancelled);
  if (cancelled) return;
  onEnd?.(audioOk ? 'ok' : 'failed');
}

export function computeWordMatchScore(expectedEn: string, spokenTranscript: string): number {
  const normTarget = expectedEn
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const normSpoken = spokenTranscript
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (normTarget.length === 0) return 0;
  const spokenSet = new Set(normSpoken);
  const hits = normTarget.filter((w) => spokenSet.has(w)).length;
  return Math.round((hits / normTarget.length) * 100);
}

function getSupportedRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime));
}

export async function startDialogueSession(
  opts: DialogueSessionOptions
): Promise<DialogueSessionHandle> {
  let stopped = false;
  let completed = false;

  let stream: MediaStream | null = null;
  let audioCtx: AudioContext | null = null;
  let rafId = 0;
  let recorder: MediaRecorder | null = null;
  const audioChunks: BlobPart[] = [];
  let activeTranscript = '';
  let speechRec: { stop?: () => void } | null = null;
  let autoStopTimer = 0;

  const startedAt = Date.now();
  let totalFrames = 0;
  let voicedFrames = 0;

  const cleanupStreams = () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (autoStopTimer) {
      window.clearTimeout(autoStopTimer);
      autoStopTimer = 0;
    }
    if (speechRec?.stop) {
      try {
        speechRec.stop();
      } catch {}
      speechRec = null;
    }
    try {
      if (window.AndroidExploreSpeech?.stopRecognition) {
        window.AndroidExploreSpeech.stopRecognition();
      }
      window.__onNativeSpeechResult = undefined;
      window.__onNativeSpeechError = undefined;
      window.__onNativeSpeechEnd = undefined;
    } catch {}
    if (stream) {
      stream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });
      stream = null;
    }
    if (audioCtx) {
      try {
        audioCtx.close();
      } catch {}
      audioCtx = null;
    }
  };

  const finalize = (errorCode?: DialogueSessionResult['errorCode']) => {
    if (completed) return;
    completed = true;
    const elapsedSec = Math.max(0.2, Number(((Date.now() - startedAt) / 1000).toFixed(1)));
    const voicedRatio = totalFrames > 0 ? voicedFrames / totalFrames : 0;

    // Acoustic fluency score based on sustained vocal energy and natural sentence pacing
    const wordCount = opts.expectedText.trim().split(/\s+/).filter(Boolean).length;
    const targetSec = Math.min(12, Math.max(2.0, wordCount * 0.42));
    const paceRatio = Math.min(1, elapsedSec / targetSec);
    const acousticFluency =
      voicedRatio > 0.08
        ? Math.min(96, Math.round(voicedRatio * 55 + paceRatio * 50))
        : 0;

    const cleanTranscript = activeTranscript.trim();
    const matchScore = cleanTranscript
      ? computeWordMatchScore(opts.expectedText, cleanTranscript)
      : null;

    let recordingUrl: string | null = null;
    if (audioChunks.length > 0) {
      try {
        const mimeType = recorder?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunks, { type: mimeType });
        if (blob.size > 256) {
          recordingUrl = URL.createObjectURL(blob);
        }
      } catch {}
    }

    cleanupStreams();
    opts.onLevel?.(0);
    opts.onComplete({
      transcript: cleanTranscript,
      matchScore,
      spokenSeconds: elapsedSec,
      fluencyScore: acousticFluency,
      recordingUrl,
      usedTranscript: Boolean(cleanTranscript),
      errorCode,
    });
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.onstop = () => finalize();
        recorder.stop();
        window.setTimeout(() => finalize(), 400);
        return;
      } catch {}
    }
    finalize();
  };

  // Stop any outgoing TTS before listening so mic doesn't record speaker echo
  stopAllExploreSpeech();

  // Check secure context when getUserMedia isn't exposed (e.g. non-localhost HTTP)
  const hasMediaDevices =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');

  // Step 1: Attempt real microphone capture via getUserMedia + AudioContext + MediaRecorder
  if (hasMediaDevices) {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      const name = (err as { name?: string })?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
        // Still see if Android native recognition can run, otherwise report clear mic permission error
        const hasNativeBridge = Boolean(window.AndroidExploreSpeech?.startRecognition);
        if (!hasNativeBridge) {
          finalize('permission_denied');
          return { stop };
        }
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        finalize('no_microphone');
        return { stop };
      }
    }
  } else if (
    typeof window !== 'undefined' &&
    !window.isSecureContext &&
    !window.AndroidExploreSpeech?.startRecognition
  ) {
    finalize('insecure_context');
    return { stop };
  }

  if (stopped) {
    cleanupStreams();
    return { stop };
  }

  // Attach Web Audio volume analyser + MediaRecorder if mic stream is live
  if (stream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tickMeter = () => {
          if (stopped || completed) return;
          analyser.getByteTimeDomainData(data);
          let sumSq = 0;
          for (let i = 0; i < data.length; i += 1) {
            const norm = (data[i] - 128) / 128;
            sumSq += norm * norm;
          }
          const rms = Math.sqrt(sumSq / data.length);
          const level = Math.min(100, Math.round(rms * 320));
          totalFrames += 1;
          if (level >= 10) voicedFrames += 1;
          opts.onLevel?.(level);
          rafId = window.requestAnimationFrame(tickMeter);
        };
        rafId = window.requestAnimationFrame(tickMeter);
      }
    } catch {}

    try {
      if (typeof MediaRecorder !== 'undefined') {
        const mimeType = getSupportedRecorderMimeType();
        recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        recorder.ondataavailable = (ev: BlobEvent) => {
          if (ev.data && ev.data.size > 0) {
            audioChunks.push(ev.data);
          }
        };
        recorder.start(250);
      }
    } catch {}
  }

  // Step 2: Parallel Transcript Capture (Native Android SpeechRecognizer OR Web SpeechRecognition)
  try {
    const bridge = window.AndroidExploreSpeech;
    if (bridge?.startRecognition) {
      window.__onNativeSpeechResult = (payload: string) => {
        if (payload && payload.trim()) {
          activeTranscript = payload.trim();
          opts.onInterimTranscript?.(activeTranscript);
        }
      };
      window.__onNativeSpeechError = () => {
        // Keep MediaRecorder running gracefully even if Android ROM has no cloud ASR
      };
      window.__onNativeSpeechEnd = () => {
        if (!stopped && activeTranscript) {
          stop();
        }
      };
      bridge.startRecognition(opts.accent);
    } else {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.lang = opts.accent;
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (ev) => {
          let combined = '';
          for (let i = 0; i < ev.results.length; i += 1) {
            const seg = ev.results[i]?.[0]?.transcript || '';
            if (seg) combined += (combined ? ' ' : '') + seg;
          }
          if (combined.trim()) {
            activeTranscript = combined.trim();
            opts.onInterimTranscript?.(activeTranscript);
          }
        };
        rec.onerror = () => {
          // Do not terminate MediaRecorder — user voice recording & acoustic fluency continue working
        };
        rec.onend = () => {
          if (!stopped && !stream) {
            stop();
          }
        };
        speechRec = rec;
        rec.start();
      } else if (!stream) {
        finalize('no_microphone');
        return { stop };
      }
    }
  } catch {
    if (!stream) {
      finalize('failed');
      return { stop };
    }
  }

  // Auto-stop after 18s to avoid leaving mic open indefinitely on mobile
  autoStopTimer = window.setTimeout(() => {
    stop();
  }, 18000);

  return { stop };
}
