import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Heart,
  Footprints,
  Moon,
  Droplets,
  Brain,
  Scale,
  Activity,
  ChevronRight,
  Sparkles,
  Smartphone,
  Flame,
  Play,
  Square,
  Star,
  Download,
  Upload,
  Undo2,
  Wind,
  Timer,
} from 'lucide-react';
import { AppSettings } from '../types/calendar';
import { triggerHaptic } from '../utils/haptics';
import { isRtlLanguage } from '../utils/i18n';
import { getHealthI18n, localizeWorkoutName } from '../utils/fabModalI18n';
import { FolderDown } from 'lucide-react';
import {
  saveFileToDevice,
  saveFileToChosenDirectory,
  pickFileFromDevice,
} from '../utils/fileTransfer';

interface HealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  completedFocusSessionsToday?: number;
}

interface WorkoutLog {
  id: string;
  type: string;
  minutes: number;
  kcal: number;
  time: string;
}

interface DailyHealthEntry {
  steps: number;
  exerciseMinutes: number;
  activeKcal: number;
  waterMl: number;
  sleepHours: number;
  sleepBedtime?: string;
  sleepWake?: string;
  sleepQuality?: number; // 1-5
  mindfulMinutes: number;
  heartRates: { bpm: number; time: string; tag: string }[];
  spo2?: number;
  bpSys?: number;
  bpDia?: number;
  workouts: WorkoutLog[];
}

interface HealthStore {
  stepGoal: number;
  kcalGoal: number;
  exerciseGoalMin: number;
  waterGoalMl: number;
  sleepGoalHours: number;
  heightCm: number;
  weightKg: number;
  days: Record<string, DailyHealthEntry>;
}

const STORAGE_KEY = 'apple_health_store_v1';

const WORKOUT_TYPES: { id: 'walk' | 'run' | 'cycle' | 'strength' | 'yoga'; kcalPerMin: number }[] = [
  { id: 'walk', kcalPerMin: 4.5 },
  { id: 'run', kcalPerMin: 9.5 },
  { id: 'cycle', kcalPerMin: 7.5 },
  { id: 'strength', kcalPerMin: 6.0 },
  { id: 'yoga', kcalPerMin: 3.2 },
];

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getPastDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function createEmptyDay(): DailyHealthEntry {
  return {
    steps: 0,
    exerciseMinutes: 0,
    activeKcal: 0,
    waterMl: 0,
    sleepHours: 0,
    sleepBedtime: '23:15',
    sleepWake: '07:15',
    sleepQuality: 4,
    mindfulMinutes: 0,
    heartRates: [],
    workouts: [],
  };
}

function loadHealthStore(): HealthStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.days) {
        return {
          stepGoal: parsed.stepGoal || 8000,
          kcalGoal: parsed.kcalGoal || 450,
          exerciseGoalMin: parsed.exerciseGoalMin || 30,
          waterGoalMl: parsed.waterGoalMl || 2000,
          sleepGoalHours: parsed.sleepGoalHours || 8,
          heightCm: parsed.heightCm || 172,
          weightKg: parsed.weightKg || 65,
          days: parsed.days || {},
        };
      }
    }
  } catch {}
  return {
    stepGoal: 8000,
    kcalGoal: 450,
    exerciseGoalMin: 30,
    waterGoalMl: 2000,
    sleepGoalHours: 8,
    heightCm: 172,
    weightKg: 65,
    days: {},
  };
}

function calcHoursBetween(bed: string, wake: string): number {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  if ([bh, bm, wh, wm].some((n) => !Number.isFinite(n))) return 7.5;
  let start = bh * 60 + bm;
  let end = wh * 60 + wm;
  if (end <= start) end += 24 * 60;
  return Number(((end - start) / 60).toFixed(1));
}

export const HealthModal: React.FC<HealthModalProps> = ({
  isOpen,
  onClose,
  settings,
  completedFocusSessionsToday = 0,
}) => {
  const hapticsEnabled = settings.enableHaptics !== false;
  const hl = getHealthI18n(settings.language);
  const isRtl = isRtlLanguage(settings.language);
  const todayStr = getTodayStr();

  const [store, setStore] = useState<HealthStore>(() => loadHealthStore());
  const [activeTab, setActiveTab] = useState<'summary' | 'vitals' | 'trends'>('summary');
  const [sensorActive, setSensorActive] = useState(false);
  const [sensorStatusKey, setSensorStatusKey] = useState<
    'paused' | 'unsupported' | 'denied' | 'running' | 'error' | null
  >(null);

  // Tap-to-measure heart rate
  const [showPulsePad, setShowPulsePad] = useState(false);
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
  const [measuredBpm, setMeasuredBpm] = useState<number | null>(null);
  const [manualBpm, setManualBpm] = useState('');

  // Live Workout Timer
  const [workoutType, setWorkoutType] = useState(WORKOUT_TYPES[0]);
  const [workoutRunning, setWorkoutRunning] = useState(false);
  const [workoutSec, setWorkoutSec] = useState(0);

  // Box Breathing 4-4-4-4 Timer
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingSec, setBreathingSec] = useState(60);

  // Vitals manual inputs
  const [spo2Input, setSpo2Input] = useState('98');
  const [bpSysInput, setBpSysInput] = useState('118');
  const [bpDiaInput, setBpDiaInput] = useState('76');

  // Body & Goal editing
  const [editingBody, setEditingBody] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null);

  const transferI18n = useMemo(() => {
    const map: Record<string, { importTitle: string; importedOk: string; importFail: string; exportedOk: string; exportFail: string }> = {
      'zh-CN': { importTitle: '导入本机健康数据 (JSON/CSV/XML)', importedOk: '已成功导入 {count} 天健康数据', importFail: '无法识别该健康数据文件格式', exportedOk: '健康数据已导出并准备保存', exportFail: '导出失败，请重试' },
      'zh-TW': { importTitle: '匯入本機健康資料 (JSON/CSV/XML)', importedOk: '已成功匯入 {count} 天健康資料', importFail: '無法辨識該健康資料檔案格式', exportedOk: '健康資料已匯出並準備儲存', exportFail: '匯出失敗，請重試' },
      ja: { importTitle: '健康データを読み込む (JSON/CSV/XML)', importedOk: '{count}日分の健康データを読み込みました', importFail: '対応していないファイル形式です', exportedOk: '健康データを書き出しました', exportFail: '書き出しに失敗しました' },
      ko: { importTitle: '기기 건강 데이터 가져오기 (JSON/CSV/XML)', importedOk: '{count}일간의 건강 데이터를 가져왔습니다', importFail: '지원하지 않는 건강 데이터 파일입니다', exportedOk: '건강 데이터를 내보냈습니다', exportFail: '내보내기에 실패했습니다' },
      fr: { importTitle: 'Importer des données santé (JSON/CSV/XML)', importedOk: '{count} jours importés avec succès', importFail: 'Format de fichier santé non reconnu', exportedOk: 'Données santé exportées', exportFail: 'Échec de l’exportation' },
      ru: { importTitle: 'Импорт данных здоровья (JSON/CSV/XML)', importedOk: 'Импортировано дней: {count}', importFail: 'Неподдерживаемый формат файла', exportedOk: 'Данные здоровья экспортированы', exportFail: 'Ошибка экспорта' },
      fa: { importTitle: 'وارد کردن داده‌های سلامت (JSON/CSV/XML)', importedOk: 'داده‌های {count} روز وارد شد', importFail: 'فرمت فایل سلامت پشتیبانی نمی‌شود', exportedOk: 'فایل سلامت خروجی گرفته شد', exportFail: 'خطا در خروجی فایل' },
      mn: { importTitle: 'Эрүүл мэндийн өгөгдөл оруулах (JSON/CSV/XML)', importedOk: '{count} өдрийн өгөгдөл орууллаа', importFail: 'Дэмжигдээгүй файлын формат', exportedOk: 'Өгөгдөл хадгалагдлаа', exportFail: 'Хадгалахад алдаа гарлаа' },
      ug: { importTitle: 'ساغلاملىق سانلىق مەلۇماتى كىرگۈزۈش (JSON/CSV/XML)', importedOk: '{count} كۈنلۈك سانلىق مەلۇمات كىرگۈزۈلدى', importFail: 'ھۆججەت شەكلى قوللىمايدۇ', exportedOk: 'ساغلاملىق ھۆججىتى چىقىرىلدى', exportFail: 'چىقىرىش مەغلۇپ بولدى' },
      en: { importTitle: 'Import Device Health Data (JSON/CSV/XML)', importedOk: 'Imported {count} days of health records', importFail: 'Unsupported or invalid health file format', exportedOk: 'Health backup ready to save', exportFail: 'Export failed' },
    };
    return map[settings.language] || map.en;
  }, [settings.language]);

  const showFeedback = (msg: string, kind: 'ok' | 'err' = 'ok') => {
    setFeedbackBanner({ msg, kind });
    window.setTimeout(() => {
      setFeedbackBanner((cur) => (cur?.msg === msg ? null : cur));
    }, 3500);
  };

  const lastAccelRef = useRef<number>(0);
  const lastStepTimeRef = useRef<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {}
  }, [store]);

  const todayData: DailyHealthEntry = {
    ...createEmptyDay(),
    ...(store.days[todayStr] || {}),
    workouts: store.days[todayStr]?.workouts || [],
    heartRates: store.days[todayStr]?.heartRates || [],
  };

  const updateToday = (updater: (prev: DailyHealthEntry) => DailyHealthEntry) => {
    setStore((prev) => {
      const curr = {
        ...createEmptyDay(),
        ...(prev.days[todayStr] || {}),
        workouts: prev.days[todayStr]?.workouts || [],
        heartRates: prev.days[todayStr]?.heartRates || [],
      };
      return {
        ...prev,
        days: {
          ...prev.days,
          [todayStr]: updater(curr),
        },
      };
    });
  };

  // Native DeviceMotion Pedometer
  useEffect(() => {
    if (!isOpen || !sensorActive) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const delta = Math.abs(magnitude - lastAccelRef.current);
      lastAccelRef.current = magnitude;

      const now = Date.now();
      if (delta > 3.2 && now - lastStepTimeRef.current > 280) {
        lastStepTimeRef.current = now;
        updateToday((d) => ({ ...d, steps: d.steps + 1 }));
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isOpen, sensorActive, todayStr]);

  // Workout stopwatch
  useEffect(() => {
    if (!workoutRunning) return;
    const id = window.setInterval(() => setWorkoutSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [workoutRunning]);

  // Guided 4-4-4-4 Box Breathing countdown
  useEffect(() => {
    if (!breathingActive) return;
    const timer = window.setInterval(() => {
      setBreathingSec((sec) => {
        if (sec <= 1) {
          setBreathingActive(false);
          updateToday((d) => ({ ...d, mindfulMinutes: d.mindfulMinutes + 1 }));
          triggerHaptic('success', hapticsEnabled);
          return 60;
        }
        return sec - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [breathingActive, hapticsEnabled]);

  const toggleNativeStepSensor = async () => {
    triggerHaptic('selection', hapticsEnabled);
    if (sensorActive) {
      setSensorActive(false);
      setSensorStatusKey('paused');
      return;
    }

    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) {
      setSensorStatusKey('unsupported');
      return;
    }

    try {
      const DM = DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof DM.requestPermission === 'function') {
        const perm = await DM.requestPermission();
        if (perm !== 'granted') {
          setSensorStatusKey('denied');
          return;
        }
      }
      setSensorActive(true);
      setSensorStatusKey('running');
    } catch {
      setSensorStatusKey('error');
    }
  };

  const finishWorkout = () => {
    const mins = Math.max(1, Math.round(workoutSec / 60));
    const kcal = Math.round(mins * workoutType.kcalPerMin);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    triggerHaptic('success', hapticsEnabled);
    updateToday((d) => ({
      ...d,
      exerciseMinutes: d.exerciseMinutes + mins,
      activeKcal: d.activeKcal + kcal,
      workouts: [
        {
          id: `wk-${Date.now()}`,
          type: workoutType.id,
          minutes: mins,
          kcal,
          time: timeStr,
        },
        ...d.workouts,
      ],
    }));
    setWorkoutRunning(false);
    setWorkoutSec(0);
  };

  const handleHeartTap = () => {
    triggerHaptic('selection', hapticsEnabled);
    const now = Date.now();
    setTapTimestamps((prev) => {
      const recent = prev.filter((ts) => now - ts < 4000);
      const next = [...recent, now].slice(-8);
      if (next.length >= 3) {
        const intervals: number[] = [];
        for (let i = 1; i < next.length; i++) {
          intervals.push(next[i] - next[i - 1]);
        }
        const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = Math.round(Math.min(200, Math.max(40, 60000 / avgMs)));
        setMeasuredBpm(bpm);
      }
      return next;
    });
  };

  const saveHeartRate = (bpmValue: number, tag: string) => {
    if (!Number.isFinite(bpmValue) || bpmValue < 35 || bpmValue > 220) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    triggerHaptic('selection', hapticsEnabled);
    updateToday((d) => ({
      ...d,
      heartRates: [{ bpm: Math.round(bpmValue), time: timeStr, tag }, ...d.heartRates].slice(0, 12),
    }));
    setMeasuredBpm(null);
    setTapTimestamps([]);
    setManualBpm('');
    setShowPulsePad(false);
  };

  const handleExportHealth = async () => {
    const filename = `${hl.exportFilenamePrefix}_${todayStr}.json`;
    const res = await saveFileToDevice(filename, JSON.stringify(store, null, 2), 'application/json;charset=utf-8');
    if (res.ok) {
      showFeedback(
        res.pathHint ? `${transferI18n.exportedOk} (${res.pathHint})` : transferI18n.exportedOk,
        'ok'
      );
    } else if (res.error !== 'cancelled') {
      showFeedback(transferI18n.exportFail, 'err');
    }
  };

  const handleExportHealthToFolder = async () => {
    const filename = `${hl.exportFilenamePrefix}_${todayStr}.json`;
    const res = await saveFileToChosenDirectory(
      filename,
      JSON.stringify(store, null, 2),
      'application/json;charset=utf-8'
    );
    if (res.ok) {
      showFeedback(
        res.pathHint ? `${transferI18n.exportedOk} (${res.pathHint})` : transferI18n.exportedOk,
        'ok'
      );
    } else if (res.error !== 'cancelled') {
      showFeedback(transferI18n.exportFail, 'err');
    }
  };

  const handlePickAndImportHealthFile = async () => {
    const file = await pickFileFromDevice({
      accept: '.json,.csv,.xml',
      mimeTypes: ['application/json', 'text/csv', 'text/xml', 'application/xml'],
      description: 'Health Data (JSON / CSV / XML)',
    });
    if (!file) return;
    await importHealthFromFile(file);
  };

  const handleImportHealthFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await importHealthFromFile(file);
  };

  const importHealthFromFile = async (file: File) => {
    try {
      const text = await file.text();
      const importedDays: Record<string, Partial<DailyHealthEntry>> = {};
      let importedHeight: number | undefined;
      let importedWeight: number | undefined;

      const normalizeDate = (raw: string): string | null => {
        const m = String(raw || '').trim().match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        if (!m) return null;
        return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
      };

      const ensureDay = (dateKey: string) => {
        if (!importedDays[dateKey]) importedDays[dateKey] = {};
        return importedDays[dateKey];
      };

      const trimmed = text.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.days && typeof parsed.days === 'object') {
          Object.entries(parsed.days as Record<string, Partial<DailyHealthEntry>>).forEach(([dKey, entry]) => {
            const norm = normalizeDate(dKey);
            if (!norm || !entry || typeof entry !== 'object') return;
            const target = ensureDay(norm);
            if (typeof entry.steps === 'number') target.steps = Math.round(entry.steps);
            if (typeof entry.activeKcal === 'number') target.activeKcal = Math.round(entry.activeKcal);
            if (typeof entry.exerciseMinutes === 'number') target.exerciseMinutes = Math.round(entry.exerciseMinutes);
            if (typeof entry.waterMl === 'number') target.waterMl = Math.round(entry.waterMl);
            if (typeof entry.sleepHours === 'number') target.sleepHours = Number(entry.sleepHours.toFixed(1));
            if (typeof entry.mindfulMinutes === 'number') target.mindfulMinutes = Math.round(entry.mindfulMinutes);
            if (Array.isArray(entry.heartRates)) target.heartRates = entry.heartRates;
            if (Array.isArray(entry.workouts)) target.workouts = entry.workouts;
            if (typeof entry.spo2 === 'number') target.spo2 = entry.spo2;
            if (typeof entry.bpSys === 'number') target.bpSys = entry.bpSys;
            if (typeof entry.bpDia === 'number') target.bpDia = entry.bpDia;
          });
          if (typeof parsed.heightCm === 'number' && parsed.heightCm > 60) importedHeight = parsed.heightCm;
          if (typeof parsed.weightKg === 'number' && parsed.weightKg > 20) importedWeight = parsed.weightKg;
        } else {
          // Generic array of daily records (Google Fit / Health Connect style JSON)
          const list = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.DataPoints || parsed?.records || parsed?.data)
            ? (parsed.DataPoints || parsed.records || parsed.data)
            : [];
          for (const row of list) {
            if (!row || typeof row !== 'object') continue;
            const norm = normalizeDate(row.date || row.day || row.startDate || row.timestamp || todayStr);
            if (!norm) continue;
            const target = ensureDay(norm);
            const stepsVal = Number(row.steps ?? row.stepCount ?? row.step_count);
            if (Number.isFinite(stepsVal) && stepsVal > 0) target.steps = Math.round(stepsVal);
            const kcalVal = Number(row.activeKcal ?? row.calories ?? row.kcal);
            if (Number.isFinite(kcalVal) && kcalVal > 0) target.activeKcal = Math.round(kcalVal);
            const sleepVal = Number(row.sleepHours ?? row.sleep_hours);
            if (Number.isFinite(sleepVal) && sleepVal > 0) target.sleepHours = Number(sleepVal.toFixed(1));
            const waterVal = Number(row.waterMl ?? row.water_ml);
            if (Number.isFinite(waterVal) && waterVal > 0) target.waterMl = Math.round(waterVal);
            const bpmVal = Number(row.bpm ?? row.heartRate ?? row.heart_rate);
            if (Number.isFinite(bpmVal) && bpmVal >= 35 && bpmVal <= 220) {
              target.heartRates = [{ bpm: Math.round(bpmVal), time: '12:00', tag: 'import' }];
            }
          }
        }
      } else if (trimmed.startsWith('<')) {
        // Apple Health export.xml parser via DOMParser
        const doc = new DOMParser().parseFromString(trimmed, 'text/xml');
        const records = Array.from(doc.getElementsByTagName('Record'));
        records.forEach((rec) => {
          const type = rec.getAttribute('type') || '';
          const startDate = rec.getAttribute('startDate') || rec.getAttribute('creationDate') || '';
          const norm = normalizeDate(startDate);
          if (!norm) return;
          const val = Number(rec.getAttribute('value') || '0');
          const target = ensureDay(norm);
          if (type.includes('StepCount') && Number.isFinite(val)) {
            target.steps = Math.round((target.steps || 0) + val);
          } else if (type.includes('ActiveEnergyBurned') && Number.isFinite(val)) {
            target.activeKcal = Math.round((target.activeKcal || 0) + val);
          } else if (type.includes('AppleExerciseTime') && Number.isFinite(val)) {
            target.exerciseMinutes = Math.round((target.exerciseMinutes || 0) + val);
          } else if (type.includes('DietaryWater') && Number.isFinite(val)) {
            const unit = (rec.getAttribute('unit') || '').toLowerCase();
            const ml = unit === 'l' ? val * 1000 : val;
            target.waterMl = Math.round((target.waterMl || 0) + ml);
          } else if (type.includes('HeartRate') && Number.isFinite(val) && val >= 35 && val <= 220) {
            const timeMatch = startDate.match(/\b(\d{2}:\d{2})/);
            const hrs = target.heartRates || [];
            if (hrs.length < 12) {
              hrs.unshift({ bpm: Math.round(val), time: timeMatch?.[1] || '12:00', tag: 'import' });
              target.heartRates = hrs;
            }
          }
        });
      } else {
        // CSV parser (Date, Steps, Calories/Kcal, Sleep, Water, BPM, Minutes)
        const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length >= 2) {
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
          const findCol = (keywords: string[]) => headers.findIndex((h) => keywords.some((k) => h.includes(k)));
          const dateIdx = findCol(['date', 'day', '日期', '時間']);
          const stepsIdx = findCol(['step', '步数', '步數', '歩数']);
          const kcalIdx = findCol(['kcal', 'calorie', 'energy', '卡路里', '热量']);
          const sleepIdx = findCol(['sleep', '睡眠']);
          const waterIdx = findCol(['water', '饮水', '水分']);
          const bpmIdx = findCol(['bpm', 'heart', '心率']);
          const minIdx = findCol(['minute', 'exercise', 'active', '锻炼', '運動']);

          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
            const norm = dateIdx >= 0 ? normalizeDate(cols[dateIdx] || '') : todayStr;
            if (!norm) continue;
            const target = ensureDay(norm);
            if (stepsIdx >= 0) {
              const v = parseFloat(cols[stepsIdx]);
              if (Number.isFinite(v) && v >= 0) target.steps = Math.round((target.steps || 0) + v);
            }
            if (kcalIdx >= 0) {
              const v = parseFloat(cols[kcalIdx]);
              if (Number.isFinite(v) && v >= 0) target.activeKcal = Math.round((target.activeKcal || 0) + v);
            }
            if (sleepIdx >= 0) {
              const v = parseFloat(cols[sleepIdx]);
              if (Number.isFinite(v) && v > 0 && v <= 24) target.sleepHours = Number(v.toFixed(1));
            }
            if (waterIdx >= 0) {
              const v = parseFloat(cols[waterIdx]);
              if (Number.isFinite(v) && v >= 0) target.waterMl = Math.round((target.waterMl || 0) + v);
            }
            if (minIdx >= 0) {
              const v = parseFloat(cols[minIdx]);
              if (Number.isFinite(v) && v >= 0) target.exerciseMinutes = Math.round((target.exerciseMinutes || 0) + v);
            }
            if (bpmIdx >= 0) {
              const v = parseFloat(cols[bpmIdx]);
              if (Number.isFinite(v) && v >= 35 && v <= 220) {
                target.heartRates = [{ bpm: Math.round(v), time: '12:00', tag: 'import' }];
              }
            }
          }
        }
      }

      const dayKeys = Object.keys(importedDays);
      if (dayKeys.length === 0) {
        showFeedback(transferI18n.importFail, 'err');
        return;
      }

      setStore((prev) => {
        const nextDays = { ...prev.days };
        dayKeys.forEach((dKey) => {
          const existing = { ...createEmptyDay(), ...(nextDays[dKey] || {}) };
          const patch = importedDays[dKey];
          nextDays[dKey] = {
            ...existing,
            ...patch,
            heartRates: patch.heartRates ? [...patch.heartRates, ...existing.heartRates].slice(0, 12) : existing.heartRates,
            workouts: patch.workouts ? [...patch.workouts, ...existing.workouts] : existing.workouts,
          };
        });
        return {
          ...prev,
          heightCm: importedHeight ?? prev.heightCm,
          weightKg: importedWeight ?? prev.weightKg,
          days: nextDays,
        };
      });

      triggerHaptic('success', hapticsEnabled);
      showFeedback(transferI18n.importedOk.replace('{count}', String(dayKeys.length)), 'ok');
    } catch {
      showFeedback(transferI18n.importFail, 'err');
    }
  };

  // Activity Ring Metrics
  const totalMoveKcal = Math.round(todayData.steps * 0.04 + todayData.activeKcal);
  const moveProgress = Math.min(1, totalMoveKcal / Math.max(1, store.kcalGoal));
  const exerciseProgress = Math.min(1, todayData.exerciseMinutes / Math.max(1, store.exerciseGoalMin));
  const stepProgress = Math.min(1, todayData.steps / Math.max(1, store.stepGoal));

  const estimatedKm = (todayData.steps * 0.00072).toFixed(2);
  const waterProgress = Math.min(1, todayData.waterMl / Math.max(1, store.waterGoalMl));
  const totalMindfulMins = todayData.mindfulMinutes + completedFocusSessionsToday * 25;

  const bmiValue = useMemo(() => {
    const hMeters = store.heightCm / 100;
    if (hMeters <= 0) return 0;
    return Number((store.weightKg / (hMeters * hMeters)).toFixed(1));
  }, [store.heightCm, store.weightKg]);

  const bmiLabel = useMemo(() => {
    if (bmiValue < 18.5) return { text: hl.bmiUnder, color: 'text-sky-600 dark:text-sky-400' };
    if (bmiValue < 24) return { text: hl.bmiIdeal, color: 'text-emerald-600 dark:text-emerald-400' };
    if (bmiValue < 28) return { text: hl.bmiOver, color: 'text-amber-600 dark:text-amber-400' };
    return { text: hl.bmiConcern, color: 'text-rose-600 dark:text-rose-400' };
  }, [bmiValue, hl]);

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dateStr = getPastDateStr(6 - i);
      const entry = { ...createEmptyDay(), ...(store.days[dateStr] || {}) };
      return {
        dateStr,
        label: dateStr.slice(5),
        ...entry,
      };
    });
  }, [store.days]);

  const latestBpm = todayData.heartRates[0];

  const localizeHrTag = (tag: string) => {
    if (tag === 'tap' || tag === '指尖节拍测量') return hl.hrTapTag;
    if (tag === 'manual' || tag === '手动记录') return hl.hrManualTag;
    return tag;
  };

  const sensorStatusText =
    sensorStatusKey === 'paused'
      ? hl.sensorPaused
      : sensorStatusKey === 'unsupported'
      ? hl.sensorUnsupported
      : sensorStatusKey === 'denied'
      ? hl.sensorDenied
      : sensorStatusKey === 'running'
      ? hl.sensorRunning
      : sensorStatusKey === 'error'
      ? hl.sensorError
      : '';

  // Breathing phase label (4s Inhale -> 4s Hold -> 4s Exhale -> 4s Hold)
  const breathElapsed = 60 - breathingSec;
  const breathCyclePos = breathElapsed % 16;
  const breathPhase =
    breathCyclePos < 4
      ? hl.breathInhale
      : breathCyclePos < 8
      ? hl.breathHold1
      : breathCyclePos < 12
      ? hl.breathExhale
      : hl.breathHold2;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm sm:p-4 animate-modal-backdrop"
      onClick={onClose}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl h-[92dvh] max-h-[calc(100dvh-env(safe-area-inset-top)-8px)] sm:h-auto sm:max-h-[90vh] flex flex-col bg-[#F2F2F7] dark:bg-neutral-950 [.amoled-mode_&]:bg-black rounded-t-3xl sm:rounded-3xl border border-black/10 dark:border-white/12 shadow-2xl overflow-hidden animate-modal-content"
      >
        {/* Apple Health Header */}
        <div className="shrink-0 px-4 sm:px-5 py-3.5 bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                {hl.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <input
              id="health-import-file-input"
              type="file"
              accept=".json,.csv,.xml,application/json,text/csv,text/xml"
              onChange={handleImportHealthFile}
              className="sr-only"
            />
            <button
              type="button"
              onClick={handlePickAndImportHealthFile}
              title={transferI18n.importTitle}
              aria-label={transferI18n.importTitle}
              className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer inline-flex items-center justify-center"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportHealth}
              title={hl.exportTitle}
              aria-label={hl.exportTitle}
              className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportHealthToFolder}
              title={`${hl.exportTitle} (Folder)`}
              aria-label={`${hl.exportTitle} (Folder)`}
              className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <FolderDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              aria-label={hl.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

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

        {/* 3-Tab Switcher (Market-unified rounded-full segmented bar) */}
        <div className="shrink-0 px-4 sm:px-5 py-2 bg-white/75 dark:bg-neutral-900/60 [.amoled-mode_&]:bg-black border-b border-black/[0.05] dark:border-white/10">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-full bg-neutral-100/95 dark:bg-white/[0.08] border border-neutral-200/75 dark:border-white/10 w-full">
            {[
              { id: 'summary' as const, label: hl.tabSummary },
              { id: 'vitals' as const, label: hl.tabVitals },
              { id: 'trends' as const, label: hl.tabTrends },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center justify-center py-1.5 px-2 rounded-full text-xs transition-all cursor-pointer min-w-0 ${
                  activeTab === t.id
                    ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white font-bold shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-semibold'
                }`}
              >
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3.5">
          {activeTab === 'summary' && (
            <>
              {/* Sensor Quick Bar */}
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {hl.ringsHeading}
                </h3>
                <button
                  type="button"
                  onClick={toggleNativeStepSensor}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    sensorActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-black/10 dark:border-white/10'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {sensorActive ? hl.sensorActiveBtn : hl.sensorInactiveBtn}
                </button>
              </div>
              {sensorStatusText && (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 px-1 -mt-2">
                  {sensorStatusText}
                </p>
              )}

              {/* Apple Fitness Triple Activity Rings Card */}
              <div className="rounded-2xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-4 border border-black/[0.05] dark:border-white/10 shadow-xs">
                <div className="flex items-center gap-4">
                  {/* Concentric 3 Rings */}
                  <div className="relative w-28 h-28 shrink-0">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      {/* Outer Move Ring (Red) */}
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(244,63,94,0.16)" strokeWidth="10" />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#F43F5E"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 50}
                        strokeDashoffset={2 * Math.PI * 50 * (1 - moveProgress)}
                        className="transition-all duration-500"
                      />
                      {/* Middle Exercise Ring (Green) */}
                      <circle cx="60" cy="60" r="37" fill="none" stroke="rgba(34,197,94,0.16)" strokeWidth="10" />
                      <circle
                        cx="60"
                        cy="60"
                        r="37"
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 37}
                        strokeDashoffset={2 * Math.PI * 37 * (1 - exerciseProgress)}
                        className="transition-all duration-500"
                      />
                      {/* Inner Steps Ring (Orange/Cyan) */}
                      <circle cx="60" cy="60" r="24" fill="none" stroke="rgba(249,115,22,0.16)" strokeWidth="10" />
                      <circle
                        cx="60"
                        cy="60"
                        r="24"
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 24}
                        strokeDashoffset={2 * Math.PI * 24 * (1 - stepProgress)}
                        className="transition-all duration-500"
                      />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-500 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> {hl.moveLabel}
                      </span>
                      <span className="font-extrabold text-neutral-900 dark:text-white">
                        {totalMoveKcal} / {store.kcalGoal} {hl.kcalUnit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-500 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" /> {hl.exerciseLabel}
                      </span>
                      <span className="font-extrabold text-neutral-900 dark:text-white">
                        {todayData.exerciseMinutes} / {store.exerciseGoalMin} {hl.minUnit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-orange-500 flex items-center gap-1">
                        <Footprints className="w-3.5 h-3.5" /> {hl.stepsLabel}
                      </span>
                      <span className="font-extrabold text-neutral-900 dark:text-white">
                        {todayData.steps.toLocaleString()} ({estimatedKm}km)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[500, 1500, 3000].map((inc) => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection', hapticsEnabled);
                            updateToday((d) => ({ ...d, steps: d.steps + inc }));
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400"
                        >
                          +{inc} {hl.stepUnit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Workout Timer Card */}
              <div className="rounded-2xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-4 border border-black/[0.05] dark:border-white/10 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                    <Activity className="w-4 h-4" />
                    <span>{hl.liveWorkoutTitle}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                    {String(Math.floor(workoutSec / 60)).padStart(2, '0')}:
                    {String(workoutSec % 60).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {WORKOUT_TYPES.map((wt) => (
                    <button
                      key={wt.id}
                      type="button"
                      disabled={workoutRunning}
                      onClick={() => setWorkoutType(wt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        workoutType.id === wt.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      {hl.workoutNames[wt.id]}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection', hapticsEnabled);
                      setWorkoutRunning((r) => !r);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${
                      workoutRunning
                        ? 'bg-amber-500 text-neutral-950'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    {workoutRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    {workoutRunning ? hl.pauseWorkout : hl.startWorkout}
                  </button>
                  {workoutSec > 0 && (
                    <button
                      type="button"
                      onClick={finishWorkout}
                      className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-bold"
                    >
                      {hl.finishSaveWorkout}
                    </button>
                  )}
                </div>

                {todayData.workouts.length > 0 && (
                  <div className="pt-2 border-t border-black/[0.06] dark:border-white/10 space-y-1">
                    {todayData.workouts.slice(0, 3).map((w) => (
                      <div key={w.id} className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                        <span>{localizeWorkoutName(w.type, settings.language)} · {w.time}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {w.minutes}{hl.minUnit} · {w.kcal}{hl.kcalUnit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hydration & Guided Box Breathing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-4 border border-black/[0.05] dark:border-white/10 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sky-500 font-bold text-sm">
                      <Droplets className="w-4 h-4 fill-sky-500" />
                      <span>{hl.hydrationTitle}</span>
                    </div>
                    <button
                      type="button"
                      disabled={todayData.waterMl <= 0}
                      onClick={() => updateToday((d) => ({ ...d, waterMl: Math.max(0, d.waterMl - 250) }))}
                      className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                      title={hl.undoWaterTitle}
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                        {todayData.waterMl}
                      </span>
                      <span className="text-xs font-medium text-neutral-500 ml-1">
                        / {store.waterGoalMl} ml
                      </span>
                    </div>
                    <span className="text-xs font-bold text-sky-500">
                      {Math.round(waterProgress * 100)}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-sky-500/15 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(waterProgress * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[200, 250, 500].map((ml) => (
                      <button
                        key={ml}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection', hapticsEnabled);
                          updateToday((d) => ({ ...d, waterMl: d.waterMl + ml }));
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold"
                      >
                        +{ml}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guided 4-4-4-4 Box Breathing */}
                <div className="rounded-2xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-4 border border-black/[0.05] dark:border-white/10 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-teal-500 font-bold text-sm">
                      <Brain className="w-4 h-4" />
                      <span>{hl.mindfulnessTitle}</span>
                    </div>
                    <span className="text-xs font-bold text-neutral-500">
                      {totalMindfulMins} {hl.minUnit}
                    </span>
                  </div>

                  {breathingActive ? (
                    <div className="py-1 flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full bg-teal-500/20 border-2 border-teal-500 flex items-center justify-center transition-transform duration-1000 ${
                          breathCyclePos < 8 ? 'scale-110' : 'scale-90'
                        }`}
                      >
                        <Wind className="w-5 h-5 text-teal-500" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-teal-600 dark:text-teal-400">
                          {breathPhase}
                        </div>
                        <div className="text-[11px] text-neutral-500">{hl.breathRemain(breathingSec)}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {hl.breathDesc}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection', hapticsEnabled);
                      if (breathingActive) {
                        setBreathingActive(false);
                        setBreathingSec(60);
                      } else {
                        setBreathingSec(60);
                        setBreathingActive(true);
                      }
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      breathingActive
                        ? 'bg-teal-500 text-white'
                        : 'bg-teal-500/12 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {breathingActive ? hl.breathStop : hl.breathStart}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'vitals' && (
            <>
              {/* Heart Rate Card */}
              <div className="rounded-2xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-4 border border-black/[0.05] dark:border-white/10 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-500 font-bold text-sm">
                    <Heart className="w-4 h-4 fill-rose-500" />
                    <span>{hl.hrTitle}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPulsePad((v) => !v)}
                    className="text-xs font-semibold text-rose-500 flex items-center gap-0.5"
                  >
                    {showPulsePad ? hl.hrCollapse : hl.hrMeasure}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {latestBpm ? (
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                        {latestBpm.bpm}
                      </span>
                      <span className="text-xs font-medium text-neutral-500">
                        {hl.hrBpmUnit} · {localizeHrTag(latestBpm.tag)} ({latestBpm.time})
                      </span>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/12 text-rose-600 dark:text-rose-400">
                      {latestBpm.bpm < 60 ? hl.hrLow : latestBpm.bpm <= 100 ? hl.hrNormal : hl.hrHigh}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {hl.hrEmpty}
                  </p>
                )}

                {showPulsePad && (
                  <div className="pt-2 border-t border-black/[0.06] dark:border-white/10 space-y-2.5">
                    <button
                      type="button"
                      onClick={handleHeartTap}
                      className="w-full py-3 rounded-xl bg-rose-500/12 hover:bg-rose-500/20 active:scale-[0.98] text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Activity className="w-4 h-4 animate-pulse" />
                      {measuredBpm
                        ? hl.hrEstimated(measuredBpm)
                        : hl.hrTapPrompt(tapTimestamps.length)}
                    </button>

                    {measuredBpm && (
                      <button
                        type="button"
                        onClick={() => saveHeartRate(measuredBpm, 'tap')}
                        className="w-full py-2 rounded-xl bg-rose-500 text-white text-xs font-bold"
                      >
                        {hl.hrSaveBtn(measuredBpm)}
                      </button>
                    )}

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={40}
                        max={200}
                        value={manualBpm}
                        onChange={(e) => setManualBpm(e.target.value)}
                        placeholder={hl.hrInputPlaceholder}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => saveHeartRate(Number(manualBpm), 'manual')}
                        className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold"
                      >
                        {hl.addBtn}
                      </button>
                    </div>
                  </div>
                )}

                {todayData.heartRates.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {todayData.heartRates.slice(0, 6).map((hr, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300"
                      >
                        {hr.time} · {hr.bpm} BPM
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Blood Oxygen & Blood Pressure */}
              <div className="rounded-2xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-4 border border-black/[0.05] dark:border-white/10 shadow-xs space-y-3">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {hl.spo2BpTitle}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/70 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">{hl.spo2Label}</span>
                      <span className="font-extrabold text-sky-600 dark:text-sky-400">
                        {todayData.spo2 ? `${todayData.spo2}%` : hl.unrecorded}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min={80}
                        max={100}
                        value={spo2Input}
                        onChange={(e) => setSpo2Input(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-neutral-900 font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateToday((d) => ({ ...d, spo2: Number(spo2Input) || 98 }))
                        }
                        className="px-2.5 py-1 rounded-lg bg-sky-500 text-white font-bold shrink-0"
                      >
                        {hl.saveShort}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/70 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">{hl.bpLabel}</span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400">
                        {todayData.bpSys && todayData.bpDia
                          ? `${todayData.bpSys}/${todayData.bpDia}`
                          : hl.unrecorded}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={bpSysInput}
                        onChange={(e) => setBpSysInput(e.target.value)}
                        className="w-full px-1.5 py-1 rounded-lg bg-white dark:bg-neutral-900 font-semibold text-center"
                      />
                      <input
                        type="number"
                        value={bpDiaInput}
                        onChange={(e) => setBpDiaInput(e.target.value)}
                        className="w-full px-1.5 py-1 rounded-lg bg-white dark:bg-neutral-900 font-semibold text-center"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateToday((d) => ({
                            ...d,
                            bpSys: Number(bpSysInput) || 120,
                            bpDia: Number(bpDiaInput) || 80,
                          }))
                        }
                        className="px-2 py-1 rounded-lg bg-rose-500 text-white font-bold shrink-0"
                      >
                        {hl.saveShort}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sleep Schedule & Quality Breakdown */}
              <div className="rounded-2xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-4 border border-black/[0.05] dark:border-white/10 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-sm">
                    <Moon className="w-4 h-4 fill-indigo-500" />
                    <span>{hl.sleepTitle}</span>
                  </div>
                  <span className="text-sm font-extrabold text-neutral-900 dark:text-white">
                    {todayData.sleepHours.toFixed(1)} {hl.hoursUnit}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="space-y-1">
                    <span className="text-neutral-500">{hl.bedtimeLabel}</span>
                    <input
                      type="time"
                      value={todayData.sleepBedtime || '23:15'}
                      onChange={(e) => {
                        const bed = e.target.value;
                        const wake = todayData.sleepWake || '07:15';
                        updateToday((d) => ({
                          ...d,
                          sleepBedtime: bed,
                          sleepHours: calcHoursBetween(bed, wake),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-semibold"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-neutral-500">{hl.wakeLabel}</span>
                    <input
                      type="time"
                      value={todayData.sleepWake || '07:15'}
                      onChange={(e) => {
                        const wake = e.target.value;
                        const bed = todayData.sleepBedtime || '23:15';
                        updateToday((d) => ({
                          ...d,
                          sleepWake: wake,
                          sleepHours: calcHoursBetween(bed, wake),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-semibold"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">{hl.sleepQualityLabel}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateToday((d) => ({ ...d, sleepQuality: star }))}
                        className="p-0.5"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            (todayData.sleepQuality || 0) >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-300 dark:text-neutral-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {todayData.sleepHours > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="h-2.5 w-full rounded-full overflow-hidden flex">
                      <div className="bg-indigo-700 w-[22%]" title={hl.sleepDeep} />
                      <div className="bg-indigo-400 w-[55%]" title={hl.sleepLight} />
                      <div className="bg-sky-400 w-[23%]" title={hl.sleepRem} />
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>{hl.sleepDeep} {(todayData.sleepHours * 0.22).toFixed(1)}h</span>
                      <span>{hl.sleepLight} {(todayData.sleepHours * 0.55).toFixed(1)}h</span>
                      <span>{hl.sleepRem} {(todayData.sleepHours * 0.23).toFixed(1)}h</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Body Metrics / BMI */}
              <div className="rounded-2xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-4 border border-black/[0.05] dark:border-white/10 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-purple-500 font-bold text-sm">
                    <Scale className="w-4 h-4" />
                    <span>{hl.bodyTitle}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingBody((v) => !v)}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400"
                  >
                    {editingBody ? hl.done : hl.editBodyGoals}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/70 p-2.5">
                    <div className="text-[11px] text-neutral-500">{hl.heightLabel}</div>
                    <div className="text-sm font-extrabold text-neutral-900 dark:text-white mt-0.5">
                      {store.heightCm} cm
                    </div>
                  </div>
                  <div className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/70 p-2.5">
                    <div className="text-[11px] text-neutral-500">{hl.weightLabel}</div>
                    <div className="text-sm font-extrabold text-neutral-900 dark:text-white mt-0.5">
                      {store.weightKg} kg
                    </div>
                  </div>
                  <div className="rounded-xl bg-neutral-100/80 dark:bg-neutral-800/70 p-2.5">
                    <div className="text-[11px] text-neutral-500">{hl.bmiLabel}</div>
                    <div className={`text-sm font-extrabold mt-0.5 ${bmiLabel.color}`}>
                      {bmiValue} · {bmiLabel.text}
                    </div>
                  </div>
                </div>

                {editingBody && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-black/[0.06] dark:border-white/10 text-xs">
                    <label className="space-y-1">
                      <span className="text-neutral-500">{hl.heightLabel} (cm)</span>
                      <input
                        type="number"
                        value={store.heightCm}
                        onChange={(e) =>
                          setStore((s) => ({ ...s, heightCm: Number(e.target.value) || 170 }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-semibold"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-neutral-500">{hl.weightLabel} (kg)</span>
                      <input
                        type="number"
                        step={0.5}
                        value={store.weightKg}
                        onChange={(e) =>
                          setStore((s) => ({ ...s, weightKg: Number(e.target.value) || 65 }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-semibold"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-neutral-500">{hl.stepGoalLabel}</span>
                      <input
                        type="number"
                        step={500}
                        value={store.stepGoal}
                        onChange={(e) =>
                          setStore((s) => ({ ...s, stepGoal: Number(e.target.value) || 8000 }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-semibold"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-neutral-500">{hl.waterGoalLabel}</span>
                      <input
                        type="number"
                        step={250}
                        value={store.waterGoalMl}
                        onChange={(e) =>
                          setStore((s) => ({ ...s, waterGoalMl: Number(e.target.value) || 2000 }))
                        }
                        className="w-full px-2 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-semibold"
                      />
                    </label>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-4 border border-black/[0.05] dark:border-white/10">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-orange-500" />
                  {hl.trendSteps}
                </h4>
                <div className="h-36 flex items-end justify-between gap-2 pt-4">
                  {last7Days.map((day) => {
                    const pct = Math.max(8, Math.min(100, Math.round((day.steps / store.stepGoal) * 100)));
                    return (
                      <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                          {day.steps > 0 ? day.steps : '-'}
                        </span>
                        <div className="w-full max-w-[28px] h-24 rounded-lg bg-orange-500/10 flex items-end overflow-hidden">
                          <div
                            className="w-full bg-orange-500 rounded-lg transition-all duration-300"
                            style={{ height: `${day.steps > 0 ? pct : 6}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-500">{day.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-4 border border-black/[0.05] dark:border-white/10">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  {hl.trendSleep}
                </h4>
                <div className="h-36 flex items-end justify-between gap-2 pt-4">
                  {last7Days.map((day) => {
                    const pct = Math.max(8, Math.min(100, Math.round((day.sleepHours / 10) * 100)));
                    return (
                      <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                          {day.sleepHours > 0 ? `${day.sleepHours}h` : '-'}
                        </span>
                        <div className="w-full max-w-[28px] h-24 rounded-lg bg-indigo-500/10 flex items-end overflow-hidden">
                          <div
                            className="w-full bg-indigo-500 rounded-lg transition-all duration-300"
                            style={{ height: `${day.sleepHours > 0 ? pct : 6}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-500">{day.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-neutral-950 p-4 border border-black/[0.05] dark:border-white/10">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  {hl.trendWater}
                </h4>
                <div className="h-32 flex items-end justify-between gap-2 pt-3">
                  {last7Days.map((day) => {
                    const pct = Math.max(8, Math.min(100, Math.round((day.waterMl / store.waterGoalMl) * 100)));
                    return (
                      <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
                          {day.waterMl > 0 ? `${day.waterMl}` : '-'}
                        </span>
                        <div className="w-full max-w-[28px] h-20 rounded-lg bg-sky-500/10 flex items-end overflow-hidden">
                          <div
                            className="w-full bg-sky-500 rounded-lg transition-all duration-300"
                            style={{ height: `${day.waterMl > 0 ? pct : 6}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-500">{day.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
