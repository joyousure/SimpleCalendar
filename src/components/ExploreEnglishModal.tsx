import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Compass,
  Volume2,
  BookOpen,
  GraduationCap,
  Award,
  CheckCircle2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Headphones,
  Map as MapIcon,
  Mic,
  MicOff,
  Keyboard,
  Layers,
  Check,
  Search,
  Timer,
  Play,
  RotateCcw,
  ArrowRight,
  FileText,
  Copy,
  Shuffle,
  AlertCircle,
  Calculator,
  Eye,
  EyeOff,
  Square,
  Bookmark,
  Download,
  BookMarked,
  ListOrdered,
  Clock,
  ChevronDown,
  ShieldCheck,
  WifiOff,
  GitBranch,
} from 'lucide-react';
import { AppSettings } from '../types/calendar';
import { triggerHaptic } from '../utils/haptics';
import { isRtlLanguage } from '../utils/i18n';
import { normalizeSearchText } from '../data/worldCities';
import { getExploreEnglishI18n } from '../utils/fabModalI18n';
import {
  getExploreExtraI18n,
  getExploreAudioI18n,
  getExploreFavoritesI18n,
} from '../utils/lawsExploreExtraI18n';
import { getExploreVaultI18n } from '../utils/exploreVaultI18n';
import { useSearchHistory } from '../utils/searchHistory';
import { SearchHistoryBar } from './SearchHistoryBar';
import {
  speakEnglishAudio,
  stopAllExploreSpeech,
  startDialogueSession,
  DialogueSessionHandle,
  PlaybackResultStatus,
} from '../utils/exploreSpeech';
import { readStorageJson, writeStorageJson } from '../utils/storage';
import {
  syncAndLoadExplorePackIdb,
  loadExploreProgressIdb,
  saveExploreProgressIdb,
  mergeExploreProgress,
} from '../utils/offlineDb';
import {
  IeltsBand,
  GrammarCategory,
  Listening179Item,
  calculateOfficialIeltsOverall,
  calculateIeltsWritingOverall,
  LISTENING_179_ITEMS,
  SPEAKING_PROMPTS,
  SYNONYM_538_PAIRS,
  TFNG_DRILLS,
  ABC_CHAIN_TOPICS,
  TASK1_DATA_PATTERNS,
  SENTENCE_UPGRADES,
  GRAMMAR_MODULES,
  OPEN_IELTS_STUDY_PLAN,
  IELTS_WRITING_BAND_MATRIX,
  OPEN_IELTS_REVISION_STUDIOS,
  OPEN_IELTS_SPEAKING_CHAINS,
  GU_JIABEI_TRANSLATION_DRILLS,
} from '../data/ieltsData';
import {
  VocabTrack,
  VaultVocabItem,
  VAULT_TRACKS,
  ALL_VAULT_VOCAB,
  NCE_LESSONS,
  ReviewCardRecord,
  scheduleCardReview,
  formatVaultAsTsv,
  formatVaultAsCsv,
  triggerTextDownload,
} from '../data/englishVaultData';

interface ExploreEnglishModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
}

type LearningTab =
  | 'roadmap'
  | 'vocab'
  | 'nce'
  | 'listening_speaking'
  | 'reading_writing'
  | 'grammar'
  | 'favorites';
type VocabPracticeMode = 'cards' | 'spelling' | 'listening';
type LSPracticeMode = 'corpus179' | 'speaking';
type RWPracticeMode = 'reading538' | 'writingABC';
type SpeakingPart = 'P1' | 'P2' | 'P3';

interface FavoriteSentenceItem {
  id: string;
  source: 'vocab' | 'speaking' | 'upgrade' | 'task1' | 'grammar' | 'nce';
  title: string;
  en: string;
  zh?: string;
  band?: string;
}

interface StoredProgress {
  masteredIds: string[];
  completedModules: string[];
  weakIds: string[];
  xp: number;
  favoriteWords: string[];
  favoriteSentences: FavoriteSentenceItem[];
  reviewMap: Record<string, ReviewCardRecord>;
}

const PROGRESS_KEY = 'ielts_learning_progress_v1';

const DEFAULT_PROGRESS: StoredProgress = {
  masteredIds: [],
  completedModules: [],
  weakIds: [],
  xp: 0,
  favoriteWords: [],
  favoriteSentences: [],
  reviewMap: {},
};

function loadProgress(): StoredProgress {
  const parsed = readStorageJson<Partial<StoredProgress>>(
    PROGRESS_KEY,
    (val): val is Partial<StoredProgress> => Boolean(val) && typeof val === 'object'
  );
  if (!parsed) return DEFAULT_PROGRESS;
  const rawReviewMap =
    parsed.reviewMap && typeof parsed.reviewMap === 'object' ? parsed.reviewMap : {};
  const cleanReviewMap: Record<string, ReviewCardRecord> = {};
  Object.entries(rawReviewMap).forEach(([k, v]) => {
    if (
      v &&
      typeof v === 'object' &&
      (v.stage === 0 || v.stage === 1 || v.stage === 2 || v.stage === 3) &&
      typeof v.nextReviewAt === 'number' &&
      typeof v.reps === 'number'
    ) {
      cleanReviewMap[k] = { stage: v.stage, nextReviewAt: v.nextReviewAt, reps: v.reps };
    }
  });
  return {
    masteredIds: Array.isArray(parsed.masteredIds)
      ? parsed.masteredIds.filter((i): i is string => typeof i === 'string')
      : [],
    completedModules: Array.isArray(parsed.completedModules)
      ? parsed.completedModules.filter((i): i is string => typeof i === 'string')
      : [],
    weakIds: Array.isArray(parsed.weakIds)
      ? parsed.weakIds.filter((i): i is string => typeof i === 'string')
      : [],
    xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
    favoriteWords: Array.isArray(parsed.favoriteWords)
      ? parsed.favoriteWords.filter((i): i is string => typeof i === 'string')
      : [],
    favoriteSentences: Array.isArray(parsed.favoriteSentences)
      ? parsed.favoriteSentences.filter(
          (item): item is FavoriteSentenceItem =>
            Boolean(item) &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.en === 'string'
        )
      : [],
    reviewMap: cleanReviewMap,
  };
}

function clampBandScore(val: number): number {
  const clamped = Math.min(9, Math.max(4, val));
  return Math.round(clamped * 2) / 2;
}

export const ExploreEnglishModal: React.FC<ExploreEnglishModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const hapticsEnabled = settings.enableHaptics !== false;
  const ui = getExploreEnglishI18n(settings.language);
  const extra = getExploreExtraI18n(settings.language);
  const audioUi = getExploreAudioI18n(settings.language);
  const favUi = getExploreFavoritesI18n(settings.language);
  const vaultUi = getExploreVaultI18n(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const isZh = settings.language === 'zh-CN' || settings.language === 'zh-TW';

  const [activeTab, setActiveTab] = useState<LearningTab>('roadmap');
  const [favFilter, setFavFilter] = useState<'all' | 'words' | 'sentences'>('all');
  const vocabSearchHistory = useSearchHistory('explore_vocab');
  const synonymSearchHistory = useSearchHistory('explore_synonym');
  const [bandFilter, setBandFilter] = useState<IeltsBand | 'ALL'>('ALL');
  const [accent, setAccent] = useState<'en-GB' | 'en-US'>('en-GB');
  const [speechRate, setSpeechRate] = useState<number>(0.92);
  const [progress, setProgress] = useState<StoredProgress>(loadProgress);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Roadmap Band Score Calculator state
  const [calcScores, setCalcScores] = useState({
    listening: 6.5,
    reading: 7.0,
    writing: 6.0,
    speaking: 6.5,
  });

  // Multi-Track Vocabulary Vault state (Sequential vs Shuffled + SRS + Export)
  const [vocabTrack, setVocabTrack] = useState<VocabTrack | 'ALL'>('ALL');
  const [vocabMode, setVocabMode] = useState<VocabPracticeMode>('cards');
  const [vocabGroup, setVocabGroup] = useState<string>('ALL');
  const [vocabQuery, setVocabQuery] = useState('');
  const [vocabIndex, setVocabIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [unmasteredOnly, setUnmasteredOnly] = useState(false);
  const [weakVocabOnly, setWeakVocabOnly] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const [orderMode, setOrderMode] = useState<'sequential' | 'shuffled'>('sequential');
  const [shuffleSeed, setShuffleSeed] = useState<number>(17);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // New Concept English (NCE 1-4) state
  const [nceBookFilter, setNceBookFilter] = useState<'ALL' | 1 | 2 | 3 | 4>('ALL');
  const [selectedNceId, setSelectedNceId] = useState<string>(NCE_LESSONS[0].id);
  const [nceShowZh, setNceShowZh] = useState<boolean>(true);

  // Corpus Spelling state
  const [spellingInput, setSpellingInput] = useState('');
  const [spellingState, setSpellingState] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Audio Match state
  const [listenIndex, setListenIndex] = useState(0);
  const [listenPickedId, setListenPickedId] = useState<string | null>(null);

  // Listening 179 + Speaking state
  const [lsMode, setLsMode] = useState<LSPracticeMode>('corpus179');
  const [corpusInputs, setCorpusInputs] = useState<Record<string, string>>({});
  const [corpusChecks, setCorpusChecks] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [revealedCorpusIds, setRevealedCorpusIds] = useState<Record<string, boolean>>({});
  const [speakingPartFilter, setSpeakingPartFilter] = useState<SpeakingPart | 'ALL'>('ALL');
  const [prepPhase, setPrepPhase] = useState<'prep' | 'speak'>('prep');
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(60);
  const [prepRunning, setPrepRunning] = useState(false);
  const [listeningLineId, setListeningLineId] = useState<string | null>(null);
  const [speechFeedback, setSpeechFeedback] = useState<Record<string, string>>({});

  // Reading 538 + Writing ABC state
  const [rwMode, setRwMode] = useState<RWPracticeMode>('reading538');
  const [synonymQuery, setSynonymQuery] = useState('');
  const [tfngPicked, setTfngPicked] = useState<Record<string, 'TRUE' | 'FALSE' | 'NOT GIVEN'>>({});
  const [selectedAbcId, setSelectedAbcId] = useState<string>(ABC_CHAIN_TOPICS[0].id);
  const [abcDraftA, setAbcDraftA] = useState('');
  const [abcDraftB, setAbcDraftB] = useState('');
  const [abcDraftC, setAbcDraftC] = useState('');
  const [essayDraft, setEssayDraft] = useState('');
  const [task1TypeFilter, setTask1TypeFilter] = useState<
    'all' | 'trend' | 'comparison' | 'process' | 'map'
  >('all');

  // Grammar & offline status state
  const [grammarQuizAnswer, setGrammarQuizAnswer] = useState<Record<string, number>>({});
  const [grammarUnsolvedOnly, setGrammarUnsolvedOnly] = useState(false);
  const [grammarCategoryFilter, setGrammarCategoryFilter] = useState<GrammarCategory | 'ALL'>('ALL');
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [listeningDictationMode, setListeningDictationMode] = useState(false);
  const [showSpeakingChains, setShowSpeakingChains] = useState(false);
  const [writingTask1Score, setWritingTask1Score] = useState<number>(6.0);
  const [writingTask2Score, setWritingTask2Score] = useState<number>(6.5);
  const [showBandMatrix, setShowBandMatrix] = useState(false);
  const [revisionAuditChecked, setRevisionAuditChecked] = useState<Record<string, boolean>>({});
  const [guInputs, setGuInputs] = useState<Record<string, string>>({});
  const [guHintOpen, setGuHintOpen] = useState<Record<string, boolean>>({});
  const [guModelOpen, setGuModelOpen] = useState<Record<string, boolean>>({});

  // Clipboard feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Audio playback & real-device dialogue capture state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioStatusBanner, setAudioStatusBanner] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState<Record<string, string>>({});
  const [userRecordings, setUserRecordings] = useState<Record<string, string>>({});
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);

  const dialogueSessionRef = useRef<DialogueSessionHandle | null>(null);
  const recordingAudioRef = useRef<HTMLAudioElement | null>(null);
  const userRecordingsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    userRecordingsRef.current = userRecordings;
  }, [userRecordings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    return () => {
      stopAllExploreSpeech();
      if (dialogueSessionRef.current) {
        dialogueSessionRef.current.stop();
        dialogueSessionRef.current = null;
      }
      if (recordingAudioRef.current) {
        try {
          recordingAudioRef.current.pause();
        } catch {}
        recordingAudioRef.current = null;
      }
      Object.values(userRecordingsRef.current).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
    };
  }, []);

  const idbHydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await syncAndLoadExplorePackIdb({
        vocab: ALL_VAULT_VOCAB,
        nceLessons: NCE_LESSONS,
        listening179Count: LISTENING_179_ITEMS.length,
        speakingCount: SPEAKING_PROMPTS.length,
        synonymCount: SYNONYM_538_PAIRS.length,
        tfngCount: TFNG_DRILLS.length,
        grammarCount: GRAMMAR_MODULES.length,
      });
      const idbProg = await loadExploreProgressIdb();
      if (cancelled) return;
      idbHydratedRef.current = true;
      if (idbProg) {
        setProgress((prev) => mergeExploreProgress(prev, idbProg));
      } else {
        void saveExploreProgressIdb(progress);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    writeStorageJson(PROGRESS_KEY, progress);
    if (idbHydratedRef.current) {
      void saveExploreProgressIdb(progress);
    }
  }, [progress]);

  useEffect(() => {
    if (!isOpen) {
      stopAllExploreSpeech();
      setIsPlayingAudio(false);
      setAudioStatusBanner(null);
      if (dialogueSessionRef.current) {
        dialogueSessionRef.current.stop();
        dialogueSessionRef.current = null;
      }
      if (recordingAudioRef.current) {
        try {
          recordingAudioRef.current.pause();
          recordingAudioRef.current.currentTime = 0;
        } catch {}
        recordingAudioRef.current = null;
      }
      setPlayingRecordingId(null);
      setListeningLineId(null);
      setMicLevel(0);
      setPrepRunning(false);
      setShowResetConfirm(false);
      setShowExportMenu(false);
    }
  }, [isOpen]);

  // Official Part 2 dual-phase countdown timer (1m prep -> 2m speak)
  useEffect(() => {
    if (!isOpen || !prepRunning) return;
    const id = window.setInterval(() => {
      setPrepSecondsLeft((s) => {
        if (s <= 1) {
          triggerHaptic('success', hapticsEnabled);
          if (prepPhase === 'prep') {
            setPrepPhase('speak');
            return 120;
          }
          setPrepRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isOpen, prepRunning, prepPhase, hapticsEnabled]);

  const stopRecordingPlayback = () => {
    if (recordingAudioRef.current) {
      try {
        recordingAudioRef.current.pause();
        recordingAudioRef.current.currentTime = 0;
      } catch {}
      recordingAudioRef.current = null;
    }
    setPlayingRecordingId(null);
  };

  const togglePlayRecording = (lineId: string, url: string) => {
    triggerHaptic('selection', hapticsEnabled);
    if (playingRecordingId === lineId) {
      stopRecordingPlayback();
      return;
    }
    stopAllExploreSpeech();
    setIsPlayingAudio(false);
    stopRecordingPlayback();
    const audio = new Audio(url);
    recordingAudioRef.current = audio;
    setPlayingRecordingId(lineId);
    audio.onended = () => {
      if (recordingAudioRef.current === audio) {
        recordingAudioRef.current = null;
      }
      setPlayingRecordingId(null);
    };
    audio.onerror = () => {
      if (recordingAudioRef.current === audio) {
        recordingAudioRef.current = null;
      }
      setPlayingRecordingId(null);
      setAudioStatusBanner(audioUi.audioPlaybackFailed);
    };
    audio.play().catch(() => {
      setPlayingRecordingId(null);
      setAudioStatusBanner(audioUi.audioPlaybackFailed);
    });
  };

  const speakText = (text: string, customRate?: number) => {
    triggerHaptic('selection', hapticsEnabled);
    stopRecordingPlayback();
    setAudioStatusBanner(null);
    void speakEnglishAudio({
      text,
      accent,
      rate: customRate ?? speechRate,
      offlineMode: Boolean(settings.offlineMode) || !isOnline,
      onStart: () => setIsPlayingAudio(true),
      onEnd: (status: PlaybackResultStatus) => {
        setIsPlayingAudio(false);
        if (status === 'offline_no_tts') {
          setAudioStatusBanner(audioUi.audioOfflineNoTts);
        } else if (status === 'failed') {
          setAudioStatusBanner(audioUi.audioPlaybackFailed);
        }
      },
    });
  };

  const copyText = (key: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    triggerHaptic('success', hapticsEnabled);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1600);
  };

  const awardXpOnce = (moduleKey: string, points: number) => {
    setProgress((prev) => {
      if (prev.completedModules.includes(moduleKey)) return prev;
      return {
        ...prev,
        completedModules: [...prev.completedModules, moduleKey],
        xp: prev.xp + points,
      };
    });
  };

  const recordWeakItem = (weakKey: string) => {
    setProgress((prev) => {
      if (prev.weakIds.includes(weakKey)) return prev;
      return {
        ...prev,
        weakIds: [...prev.weakIds, weakKey],
      };
    });
  };

  const resolveWeakItem = (weakKey: string) => {
    setProgress((prev) => {
      if (!prev.weakIds.includes(weakKey)) return prev;
      return {
        ...prev,
        weakIds: prev.weakIds.filter((id) => id !== weakKey),
      };
    });
  };

  const toggleMastered = (id: string) => {
    triggerHaptic('selection', hapticsEnabled);
    setProgress((prev) => {
      const exists = prev.masteredIds.includes(id);
      return {
        ...prev,
        masteredIds: exists
          ? prev.masteredIds.filter((item) => item !== id)
          : [...prev.masteredIds, id],
        weakIds: exists ? prev.weakIds : prev.weakIds.filter((w) => w !== `voc:${id}`),
        xp: exists ? prev.xp : prev.xp + 5,
      };
    });
  };

  const isWordFavorited = (wordId: string) => progress.favoriteWords.includes(wordId);

  const toggleFavoriteWord = (wordId: string) => {
    triggerHaptic('selection', hapticsEnabled);
    setProgress((prev) => {
      const exists = prev.favoriteWords.includes(wordId);
      return {
        ...prev,
        favoriteWords: exists
          ? prev.favoriteWords.filter((id) => id !== wordId)
          : [wordId, ...prev.favoriteWords],
      };
    });
  };

  const isSentenceFavorited = (sentenceId: string) =>
    progress.favoriteSentences.some((item) => item.id === sentenceId);

  const toggleFavoriteSentence = (item: FavoriteSentenceItem) => {
    triggerHaptic('selection', hapticsEnabled);
    setProgress((prev) => {
      const exists = prev.favoriteSentences.some((s) => s.id === item.id);
      return {
        ...prev,
        favoriteSentences: exists
          ? prev.favoriteSentences.filter((s) => s.id !== item.id)
          : [item, ...prev.favoriteSentences],
      };
    });
  };

  const rateCardSrs = (card: VaultVocabItem, rating: 'again' | 'hard' | 'good') => {
    triggerHaptic(rating === 'good' ? 'success' : 'selection', hapticsEnabled);
    setProgress((prev) => {
      const updatedRecord = scheduleCardReview(prev.reviewMap[card.id], rating);
      const nextReviewMap = { ...prev.reviewMap, [card.id]: updatedRecord };
      let nextMastered = prev.masteredIds;
      let nextWeak = prev.weakIds;
      let nextXp = prev.xp;
      if (rating === 'again') {
        nextMastered = prev.masteredIds.filter((id) => id !== card.id);
        if (!nextWeak.includes(`voc:${card.id}`)) {
          nextWeak = [...nextWeak, `voc:${card.id}`];
        }
      } else if (rating === 'hard') {
        nextWeak = nextWeak.filter((w) => w !== `voc:${card.id}`);
        nextXp += 3;
      } else {
        if (!nextMastered.includes(card.id)) {
          nextMastered = [...nextMastered, card.id];
          nextXp += 5;
        } else {
          nextXp += 2;
        }
        nextWeak = nextWeak.filter((w) => w !== `voc:${card.id}`);
      }
      return {
        ...prev,
        reviewMap: nextReviewMap,
        masteredIds: nextMastered,
        weakIds: nextWeak,
        xp: nextXp,
      };
    });
  };

  const favoriteVocabEntries = useMemo(
    () =>
      progress.favoriteWords
        .map((id) => ALL_VAULT_VOCAB.find((v) => v.id === id))
        .filter((v): v is VaultVocabItem => Boolean(v)),
    [progress.favoriteWords]
  );

  const totalFavoritesCount =
    favoriteVocabEntries.length + progress.favoriteSentences.length;

  const weakVocabIds = useMemo(
    () =>
      progress.weakIds
        .filter((w) => w.startsWith('voc:'))
        .map((w) => w.slice(4)),
    [progress.weakIds]
  );

  const dueVocabIds = useMemo(() => {
    const now = Date.now();
    return ALL_VAULT_VOCAB.filter((v) => {
      const rec = progress.reviewMap[v.id];
      if (rec) return rec.nextReviewAt <= now;
      return !progress.masteredIds.includes(v.id);
    }).map((v) => v.id);
  }, [progress.reviewMap, progress.masteredIds]);

  const trackAndBandScopedVocab = useMemo(
    () =>
      ALL_VAULT_VOCAB.filter((v) => {
        if (vocabTrack !== 'ALL' && v.track !== vocabTrack) return false;
        if (bandFilter !== 'ALL' && v.band !== bandFilter) return false;
        return true;
      }),
    [vocabTrack, bandFilter]
  );

  const vocabGroups = useMemo(() => {
    const map = new Map<string, string>();
    trackAndBandScopedVocab.forEach((c) => {
      map.set(c.group, isZh ? c.group : c.groupEn);
    });
    return Array.from(map.entries());
  }, [trackAndBandScopedVocab, isZh]);

  const filteredVocab = useMemo(() => {
    const q = normalizeSearchText(vocabQuery);
    const dueSet = new Set(dueVocabIds);
    const list = trackAndBandScopedVocab.filter((v) => {
      if (vocabGroup !== 'ALL' && v.group !== vocabGroup) return false;
      if (unmasteredOnly && progress.masteredIds.includes(v.id)) return false;
      if (weakVocabOnly && !weakVocabIds.includes(v.id)) return false;
      if (dueOnly && !dueSet.has(v.id)) return false;
      if (!q) return true;
      return (
        normalizeSearchText(v.word).includes(q) ||
        normalizeSearchText(v.meaning).includes(q) ||
        normalizeSearchText(v.meaningEn).includes(q) ||
        normalizeSearchText(v.collocation).includes(q) ||
        normalizeSearchText(v.rootHint).includes(q) ||
        normalizeSearchText(v.group).includes(q) ||
        normalizeSearchText(v.groupEn).includes(q) ||
        normalizeSearchText(v.bookName).includes(q) ||
        normalizeSearchText(v.bookNameEn).includes(q)
      );
    });
    if (orderMode === 'sequential') return list;
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = (shuffleSeed * (i + 7) + i * 13) % (i + 1);
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }, [
    trackAndBandScopedVocab,
    vocabGroup,
    vocabQuery,
    unmasteredOnly,
    weakVocabOnly,
    dueOnly,
    dueVocabIds,
    progress.masteredIds,
    weakVocabIds,
    orderMode,
    shuffleSeed,
  ]);

  const activeVocabPool: VaultVocabItem[] =
    filteredVocab.length > 0 ? filteredVocab : ALL_VAULT_VOCAB;
  const safeVocabIdx = vocabIndex % activeVocabPool.length;
  const activeCard = activeVocabPool[safeVocabIdx];
  const listenTarget = activeVocabPool[listenIndex % activeVocabPool.length];

  const cardWindowSlice = useMemo(() => {
    const maxPills = 24;
    if (activeVocabPool.length <= maxPills) {
      return activeVocabPool.map((card, idx) => ({ card, idx }));
    }
    const half = Math.floor(maxPills / 2);
    let start = Math.max(0, safeVocabIdx - half);
    let end = start + maxPills;
    if (end > activeVocabPool.length) {
      end = activeVocabPool.length;
      start = Math.max(0, end - maxPills);
    }
    return activeVocabPool.slice(start, end).map((card, offset) => ({
      card,
      idx: start + offset,
    }));
  }, [activeVocabPool, safeVocabIdx]);

  const listenChoices = useMemo(() => {
    const sameTrackPool = ALL_VAULT_VOCAB.filter(
      (v) => v.id !== listenTarget.id && (vocabTrack === 'ALL' || v.track === listenTarget.track)
    );
    const fallbackPool =
      sameTrackPool.length >= 3
        ? sameTrackPool
        : ALL_VAULT_VOCAB.filter((v) => v.id !== listenTarget.id);
    const offset = listenIndex % Math.max(1, fallbackPool.length - 3);
    const distractors = fallbackPool.slice(offset, offset + 3);
    const list = [listenTarget, ...distractors];
    return list.sort((a, b) => a.word.localeCompare(b.word));
  }, [listenTarget, listenIndex, vocabTrack]);

  const filteredNceLessons = useMemo(
    () =>
      nceBookFilter === 'ALL'
        ? NCE_LESSONS
        : NCE_LESSONS.filter((l) => l.book === nceBookFilter),
    [nceBookFilter]
  );

  const activeNceLesson = useMemo(
    () =>
      filteredNceLessons.find((l) => l.id === selectedNceId) ||
      filteredNceLessons[0] ||
      NCE_LESSONS[0],
    [filteredNceLessons, selectedNceId]
  );

  const handleExportDeck = (format: 'txt' | 'csv' | 'copy', customList?: VaultVocabItem[]) => {
    const items = customList && customList.length > 0 ? customList : activeVocabPool;
    const tag = vocabTrack === 'ALL' ? 'all' : vocabTrack;
    if (format === 'txt') {
      const tsv = formatVaultAsTsv(items, isZh);
      triggerTextDownload(`english-vault-${tag}.txt`, tsv, 'text/plain;charset=utf-8');
      setExportNotice(vaultUi.exportSuccessNotice(items.length, 'Anki / Eudic .txt'));
    } else if (format === 'csv') {
      const csv = formatVaultAsCsv(items, isZh);
      triggerTextDownload(`english-vault-${tag}.csv`, csv, 'text/csv;charset=utf-8');
      setExportNotice(vaultUi.exportSuccessNotice(items.length, 'Excel .csv'));
    } else {
      const tsv = formatVaultAsTsv(items, isZh);
      copyText('vault-export', tsv);
      setExportNotice(vaultUi.exportSuccessNotice(items.length, 'Clipboard'));
    }
    setShowExportMenu(false);
    triggerHaptic('success', hapticsEnabled);
    window.setTimeout(() => setExportNotice(null), 3200);
  };

  // Keyboard shortcuts for Vocab Cards tab when not typing into form fields
  useEffect(() => {
    if (!isOpen || activeTab !== 'vocab' || vocabMode !== 'cards') return;
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setVocabIndex((i) => (i + 1) % activeVocabPool.length);
        setCardFlipped(false);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setVocabIndex((i) => (i - 1 + activeVocabPool.length) % activeVocabPool.length);
        setCardFlipped(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setCardFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, activeTab, vocabMode, activeVocabPool.length]);

  const filteredListening179 = useMemo(
    () =>
      bandFilter === 'ALL'
        ? LISTENING_179_ITEMS
        : LISTENING_179_ITEMS.filter((item) => item.band === bandFilter),
    [bandFilter]
  );

  const filteredSpeakingPrompts = useMemo(
    () =>
      SPEAKING_PROMPTS.filter(
        (sp) =>
          (bandFilter === 'ALL' || sp.band === bandFilter) &&
          (speakingPartFilter === 'ALL' || sp.part === speakingPartFilter)
      ),
    [bandFilter, speakingPartFilter]
  );

  const filteredSynonyms538 = useMemo(() => {
    const q = normalizeSearchText(synonymQuery);
    return SYNONYM_538_PAIRS.filter((item) => {
      if (bandFilter !== 'ALL' && item.band !== bandFilter) return false;
      if (!q) return true;
      return `${item.passageTerm} ${item.questionParaphrase} ${item.meaning} ${item.meaningEn}`
        .toLowerCase()
        .includes(q);
    });
  }, [bandFilter, synonymQuery]);

  const filteredTfngDrills = useMemo(
    () =>
      bandFilter === 'ALL'
        ? TFNG_DRILLS
        : TFNG_DRILLS.filter((item) => item.band === bandFilter),
    [bandFilter]
  );

  const filteredTask1Patterns = useMemo(
    () =>
      task1TypeFilter === 'all'
        ? TASK1_DATA_PATTERNS
        : TASK1_DATA_PATTERNS.filter((p) => p.type === task1TypeFilter),
    [task1TypeFilter]
  );

  const filteredGrammar = useMemo(
    () =>
      GRAMMAR_MODULES.filter((g) => {
        if (bandFilter !== 'ALL' && g.band !== bandFilter) return false;
        if (grammarCategoryFilter !== 'ALL' && g.category !== grammarCategoryFilter) return false;
        if (grammarUnsolvedOnly && progress.completedModules.includes(`ielts_gram_${g.id}`)) {
          return false;
        }
        return true;
      }),
    [bandFilter, grammarCategoryFilter, grammarUnsolvedOnly, progress.completedModules]
  );

  const activeAbcTopic =
    ABC_CHAIN_TOPICS.find((t) => t.id === selectedAbcId) || ABC_CHAIN_TOPICS[0];

  useEffect(() => {
    setAbcDraftA(activeAbcTopic.chainA);
    setAbcDraftB(activeAbcTopic.chainB);
    setAbcDraftC(activeAbcTopic.chainC);
  }, [activeAbcTopic]);

  const handleCheckSpelling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spellingInput.trim()) return;
    const isRight =
      spellingInput.trim().toLowerCase() === activeCard.word.toLowerCase();
    setSpellingState(isRight ? 'correct' : 'wrong');
    triggerHaptic(isRight ? 'success' : 'selection', hapticsEnabled);
    if (isRight) {
      awardXpOnce(`ielts_spell_${activeCard.id}`, 10);
      resolveWeakItem(`voc:${activeCard.id}`);
      if (!progress.masteredIds.includes(activeCard.id)) {
        setProgress((prev) => ({
          ...prev,
          masteredIds: [...prev.masteredIds, activeCard.id],
        }));
      }
    } else {
      recordWeakItem(`voc:${activeCard.id}`);
    }
  };

  const handleCheckCorpus179 = (item: Listening179Item) => {
    const raw = (corpusInputs[item.id] || '').trim().toLowerCase();
    if (!raw) return;
    const targetA = item.audioParaphrase.toLowerCase();
    const targetB = item.questionWord.toLowerCase();
    const matched = raw === targetA || raw === targetB;
    setCorpusChecks((prev) => ({ ...prev, [item.id]: matched ? 'correct' : 'wrong' }));
    triggerHaptic(matched ? 'success' : 'selection', hapticsEnabled);
    if (matched) {
      awardXpOnce(`ielts_179_${item.id}`, 10);
      resolveWeakItem(`179:${item.id}`);
    } else {
      recordWeakItem(`179:${item.id}`);
    }
  };

  const handleShadowPractice = async (lineId: string, expectedEn: string) => {
    triggerHaptic('selection', hapticsEnabled);
    stopRecordingPlayback();
    setAudioStatusBanner(null);

    if (listeningLineId === lineId && dialogueSessionRef.current) {
      dialogueSessionRef.current.stop();
      dialogueSessionRef.current = null;
      return;
    }

    if (dialogueSessionRef.current) {
      dialogueSessionRef.current.stop();
      dialogueSessionRef.current = null;
    }

    setListeningLineId(lineId);
    setMicLevel(0);
    setInterimTranscript((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });

    let sessionAlreadyFinished = false;
    const handle = await startDialogueSession({
      accent,
      expectedText: expectedEn,
      onLevel: (lvl) => setMicLevel(lvl),
      onInterimTranscript: (txt) =>
        setInterimTranscript((prev) => ({ ...prev, [lineId]: txt })),
      onComplete: (res) => {
        sessionAlreadyFinished = true;
        dialogueSessionRef.current = null;
        setListeningLineId((curr) => (curr === lineId ? null : curr));
        setMicLevel(0);
        setInterimTranscript((prev) => {
          const next = { ...prev };
          delete next[lineId];
          return next;
        });

        if (res.errorCode) {
          const msg =
            res.errorCode === 'permission_denied'
              ? audioUi.micPermissionDenied
              : res.errorCode === 'no_microphone'
              ? audioUi.micNoDevice
              : res.errorCode === 'insecure_context'
              ? audioUi.micInsecureContext
              : audioUi.audioPlaybackFailed;
          setSpeechFeedback((prev) => ({ ...prev, [lineId]: msg }));
          setAudioStatusBanner(msg);
          return;
        }

        if (res.recordingUrl) {
          setUserRecordings((prev) => {
            const oldUrl = prev[lineId];
            if (oldUrl && oldUrl !== res.recordingUrl) {
              try {
                URL.revokeObjectURL(oldUrl);
              } catch {}
            }
            return { ...prev, [lineId]: res.recordingUrl! };
          });
        }

        if (res.usedTranscript) {
          const score = res.matchScore ?? 0;
          setSpeechFeedback((prev) => ({
            ...prev,
            [lineId]: ui.speechMatched(res.transcript, score),
          }));
          if (score >= 60) {
            triggerHaptic('success', hapticsEnabled);
            awardXpOnce(`ielts_shadow_${lineId}`, 10);
          }
        } else if (res.fluencyScore > 0) {
          setSpeechFeedback((prev) => ({
            ...prev,
            [lineId]: audioUi.fluencyFeedback(res.spokenSeconds, res.fluencyScore),
          }));
          if (res.fluencyScore >= 55) {
            triggerHaptic('success', hapticsEnabled);
            awardXpOnce(`ielts_shadow_${lineId}`, 10);
          }
        } else {
          setSpeechFeedback((prev) => ({
            ...prev,
            [lineId]: audioUi.fluencyNoVoice,
          }));
        }
      },
    });

    if (!sessionAlreadyFinished) {
      dialogueSessionRef.current = handle;
    }
  };

  if (!isOpen) return null;

  const overallCalculatedBand = calculateOfficialIeltsOverall(
    calcScores.listening,
    calcScores.reading,
    calcScores.writing,
    calcScores.speaking
  );

  const dailyDoneCount = [
    progress.masteredIds.length >= 3,
    progress.completedModules.some((m) => m.startsWith('ielts_179_') || m.startsWith('ielts_shadow_')),
    progress.completedModules.some((m) => m.startsWith('ielts_tfng_')),
    progress.completedModules.some((m) => m.startsWith('ielts_abc_')),
    progress.completedModules.some((m) => m.startsWith('nce_lesson_')),
  ].filter(Boolean).length;
  const overallPercent = Math.round((dailyDoneCount / 5) * 100);

  const corpusCorrectCount = filteredListening179.filter(
    (item) => progress.completedModules.includes(`ielts_179_${item.id}`)
  ).length;
  const tfngCorrectCount = filteredTfngDrills.filter(
    (item) => progress.completedModules.includes(`ielts_tfng_${item.id}`)
  ).length;
  const grammarSolvedCount = GRAMMAR_MODULES.filter((g) =>
    progress.completedModules.includes(`ielts_gram_${g.id}`)
  ).length;
  const essayWordCount = essayDraft.trim() ? essayDraft.trim().split(/\s+/).length : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-md pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-4 animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-4xl h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] sm:h-[90vh] sm:max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-modal-content"
      >
        {/* Header */}
        <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {vaultUi.headerTitle}
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {vaultUi.headerSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              title={vaultUi.offlineNoticeDesc}
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border ${
                !isOnline || settings.offlineMode
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-sky-50 dark:bg-sky-500/15 border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300'
              }`}
            >
              {!isOnline || settings.offlineMode ? (
                <WifiOff className="w-3 h-3 shrink-0" />
              ) : (
                <ShieldCheck className="w-3 h-3 shrink-0" />
              )}
              <span>
                {!isOnline || settings.offlineMode
                  ? vaultUi.offlineReadyBadge
                  : vaultUi.onlineReadyBadge}
              </span>
            </span>
            <div className="hidden xs:flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 tabular-nums">
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>{progress.xp} XP</span>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="text-indigo-600 dark:text-indigo-400">
                {progress.masteredIds.length}/{ALL_VAULT_VOCAB.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer shrink-0"
              aria-label={ui.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Band Filter + Accent/Speed Controls */}
        <div className="shrink-0 px-4 sm:px-5 pt-2 pb-1.5 flex flex-wrap items-center justify-between gap-2 bg-neutral-50/70 dark:bg-neutral-950/30 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="grid grid-cols-5 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full sm:w-auto sm:min-w-[300px]">
            {(
              [
                { id: 'ALL', label: ui.allBands },
                { id: '5.5', label: ui.band55 },
                { id: '6.5', label: ui.band65 },
                { id: '7.0', label: ui.band70 },
                { id: '8.0+', label: ui.band80 },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setBandFilter(opt.id);
                  setVocabIndex(0);
                  setListenIndex(0);
                }}
                className={`px-1.5 py-1 rounded-full text-[11px] font-semibold text-center truncate transition-all cursor-pointer tabular-nums whitespace-nowrap ${
                  bandFilter === opt.id
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {isPlayingAudio && (
              <button
                type="button"
                onClick={() => {
                  stopAllExploreSpeech();
                  setIsPlayingAudio(false);
                }}
                className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>{audioUi.stopSpeechBtn}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setAccent((a) => (a === 'en-GB' ? 'en-US' : 'en-GB'))}
              className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              {accent === 'en-GB' ? ui.accentUk : ui.accentUs}
            </button>
            <button
              type="button"
              onClick={() => setSpeechRate((r) => (r < 0.9 ? 0.96 : 0.82))}
              className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer tabular-nums whitespace-nowrap shrink-0"
            >
              {speechRate < 0.9 ? ui.speedSlow : ui.speedNormal}
            </button>
          </div>
        </div>

        {/* Unified 7-Tab Curriculum + NCE + Favorites Switcher */}
        <div className="shrink-0 px-4 sm:px-5 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none sm:grid sm:grid-cols-7 p-1 rounded-2xl sm:rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10">
            {(
              [
                { id: 'roadmap', label: vaultUi.tabRoadmap, icon: MapIcon },
                { id: 'vocab', label: vaultUi.tabVault, icon: BookOpen },
                { id: 'nce', label: vaultUi.tabNce, icon: BookMarked },
                { id: 'listening_speaking', label: vaultUi.tabLS, icon: Headphones },
                { id: 'reading_writing', label: vaultUi.tabRW, icon: FileText },
                { id: 'grammar', label: vaultUi.tabGrammar, icon: GraduationCap },
                { id: 'favorites', label: vaultUi.tabFavorites, icon: Bookmark },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection', hapticsEnabled);
                    setShowExportMenu(false);
                    setActiveTab(tab.id);
                  }}
                  className={`min-h-[36px] flex items-center justify-center gap-1 py-1.5 px-2.5 sm:px-1.5 rounded-xl sm:rounded-full text-[11px] transition-all cursor-pointer tabular-nums whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 font-semibold hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      tab.id === 'favorites' && totalFavoritesCount > 0 ? 'text-amber-500' : ''
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.id === 'favorites' && totalFavoritesCount > 0 && (
                    <span className="text-[10px] opacity-75">({totalFavoritesCount})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {audioStatusBanner && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 flex items-center justify-between gap-2 text-xs font-semibold text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-300" />
                <span className="leading-snug">{audioStatusBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setAudioStatusBanner(null)}
                className="p-1 text-amber-600 dark:text-amber-300 cursor-pointer shrink-0"
                aria-label={ui.close}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {/* 1. ROADMAP TAB */}
          {activeTab === 'roadmap' && (
            <div className="space-y-4">
              {/* Hero Study Progress Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white/85">{ui.todayProgressLabel}</p>
                    <h3 className="text-lg font-extrabold mt-0.5 tabular-nums">
                      {dailyDoneCount} / 5 {isZh ? '核心模块已打卡' : 'Core Modules'}
                    </h3>
                    <p className="text-[11px] text-white/85 mt-1 tabular-nums">
                      {vaultUi.vaultTotalSummary(
                        ALL_VAULT_VOCAB.length,
                        progress.masteredIds.length,
                        dueVocabIds.length
                      )}
                    </p>
                  </div>
                  <div className="text-end tabular-nums shrink-0">
                    <div className="text-2xl font-extrabold">{overallPercent}%</div>
                    <div className="text-[11px] text-white/80">
                      {ui.masteredWordsLabel} {progress.masteredIds.length}/{ALL_VAULT_VOCAB.length}
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
              </div>

              {/* Multi-Track Vocabulary Vault Directory */}
              <div className="space-y-2.5">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {vaultUi.vaultDirectoryTitle}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {vaultUi.vaultDirectoryDesc}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {VAULT_TRACKS.map((tr) => {
                    const trackItems = ALL_VAULT_VOCAB.filter((v) => v.track === tr.id);
                    const masteredCount = trackItems.filter((v) =>
                      progress.masteredIds.includes(v.id)
                    ).length;
                    const pct =
                      trackItems.length > 0
                        ? Math.round((masteredCount / trackItems.length) * 100)
                        : 0;
                    return (
                      <button
                        key={tr.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection', hapticsEnabled);
                          setVocabTrack(tr.id);
                          setVocabGroup('ALL');
                          setVocabIndex(0);
                          setCardFlipped(false);
                          setActiveTab('vocab');
                        }}
                        className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 text-start transition-colors cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100 truncate">
                            {isZh ? tr.nameZh : tr.nameEn}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                            {tr.cefr}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-snug">
                          {isZh ? tr.subtitleZh : tr.subtitleEn}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums">
                            <span>
                              {masteredCount} / {trackItems.length}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Official IELTS Overall Band Calculator */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {extra.bandCalcTitle}
                    </h4>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-extrabold tabular-nums shrink-0">
                    {extra.bandCalcOverall}: {overallCalculatedBand.toFixed(1)}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { key: 'listening', label: extra.skillListening },
                      { key: 'reading', label: extra.skillReading },
                      { key: 'writing', label: extra.skillWriting },
                      { key: 'speaking', label: extra.skillSpeaking },
                    ] as const
                  ).map((sk) => (
                    <div
                      key={sk.key}
                      className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-between gap-1"
                    >
                      <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 truncate">
                        {sk.label}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 tabular-nums">
                        <button
                          type="button"
                          onClick={() =>
                            setCalcScores((prev) => ({
                              ...prev,
                              [sk.key]: clampBandScore(prev[sk.key] - 0.5),
                            }))
                          }
                          className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-200 cursor-pointer"
                        >
                          −
                        </button>
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 w-7 text-center">
                          {calcScores[sk.key].toFixed(1)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCalcScores((prev) => ({
                              ...prev,
                              [sk.key]: clampBandScore(prev[sk.key] + 0.5),
                            }))
                          }
                          className="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weak-Spot Mistake Queue & Safe Progress Reset */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {extra.weakQueueTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 tabular-nums">
                      {extra.weakQueueCount(progress.weakIds.length)}
                    </span>
                  </div>

                  {!showResetConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="text-[11px] font-semibold text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    >
                      {extra.resetProgressBtn}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-rose-600 dark:text-rose-300 font-semibold">
                        {extra.resetConfirmText}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setProgress(DEFAULT_PROGRESS);
                          setCorpusChecks({});
                          setTfngPicked({});
                          setGrammarQuizAnswer({});
                          setShowResetConfirm(false);
                        }}
                        className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                      >
                        {extra.resetConfirmYes}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-2.5 py-1 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer"
                      >
                        {extra.resetCancel}
                      </button>
                    </div>
                  )}
                </div>

                {progress.weakIds.length === 0 ? (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {extra.weakQueueEmpty}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {weakVocabIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setVocabTrack('ALL');
                          setBandFilter('ALL');
                          setVocabGroup('ALL');
                          setDueOnly(false);
                          setUnmasteredOnly(false);
                          setWeakVocabOnly(true);
                          setVocabMode('spelling');
                          setVocabIndex(0);
                          setActiveTab('vocab');
                        }}
                        className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300 cursor-pointer tabular-nums"
                      >
                        {ui.tabs.vocab} ({weakVocabIds.length})
                      </button>
                    )}
                    {progress.weakIds.some((w) => w.startsWith('179:')) && (
                      <button
                        type="button"
                        onClick={() => {
                          setLsMode('corpus179');
                          setActiveTab('listening_speaking');
                        }}
                        className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300 cursor-pointer tabular-nums"
                      >
                        {ui.lsModes.corpus179} (
                        {progress.weakIds.filter((w) => w.startsWith('179:')).length})
                      </button>
                    )}
                    {progress.weakIds.some((w) => w.startsWith('tfng:')) && (
                      <button
                        type="button"
                        onClick={() => {
                          setRwMode('reading538');
                          setActiveTab('reading_writing');
                        }}
                        className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300 cursor-pointer tabular-nums"
                      >
                        T/F/NG ({progress.weakIds.filter((w) => w.startsWith('tfng:')).length})
                      </button>
                    )}
                    {progress.weakIds.some((w) => w.startsWith('gram:')) && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('grammar')}
                        className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300 cursor-pointer tabular-nums"
                      >
                        {ui.tabs.grammar} (
                        {progress.weakIds.filter((w) => w.startsWith('gram:')).length})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Daily 4-Step Loop */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {ui.dailyFourSteps}
                </h4>
                {(
                  [
                    {
                      targetTab: 'vocab' as LearningTab,
                      title: ui.steps.vocab.title,
                      desc: ui.steps.vocab.desc,
                      done: progress.masteredIds.length >= 3,
                    },
                    {
                      targetTab: 'listening_speaking' as LearningTab,
                      title: ui.steps.listening.title,
                      desc: ui.steps.listening.desc,
                      done: progress.completedModules.some(
                        (m) => m.startsWith('ielts_179_') || m.startsWith('ielts_shadow_')
                      ),
                    },
                    {
                      targetTab: 'reading_writing' as LearningTab,
                      onOpen: () => setRwMode('reading538'),
                      title: ui.steps.reading.title,
                      desc: ui.steps.reading.desc,
                      done: progress.completedModules.some((m) => m.startsWith('ielts_tfng_')),
                    },
                    {
                      targetTab: 'reading_writing' as LearningTab,
                      onOpen: () => setRwMode('writingABC'),
                      title: ui.steps.writing.title,
                      desc: ui.steps.writing.desc,
                      done: progress.completedModules.some((m) => m.startsWith('ielts_abc_')),
                    },
                    {
                      targetTab: 'nce' as LearningTab,
                      title: vaultUi.roadmapStepNceTitle,
                      desc: vaultUi.roadmapStepNceDesc,
                      done: progress.completedModules.some((m) => m.startsWith('nce_lesson_')),
                    },
                  ] as const
                ).map((step, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if ('onOpen' in step && step.onOpen) step.onOpen();
                      setActiveTab(step.targetTab);
                    }}
                    className="w-full p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-indigo-300 dark:hover:border-indigo-500/40 flex items-center justify-between gap-3 text-start transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          step.done
                            ? 'bg-emerald-500 text-white'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300 text-xs font-bold tabular-nums'
                        }`}
                      >
                        {step.done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {step.title}
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 rtl:rotate-180" />
                  </button>
                ))}
              </div>

              {/* Band Progression Map */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(
                  [
                    {
                      band: '5.5' as IeltsBand,
                      stage: ui.stages.b55,
                      tone: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5',
                    },
                    {
                      band: '6.5' as IeltsBand,
                      stage: ui.stages.b65,
                      tone: 'border-sky-200 dark:border-sky-500/30 bg-sky-50/50 dark:bg-sky-500/5',
                    },
                    {
                      band: '7.0' as IeltsBand,
                      stage: ui.stages.b70,
                      tone: 'border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/5',
                    },
                    {
                      band: '8.0+' as IeltsBand,
                      stage: ui.stages.b80,
                      tone: 'border-violet-200 dark:border-violet-500/30 bg-violet-50/50 dark:bg-violet-500/5',
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.band}
                    type="button"
                    onClick={() => {
                      setVocabTrack('ALL');
                      setVocabGroup('ALL');
                      setBandFilter(item.band);
                      setVocabIndex(0);
                      setCardFlipped(false);
                      setActiveTab('vocab');
                    }}
                    className={`p-3 rounded-2xl border text-start transition-colors hover:brightness-95 cursor-pointer ${item.tone}`}
                  >
                    <div className="text-xs font-extrabold text-neutral-900 dark:text-neutral-100 tabular-nums">
                      {item.stage.title}
                    </div>
                    <div className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
                      {item.stage.points}
                    </div>
                  </button>
                ))}
              </div>

              {/* Official 4-Skill Scoring Criteria */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {ui.rubricTitle}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ui.rubrics.map((r) => (
                    <div
                      key={r.module}
                      className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800"
                    >
                      <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {r.module}
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5">
                        {r.criteria}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* openIELTS 4-Stage Zero-Cost Prep Roadmap */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-200/70 dark:border-neutral-800/80">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {vaultUi.openIeltsPlanTitle}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {vaultUi.openIeltsPlanSubtitle}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {OPEN_IELTS_STUDY_PLAN.map((stage) => (
                    <div
                      key={stage.id}
                      className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/45 border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between gap-2.5"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {isZh ? stage.durationZh : stage.durationEn}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveTab(stage.targetTab)}
                            className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold cursor-pointer hover:bg-indigo-700"
                          >
                            {vaultUi.openIeltsGoBtn}
                          </button>
                        </div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {isZh ? stage.titleZh : stage.titleEn}
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          {isZh ? stage.focusZh : stage.focusEn}
                        </p>
                        <ul className="space-y-0.5 ps-4 list-disc text-[11px] text-neutral-500 dark:text-neutral-400">
                          {(isZh ? stage.checklistZh : stage.checklistEn).map((chk, idx) => (
                            <li key={idx}>{chk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. MULTI-TRACK VOCABULARY VAULT TAB */}
          {activeTab === 'vocab' && (
            <div className="space-y-4">
              {/* Track Switcher (All / IELTS / CET·Kaoyan / TOEFL·GRE / IT / Finance / NCE) */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setVocabTrack('ALL');
                    setVocabGroup('ALL');
                    setVocabIndex(0);
                    setCardFlipped(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 border transition-colors cursor-pointer tabular-nums ${
                    vocabTrack === 'ALL'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {vaultUi.allTracksLabel} ({ALL_VAULT_VOCAB.length})
                </button>
                {VAULT_TRACKS.map((tr) => {
                  const cnt = ALL_VAULT_VOCAB.filter((v) => v.track === tr.id).length;
                  const active = vocabTrack === tr.id;
                  return (
                    <button
                      key={tr.id}
                      type="button"
                      onClick={() => {
                        setVocabTrack(tr.id);
                        setVocabGroup('ALL');
                        setVocabIndex(0);
                        setCardFlipped(false);
                      }}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 border transition-colors cursor-pointer tabular-nums ${
                        active
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-indigo-400'
                      }`}
                    >
                      {vaultUi.trackShortNames[tr.id]} ({cnt})
                    </button>
                  );
                })}
              </div>

              {/* Mode Switcher */}
              <div className="grid grid-cols-3 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10">
                {(
                  [
                    { id: 'cards', label: ui.vocabModes.cards, icon: Layers },
                    { id: 'spelling', label: ui.vocabModes.spelling, icon: Keyboard },
                    { id: 'listening', label: ui.vocabModes.listening, icon: Headphones },
                  ] as const
                ).map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setVocabMode(mode.id);
                        setSpellingState('idle');
                        setSpellingInput('');
                        setListenPickedId(null);
                      }}
                      className={`min-h-[38px] py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        vocabMode === mode.id
                          ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Topic Groups */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none p-1 rounded-2xl bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setVocabGroup('ALL');
                    setVocabIndex(0);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold text-center whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                    vocabGroup === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {ui.allGroups}
                </button>
                {vocabGroups.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setVocabGroup(key);
                      setVocabIndex(0);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold text-center whitespace-nowrap shrink-0 cursor-pointer transition-all ${
                      vocabGroup === key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search Bar + Sequential/Shuffle Order + SRS Filter + Anki/CSV Export */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (vocabQuery.trim().length >= 2) vocabSearchHistory.recordQuery(vocabQuery);
                    }}
                    className="flex-1 min-w-[190px] flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl px-3 min-h-[40px] border border-neutral-200/70 dark:border-neutral-700/70"
                  >
                    <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                    <input
                      type="text"
                      value={vocabQuery}
                      onChange={(e) => {
                        setVocabQuery(e.target.value);
                        setVocabIndex(0);
                      }}
                      onBlur={() => {
                        if (vocabQuery.trim().length >= 2) vocabSearchHistory.recordQuery(vocabQuery);
                      }}
                      placeholder={ui.vocabSearchPlaceholder}
                      className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                    />
                    {vocabQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setVocabQuery('');
                          setVocabIndex(0);
                        }}
                        className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </form>

                  {/* Sequential vs Shuffled Toggle (lilinji/English 正序/乱序) */}
                  <div className="inline-flex p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderMode('sequential');
                        setVocabIndex(0);
                        setCardFlipped(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        orderMode === 'sequential'
                          ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm font-bold'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>{vaultUi.orderSequential}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (orderMode === 'shuffled') {
                          setShuffleSeed((s) => (s + 19) % 997 + 1);
                        } else {
                          setOrderMode('shuffled');
                        }
                        setVocabIndex(0);
                        setCardFlipped(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                        orderMode === 'shuffled'
                          ? 'bg-indigo-600 text-white shadow-sm font-bold'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>{vaultUi.orderShuffle}</span>
                    </button>
                  </div>

                  {/* Export Dropdown (Anki .txt / Excel .csv) */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowExportMenu((o) => !o)}
                      className="px-2.5 py-2 rounded-xl text-[11px] font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{vaultUi.exportMenuLabel}</span>
                      <ChevronDown className="w-3 h-3 opacity-70" />
                    </button>
                    {showExportMenu && (
                      <div className="absolute end-0 mt-1.5 w-52 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl z-20 p-1.5 space-y-1">
                        <button
                          type="button"
                          onClick={() => handleExportDeck('txt')}
                          className="w-full px-3 py-2 rounded-xl text-start text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 cursor-pointer"
                        >
                          {vaultUi.exportAnkiTxt}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportDeck('csv')}
                          className="w-full px-3 py-2 rounded-xl text-start text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 cursor-pointer"
                        >
                          {vaultUi.exportExcelCsv}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportDeck('copy')}
                          className="w-full px-3 py-2 rounded-xl text-start text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 cursor-pointer"
                        >
                          {vaultUi.exportCopyText}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Filters */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setDueOnly((d) => !d);
                      setVocabIndex(0);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer transition-colors inline-flex items-center gap-1 tabular-nums whitespace-nowrap ${
                      dueOnly
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>
                      {vaultUi.filterDueOnly} ({dueVocabIds.length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnmasteredOnly((u) => !u);
                      setVocabIndex(0);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer transition-colors whitespace-nowrap ${
                      unmasteredOnly
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {extra.filterUnmasteredOnly}
                  </button>
                  {weakVocabIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setWeakVocabOnly((w) => !w);
                        setVocabIndex(0);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer transition-colors tabular-nums whitespace-nowrap ${
                        weakVocabOnly
                          ? 'bg-rose-600 border-rose-600 text-white'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-rose-600 dark:text-rose-300'
                      }`}
                    >
                      {extra.filterWeakOnly} ({weakVocabIds.length})
                    </button>
                  )}
                </div>

                {exportNotice && (
                  <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{exportNotice}</span>
                  </div>
                )}

                <SearchHistoryBar
                  history={vocabSearchHistory.history}
                  language={settings.language}
                  onSelectQuery={(q) => {
                    setVocabQuery(q);
                    setVocabIndex(0);
                    vocabSearchHistory.recordQuery(q);
                  }}
                  onRemoveQuery={vocabSearchHistory.removeQuery}
                  onClearHistory={vocabSearchHistory.clearHistory}
                  compact
                />
              </div>

              {vocabMode === 'cards' && (
                <>
                  <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="truncate">
                      {isZh ? activeCard.bookName : activeCard.bookNameEn} ·{' '}
                      {isZh ? activeCard.group : activeCard.groupEn}
                    </span>
                    <span className="tabular-nums shrink-0 font-semibold">
                      {safeVocabIdx + 1} / {activeVocabPool.length} ·{' '}
                      {ui.masteredRatio(progress.masteredIds.length, ALL_VAULT_VOCAB.length)}
                    </span>
                  </div>

                  {filteredVocab.length === 0 && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400">
                      {ui.vocabNoMatch}
                    </div>
                  )}

                  {/* Interactive Flashcard */}
                  <div
                    onClick={() => {
                      triggerHaptic('selection', hapticsEnabled);
                      setCardFlipped((f) => !f);
                    }}
                    className="p-5 rounded-3xl bg-gradient-to-br from-neutral-50 to-indigo-50/40 dark:from-neutral-800/70 dark:to-indigo-950/20 border border-neutral-200 dark:border-neutral-700 cursor-pointer select-none min-h-[245px] flex flex-col justify-between transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                          {vaultUi.trackShortNames[activeCard.track]} · Band {activeCard.band} ·{' '}
                          {activeCard.pos} ·{' '}
                          {vaultUi.srsStageLabels[progress.reviewMap[activeCard.id]?.stage ?? 0]}
                        </span>
                        <h3 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-1.5 tracking-tight break-words">
                          {activeCard.word}
                        </h3>
                        <p className="text-sm font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {activeCard.ipa}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              `voc-${activeCard.id}`,
                              `${activeCard.word} ${activeCard.ipa} — ${activeCard.collocation}`
                            )
                          }
                          className="p-2.5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                          title={extra.copyItem}
                        >
                          {copiedKey === `voc-${activeCard.id}` ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => speakText(activeCard.word)}
                          className="p-2.5 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                          title={ui.pronounceWordTitle}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavoriteWord(activeCard.id)}
                          className={`p-2.5 rounded-2xl border cursor-pointer transition-colors ${
                            isWordFavorited(activeCard.id)
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-white dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:text-amber-500'
                          }`}
                          title={
                            isWordFavorited(activeCard.id)
                              ? favUi.savedWordTitle
                              : favUi.saveWordTitle
                          }
                        >
                          <Bookmark className={`w-4 h-4 ${isWordFavorited(activeCard.id) ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleMastered(activeCard.id)}
                          className={`p-2.5 rounded-2xl border cursor-pointer transition-colors ${
                            progress.masteredIds.includes(activeCard.id)
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-white dark:bg-neutral-800 text-neutral-400 border-neutral-200 dark:border-neutral-700'
                          }`}
                          title={
                            progress.masteredIds.includes(activeCard.id)
                              ? ui.markedMastered
                              : ui.markMastered
                          }
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {cardFlipped ? (
                      <div className="mt-4 pt-4 border-t border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                        <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                          {isZh ? activeCard.meaning : activeCard.meaningEn}
                        </div>
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-xl">
                          {ui.collocationLabel}
                          {activeCard.collocation}
                        </p>
                        <p className="text-xs text-sky-700 dark:text-sky-300">
                          {isZh ? activeCard.rootHint : activeCard.rootHintEn}
                        </p>
                        <div className="p-3 rounded-xl bg-white/85 dark:bg-neutral-900/65 text-xs space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                              {activeCard.exampleEn}
                            </span>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavoriteSentence({
                                    id: `voc-${activeCard.id}`,
                                    source: 'vocab',
                                    title: activeCard.word,
                                    en: activeCard.exampleEn,
                                    zh: activeCard.exampleZh,
                                    band: activeCard.band,
                                  });
                                }}
                                className={`p-1.5 shrink-0 cursor-pointer ${
                                  isSentenceFavorited(`voc-${activeCard.id}`)
                                    ? 'text-amber-500'
                                    : 'text-neutral-400 hover:text-amber-500'
                                }`}
                                title={
                                  isSentenceFavorited(`voc-${activeCard.id}`)
                                    ? favUi.savedSentenceTitle
                                    : favUi.saveSentenceTitle
                                }
                              >
                                <Bookmark
                                  className={`w-3.5 h-3.5 ${
                                    isSentenceFavorited(`voc-${activeCard.id}`) ? 'fill-current' : ''
                                  }`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  speakText(activeCard.exampleEn);
                                }}
                                className="p-1.5 text-indigo-500 hover:text-indigo-600 shrink-0 cursor-pointer"
                                title={ui.pronounceSentence}
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {isZh && <p className="text-neutral-500">{activeCard.exampleZh}</p>}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 flex items-center justify-between gap-2 text-xs text-neutral-400">
                        <span className="inline-flex items-center gap-1.5">
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>{ui.flipCardHint}</span>
                        </span>
                        <span className="hidden sm:inline text-[10px]">
                          {extra.keyboardShortcutHint}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Spaced-Repetition Recall Bar (Anki-style) */}
                  <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      {vaultUi.srsRateLabel}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          rateCardSrs(activeCard, 'again');
                          setVocabIndex((i) => (i + 1) % activeVocabPool.length);
                          setCardFlipped(false);
                        }}
                        className="min-h-[38px] px-2 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-[11px] font-bold text-rose-700 dark:text-rose-300 cursor-pointer hover:brightness-95"
                      >
                        {vaultUi.srsAgain}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          rateCardSrs(activeCard, 'hard');
                          setVocabIndex((i) => (i + 1) % activeVocabPool.length);
                          setCardFlipped(false);
                        }}
                        className="min-h-[38px] px-2 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-[11px] font-bold text-amber-700 dark:text-amber-300 cursor-pointer hover:brightness-95"
                      >
                        {vaultUi.srsHard}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          rateCardSrs(activeCard, 'good');
                          setVocabIndex((i) => (i + 1) % activeVocabPool.length);
                          setCardFlipped(false);
                        }}
                        className="min-h-[38px] px-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 cursor-pointer hover:brightness-95"
                      >
                        {vaultUi.srsGood}
                      </button>
                    </div>
                  </div>

                  {/* Ergonomic Prev / Master & Next / Next Bar (>= 44px touch targets) */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVocabIndex((i) => (i - 1 + activeVocabPool.length) % activeVocabPool.length);
                        setCardFlipped(false);
                      }}
                      className="min-h-[44px] px-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                      <span>{extra.prevCard}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!progress.masteredIds.includes(activeCard.id)) {
                          toggleMastered(activeCard.id);
                        }
                        setVocabIndex((i) => (i + 1) % activeVocabPool.length);
                        setCardFlipped(false);
                      }}
                      className="min-h-[44px] px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span className="truncate">{extra.masterAndNext}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVocabIndex((i) => (i + 1) % activeVocabPool.length);
                        setCardFlipped(false);
                      }}
                      className="min-h-[44px] px-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{extra.nextCard}</span>
                      <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>

                  {/* Windowed Card Selector Strip (keeps fast DOM on 150+ entries) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {cardWindowSlice.map(({ card, idx }) => {
                      const isDone = progress.masteredIds.includes(card.id);
                      const isCur = card.id === activeCard.id;
                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => {
                            setVocabIndex(idx);
                            setCardFlipped(false);
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer transition-colors ${
                            isCur
                              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                              : isDone
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-3 h-3" />}
                          {card.word}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {vocabMode === 'spelling' && (
                <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {vaultUi.trackShortNames[activeCard.track]} ·{' '}
                      {ui.spellingChallenge(
                        (vocabIndex % activeVocabPool.length) + 1,
                        activeVocabPool.length
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakText(activeCard.word)}
                      className="px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      {ui.playAudio}
                    </button>
                  </div>

                  <div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {isZh ? activeCard.meaning : activeCard.meaningEn}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {activeCard.pos} · Band {activeCard.band} ·{' '}
                      {isZh ? activeCard.rootHint : activeCard.rootHintEn}
                    </p>
                  </div>

                  <form onSubmit={handleCheckSpelling} className="flex gap-2">
                    <input
                      type="text"
                      value={spellingInput}
                      onChange={(e) => {
                        setSpellingInput(e.target.value);
                        setSpellingState('idle');
                      }}
                      placeholder={ui.spellingPlaceholder}
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="flex-1 px-3.5 min-h-[44px] rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                    >
                      {ui.checkBtn}
                    </button>
                  </form>

                  {spellingState !== 'idle' && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                        spellingState === 'correct'
                          ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      <span>
                        {spellingState === 'correct'
                          ? ui.spellingCorrect
                          : ui.spellingWrong(activeCard.word)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setVocabIndex((i) => (i + 1) % activeVocabPool.length);
                          setSpellingInput('');
                          setSpellingState('idle');
                        }}
                        className="underline font-bold cursor-pointer"
                      >
                        {ui.nextWordBtn}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {vocabMode === 'listening' && (
                <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {vaultUi.trackShortNames[listenTarget.track]} ·{' '}
                      {ui.listeningPractice(
                        (listenIndex % activeVocabPool.length) + 1,
                        activeVocabPool.length
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setListenIndex((i) => (i + 1) % activeVocabPool.length);
                        setListenPickedId(null);
                      }}
                      className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
                    >
                      {ui.nextQuestionBtn}
                    </button>
                  </div>

                  <div className="text-center py-3">
                    <button
                      type="button"
                      onClick={() => speakText(listenTarget.word)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm cursor-pointer"
                    >
                      <Volume2 className="w-5 h-5" />
                      {ui.tapToListen}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {listenChoices.map((choice) => {
                      const picked = listenPickedId === choice.id;
                      const isRight = choice.id === listenTarget.id;
                      return (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => {
                            setListenPickedId(choice.id);
                            triggerHaptic(isRight ? 'success' : 'selection', hapticsEnabled);
                            if (isRight) {
                              awardXpOnce(`ielts_listen_${listenTarget.id}`, 10);
                              resolveWeakItem(`voc:${listenTarget.id}`);
                            } else {
                              recordWeakItem(`voc:${listenTarget.id}`);
                            }
                          }}
                          className={`p-3 rounded-2xl border text-start transition-colors cursor-pointer ${
                            listenPickedId === null
                              ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:border-indigo-400'
                              : isRight
                              ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-400 text-emerald-800 dark:text-emerald-200'
                              : picked
                              ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-400 text-rose-700 dark:text-rose-200'
                              : 'bg-white/60 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 opacity-60'
                          }`}
                        >
                          <div className="text-sm font-bold">{choice.word}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {isZh ? choice.meaning : choice.meaningEn}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2.5 NEW CONCEPT ENGLISH (NCE 1-4) MASTER LECTURES TAB */}
          {activeTab === 'nce' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {vaultUi.nceTitle}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {vaultUi.nceSubtitle}
                </p>
              </div>

              {/* Book 1–4 Selector */}
              <div className="grid grid-cols-5 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10">
                {(['ALL', 1, 2, 3, 4] as const).map((bk) => (
                  <button
                    key={String(bk)}
                    type="button"
                    onClick={() => {
                      setNceBookFilter(bk);
                      const firstMatch =
                        bk === 'ALL' ? NCE_LESSONS[0] : NCE_LESSONS.find((l) => l.book === bk);
                      if (firstMatch) setSelectedNceId(firstMatch.id);
                    }}
                    className={`py-1.5 px-1.5 rounded-full text-[11px] font-semibold text-center truncate cursor-pointer transition-all tabular-nums ${
                      nceBookFilter === bk
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {bk === 'ALL' ? vaultUi.nceAllBooks : vaultUi.nceBookLabel(bk)}
                  </button>
                ))}
              </div>

              {nceBookFilter !== 'ALL' && (
                <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  {vaultUi.nceBookTaglines[nceBookFilter]}
                </div>
              )}

              {/* Lesson Selector Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {filteredNceLessons.map((lesson) => {
                  const isSel = activeNceLesson.id === lesson.id;
                  const isDone = progress.completedModules.includes(`nce_lesson_${lesson.id}`);
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection', hapticsEnabled);
                        setSelectedNceId(lesson.id);
                      }}
                      className={`p-3 rounded-2xl border text-start transition-colors cursor-pointer space-y-1 ${
                        isSel
                          ? 'bg-indigo-50/90 dark:bg-indigo-500/15 border-indigo-400 dark:border-indigo-500/60'
                          : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
                        <span className="text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {lesson.lessonNumber} · {lesson.cefrBand}
                        </span>
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </div>
                      <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                        {isZh ? lesson.titleZh : lesson.titleEn}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active NCE Master Lecture Two-Zone Deck */}
              <div className="p-4 sm:p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {activeNceLesson.lessonNumber} · {activeNceLesson.cefrBand} ·{' '}
                      {isZh ? activeNceLesson.themeZh : activeNceLesson.themeEn}
                    </div>
                    <h4 className="text-base font-extrabold text-neutral-900 dark:text-neutral-100 mt-1">
                      {activeNceLesson.titleEn}
                    </h4>
                    {isZh && (
                      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {activeNceLesson.titleZh}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        speakText(activeNceLesson.paragraphs.map((p) => p.en).join(' '))
                      }
                      className="px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{vaultUi.nceReadFull}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        speakText(activeNceLesson.paragraphs.map((p) => p.en).join(' '), 0.8)
                      }
                      className="px-2.5 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer whitespace-nowrap"
                    >
                      {vaultUi.nceReadSlow}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNceShowZh((v) => !v)}
                      className="px-2.5 py-1.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      {nceShowZh ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{nceShowZh ? vaultUi.nceHideZh : vaultUi.nceShowZh}</span>
                    </button>
                  </div>
                </div>

                {/* Passage Paragraphs */}
                <div className="space-y-2.5">
                  {activeNceLesson.paragraphs.map((para, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-700/80 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
                          {para.en}
                        </p>
                        <button
                          type="button"
                          onClick={() => speakText(para.en)}
                          className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shrink-0 cursor-pointer"
                          title={ui.playAudio}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {nceShowZh && isZh && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                          {para.zh}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Syntax & Rhetoric Lecture Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-indigo-200/70 dark:border-indigo-500/25 space-y-2">
                    <div className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300">
                      {vaultUi.nceGrammarTitle}
                    </div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {isZh ? activeNceLesson.grammarFocus.titleZh : activeNceLesson.grammarFocus.titleEn}
                    </div>
                    <div className="px-2.5 py-1.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 font-mono text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                      {activeNceLesson.grammarFocus.pattern}
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {isZh
                        ? activeNceLesson.grammarFocus.analysisZh
                        : activeNceLesson.grammarFocus.analysisEn}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 space-y-2">
                    <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                      {vaultUi.nceRhetoricTitle}
                    </div>
                    {activeNceLesson.rhetoricNotes.map((note, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {isZh ? note.labelZh : note.labelEn}
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          {isZh ? note.detailZh : note.detailEn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Golden Sentence + Shadowing + Bookmark */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/25 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {vaultUi.nceGoldenTitle}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          toggleFavoriteSentence({
                            id: `nce-${activeNceLesson.id}`,
                            source: 'nce',
                            title: activeNceLesson.lessonNumber,
                            en: activeNceLesson.goldenSentence.en,
                            zh: activeNceLesson.goldenSentence.zh,
                            band: activeNceLesson.cefrBand,
                          })
                        }
                        className={`p-1.5 rounded-lg cursor-pointer ${
                          isSentenceFavorited(`nce-${activeNceLesson.id}`)
                            ? 'bg-amber-500 text-white'
                            : 'bg-white dark:bg-neutral-900 text-neutral-500 hover:text-amber-500'
                        }`}
                        title={
                          isSentenceFavorited(`nce-${activeNceLesson.id}`)
                            ? favUi.savedSentenceTitle
                            : favUi.saveSentenceTitle
                        }
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${
                            isSentenceFavorited(`nce-${activeNceLesson.id}`) ? 'fill-current' : ''
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(`nce-gold-${activeNceLesson.id}`, activeNceLesson.goldenSentence.en)
                        }
                        className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                        title={extra.copyItem}
                      >
                        {copiedKey === `nce-gold-${activeNceLesson.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => speakText(activeNceLesson.goldenSentence.en)}
                        className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 text-indigo-600 cursor-pointer"
                        title={ui.pronounceSentence}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleShadowPractice(
                            activeNceLesson.id,
                            activeNceLesson.goldenSentence.en
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                          listeningLineId === activeNceLesson.id
                            ? 'bg-rose-500 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {listeningLineId === activeNceLesson.id ? (
                          <MicOff className="w-3 h-3" />
                        ) : (
                          <Mic className="w-3 h-3" />
                        )}
                        <span>
                          {listeningLineId === activeNceLesson.id
                            ? audioUi.tapStopPrompt
                            : ui.shadowBtn}
                        </span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    “{activeNceLesson.goldenSentence.en}”
                  </p>
                  {nceShowZh && isZh && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-300">
                      {activeNceLesson.goldenSentence.zh}
                    </p>
                  )}
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-200">
                    {isZh
                      ? activeNceLesson.goldenSentence.noteZh
                      : activeNceLesson.goldenSentence.noteEn}
                  </p>
                  {speechFeedback[activeNceLesson.id] && (
                    <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                      {speechFeedback[activeNceLesson.id]}
                    </div>
                  )}
                </div>

                {/* Linked Key Vocabulary */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                    {vaultUi.nceKeyWordsTitle}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeNceLesson.keyVocabIds
                      .map((id) => ALL_VAULT_VOCAB.find((v) => v.id === id))
                      .filter((v): v is VaultVocabItem => Boolean(v))
                      .map((word) => (
                        <button
                          key={word.id}
                          type="button"
                          onClick={() => {
                            setVocabTrack('ALL');
                            setBandFilter('ALL');
                            setVocabGroup('ALL');
                            setVocabQuery('');
                            setOrderMode('sequential');
                            const idx = ALL_VAULT_VOCAB.findIndex((w) => w.id === word.id);
                            setVocabIndex(idx >= 0 ? idx : 0);
                            setVocabMode('cards');
                            setCardFlipped(true);
                            setActiveTab('vocab');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-indigo-400 text-start cursor-pointer"
                        >
                          <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            {word.word}{' '}
                            <span className="font-mono text-[10px] font-normal text-neutral-500">
                              {word.ipa}
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                            {isZh ? word.meaning : word.meaningEn}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  {(() => {
                    const isDone = progress.completedModules.includes(
                      `nce_lesson_${activeNceLesson.id}`
                    );
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('success', hapticsEnabled);
                          awardXpOnce(`nce_lesson_${activeNceLesson.id}`, 20);
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isDone ? vaultUi.nceDoneLabel : vaultUi.nceMarkDone}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* 3. LISTENING 179 & SPEAKING PART 1-3 TAB */}
          {activeTab === 'listening_speaking' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10">
                {(
                  [
                    { id: 'corpus179', label: ui.lsModes.corpus179 },
                    { id: 'speaking', label: ui.lsModes.speaking },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setLsMode(mode.id)}
                    className={`min-h-[38px] py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      lsMode === mode.id
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {lsMode === 'corpus179' ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {ui.corpusTitle}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {ui.corpusSubtitle}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setListeningDictationMode((v) => !v)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                          listeningDictationMode
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200'
                        }`}
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>{vaultUi.dictationPureBtn}</span>
                      </button>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold tabular-nums">
                        {extra.corpusAccuracyLabel(corpusCorrectCount, filteredListening179.length)}
                      </span>
                    </div>
                  </div>

                  {listeningDictationMode && (
                    <div className="px-3 py-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200/70 dark:border-indigo-500/25 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                      {vaultUi.dictationBlindHint}
                    </div>
                  )}

                  {filteredListening179.map((item) => {
                    const checkStatus = corpusChecks[item.id];
                    const isRevealed = Boolean(revealedCorpusIds[item.id]);
                    const hideCues = listeningDictationMode && !isRevealed && checkStatus !== 'correct';
                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-sky-700 dark:text-sky-300">
                              {item.section} · Band {item.band}
                            </span>
                            {!hideCues && (
                              <>
                                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                                <span className="font-semibold text-neutral-600 dark:text-neutral-300">
                                  {isZh ? item.meaning : item.meaningEn}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setRevealedCorpusIds((p) => ({
                                  ...p,
                                  [item.id]: !p[item.id],
                                }))
                              }
                              className="px-2 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 inline-flex items-center gap-1 cursor-pointer"
                            >
                              {isRevealed ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                              <span>
                                {isRevealed ? extra.corpusHideAnswer : extra.corpusShowAnswer}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => speakText(item.audioParaphrase, 0.76)}
                              className="px-2 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer"
                            >
                              {extra.corpusReplaySlow}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                speakText(
                                  hideCues
                                    ? `${item.audioParaphrase}.`
                                    : `${item.questionWord}. ${item.audioParaphrase}.`
                                )
                              }
                              className="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{ui.corpusPlayPair}</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 font-semibold text-neutral-800 dark:text-neutral-200">
                            {hideCues ? '🎧 ••••••••' : item.questionWord}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 font-bold text-emerald-700 dark:text-emerald-300">
                            {isRevealed || checkStatus === 'correct'
                              ? item.audioParaphrase
                              : '••••••••'}
                          </span>
                        </div>

                        {!hideCues && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-300">
                            {isZh ? item.trapNote : item.trapNoteEn}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={corpusInputs[item.id] || ''}
                            onChange={(e) =>
                              setCorpusInputs((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder={ui.corpusDictationPlaceholder}
                            autoCapitalize="none"
                            autoCorrect="off"
                            className="flex-1 px-3 min-h-[40px] rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleCheckCorpus179(item)}
                            className="px-3.5 min-h-[40px] rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold cursor-pointer"
                          >
                            {ui.checkBtn}
                          </button>
                        </div>

                        {checkStatus && (
                          <div
                            className={`text-[11px] font-semibold ${
                              checkStatus === 'correct'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {checkStatus === 'correct'
                              ? ui.spellingCorrect
                              : ui.spellingWrong(item.audioParaphrase)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Speaking Part 1-3 Filter */}
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full sm:w-auto sm:min-w-[300px]">
                    {(
                      [
                        { id: 'ALL', label: ui.allGroups },
                        { id: 'P1', label: ui.speakingPartLabels.P1 },
                        { id: 'P2', label: ui.speakingPartLabels.P2 },
                        { id: 'P3', label: ui.speakingPartLabels.P3 },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSpeakingPartFilter(p.id)}
                        className={`px-2 py-1 rounded-full text-[11px] font-semibold text-center truncate cursor-pointer transition-all ${
                          speakingPartFilter === p.id
                            ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Official Part 2 Dual-Phase Timer (1m Prep + 2m Speaking) */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-500/25 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Timer className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                          <span>{ui.prepTimerTitle}</span>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300">
                            {prepPhase === 'prep'
                              ? extra.speakingPhasePrep
                              : extra.speakingPhaseTalk}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-600 dark:text-neutral-300 tabular-nums">
                          {prepSecondsLeft === 0
                            ? ui.prepReadyHint
                            : `${String(Math.floor(prepSecondsLeft / 60)).padStart(2, '0')}:${String(
                                prepSecondsLeft % 60
                              ).padStart(2, '0')}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (prepSecondsLeft === 0) {
                            setPrepPhase('prep');
                            setPrepSecondsLeft(60);
                          }
                          setPrepRunning((r) => !r);
                        }}
                        className="px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer tabular-nums"
                      >
                        <Play className="w-3 h-3" />
                        <span>{prepRunning ? `${prepSecondsLeft}s` : ui.prepStartBtn}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPrepRunning(false);
                          setPrepPhase('prep');
                          setPrepSecondsLeft(60);
                        }}
                        className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-200 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{ui.prepResetBtn}</span>
                      </button>
                    </div>
                  </div>

                  {/* openIELTS Speaking Part 2 Topic Chaining (串题万能骨架) */}
                  <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-500/25 bg-neutral-50 dark:bg-neutral-800/40 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowSpeakingChains((s) => !s)}
                      className="w-full px-4 py-3 flex items-center justify-between gap-2 text-start cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {vaultUi.speakingChainTitle}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                            {vaultUi.speakingChainSubtitle}
                          </div>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${
                          showSpeakingChains ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showSpeakingChains && (
                      <div className="px-4 pb-4 pt-1 space-y-3 border-t border-neutral-200/70 dark:border-neutral-700/70">
                        {OPEN_IELTS_SPEAKING_CHAINS.map((chain) => (
                          <div
                            key={chain.id}
                            className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700/80 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                {isZh ? chain.archetypeZh : chain.archetypeEn}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleFavoriteSentence({
                                      id: `chain-${chain.id}`,
                                      source: 'speaking',
                                      title: isZh ? chain.archetypeZh : chain.archetypeEn,
                                      en: chain.coreStoryEn,
                                      zh: chain.coreStoryZh,
                                      band: '8.0+',
                                    })
                                  }
                                  className={`p-1 rounded-lg cursor-pointer ${
                                    isSentenceFavorited(`chain-${chain.id}`)
                                      ? 'text-amber-500'
                                      : 'text-neutral-400 hover:text-amber-500'
                                  }`}
                                >
                                  <Bookmark
                                    className={`w-3.5 h-3.5 ${
                                      isSentenceFavorited(`chain-${chain.id}`) ? 'fill-current' : ''
                                    }`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => speakText(chain.coreStoryEn)}
                                  className="p-1 rounded-lg text-indigo-600 dark:text-indigo-400 cursor-pointer"
                                  title={ui.playAudio}
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                              <span className="font-bold">{vaultUi.speakingChainPromptsLabel}</span>
                              {(isZh ? chain.linkedPromptsZh : chain.linkedPromptsEn).join(' · ')}
                            </div>

                            <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                              {chain.coreStoryEn}
                            </p>
                            {isZh && (
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                {chain.coreStoryZh}
                              </p>
                            )}
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                              {vaultUi.speakingChainBridgeLabel} {chain.pivotBridgeEn}
                            </p>
                            <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                              {chain.collocations.join(' · ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {filteredSpeakingPrompts.map((sp) => (
                    <div
                      key={sp.id}
                      className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
                          {ui.speakingPartLabels[sp.part]} · Band {sp.band}
                        </span>
                        <span className="font-semibold text-neutral-500">
                          {isZh ? sp.topic : sp.topicEn}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {sp.question}
                        </p>
                        <button
                          type="button"
                          onClick={() => speakText(sp.question)}
                          className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 shrink-0 cursor-pointer"
                          title={ui.playAudio}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {sp.cueBullets && (
                        <ul className="space-y-0.5 ps-4 text-xs text-neutral-600 dark:text-neutral-300 list-disc">
                          {sp.cueBullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}

                      <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {ui.band8UpgradeLabel}
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                toggleFavoriteSentence({
                                  id: `sp-${sp.id}`,
                                  source: 'speaking',
                                  title: `${sp.part} · ${isZh ? sp.topic : sp.topicEn}`,
                                  en: sp.band8Model,
                                  zh: sp.band8ModelZh,
                                  band: sp.band,
                                })
                              }
                              className={`p-1.5 rounded-lg cursor-pointer ${
                                isSentenceFavorited(`sp-${sp.id}`)
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-amber-500'
                              }`}
                              title={
                                isSentenceFavorited(`sp-${sp.id}`)
                                  ? favUi.savedSentenceTitle
                                  : favUi.saveSentenceTitle
                              }
                            >
                              <Bookmark
                                className={`w-3.5 h-3.5 ${
                                  isSentenceFavorited(`sp-${sp.id}`) ? 'fill-current' : ''
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => copyText(`sp-${sp.id}`, sp.band8Model)}
                              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                              title={extra.copyItem}
                            >
                              {copiedKey === `sp-${sp.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => speakText(sp.band8Model)}
                              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 cursor-pointer"
                              title={ui.playAudio}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            {userRecordings[sp.id] && (
                              <button
                                type="button"
                                onClick={() => togglePlayRecording(sp.id, userRecordings[sp.id])}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                                  playingRecordingId === sp.id
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {playingRecordingId === sp.id ? (
                                  <Square className="w-3 h-3 fill-current" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                                <span>
                                  {playingRecordingId === sp.id
                                    ? audioUi.stopMyRecording
                                    : audioUi.playMyRecording}
                                </span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void handleShadowPractice(sp.id, sp.band8Model)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                                listeningLineId === sp.id
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                              }`}
                            >
                              {listeningLineId === sp.id ? (
                                <MicOff className="w-3 h-3" />
                              ) : (
                                <Mic className="w-3 h-3" />
                              )}
                              <span>
                                {listeningLineId === sp.id
                                  ? audioUi.tapStopPrompt
                                  : ui.shadowBtn}
                              </span>
                            </button>
                          </div>
                        </div>

                        {listeningLineId === sp.id && (
                          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/25 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                <span>{audioUi.micLivePrompt}</span>
                              </span>
                              <span className="tabular-nums">{micLevel}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-rose-200/70 dark:bg-rose-950/60 overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full transition-all duration-75"
                                style={{ width: `${Math.max(8, micLevel)}%` }}
                              />
                            </div>
                            {interimTranscript[sp.id] && (
                              <p className="text-[11px] italic text-neutral-700 dark:text-neutral-200">
                                “{interimTranscript[sp.id]}”
                              </p>
                            )}
                          </div>
                        )}

                        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">
                          {sp.band8Model}
                        </p>
                        {isZh && (
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {sp.band8ModelZh}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                          {sp.collocations.join(' · ')}
                        </div>
                        {speechFeedback[sp.id] && (
                          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                            {speechFeedback[sp.id]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. READING 538 & WRITING ABC TAB */}
          {activeTab === 'reading_writing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10">
                {(
                  [
                    { id: 'reading538', label: ui.rwModes.reading538 },
                    { id: 'writingABC', label: ui.rwModes.writingABC },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setRwMode(mode.id)}
                    className={`min-h-[38px] py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      rwMode === mode.id
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {rwMode === 'reading538' ? (
                <div className="space-y-5">
                  {/* 538 Synonym Matrix + Search */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {ui.synonymMatrixTitle}
                      </h3>
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (synonymQuery.trim().length >= 2) {
                          synonymSearchHistory.recordQuery(synonymQuery);
                        }
                      }}
                      className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl px-3 min-h-[40px] border border-neutral-200/70 dark:border-neutral-700/70"
                    >
                      <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                      <input
                        type="text"
                        value={synonymQuery}
                        onChange={(e) => setSynonymQuery(e.target.value)}
                        onBlur={() => {
                          if (synonymQuery.trim().length >= 2) {
                            synonymSearchHistory.recordQuery(synonymQuery);
                          }
                        }}
                        placeholder={extra.synonymSearchPlaceholder}
                        className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
                      />
                      {synonymQuery && (
                        <button
                          type="button"
                          onClick={() => setSynonymQuery('')}
                          className="p-1 text-neutral-400 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </form>
                    <SearchHistoryBar
                      history={synonymSearchHistory.history}
                      language={settings.language}
                      onSelectQuery={(q) => {
                        setSynonymQuery(q);
                        synonymSearchHistory.recordQuery(q);
                      }}
                      onRemoveQuery={synonymSearchHistory.removeQuery}
                      onClearHistory={synonymSearchHistory.clearHistory}
                      compact
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredSynonyms538.map((pair) => (
                        <div
                          key={pair.id}
                          className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap text-xs">
                              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-800 dark:text-neutral-100">
                                {pair.passageTerm}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
                              <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/30 font-bold text-sky-700 dark:text-sky-300">
                                {pair.questionParaphrase}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                speakText(`${pair.passageTerm}. ${pair.questionParaphrase}.`)
                              }
                              className="p-1.5 rounded-lg bg-neutral-200/70 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-200">
                            Band {pair.band} · {isZh ? pair.meaning : pair.meaningEn}
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {isZh ? pair.note : pair.noteEn}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* T/F/NG Drills */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {ui.tfngDrillTitle}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold tabular-nums">
                        {extra.tfngScoreLabel(tfngCorrectCount, filteredTfngDrills.length)}
                      </span>
                    </div>
                    {filteredTfngDrills.map((drill) => {
                      const picked = tfngPicked[drill.id];
                      const isCorrect = picked === drill.answer;
                      return (
                        <div
                          key={drill.id}
                          className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                              Band {drill.band}
                            </span>
                            {picked && (
                              <button
                                type="button"
                                onClick={() =>
                                  setTfngPicked((p) => {
                                    const next = { ...p };
                                    delete next[drill.id];
                                    return next;
                                  })
                                }
                                className="text-[11px] font-semibold text-neutral-500 hover:text-indigo-600 cursor-pointer"
                              >
                                {extra.tfngRetryBtn}
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200/70 dark:border-neutral-700/70">
                            <span className="font-bold text-neutral-500 me-1">
                              {ui.tfngPassageLabel}
                            </span>
                            {drill.passage}
                          </div>
                          <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            <span className="text-neutral-500 font-semibold me-1">
                              {ui.tfngStatementLabel}
                            </span>
                            {drill.statement}
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {(['TRUE', 'FALSE', 'NOT GIVEN'] as const).map((opt) => {
                              const active = picked === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    setTfngPicked((p) => ({ ...p, [drill.id]: opt }));
                                    const ok = opt === drill.answer;
                                    triggerHaptic(ok ? 'success' : 'selection', hapticsEnabled);
                                    if (ok) {
                                      awardXpOnce(`ielts_tfng_${drill.id}`, 15);
                                      resolveWeakItem(`tfng:${drill.id}`);
                                    } else {
                                      recordWeakItem(`tfng:${drill.id}`);
                                    }
                                  }}
                                  className={`min-h-[38px] py-1.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                                    picked === undefined
                                      ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-indigo-400'
                                      : opt === drill.answer
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : active
                                      ? 'bg-rose-500 border-rose-500 text-white'
                                      : 'bg-white/60 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-55'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {picked && (
                            <p
                              className={`text-[11px] leading-relaxed ${
                                isCorrect
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {isZh ? drill.reason : drill.reasonEn}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Task 2 ABC Chain Builder */}
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-3">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {ui.abcTitle}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-2xl bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10">
                      {ABC_CHAIN_TOPICS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedAbcId(item.id)}
                          className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold text-center truncate cursor-pointer transition-all ${
                            activeAbcTopic.id === item.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                        >
                          {isZh ? item.topic : item.topicEn}
                        </button>
                      ))}
                    </div>

                    <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 italic">
                      “{activeAbcTopic.prompt}”
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
                          {ui.abcChainA}
                        </label>
                        <input
                          type="text"
                          value={abcDraftA}
                          onChange={(e) => setAbcDraftA(e.target.value)}
                          className="mt-0.5 w-full px-3 min-h-[38px] rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                          {ui.abcChainB}
                        </label>
                        <input
                          type="text"
                          value={abcDraftB}
                          onChange={(e) => setAbcDraftB(e.target.value)}
                          className="mt-0.5 w-full px-3 min-h-[38px] rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {ui.abcChainC}
                        </label>
                        <input
                          type="text"
                          value={abcDraftC}
                          onChange={(e) => setAbcDraftC(e.target.value)}
                          className="mt-0.5 w-full px-3 min-h-[38px] rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-500/30 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          Band {activeAbcTopic.band} Model Synthesis
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              copyText(`abc-${activeAbcTopic.id}`, activeAbcTopic.band8ConnectorSample)
                            }
                            className="p-1 text-neutral-500 cursor-pointer"
                            title={extra.copyItem}
                          >
                            {copiedKey === `abc-${activeAbcTopic.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => speakText(activeAbcTopic.band8ConnectorSample)}
                            className="p-1 text-indigo-500 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                        {activeAbcTopic.band8ConnectorSample}
                      </p>
                    </div>

                    {/* Task 2 Interactive Composer & Word Counter */}
                    <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          {extra.composerTitle}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const cleanA = abcDraftA.replace(/^A:\s*/i, '').trim();
                              const cleanB = abcDraftB.replace(/^B:\s*/i, '').trim();
                              const cleanC = abcDraftC.replace(/^C:\s*/i, '').trim();
                              setEssayDraft(
                                `Firstly, ${cleanA}. This development enables ${cleanB}. Consequently, ${cleanC}.`
                              );
                            }}
                            className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold cursor-pointer"
                          >
                            {extra.composerBuildFromAbc}
                          </button>
                          {essayDraft && (
                            <button
                              type="button"
                              onClick={() => copyText('essay-draft', essayDraft)}
                              className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer"
                            >
                              {copiedKey === 'essay-draft' ? extra.copiedItem : extra.copyItem}
                            </button>
                          )}
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        value={essayDraft}
                        onChange={(e) => setEssayDraft(e.target.value)}
                        placeholder={extra.composerPlaceholder}
                        className="w-full p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-neutral-500 tabular-nums">
                          {extra.composerWordCount(essayWordCount)}
                        </span>
                        {(() => {
                          const isDone = progress.completedModules.includes(
                            `ielts_abc_${activeAbcTopic.id}`
                          );
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('success', hapticsEnabled);
                                awardXpOnce(`ielts_abc_${activeAbcTopic.id}`, 15);
                              }}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isDone ? ui.drillDoneLabel : ui.markDrillDone}</span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Academic Task 1 Expression Bank */}
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {extra.task1Title}
                    </h3>
                    <div className="grid grid-cols-5 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10">
                      {(['all', 'trend', 'comparison', 'process', 'map'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTask1TypeFilter(t)}
                          className={`py-1 px-1 rounded-full text-[11px] font-semibold text-center truncate cursor-pointer ${
                            task1TypeFilter === t
                              ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                              : 'text-neutral-600 dark:text-neutral-300'
                          }`}
                        >
                          {extra.task1Types[t]}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {filteredTask1Patterns.map((pat) => (
                        <div
                          key={pat.id}
                          className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                              {isZh ? pat.title : pat.titleEn} · Band {pat.band}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleFavoriteSentence({
                                    id: `t1-${pat.id}`,
                                    source: 'task1',
                                    title: isZh ? pat.title : pat.titleEn,
                                    en: pat.sampleEn,
                                    zh: pat.sampleZh,
                                    band: pat.band,
                                  })
                                }
                                className={`p-1 cursor-pointer ${
                                  isSentenceFavorited(`t1-${pat.id}`)
                                    ? 'text-amber-500'
                                    : 'text-neutral-400 hover:text-amber-500'
                                }`}
                                title={
                                  isSentenceFavorited(`t1-${pat.id}`)
                                    ? favUi.savedSentenceTitle
                                    : favUi.saveSentenceTitle
                                }
                              >
                                <Bookmark
                                  className={`w-3.5 h-3.5 ${
                                    isSentenceFavorited(`t1-${pat.id}`) ? 'fill-current' : ''
                                  }`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => copyText(`t1-${pat.id}`, pat.sampleEn)}
                                className="p-1 text-neutral-500 cursor-pointer"
                              >
                                {copiedKey === `t1-${pat.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => speakText(pat.sampleEn)}
                                className="p-1 text-indigo-500 cursor-pointer"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-[11px] font-mono font-semibold text-sky-700 dark:text-sky-300">
                            {pat.verbs.join(' · ')}
                          </div>
                          <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                            {pat.sampleEn}
                          </p>
                          {isZh && (
                            <p className="text-[11px] text-neutral-500">{pat.sampleZh}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Official Writing Weighted Score Calculator + Band 5.5-8.0+ Rubric Matrix */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-500/25 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {vaultUi.writingCalcTitle}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-extrabold tabular-nums">
                        {vaultUi.writingWeightedLabel}:{' '}
                        {calculateIeltsWritingOverall(writingTask1Score, writingTask2Score).toFixed(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(
                        [
                          {
                            label: vaultUi.writingTask1Label,
                            val: writingTask1Score,
                            setVal: setWritingTask1Score,
                          },
                          {
                            label: vaultUi.writingTask2Label,
                            val: writingTask2Score,
                            setVal: setWritingTask2Score,
                          },
                        ] as const
                      ).map((row) => (
                        <div
                          key={row.label}
                          className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-2"
                        >
                          <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                            {row.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => row.setVal((v) => clampBandScore(v - 0.5))}
                              className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-9 text-center text-xs font-extrabold tabular-nums text-neutral-900 dark:text-neutral-100">
                              {row.val.toFixed(1)}
                            </span>
                            <button
                              type="button"
                              onClick={() => row.setVal((v) => clampBandScore(v + 0.5))}
                              className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowBandMatrix((s) => !s)}
                      className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{vaultUi.bandMatrixToggle}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          showBandMatrix ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {showBandMatrix && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-start border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b border-indigo-200 dark:border-indigo-500/30 text-neutral-500 dark:text-neutral-400">
                              <th className="py-1.5 pe-2 text-start font-bold">Band</th>
                              <th className="py-1.5 px-2 text-start font-bold">{vaultUi.bandMatrixColTR}</th>
                              <th className="py-1.5 px-2 text-start font-bold">{vaultUi.bandMatrixColCC}</th>
                              <th className="py-1.5 px-2 text-start font-bold">{vaultUi.bandMatrixColLR}</th>
                              <th className="py-1.5 ps-2 text-start font-bold">{vaultUi.bandMatrixColGRA}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200/70 dark:divide-neutral-700/60">
                            {IELTS_WRITING_BAND_MATRIX.map((r) => (
                              <tr key={r.band}>
                                <td className="py-2 pe-2 font-extrabold text-indigo-700 dark:text-indigo-300 tabular-nums align-top">
                                  {r.band}
                                </td>
                                <td className="py-2 px-2 text-neutral-700 dark:text-neutral-300 align-top">
                                  {isZh ? r.trTaZh : r.trTaEn}
                                </td>
                                <td className="py-2 px-2 text-neutral-700 dark:text-neutral-300 align-top">
                                  {isZh ? r.ccZh : r.ccEn}
                                </td>
                                <td className="py-2 px-2 text-neutral-700 dark:text-neutral-300 align-top">
                                  {isZh ? r.lrZh : r.lrEn}
                                </td>
                                <td className="py-2 ps-2 text-neutral-700 dark:text-neutral-300 align-top">
                                  {isZh ? r.graZh : r.graEn}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* openIELTS Essay Revision Critique Studio (Band 5.5 -> 7.5+) */}
                  <div className="space-y-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {vaultUi.revisionStudioTitle}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {vaultUi.revisionStudioSubtitle}
                      </p>
                    </div>
                    {OPEN_IELTS_REVISION_STUDIOS.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                            {isZh ? rev.topicZh : rev.topicEn} · Target {rev.targetBand}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                toggleFavoriteSentence({
                                  id: `rev-${rev.id}`,
                                  source: 'upgrade',
                                  title: isZh ? rev.topicZh : rev.topicEn,
                                  en: rev.band75Revision,
                                  zh: isZh ? rev.examinerCritiqueZh : rev.examinerCritiqueEn,
                                  band: rev.targetBand,
                                })
                              }
                              className={`p-1 cursor-pointer ${
                                isSentenceFavorited(`rev-${rev.id}`)
                                  ? 'text-amber-500'
                                  : 'text-neutral-400 hover:text-amber-500'
                              }`}
                            >
                              <Bookmark
                                className={`w-3.5 h-3.5 ${
                                  isSentenceFavorited(`rev-${rev.id}`) ? 'fill-current' : ''
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => speakText(rev.band75Revision)}
                              className="p-1 text-indigo-500 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20 text-xs text-neutral-700 dark:text-neutral-300">
                          <span className="font-bold text-rose-700 dark:text-rose-300">
                            {vaultUi.revisionDraftLabel}:{' '}
                          </span>
                          {rev.band55Draft}
                        </div>

                        <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/25 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                          <span className="font-bold">{vaultUi.revisionUpgradeLabel}: </span>
                          {rev.band75Revision}
                        </div>

                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          <span className="font-bold">{vaultUi.revisionCritiqueLabel} </span>
                          {isZh ? rev.examinerCritiqueZh : rev.examinerCritiqueEn}
                        </p>

                        <div className="pt-1.5 border-t border-neutral-200/70 dark:border-neutral-700/70 space-y-1">
                          <div className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                            {vaultUi.revisionAuditLabel}
                          </div>
                          {(isZh ? rev.auditItemsZh : rev.auditItemsEn).map((chk, idx) => {
                            const key = `${rev.id}-${idx}`;
                            const checked = Boolean(revisionAuditChecked[key]);
                            return (
                              <label
                                key={key}
                                className="flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-300 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setRevisionAuditChecked((p) => ({
                                      ...p,
                                      [key]: !p[key],
                                    }));
                                    if (!checked) {
                                      awardXpOnce(`ielts_rev_audit_${rev.id}`, 10);
                                    }
                                  }}
                                  className="rounded border-neutral-300 text-indigo-600"
                                />
                                <span className={checked ? 'line-through opacity-70' : ''}>{chk}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* my-ielts Gu Jiabei Interactive C->E Translation Lab */}
                  <div className="space-y-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {vaultUi.guLabTitle}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {vaultUi.guLabSubtitle}
                      </p>
                    </div>
                    {GU_JIABEI_TRANSLATION_DRILLS.map((drill) => {
                      const hintShown = Boolean(guHintOpen[drill.id]);
                      const modelShown = Boolean(guModelOpen[drill.id]);
                      return (
                        <div
                          key={drill.id}
                          className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                              {isZh ? drill.topicZh : drill.topicEn} · Band {drill.band}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setGuHintOpen((p) => ({ ...p, [drill.id]: !p[drill.id] }))
                                }
                                className="px-2 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 cursor-pointer"
                              >
                                {vaultUi.guHintBtn}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setGuModelOpen((p) => ({ ...p, [drill.id]: !p[drill.id] }));
                                  if (!modelShown) {
                                    awardXpOnce(`ielts_gu_${drill.id}`, 10);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-semibold cursor-pointer"
                              >
                                {modelShown ? vaultUi.guHideBtn : vaultUi.guRevealBtn}
                              </button>
                            </div>
                          </div>

                          <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            {drill.chinesePrompt}
                          </p>

                          {hintShown && (
                            <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/25 font-mono text-[11px] text-amber-800 dark:text-amber-200">
                              {drill.keyPattern}
                            </div>
                          )}

                          <textarea
                            rows={2}
                            value={guInputs[drill.id] || ''}
                            onChange={(e) =>
                              setGuInputs((p) => ({ ...p, [drill.id]: e.target.value }))
                            }
                            placeholder={vaultUi.guInputPlaceholder}
                            className="w-full p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />

                          {modelShown && (
                            <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200/70 dark:border-emerald-500/25">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200 leading-relaxed">
                                  {drill.band8Target}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => speakText(drill.band8Target)}
                                  className="p-1 text-emerald-700 dark:text-emerald-300 shrink-0 cursor-pointer"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[11px] text-neutral-700 dark:text-neutral-300">
                                {isZh ? drill.grammarNoteZh : drill.grammarNoteEn}
                              </p>
                              <p className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                                {vaultUi.guTrapLabel}{' '}
                                {isZh ? drill.commonTrapZh : drill.commonTrapEn}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Band 6 -> Band 8 Upgrades */}
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {ui.translation100Title}
                    </h3>
                    {SENTENCE_UPGRADES.map((su) => (
                      <div
                        key={su.id}
                        className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                            {su.topic} · Band {su.band}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                toggleFavoriteSentence({
                                  id: `su-${su.id}`,
                                  source: 'upgrade',
                                  title: su.topic,
                                  en: su.band8Upgrade,
                                  zh: isZh ? su.keyTakeaway : su.keyTakeawayEn,
                                  band: su.band,
                                })
                              }
                              className={`p-1 cursor-pointer ${
                                isSentenceFavorited(`su-${su.id}`)
                                  ? 'text-amber-500'
                                  : 'text-neutral-400 hover:text-amber-500'
                              }`}
                              title={
                                isSentenceFavorited(`su-${su.id}`)
                                  ? favUi.savedSentenceTitle
                                  : favUi.saveSentenceTitle
                              }
                            >
                              <Bookmark
                                className={`w-3.5 h-3.5 ${
                                  isSentenceFavorited(`su-${su.id}`) ? 'fill-current' : ''
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => copyText(`su-${su.id}`, su.band8Upgrade)}
                              className="p-1 text-neutral-500 cursor-pointer"
                            >
                              {copiedKey === `su-${su.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => speakText(su.band8Upgrade)}
                              className="p-1 text-indigo-500 cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          <span className="font-semibold">{ui.band6DraftLabel} </span>
                          {su.band6Draft}
                        </div>
                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-500/10 p-2.5 rounded-xl">
                          <span>{ui.band8UpgradeDraftLabel} </span>
                          {su.band8Upgrade}
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                          {isZh ? su.keyTakeaway : su.keyTakeawayEn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. CORE GRAMMAR TAB */}
          {activeTab === 'grammar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold tabular-nums">
                  {extra.grammarScoreLabel(grammarSolvedCount, GRAMMAR_MODULES.length)}
                </span>
                <button
                  type="button"
                  onClick={() => setGrammarUnsolvedOnly((u) => !u)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                    grammarUnsolvedOnly
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {extra.grammarFilterUnsolved}
                </button>
              </div>

              {/* New Oriental Grammar Mind-Map Category Filter */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                  {vaultUi.grammarMindMapTitle}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  <button
                    type="button"
                    onClick={() => setGrammarCategoryFilter('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border cursor-pointer transition-colors ${
                      grammarCategoryFilter === 'ALL'
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {vaultUi.grammarCategoryAll}
                  </button>
                  {(
                    [
                      'nominalization',
                      'non_finite',
                      'clause',
                      'inversion',
                      'subjunctive',
                      'tense',
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGrammarCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border cursor-pointer transition-colors ${
                        grammarCategoryFilter === cat
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {vaultUi.grammarCategories[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {filteredGrammar.map((mod) => {
                const picked = grammarQuizAnswer[mod.id];
                const isSolved = picked === mod.checkAnswerIdx;
                return (
                  <div
                    key={mod.id}
                    className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                        Band {mod.band}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            toggleFavoriteSentence({
                              id: `gram-${mod.id}`,
                              source: 'grammar',
                              title: isZh ? mod.title : mod.titleEn,
                              en: mod.correctEn,
                              zh: mod.correctZh,
                              band: mod.band,
                            })
                          }
                          className={`p-1.5 rounded-lg border cursor-pointer ${
                            isSentenceFavorited(`gram-${mod.id}`)
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-400 hover:text-amber-500'
                          }`}
                          title={
                            isSentenceFavorited(`gram-${mod.id}`)
                              ? favUi.savedSentenceTitle
                              : favUi.saveSentenceTitle
                          }
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isSentenceFavorited(`gram-${mod.id}`) ? 'fill-current' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => speakText(mod.correctEn)}
                          className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {isZh ? mod.title : mod.titleEn}
                    </h3>

                    <div className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-indigo-200/70 dark:border-indigo-500/20 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {ui.formulaPrefix}
                      {mod.formula}
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {isZh ? mod.explanation : mod.explanationEn}
                    </p>

                    <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 text-xs space-y-0.5">
                      <div className="font-semibold text-emerald-800 dark:text-emerald-200">
                        “{mod.correctEn}”
                      </div>
                      {isZh && (
                        <div className="text-emerald-700/80 dark:text-emerald-300/80">
                          {mod.correctZh}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        {ui.grammarQuizPrefix}
                        {mod.checkQuestion}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {mod.checkOptions.map((opt, idx) => {
                          const selected = picked === idx;
                          const right = idx === mod.checkAnswerIdx;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setGrammarQuizAnswer((p) => ({ ...p, [mod.id]: idx }));
                                triggerHaptic(right ? 'success' : 'selection', hapticsEnabled);
                                if (right) {
                                  awardXpOnce(`ielts_gram_${mod.id}`, 15);
                                  resolveWeakItem(`gram:${mod.id}`);
                                } else {
                                  recordWeakItem(`gram:${mod.id}`);
                                }
                              }}
                              className={`min-h-[40px] py-2 px-2 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                                picked === undefined
                                  ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:border-indigo-400'
                                  : right
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : selected
                                  ? 'bg-rose-500 border-rose-500 text-white'
                                  : 'bg-white/60 dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 opacity-55'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {picked !== undefined && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {isSolved ? ui.quizCorrectBanner : ui.quizHintPrefix}
                          {isZh ? mod.pitfall : mod.pitfallEn}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 6. FAVORITES TAB (我的收藏：单词 & 句子) */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10">
                {(
                  [
                    { id: 'all', label: `${favUi.filterAll} (${totalFavoritesCount})` },
                    { id: 'words', label: `${favUi.filterWords} (${favoriteVocabEntries.length})` },
                    { id: 'sentences', label: `${favUi.filterSentences} (${progress.favoriteSentences.length})` },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFavFilter(item.id)}
                    className={`min-h-[36px] py-1.5 px-2 rounded-full text-[11px] font-semibold truncate transition-all cursor-pointer tabular-nums ${
                      favFilter === item.id
                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {totalFavoritesCount === 0 ? (
                <div className="text-center py-14 space-y-2">
                  <Bookmark className="w-8 h-8 mx-auto text-amber-400/70" />
                  <p className="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                    {favUi.emptyTitle}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                    {favUi.emptyDesc}
                  </p>
                </div>
              ) : (
                <>
                  {(favFilter === 'all' || favFilter === 'words') &&
                    favoriteVocabEntries.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                            {favUi.wordsHeading} ({favoriteVocabEntries.length})
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleExportDeck('txt', favoriteVocabEntries)}
                            className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>{vaultUi.favoritesExportBtn}</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5">
                          {favoriteVocabEntries.map((word) => (
                            <div
                              key={word.id}
                              className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                                      {word.word}
                                    </span>
                                    <span className="text-xs font-mono text-neutral-500">
                                      {word.ipa}
                                    </span>
                                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                      {vaultUi.trackShortNames[word.track]} · {word.pos} · Band {word.band}
                                    </span>
                                  </div>
                                  <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 mt-1">
                                    {isZh ? word.meaning : word.meaningEn}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => speakText(word.word)}
                                    className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-indigo-600 cursor-pointer"
                                    title={ui.pronounceWordTitle}
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVocabTrack('ALL');
                                      setBandFilter('ALL');
                                      setVocabGroup('ALL');
                                      setVocabQuery('');
                                      setUnmasteredOnly(false);
                                      setWeakVocabOnly(false);
                                      setDueOnly(false);
                                      setOrderMode('sequential');
                                      const idx = ALL_VAULT_VOCAB.findIndex((w) => w.id === word.id);
                                      setVocabIndex(idx >= 0 ? idx : 0);
                                      setVocabMode('cards');
                                      setCardFlipped(false);
                                      setActiveTab('vocab');
                                    }}
                                    className="px-2.5 py-1 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer hover:border-indigo-400"
                                  >
                                    {favUi.openInVocabBtn}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleFavoriteWord(word.id)}
                                    className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                                    title={favUi.removeBtn}
                                  >
                                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                                {word.collocation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {(favFilter === 'all' || favFilter === 'sentences') &&
                    progress.favoriteSentences.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                          {favUi.sentencesHeading} ({progress.favoriteSentences.length})
                        </h4>
                        <div className="grid grid-cols-1 gap-2.5">
                          {progress.favoriteSentences.map((sent) => (
                            <div
                              key={sent.id}
                              className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
                                    {favUi.sourceLabels[sent.source]}
                                  </span>
                                  {sent.band && (
                                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                      Band {sent.band}
                                    </span>
                                  )}
                                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 truncate">
                                    {sent.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => copyText(`fav-${sent.id}`, sent.en)}
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                                    title={extra.copyItem}
                                  >
                                    {copiedKey === `fav-${sent.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => speakText(sent.en)}
                                    className="p-1.5 rounded-lg text-indigo-500 hover:text-indigo-600 cursor-pointer"
                                    title={ui.pronounceSentence}
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => toggleFavoriteSentence(sent)}
                                    className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                                    title={favUi.removeBtn}
                                  >
                                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed">
                                {sent.en}
                              </p>
                              {sent.zh && (
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                  {sent.zh}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreEnglishModal;
