import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Pin,
  Plus,
  Search,
  CheckSquare,
  FileText,
  Trash2,
  Palette,
  LayoutGrid,
  List,
  Copy,
  Check,
  Tag,
  Archive,
  ArchiveRestore,
  RotateCcw,
  Brush,
  Image as ImageIcon,
  Mic,
  MicOff,
  Bell,
  Download,
  Undo2,
  Eraser,
  CopyPlus,
} from 'lucide-react';
import { AppSettings } from '../types/calendar';
import { triggerHaptic } from '../utils/haptics';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';
import { getLocaleCode, isRtlLanguage } from '../utils/i18n';
import { normalizeSearchText } from '../data/worldCities';
import { getKeepNotesI18n, KeepNotesI18n, localizeKeepLabel } from '../utils/fabModalI18n';
import {
  saveFileToDevice,
  saveFileToChosenDirectory,
  pickFileFromDevice,
  compressImageFileToDataUrl,
} from '../utils/fileTransfer';
import { FolderDown } from 'lucide-react';
import { useSearchHistory } from '../utils/searchHistory';
import { SearchHistoryBar } from './SearchHistoryBar';

interface KeepNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
}

type NoteColorId = 'default' | 'coral' | 'amber' | 'sage' | 'teal' | 'cobalt' | 'lavender';
type BoxFilter = 'active' | 'archived' | 'trash';

interface ChecklistRow {
  id: string;
  text: string;
  done: boolean;
}

interface KeepNote {
  id: string;
  title: string;
  content: string;
  mode: 'text' | 'checklist';
  checklist: ChecklistRow[];
  color: NoteColorId;
  pinned: boolean;
  archived?: boolean;
  trashed?: boolean;
  label: string;
  reminderAt?: string;
  drawingDataUrl?: string;
  imageDataUrl?: string;
  updatedAt: number;
  createdAt: number;
}

const STORAGE_KEY = 'keep_quick_notes_v1';
const LABELS_KEY = 'keep_custom_labels_v1';

const DEFAULT_LABELS = ['灵感', '工作', '生活', '清单', '学习'];

const NOTE_COLORS: {
  id: NoteColorId;
  name: string;
  swatch: string;
  cardClass: string;
}[] = [
  {
    id: 'default',
    name: '默认',
    swatch: '#e5e7eb',
    cardClass:
      'bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 border-neutral-200/80 dark:border-white/12',
  },
  {
    id: 'coral',
    name: '珊瑚红',
    swatch: '#fca5a5',
    cardClass:
      'bg-rose-50/90 dark:bg-rose-950/45 border-rose-200/80 dark:border-rose-500/25',
  },
  {
    id: 'amber',
    name: '暖阳黄',
    swatch: '#fcd34d',
    cardClass:
      'bg-amber-50/90 dark:bg-amber-950/45 border-amber-200/80 dark:border-amber-500/25',
  },
  {
    id: 'sage',
    name: '鼠尾草绿',
    swatch: '#86efac',
    cardClass:
      'bg-emerald-50/90 dark:bg-emerald-950/45 border-emerald-200/80 dark:border-emerald-500/25',
  },
  {
    id: 'teal',
    name: '薄荷青',
    swatch: '#5eead4',
    cardClass:
      'bg-teal-50/90 dark:bg-teal-950/45 border-teal-200/80 dark:border-teal-500/25',
  },
  {
    id: 'cobalt',
    name: '晴空蓝',
    swatch: '#93c5fd',
    cardClass:
      'bg-sky-50/90 dark:bg-sky-950/45 border-sky-200/80 dark:border-sky-500/25',
  },
  {
    id: 'lavender',
    name: '薰衣草紫',
    swatch: '#d8b4fe',
    cardClass:
      'bg-purple-50/90 dark:bg-purple-950/45 border-purple-200/80 dark:border-purple-500/25',
  },
];

function loadNotes(): KeepNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function loadLabels(): string[] {
  try {
    const raw = localStorage.getItem(LABELS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_LABELS;
}

function getColorMeta(id: NoteColorId) {
  return NOTE_COLORS.find((c) => c.id === id) || NOTE_COLORS[0];
}

// Embedded Drawing Pad Component
const SketchCanvasPad: React.FC<{
  initialDataUrl?: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  kn: KeepNotesI18n;
}> = ({ initialDataUrl, onSave, onCancel, kn }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [penColor, setPenColor] = useState('#111827');
  const [penSize, setPenSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const historyRef = useRef<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        historyRef.current = [canvas.toDataURL('image/png')];
      };
      img.src = initialDataUrl;
    } else {
      historyRef.current = [canvas.toDataURL('image/png')];
    }
  }, [initialDataUrl]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#FFFFFF' : penColor;
    ctx.lineWidth = isEraser ? penSize * 4 : penSize;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pt = getPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    isDrawingRef.current = false;
    historyRef.current.push(canvasRef.current.toDataURL('image/png'));
    if (historyRef.current.length > 20) historyRef.current.shift();
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const prev = historyRef.current[historyRef.current.length - 1];
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = prev;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    historyRef.current.push(canvas.toDataURL('image/png'));
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-y-auto rounded-3xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/15 p-4 space-y-3 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Brush className="w-4 h-4 text-amber-500" />
            {kn.sketchPadTitle}
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              title={kn.undo}
              className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-1 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10"
            >
              {kn.clear}
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={640}
          height={380}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-56 sm:h-64 rounded-2xl border border-neutral-200 dark:border-white/15 bg-white touch-none cursor-crosshair"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {['#111827', '#EF4444', '#F59E0B', '#10B981', '#2563EB', '#7C3AED'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setIsEraser(false);
                  setPenColor(c);
                }}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full border-2 ${
                  !isEraser && penColor === c
                    ? 'border-amber-400 scale-110'
                    : 'border-black/15'
                }`}
              />
            ))}
            <button
              type="button"
              onClick={() => setIsEraser((v) => !v)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                isEraser
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'border-neutral-200 dark:border-white/15 text-neutral-600 dark:text-neutral-300'
              }`}
              title={kn.eraser}
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {[2, 4, 7].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setPenSize(sz)}
                className={`px-2 py-1 rounded-lg font-semibold ${
                  penSize === sz
                    ? 'bg-amber-400 text-neutral-950'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {sz === 2 ? kn.penThin : sz === 4 ? kn.penMedium : kn.penThick}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {kn.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (canvasRef.current) {
                onSave(canvasRef.current.toDataURL('image/png'));
              }
            }}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-neutral-950"
          >
            {kn.insertSketch}
          </button>
        </div>
      </div>
    </div>
  );
};

export const KeepNotesModal: React.FC<KeepNotesModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const hapticsEnabled = settings.enableHaptics !== false;
  const kn = getKeepNotesI18n(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const localeCode = getLocaleCode(settings.language);
  const [notes, setNotes] = useState<KeepNote[]>(() => loadNotes());
  const [labels, setLabels] = useState<string[]>(() => loadLabels());
  const [boxFilter, setBoxFilter] = useState<BoxFilter>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const notesSearchHistory = useSearchHistory('notes');
  const commitNotesSearch = (raw: string) => {
    const clean = raw.trim();
    if (clean.length >= 2) notesSearchHistory.recordQuery(clean);
  };
  const [selectedLabel, setSelectedLabel] = useState<string>('ALL');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [newLabelInput, setNewLabelInput] = useState('');
  const [showAddLabel, setShowAddLabel] = useState(false);

  // Quick composer state
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftMode, setDraftMode] = useState<'text' | 'checklist'>('text');
  const [draftChecklist, setDraftChecklist] = useState<ChecklistRow[]>([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [draftColor, setDraftColor] = useState<NoteColorId>('default');
  const [draftPinned, setDraftPinned] = useState(false);
  const [draftLabel, setDraftLabel] = useState('灵感');
  const [draftReminder, setDraftReminder] = useState('');
  const [draftDrawing, setDraftDrawing] = useState<string | undefined>(undefined);
  const [draftImage, setDraftImage] = useState<string | undefined>(undefined);
  const [showDraftPalette, setShowDraftPalette] = useState(false);
  const [showDraftReminder, setShowDraftReminder] = useState(false);
  const [showSketchPadFor, setShowSketchPadFor] = useState<'draft' | 'edit' | null>(null);

  // Dictation state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  // Editing existing note state
  const [editingNote, setEditingNote] = useState<KeepNote | null>(null);
  const [editCheckItem, setEditCheckItem] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const showFeedback = (msg: string, kind: 'ok' | 'err' = 'ok') => {
    setFeedbackBanner({ msg, kind });
    window.setTimeout(() => {
      setFeedbackBanner((cur) => (cur?.msg === msg ? null : cur));
    }, 3000);
  };

  const transferLabels = useMemo(() => {
    const map: Record<string, { exported: string; exportFail: string; imgFail: string }> = {
      'zh-CN': { exported: '已导出并准备保存到本机', exportFail: '导出失败，请重试', imgFail: '图片读取失败或格式不支持' },
      'zh-TW': { exported: '已匯出並準備儲存至本機', exportFail: '匯出失敗，請重試', imgFail: '圖片讀取失敗或格式不支援' },
      ja: { exported: 'ファイルを書き出しました', exportFail: '書き出しに失敗しました', imgFail: '画像を読み込めませんでした' },
      ko: { exported: '파일을 내보냈습니다', exportFail: '내보내기에 실패했습니다', imgFail: '이미지를 불러올 수 없습니다' },
      fr: { exported: 'Fichier exporté', exportFail: 'Échec de l’exportation', imgFail: 'Impossible de lire l’image' },
      ru: { exported: 'Файл экспортирован', exportFail: 'Ошибка экспорта', imgFail: 'Не удалось прочитать изображение' },
      fa: { exported: 'فایل خروجی گرفته شد', exportFail: 'خطا در خروجی فایل', imgFail: 'خواندن تصویر ناموفق بود' },
      mn: { exported: 'Файл хадгалагдлаа', exportFail: 'Файл хадгалахад алдаа гарлаа', imgFail: 'Зураг уншиж чадсангүй' },
      ug: { exported: 'ھۆججەت چىقىرىلدى', exportFail: 'چىقىرىش مەغلۇپ بولدى', imgFail: 'رەسىم ئوقۇش مەغلۇپ بولدى' },
      en: { exported: 'File ready to save', exportFail: 'Export failed', imgFail: 'Could not read image file' },
    };
    return map[settings.language] || map.en;
  }, [settings.language]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      showFeedback(transferLabels.imgFail, 'err');
    }
  }, [notes, transferLabels.imgFail]);

  useEffect(() => {
    try {
      localStorage.setItem(LABELS_KEY, JSON.stringify(labels));
    } catch {}
  }, [labels]);

  useEffect(() => {
    if (!isOpen && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isOpen]);

  useSystemBackLayer(
    isOpen && Boolean(editingNote),
    () => setEditingNote(null),
    BACK_PRIORITY.NESTED_MODAL,
    'keep-notes-editor'
  );

  useSystemBackLayer(
    isOpen && showAddLabel,
    () => setShowAddLabel(false),
    BACK_PRIORITY.NESTED_MODAL,
    'keep-notes-add-label'
  );

  useSystemBackLayer(
    isOpen && Boolean(showSketchPadFor),
    () => setShowSketchPadFor(null),
    BACK_PRIORITY.INNER_OVERLAY,
    'keep-notes-sketchpad'
  );

  const resetComposer = () => {
    setDraftTitle('');
    setDraftContent('');
    setDraftMode('text');
    setDraftChecklist([]);
    setNewCheckItem('');
    setDraftColor('default');
    setDraftPinned(false);
    setDraftLabel(labels[0] || '灵感');
    setDraftReminder('');
    setDraftDrawing(undefined);
    setDraftImage(undefined);
    setShowDraftPalette(false);
    setShowDraftReminder(false);
    setComposerExpanded(false);
  };

  const handleToggleDictation = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SR) {
      setComposerExpanded(true);
      setDraftContent((prev) => (prev ? prev : kn.speechUnsupported));
      return;
    }

    const rec = new (SR as new () => {
      lang: string;
      interimResults: boolean;
      continuous: boolean;
      onresult: (ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void;
      onend: () => void;
      onerror: () => void;
      start: () => void;
      stop: () => void;
    })();
    rec.lang = localeCode;
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (ev) => {
      let text = '';
      for (let i = 0; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) {
          text += ev.results[i][0].transcript;
        }
      }
      if (text.trim()) {
        setComposerExpanded(true);
        setDraftContent((prev) => (prev ? `${prev}\n${text.trim()}` : text.trim()));
      }
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    setComposerExpanded(true);
    setIsListening(true);
    rec.start();
  };

  const processDraftImageFile = async (file: File) => {
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 1280, 0.78);
      setDraftImage(dataUrl);
      setComposerExpanded(true);
    } catch {
      showFeedback(transferLabels.imgFail, 'err');
    }
  };

  const handleUploadDraftImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processDraftImageFile(file);
  };

  const handlePickDraftImage = async () => {
    const file = await pickFileFromDevice({
      accept: 'image/*',
      mimeTypes: ['image/*'],
      description: 'Images',
    });
    if (!file) return;
    await processDraftImageFile(file);
  };

  const processEditImageFile = async (file: File) => {
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 1280, 0.78);
      setEditingNote((n) => (n ? { ...n, imageDataUrl: dataUrl } : n));
    } catch {
      showFeedback(transferLabels.imgFail, 'err');
    }
  };

  const handleUploadEditImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processEditImageFile(file);
  };

  const handlePickEditImage = async () => {
    const file = await pickFileFromDevice({
      accept: 'image/*',
      mimeTypes: ['image/*'],
      description: 'Images',
    });
    if (!file) return;
    await processEditImageFile(file);
  };

  const handleCreateNote = () => {
    const trimmedTitle = draftTitle.trim();
    const trimmedContent = draftContent.trim();
    const cleanChecklist = draftChecklist.filter((c) => c.text.trim().length > 0);
    if (newCheckItem.trim()) {
      cleanChecklist.push({
        id: `chk-${Date.now()}`,
        text: newCheckItem.trim(),
        done: false,
      });
    }

    if (
      !trimmedTitle &&
      !trimmedContent &&
      cleanChecklist.length === 0 &&
      !draftDrawing &&
      !draftImage
    ) {
      resetComposer();
      return;
    }

    const now = Date.now();
    const note: KeepNote = {
      id: `note-${now}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmedTitle,
      content: trimmedContent,
      mode: draftMode,
      checklist: cleanChecklist,
      color: draftColor,
      pinned: draftPinned,
      label: draftLabel,
      reminderAt: draftReminder || undefined,
      drawingDataUrl: draftDrawing,
      imageDataUrl: draftImage,
      createdAt: now,
      updatedAt: now,
    };

    triggerHaptic('selection', hapticsEnabled);
    setNotes((prev) => [note, ...prev]);
    setBoxFilter('active');
    resetComposer();
  };

  const addDraftCheckRow = () => {
    if (!newCheckItem.trim()) return;
    setDraftChecklist((prev) => [
      ...prev,
      {
        id: `chk-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        text: newCheckItem.trim(),
        done: false,
      },
    ]);
    setNewCheckItem('');
  };

  const toggleNotePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection', hapticsEnabled);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n))
    );
  };

  const toggleArchiveNote = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic('selection', hapticsEnabled);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, archived: !n.archived, pinned: false, updatedAt: Date.now() } : n
      )
    );
  };

  const moveToTrash = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic('selection', hapticsEnabled);
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, trashed: true, pinned: false, updatedAt: Date.now() } : n
      )
    );
    if (editingNote?.id === id) setEditingNote(null);
  };

  const restoreFromTrash = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic('selection', hapticsEnabled);
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, trashed: false, updatedAt: Date.now() } : n))
    );
  };

  const deleteForever = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic('selection', hapticsEnabled);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editingNote?.id === id) setEditingNote(null);
  };

  const duplicateNote = (note: KeepNote, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection', hapticsEnabled);
    const now = Date.now();
    const copy: KeepNote = {
      ...note,
      id: `note-${now}-${Math.random().toString(36).slice(2, 6)}`,
      title: note.title ? `${note.title}${kn.copySuffix}` : '',
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [copy, ...prev]);
  };

  const toggleCardChecklistRow = (noteId: string, rowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('selection', hapticsEnabled);
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        return {
          ...n,
          updatedAt: Date.now(),
          checklist: n.checklist.map((r) => (r.id === rowId ? { ...r, done: !r.done } : r)),
        };
      })
    );
  };

  const copyNoteText = async (note: KeepNote, e: React.MouseEvent) => {
    e.stopPropagation();
    const body =
      note.mode === 'checklist'
        ? note.checklist.map((c) => `${c.done ? '[x]' : '[ ]'} ${c.text}`).join('\n')
        : note.content;
    const full = [note.title, body].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(full);
      setCopiedId(note.id);
      setTimeout(() => setCopiedId((curr) => (curr === note.id ? null : curr)), 1500);
    } catch {}
  };

  const buildMarkdownExportContent = () => {
    const activeNotes = notes.filter((n) => !n.trashed);
    return activeNotes
      .map((n) => {
        const displayLbl = localizeKeepLabel(n.label, settings.language);
        const header = `## ${n.title || kn.untitledNote} (#${displayLbl})`;
        const body =
          n.mode === 'checklist'
            ? n.checklist.map((c) => `- [${c.done ? 'x' : ' '}] ${c.text}`).join('\n')
            : n.content;
        return `${header}\n${body}\n`;
      })
      .join('\n---\n\n');
  };

  const handleExportMarkdown = async () => {
    const md = buildMarkdownExportContent();
    const filename = `${kn.exportFilenamePrefix}_${new Date().toISOString().slice(0, 10)}.md`;
    const res = await saveFileToDevice(filename, md, 'text/markdown;charset=utf-8');
    if (res.ok) {
      showFeedback(
        res.pathHint ? `${transferLabels.exported} (${res.pathHint})` : transferLabels.exported,
        'ok'
      );
    } else if (res.error !== 'cancelled') {
      showFeedback(transferLabels.exportFail, 'err');
    }
  };

  const handleExportMarkdownToFolder = async () => {
    const md = buildMarkdownExportContent();
    const filename = `${kn.exportFilenamePrefix}_${new Date().toISOString().slice(0, 10)}.md`;
    const res = await saveFileToChosenDirectory(filename, md, 'text/markdown;charset=utf-8');
    if (res.ok) {
      showFeedback(
        res.pathHint ? `${transferLabels.exported} (${res.pathHint})` : transferLabels.exported,
        'ok'
      );
    } else if (res.error !== 'cancelled') {
      showFeedback(transferLabels.exportFail, 'err');
    }
  };

  const saveEditingNote = () => {
    if (!editingNote) return;
    let updated = editingNote;
    if (editCheckItem.trim()) {
      updated = {
        ...updated,
        checklist: [
          ...updated.checklist,
          { id: `chk-${Date.now()}`, text: editCheckItem.trim(), done: false },
        ],
      };
      setEditCheckItem('');
    }
    const cleanChecklist = updated.checklist.filter((c) => c.text.trim().length > 0);
    if (
      !updated.title.trim() &&
      !updated.content.trim() &&
      cleanChecklist.length === 0 &&
      !updated.drawingDataUrl &&
      !updated.imageDataUrl
    ) {
      deleteForever(updated.id);
      return;
    }
    setNotes((prev) =>
      prev.map((n) =>
        n.id === updated.id ? { ...updated, checklist: cleanChecklist, updatedAt: Date.now() } : n
      )
    );
    setEditingNote(null);
  };

  const handleAddCustomLabel = () => {
    const trimmed = newLabelInput.trim();
    if (!trimmed) return;
    if (!labels.includes(trimmed)) {
      setLabels((prev) => [...prev, trimmed]);
    }
    setSelectedLabel(trimmed);
    setNewLabelInput('');
    setShowAddLabel(false);
  };

  const boxCounts = useMemo(() => {
    return {
      active: notes.filter((n) => !n.trashed && !n.archived).length,
      archived: notes.filter((n) => !n.trashed && !!n.archived).length,
      trash: notes.filter((n) => !!n.trashed).length,
    };
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const qNorm = normalizeSearchText(searchQuery);
    const terms = qNorm ? qNorm.split(/\s+/).filter(Boolean) : [];
    return notes.filter((n) => {
      if (boxFilter === 'active' && (n.trashed || n.archived)) return false;
      if (boxFilter === 'archived' && (n.trashed || !n.archived)) return false;
      if (boxFilter === 'trash' && !n.trashed) return false;
      if (selectedLabel !== 'ALL' && n.label !== selectedLabel) return false;
      if (terms.length === 0) return true;
      const haystack = normalizeSearchText(
        [
          n.title,
          n.content,
          n.label,
          localizeKeepLabel(n.label, settings.language),
          ...n.checklist.map((c) => c.text),
        ].join(' ')
      );
      return terms.every((term) => haystack.includes(term));
    });
  }, [notes, boxFilter, searchQuery, selectedLabel, settings.language]);

  const pinnedNotes = useMemo(
    () => (boxFilter === 'active' ? filteredNotes.filter((n) => n.pinned) : []),
    [filteredNotes, boxFilter]
  );
  const otherNotes = useMemo(
    () => (boxFilter === 'active' ? filteredNotes.filter((n) => !n.pinned) : filteredNotes),
    [filteredNotes, boxFilter]
  );

  if (!isOpen) return null;

  const renderNoteCard = (note: KeepNote) => {
    const colorMeta = getColorMeta(note.color);
    const completedCount = note.checklist.filter((c) => c.done).length;
    const checklistPct =
      note.checklist.length > 0 ? Math.round((completedCount / note.checklist.length) * 100) : 0;

    return (
      <div
        key={note.id}
        onClick={() => {
          if (note.trashed) return;
          setEditingNote(note);
          setEditCheckItem('');
        }}
        className={`group relative rounded-2xl border p-3.5 transition-all ${
          note.trashed ? 'opacity-85' : 'cursor-pointer hover:shadow-md'
        } ${colorMeta.cardClass}`}
      >
        {(note.imageDataUrl || note.drawingDataUrl) && (
          <div className="mb-2.5 rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/10 bg-white">
            <img
              src={note.imageDataUrl || note.drawingDataUrl}
              alt={kn.attachmentAlt}
              className="w-full max-h-36 object-cover"
            />
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0 flex-1">
            {note.title ? (
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                {note.title}
              </h4>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.06] dark:bg-white/[0.1] text-neutral-600 dark:text-neutral-300">
                <Tag className="w-2.5 h-2.5" />
                {localizeKeepLabel(note.label, settings.language)}
              </span>
            )}
          </div>
          {!note.trashed && !note.archived && (
            <button
              type="button"
              onClick={(e) => toggleNotePin(note.id, e)}
              title={note.pinned ? kn.unpinNote : kn.pinNote}
              className={`p-1.5 rounded-full transition-colors shrink-0 ${
                note.pinned
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {note.mode === 'text' ? (
          note.content && (
            <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap line-clamp-6">
              {note.content}
            </p>
          )
        ) : (
          <div className="space-y-1.5 mt-1">
            {note.checklist.length > 0 && (
              <div className="w-full h-1 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden mb-1.5">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${checklistPct}%` }}
                />
              </div>
            )}
            {note.checklist.slice(0, 6).map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={(e) => toggleCardChecklistRow(note.id, row.id, e)}
                className="w-full flex items-start gap-2 text-start text-xs"
              >
                <span
                  className={`mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    row.done
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-neutral-400 dark:border-neutral-500'
                  }`}
                >
                  {row.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span
                  className={`flex-1 break-words ${
                    row.done
                      ? 'line-through text-neutral-400 dark:text-neutral-500'
                      : 'text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  {row.text}
                </span>
              </button>
            ))}
            {note.checklist.length > 6 && (
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 ps-5">
                {kn.moreItems(note.checklist.length - 6)}
              </p>
            )}
          </div>
        )}

        {note.reminderAt && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/12 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
            <Bell className="w-3 h-3" />
            {note.reminderAt.replace('T', ' ')}
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {note.title && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300">
                {localizeKeepLabel(note.label, settings.language)}
              </span>
            )}
            {note.mode === 'checklist' && note.checklist.length > 0 && (
              <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                {completedCount}/{note.checklist.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5">
            {note.trashed ? (
              <>
                <button
                  type="button"
                  onClick={(e) => restoreFromTrash(note.id, e)}
                  title={kn.restoreNote}
                  className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-500/10"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => deleteForever(note.id, e)}
                  title={kn.deleteForever}
                  className="p-1.5 rounded-full text-rose-600 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => copyNoteText(note, e)}
                  title={kn.copyText}
                  className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {copiedId === note.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => duplicateNote(note, e)}
                  title={kn.duplicateNote}
                  className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <CopyPlus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => toggleArchiveNote(note.id, e)}
                  title={note.archived ? kn.unarchive : kn.archive}
                  className="p-1.5 rounded-full text-neutral-500 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400 hover:bg-amber-500/10"
                >
                  {note.archived ? (
                    <ArchiveRestore className="w-3.5 h-3.5" />
                  ) : (
                    <Archive className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => moveToTrash(note.id, e)}
                  title={kn.moveToTrash}
                  className="p-1.5 rounded-full text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm sm:p-4 animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-3xl h-[92dvh] max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:h-auto sm:max-h-[calc(90dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col bg-neutral-50 dark:bg-neutral-950 [.amoled-mode_&]:bg-black rounded-t-3xl sm:rounded-3xl border border-neutral-200/80 dark:border-white/12 shadow-2xl overflow-hidden animate-modal-content"
      >
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-5 py-3 bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black border-b border-neutral-200/80 dark:border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center shadow-sm shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white leading-tight truncate">
                {kn.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleExportMarkdown}
              title={kn.exportMdTitle}
              aria-label={kn.exportMdTitle}
              className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportMarkdownToFolder}
              title={`${kn.exportMdTitle} (Folder)`}
              aria-label={`${kn.exportMdTitle} (Folder)`}
              className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
            >
              <FolderDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode((m) => (m === 'grid' ? 'list' : 'grid'))}
              className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
              title={layoutMode === 'grid' ? kn.switchToList : kn.switchToGrid}
              aria-label={layoutMode === 'grid' ? kn.switchToList : kn.switchToGrid}
            >
              {layoutMode === 'grid' ? (
                <List className="w-4 h-4" />
              ) : (
                <LayoutGrid className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shrink-0"
              aria-label={kn.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Box Tabs + Search & Label Bar */}
        <div className="shrink-0 px-4 sm:px-5 pt-3 pb-2 space-y-2.5 bg-white/70 dark:bg-neutral-900/60 [.amoled-mode_&]:bg-black border-b border-neutral-200/60 dark:border-white/10">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="grid grid-cols-3 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 text-xs shrink-0 w-full sm:w-auto sm:min-w-[260px]">
              <button
                type="button"
                onClick={() => setBoxFilter('active')}
                className={`px-2 py-1 rounded-full text-center truncate transition-all cursor-pointer ${
                  boxFilter === 'active'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                {kn.tabActive} ({boxCounts.active})
              </button>
              <button
                type="button"
                onClick={() => setBoxFilter('archived')}
                className={`px-2 py-1 rounded-full text-center truncate transition-all cursor-pointer ${
                  boxFilter === 'archived'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                {kn.tabArchived} ({boxCounts.archived})
              </button>
              <button
                type="button"
                onClick={() => setBoxFilter('trash')}
                className={`px-2 py-1 rounded-full text-center truncate transition-all cursor-pointer ${
                  boxFilter === 'trash'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                {kn.tabTrash} ({boxCounts.trash})
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                commitNotesSearch(searchQuery);
              }}
              className="relative flex-1 min-w-[140px]"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => commitNotesSearch(searchQuery)}
                placeholder={kn.searchPlaceholder}
                className="w-full ps-8 pe-9 py-1.5 text-xs rounded-full bg-neutral-100/90 dark:bg-neutral-800/80 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-400/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute end-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                  aria-label={kn.clear}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          <SearchHistoryBar
            history={notesSearchHistory.history}
            language={settings.language}
            onSelectQuery={(q) => {
              setSearchQuery(q);
              notesSearchHistory.recordQuery(q);
            }}
            onRemoveQuery={notesSearchHistory.removeQuery}
            onClearHistory={notesSearchHistory.clearHistory}
            compact
          />

          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 overflow-x-auto max-w-full no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedLabel('ALL')}
              className={`shrink-0 px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                selectedLabel === 'ALL'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
              }`}
            >
              {kn.allLabels}
            </button>
            {labels.map((lbl) => (
              <button
                key={lbl}
                type="button"
                onClick={() => setSelectedLabel(lbl)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs transition-all cursor-pointer ${
                  selectedLabel === lbl
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                {localizeKeepLabel(lbl, settings.language)}
              </button>
            ))}
            {showAddLabel ? (
              <div className="shrink-0 flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomLabel();
                  }}
                  placeholder={kn.newLabelPlaceholder}
                  className="w-20 px-2 py-1 rounded-lg text-xs bg-white dark:bg-neutral-800 border border-amber-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomLabel}
                  className="px-2 py-1 rounded-lg bg-amber-400 text-neutral-950 text-xs font-bold"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddLabel(true)}
                className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border border-dashed border-neutral-300 dark:border-white/20 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                {kn.addLabelBtn}
              </button>
            )}
          </div>
        </div>

        {/* Inline Toast Banner */}
        {feedbackBanner && (
          <div
            className={`mx-4 mt-2 px-3 py-1.5 rounded-xl text-xs font-bold text-center shrink-0 ${
              feedbackBanner.kind === 'err'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {feedbackBanner.msg}
          </div>
        )}

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5">
          {/* Quick Composer (shown on active view) */}
          {boxFilter === 'active' && (
            <div
              className={`rounded-2xl border shadow-sm transition-colors ${getColorMeta(draftColor).cardClass}`}
            >
              <input
                id="keep-draft-image-input"
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadDraftImage}
                className="sr-only"
              />
              {!composerExpanded ? (
                <div className="flex items-center gap-1.5 px-3.5 py-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftMode('text');
                      setComposerExpanded(true);
                    }}
                    className="flex-1 text-start text-sm text-neutral-500 dark:text-neutral-400 py-1 cursor-text"
                  >
                    {kn.composerPrompt}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftMode('checklist');
                      setComposerExpanded(true);
                    }}
                    title={kn.newChecklistTitle}
                    className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setComposerExpanded(true);
                      setShowSketchPadFor('draft');
                    }}
                    title={kn.sketchNoteTitle}
                    className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <Brush className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleDictation}
                    title={kn.voiceNoteTitle}
                    className={`p-2 rounded-xl transition-colors ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handlePickDraftImage}
                    title={kn.addImageTitle}
                    aria-label={kn.addImageTitle}
                    className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer inline-flex items-center justify-center"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="p-3.5 space-y-2.5">
                  {(draftImage || draftDrawing) && (
                    <div className="relative rounded-xl overflow-hidden border border-black/10 dark:border-white/15 bg-white">
                      <img
                        src={draftImage || draftDrawing}
                        alt={kn.attachmentAlt}
                        className="w-full max-h-44 object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDraftImage(undefined);
                          setDraftDrawing(undefined);
                        }}
                        className="absolute top-2 end-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/65 text-white hover:bg-black"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder={kn.draftTitlePlaceholder}
                      className="flex-1 bg-transparent text-sm font-bold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setDraftPinned((p) => !p)}
                      title={draftPinned ? kn.unpinNote : kn.pinNote}
                      className={`p-1.5 rounded-full transition-colors ${
                        draftPinned
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-white'
                      }`}
                    >
                      <Pin className={`w-4 h-4 ${draftPinned ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {draftMode === 'text' ? (
                    <textarea
                      rows={3}
                      autoFocus
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      placeholder={kn.draftTextPlaceholder}
                      className="w-full bg-transparent text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 resize-none focus:outline-none leading-relaxed"
                    />
                  ) : (
                    <div className="space-y-1.5">
                      {draftChecklist.map((row) => (
                        <div key={row.id} className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() =>
                              setDraftChecklist((prev) =>
                                prev.map((r) => (r.id === row.id ? { ...r, done: !r.done } : r))
                              )
                            }
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              row.done
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'border-neutral-400'
                            }`}
                          >
                            {row.done && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </button>
                          <input
                            type="text"
                            value={row.text}
                            onChange={(e) =>
                              setDraftChecklist((prev) =>
                                prev.map((r) =>
                                  r.id === row.id ? { ...r, text: e.target.value } : r
                                )
                              )
                            }
                            className={`flex-1 bg-transparent focus:outline-none ${
                              row.done
                                ? 'line-through text-neutral-400'
                                : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraftChecklist((prev) => prev.filter((r) => r.id !== row.id))
                            }
                            className="text-neutral-400 hover:text-rose-500 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-1">
                        <Plus className="w-4 h-4 text-neutral-400 shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          value={newCheckItem}
                          onChange={(e) => setNewCheckItem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addDraftCheckRow();
                            }
                          }}
                          placeholder={kn.checklistInputPlaceholder}
                          className="flex-1 bg-transparent text-xs text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 focus:outline-none"
                        />
                        {newCheckItem.trim() && (
                          <button
                            type="button"
                            onClick={addDraftCheckRow}
                            className="text-xs font-semibold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-500/10"
                          >
                            {kn.addBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {showDraftReminder && (
                    <div className="flex items-center gap-2 text-xs">
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <input
                        type="datetime-local"
                        value={draftReminder}
                        onChange={(e) => setDraftReminder(e.target.value)}
                        className="bg-black/[0.05] dark:bg-white/[0.08] rounded-lg px-2 py-1 text-xs focus:outline-none"
                      />
                    </div>
                  )}

                  {showDraftPalette && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {NOTE_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setDraftColor(c.id)}
                          title={kn.colorNames[c.id]}
                          style={{ backgroundColor: c.swatch }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            draftColor === c.id
                              ? 'border-neutral-900 dark:border-white scale-110'
                              : 'border-black/15'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowDraftPalette((s) => !s)}
                        title={kn.bgColorTitle}
                        className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftMode((m) => (m === 'text' ? 'checklist' : 'text'))
                        }
                        title={draftMode === 'text' ? kn.switchToChecklist : kn.switchToText}
                        className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSketchPadFor('draft')}
                        title={kn.sketchTitle}
                        className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <Brush className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handlePickDraftImage}
                        title={kn.addImageBtnTitle}
                        aria-label={kn.addImageBtnTitle}
                        className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer inline-flex items-center justify-center"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleToggleDictation}
                        title={kn.dictationTitle}
                        className={`p-1.5 rounded-lg ${
                          isListening
                            ? 'bg-rose-500 text-white'
                            : 'text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDraftReminder((r) => !r)}
                        title={kn.reminderTitle}
                        className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <select
                        value={draftLabel}
                        onChange={(e) => setDraftLabel(e.target.value)}
                        className="text-xs font-medium bg-black/[0.05] dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-200 rounded-lg px-2 py-1 focus:outline-none"
                      >
                        {labels.map((l) => (
                          <option key={l} value={l}>
                            #{localizeKeepLabel(l, settings.language)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={resetComposer}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        {kn.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateNote}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-neutral-950 shadow-sm"
                      >
                        {kn.saveNote}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trash Empty All Button */}
          {boxFilter === 'trash' && filteredNotes.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {kn.trashBanner}
              </span>
              <button
                type="button"
                onClick={() => setNotes((prev) => prev.filter((n) => !n.trashed))}
                className="px-3 py-1 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/10"
              >
                {kn.emptyTrashBtn}
              </button>
            </div>
          )}

          {/* Empty State */}
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/15 text-amber-500 flex items-center justify-center">
                <FileText className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {boxFilter === 'archived'
                  ? kn.emptyArchived
                  : boxFilter === 'trash'
                  ? kn.emptyTrash
                  : kn.emptyActive}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {kn.emptyHint}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {pinnedNotes.length > 0 && (
                <section className="space-y-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-1">
                    {kn.pinnedSection} ({pinnedNotes.length})
                  </h3>
                  <div
                    className={
                      layoutMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                        : 'space-y-2.5'
                    }
                  >
                    {pinnedNotes.map(renderNoteCard)}
                  </div>
                </section>
              )}

              {otherNotes.length > 0 && (
                <section className="space-y-2.5">
                  {pinnedNotes.length > 0 && (
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 px-1">
                      {kn.othersSection} ({otherNotes.length})
                    </h3>
                  )}
                  <div
                    className={
                      layoutMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                        : 'space-y-2.5'
                    }
                  >
                    {otherNotes.map(renderNoteCard)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Inline Edit Sub-Modal */}
        {editingNote && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-xs p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
            onClick={saveEditingNote}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-lg rounded-3xl border p-4 sm:p-5 shadow-2xl space-y-3 max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:max-h-[85vh] overflow-y-auto ${
                getColorMeta(editingNote.color).cardClass
              }`}
            >
              {(editingNote.imageDataUrl || editingNote.drawingDataUrl) && (
                <div className="relative rounded-xl overflow-hidden border border-black/10 bg-white">
                  <img
                    src={editingNote.imageDataUrl || editingNote.drawingDataUrl}
                    alt={kn.attachmentAlt}
                    className="w-full max-h-48 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setEditingNote((n) =>
                        n ? { ...n, imageDataUrl: undefined, drawingDataUrl: undefined } : n
                      )
                    }
                    className="absolute top-2 end-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/65 text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) =>
                    setEditingNote((n) => (n ? { ...n, title: e.target.value } : n))
                  }
                  placeholder={kn.editTitlePlaceholder}
                  className="flex-1 bg-transparent text-base font-bold text-neutral-900 dark:text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setEditingNote((n) => (n ? { ...n, pinned: !n.pinned } : n))
                  }
                  className={`p-2 rounded-full ${
                    editingNote.pinned
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'text-neutral-400'
                  }`}
                >
                  <Pin className={`w-4 h-4 ${editingNote.pinned ? 'fill-current' : ''}`} />
                </button>
              </div>

              {editingNote.mode === 'text' ? (
                <textarea
                  rows={5}
                  value={editingNote.content}
                  onChange={(e) =>
                    setEditingNote((n) => (n ? { ...n, content: e.target.value } : n))
                  }
                  placeholder={kn.editContentPlaceholder}
                  className="w-full bg-transparent text-sm text-neutral-800 dark:text-neutral-200 resize-none focus:outline-none leading-relaxed"
                />
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 pe-1">
                  {editingNote.checklist.map((row) => (
                    <div key={row.id} className="flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingNote((n) =>
                            n
                              ? {
                                  ...n,
                                  checklist: n.checklist.map((r) =>
                                    r.id === row.id ? { ...r, done: !r.done } : r
                                  ),
                                }
                              : n
                          )
                        }
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          row.done
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'border-neutral-400'
                        }`}
                      >
                        {row.done && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <input
                        type="text"
                        value={row.text}
                        onChange={(e) =>
                          setEditingNote((n) =>
                            n
                              ? {
                                  ...n,
                                  checklist: n.checklist.map((r) =>
                                    r.id === row.id ? { ...r, text: e.target.value } : r
                                  ),
                                }
                              : n
                          )
                        }
                        className={`flex-1 bg-transparent focus:outline-none ${
                          row.done
                            ? 'line-through text-neutral-400'
                            : 'text-neutral-800 dark:text-neutral-200'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditingNote((n) =>
                            n
                              ? { ...n, checklist: n.checklist.filter((r) => r.id !== row.id) }
                              : n
                          )
                        }
                        className="text-neutral-400 hover:text-rose-500 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <Plus className="w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={editCheckItem}
                      onChange={(e) => setEditCheckItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && editCheckItem.trim()) {
                          e.preventDefault();
                          setEditingNote((n) =>
                            n
                              ? {
                                  ...n,
                                  checklist: [
                                    ...n.checklist,
                                    { id: `chk-${Date.now()}`, text: editCheckItem.trim(), done: false },
                                  ],
                                }
                              : n
                          );
                          setEditCheckItem('');
                        }
                      }}
                      placeholder={kn.addCheckItemPlaceholder}
                      className="flex-1 bg-transparent text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={kn.colorNames[c.id]}
                    onClick={() =>
                      setEditingNote((n) => (n ? { ...n, color: c.id } : n))
                    }
                    style={{ backgroundColor: c.swatch }}
                    className={`w-5 h-5 rounded-full border-2 ${
                      editingNote.color === c.id
                        ? 'border-neutral-900 dark:border-white scale-110'
                        : 'border-black/15'
                    }`}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setShowSketchPadFor('edit')}
                  title={kn.editSketchTitle}
                  className="p-1.5 rounded-lg bg-black/[0.06] dark:bg-white/[0.1] text-neutral-700 dark:text-neutral-200 cursor-pointer"
                >
                  <Brush className="w-3.5 h-3.5" />
                </button>
                <input
                  id="keep-edit-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleUploadEditImage}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={handlePickEditImage}
                  title={kn.addImageBtnTitle}
                  aria-label={kn.addImageBtnTitle}
                  className="p-1.5 rounded-lg bg-black/[0.06] dark:bg-white/[0.1] text-neutral-700 dark:text-neutral-200 cursor-pointer inline-flex items-center justify-center"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                <select
                  value={editingNote.label}
                  onChange={(e) =>
                    setEditingNote((n) => (n ? { ...n, label: e.target.value } : n))
                  }
                  className="ms-auto text-xs font-medium bg-black/[0.06] dark:bg-white/[0.1] text-neutral-700 dark:text-neutral-200 rounded-lg px-2 py-1 focus:outline-none"
                >
                  {labels.map((l) => (
                    <option key={l} value={l}>
                      #{localizeKeepLabel(l, settings.language)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => moveToTrash(editingNote.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                >
                  {kn.moveToTrash}
                </button>
                <button
                  type="button"
                  onClick={saveEditingNote}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-neutral-900 text-white dark:bg-amber-400 dark:text-neutral-950"
                >
                  {kn.done}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sketch Pad Modal */}
        {showSketchPadFor && (
          <SketchCanvasPad
            kn={kn}
            initialDataUrl={
              showSketchPadFor === 'edit'
                ? editingNote?.drawingDataUrl
                : draftDrawing
            }
            onCancel={() => setShowSketchPadFor(null)}
            onSave={(dataUrl) => {
              if (showSketchPadFor === 'edit') {
                setEditingNote((n) => (n ? { ...n, drawingDataUrl: dataUrl } : n));
              } else {
                setDraftDrawing(dataUrl);
                setComposerExpanded(true);
              }
              setShowSketchPadFor(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
