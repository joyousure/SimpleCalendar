import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Language } from '../types/calendar';
import {
  MajorMacroGroup,
  MajorMacroMatrixDataset,
  MajorMacroRow,
  evaluateMajorMacroRow,
  fetchLiveMajorMacroMatrix,
  loadCachedMajorMacroMatrix,
} from '../utils/financeService';
import { isChineseLocale, isRtlLanguage } from '../utils/i18n';
import { BACK_PRIORITY, useSystemBackLayer } from '../utils/systemBack';
import { MajorMacroDetailModal } from './MajorMacroDetailModal';

interface MajorMacroMatrixModalProps {
  open: boolean;
  language: Language;
  onClose: () => void;
}

const LIGHT_HEATMAP_BINS = [
  { bg: '#2B7BC4', text: '#FFFFFF' }, // 0: weakest
  { bg: '#4E97D8', text: '#FFFFFF' }, // 1
  { bg: '#7FB9EA', text: '#0F172A' }, // 2
  { bg: '#AED5F2', text: '#0F172A' }, // 3
  { bg: '#DCEBF6', text: '#1E293B' }, // 4
  { bg: '#F4ECE2', text: '#1E293B' }, // 5
  { bg: '#F6CAC6', text: '#1E293B' }, // 6
  { bg: '#EE9997', text: '#1E293B' }, // 7
  { bg: '#E3696B', text: '#FFFFFF' }, // 8
  { bg: '#D5484E', text: '#FFFFFF' }, // 9: strongest
];

const DARK_HEATMAP_BINS = [
  { bg: '#1E40AF', text: '#F8FAFC' }, // 0: weakest
  { bg: '#2563EB', text: '#FFFFFF' }, // 1
  { bg: '#1D4ED8', text: '#E2E8F0' }, // 2
  { bg: '#1E3A5F', text: '#E2E8F0' }, // 3
  { bg: '#1E293B', text: '#E2E8F0' }, // 4
  { bg: '#282321', text: '#E2E8F0' }, // 5
  { bg: '#5A2125', text: '#F8FAFC' }, // 6
  { bg: '#882228', text: '#F8FAFC' }, // 7
  { bg: '#B91C1C', text: '#FFFFFF' }, // 8
  { bg: '#DC2626', text: '#FFFFFF' }, // 9: strongest
];

function useReactiveDarkTheme(): boolean {
  const detect = () => {
    if (typeof document === 'undefined') return false;
    const root = document.documentElement;
    if (root.classList.contains('dark') || root.classList.contains('amoled-mode')) {
      return true;
    }
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  };

  const [isDark, setIsDark] = useState<boolean>(detect);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const update = () => setIsDark(detect());
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', update);

    return () => {
      observer.disconnect();
      mq?.removeEventListener?.('change', update);
    };
  }, []);

  return isDark;
}

function computeRowBinIndices(row: MajorMacroRow): number[] {
  const vals = row.values;
  const mean = vals.reduce((s, v) => s + v, 0) / Math.max(1, vals.length);
  const variance = vals.reduce((s, v) => s + (v - mean) * (v - mean), 0) / Math.max(1, vals.length);
  const std = Math.sqrt(variance);
  const maxAbsDev = Math.max(...vals.map((v) => Math.abs(v - mean)), std * 1.4, 0.05);
  const scale = Math.max(std * 1.75, maxAbsDev * 0.92, 0.05);

  return vals.map((val) => {
    let z = (val - mean) / scale;
    if (row.invertColor) z = -z;
    const clamped = Math.max(-1, Math.min(1, z));
    const idx = Math.round(((clamped + 1) / 2) * (LIGHT_HEATMAP_BINS.length - 1));
    return Math.max(0, Math.min(LIGHT_HEATMAP_BINS.length - 1, idx));
  });
}

function formatMatrixCell(val: number, row: MajorMacroRow): string {
  const sign = row.signed && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(row.decimals)}`;
}

export const MajorMacroMatrixModal: React.FC<MajorMacroMatrixModalProps> = ({
  open,
  language,
  onClose,
}) => {
  const isRtl = isRtlLanguage(language);
  const isZh = isChineseLocale(language);
  const isDark = useReactiveDarkTheme();
  const palette = isDark ? DARK_HEATMAP_BINS : LIGHT_HEATMAP_BINS;

  const [dataset, setDataset] = useState<MajorMacroMatrixDataset>(() =>
    loadCachedMajorMacroMatrix()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [detailRowId, setDetailRowId] = useState<string | null>(null);
  const lastTapRef = useRef<{ rowId: string; ts: number }>({ rowId: '', ts: 0 });

  const syncMatrix = useCallback(async (forceRefresh: boolean = false) => {
    setIsSyncing(true);
    try {
      const updated = await fetchLiveMajorMacroMatrix(forceRefresh);
      setDataset(updated);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setDetailRowId(null);
      return;
    }
    setDataset(loadCachedMajorMacroMatrix());
    syncMatrix(true);
  }, [open, syncMatrix]);

  useEffect(() => {
    const onAppSync = () => {
      setDataset(loadCachedMajorMacroMatrix());
    };
    window.addEventListener('app-live-sync', onAppSync);
    return () => window.removeEventListener('app-live-sync', onAppSync);
  }, []);

  useSystemBackLayer(
    open && !detailRowId,
    onClose,
    BACK_PRIORITY.NESTED_MODAL,
    'major-macro-matrix-modal'
  );

  const selectedContext = useMemo<{
    group: MajorMacroGroup;
    row: MajorMacroRow;
    evalData: ReturnType<typeof evaluateMajorMacroRow>;
  } | null>(() => {
    if (!selectedRowId) return null;
    for (const grp of dataset.groups) {
      const hit = grp.rows.find((r) => r.id === selectedRowId);
      if (hit) {
        return {
          group: grp,
          row: hit,
          evalData: evaluateMajorMacroRow(hit, grp, language),
        };
      }
    }
    return null;
  }, [selectedRowId, dataset.groups, language]);

  const detailContext = useMemo<{
    group: MajorMacroGroup;
    row: MajorMacroRow;
  } | null>(() => {
    if (!detailRowId) return null;
    for (const grp of dataset.groups) {
      const hit = grp.rows.find((r) => r.id === detailRowId);
      if (hit) {
        return { group: grp, row: hit };
      }
    }
    return null;
  }, [detailRowId, dataset.groups]);

  if (!open) return null;

  const highlightIdx = dataset.highlightColIndex;
  const titleText =
    language === 'zh-TW'
      ? '主要宏觀經濟指標'
      : isZh
      ? '主要宏观经济指标'
      : 'Major Macro Economic Indicators';

  const openDetailForRow = (rowId: string) => {
    setSelectedRowId(rowId);
    setDetailRowId(rowId);
  };

  const handleRowClick = (rowId: string) => {
    const now = Date.now();
    if (lastTapRef.current.rowId === rowId && now - lastTapRef.current.ts <= 340) {
      lastTapRef.current = { rowId: '', ts: 0 };
      openDetailForRow(rowId);
      return;
    }
    lastTapRef.current = { rowId, ts: now };
    setSelectedRowId((prev) => (prev === rowId ? null : rowId));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 pt-[max(0.35rem,env(safe-area-inset-top))] pb-[max(0.35rem,env(safe-area-inset-bottom))] bg-black/55 backdrop-blur-md select-none animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={titleText}
        className="econ-modal-cq w-full max-w-6xl max-h-[calc(100dvh-0.7rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col justify-between overflow-hidden rounded-[22px] bg-white/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black backdrop-blur-2xl border border-neutral-200/85 dark:border-neutral-800 [.amoled-mode_&]:border-white/15 shadow-2xl p-2 sm:p-3.5 [@media(max-height:560px)]:p-2 gap-1 sm:gap-1.5 [@media(max-height:560px)]:gap-1 animate-modal-sheet"
      >
        {/* Top Compact Header Band */}
        <div className="shrink-0 flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h2 className="text-sm sm:text-base [@media(max-height:560px)]:text-xs font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 leading-none">
                {titleText}
              </h2>
              <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                {isZh ? '近一年月度景气矩阵 (13个月)' : 'Trailing 1-Year Heatmap'}
              </span>
              <span className="text-[9.5px] sm:text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                {dataset.sourceLine}
                {dataset.syncedAt
                  ? ` · ${isZh ? '已同步' : 'Synced'} ${dataset.syncedAt}`
                  : ''}
              </span>
            </div>

            <div className="text-[10.5px] sm:text-xs [@media(max-height:560px)]:text-[10px] font-semibold text-neutral-700 dark:text-neutral-200 leading-tight truncate">
              {dataset.headlineNote}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => syncMatrix(true)}
              disabled={isSyncing}
              title={isZh ? '实时同步最新官方数据' : 'Sync Live Macro Data'}
              aria-label={isZh ? '实时同步最新官方数据' : 'Sync Live Macro Data'}
              className="w-8 h-8 [@media(max-height:560px)]:w-7 [@media(max-height:560px)]:h-7 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 [@media(max-height:560px)]:w-7 [@media(max-height:560px)]:h-7 rounded-full flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ultra-Compact Single-Viewport Matrix Table */}
        <div className="econ-chart-cq flex-1 min-h-0 overflow-auto overscroll-contain rounded-xl border border-neutral-200/80 dark:border-neutral-800 [.amoled-mode_&]:border-white/12 bg-neutral-50/75 dark:bg-neutral-950/60 [.amoled-mode_&]:bg-black">
          <table className="econ-matrix-table w-full min-w-[500px] sm:min-w-0 border-separate border-spacing-[1px] sm:border-spacing-[1.5px] text-[9.5px] sm:text-[10.5px] [@media(max-height:560px)]:text-[9px] leading-tight">
            <thead className="sticky top-0 z-20 bg-neutral-100/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black backdrop-blur-md">
              {/* Row 1: Year Grouping */}
              <tr>
                <th
                  colSpan={2}
                  className="sticky start-0 z-30 bg-neutral-100/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black px-1.5 py-0.5 text-start font-semibold text-neutral-500 dark:text-neutral-400"
                >
                  {isZh ? '板块 · 核心指标' : 'Sector · Indicator'}
                </th>
                {dataset.yearGroups.map((yg) => (
                  <th
                    key={yg.year}
                    colSpan={yg.colSpan}
                    className="px-0.5 py-0.5 text-center font-bold text-neutral-700 dark:text-neutral-200 border-b border-neutral-300/70 dark:border-neutral-700"
                  >
                    {yg.year}
                  </th>
                ))}
                <th className="px-1.5 py-0.5 text-center font-bold text-neutral-700 dark:text-neutral-200 whitespace-nowrap">
                  {isZh ? '较上月' : 'MoM'}
                </th>
              </tr>

              {/* Row 2: Trailing 1-Year Month Headers */}
              <tr>
                <th className="sticky start-0 z-30 bg-neutral-100/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black px-1 py-0.5 [@media(max-height:560px)]:py-[1px] text-start text-[9.5px] font-medium text-neutral-500 dark:text-neutral-400 w-[52px] min-w-[52px] max-w-[52px] sm:w-[74px] sm:min-w-[74px] sm:max-w-[74px]">
                  {isZh ? '口径' : 'Type'}
                </th>
                <th className="sticky start-[52px] sm:start-[74px] z-30 bg-neutral-100/95 dark:bg-neutral-900/95 [.amoled-mode_&]:bg-black px-1.5 py-0.5 [@media(max-height:560px)]:py-[1px] text-start text-[9.5px] font-medium text-neutral-500 dark:text-neutral-400 min-w-[84px] sm:min-w-[106px]">
                  {isZh ? '指标名称' : 'Metric'}
                </th>
                {dataset.columns.map((col, colIdx) => {
                  const isHighlighted = colIdx === highlightIdx;
                  return (
                    <th
                      key={`${col}-${colIdx}`}
                      className={`px-0.5 py-0.5 [@media(max-height:560px)]:py-[1px] text-center font-bold whitespace-nowrap tabular-nums ${
                        isHighlighted
                          ? 'text-rose-600 dark:text-rose-400 border-t-2 border-x-2 border-rose-500/80 rounded-t bg-rose-500/8'
                          : 'text-neutral-700 dark:text-neutral-200'
                      }`}
                    >
                      {col}
                    </th>
                  );
                })}
                <th className="px-1.5 py-0.5 [@media(max-height:560px)]:py-[1px] text-center text-[9.5px] font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                  {isZh ? '变动 / 极值' : 'Delta'}
                </th>
              </tr>
            </thead>

            <tbody>
              {dataset.groups.map((group, grpIdx) => {
                const isLastGroup = grpIdx === dataset.groups.length - 1;
                return group.rows.map((row, rowIdx) => {
                  const bins = computeRowBinIndices(row);
                  const isFirstInGroup = rowIdx === 0;
                  const isLastRowOverall = isLastGroup && rowIdx === group.rows.length - 1;
                  const isRowSelected = selectedRowId === row.id;
                  const momUp = row.momDelta > 0;
                  const momAbs = Math.abs(row.momDelta).toFixed(row.decimals);
                  const isLiveRow = dataset.liveSyncedRowIds.includes(row.id);

                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleRowClick(row.id)}
                      onDoubleClick={() => openDetailForRow(row.id)}
                      className={`cursor-pointer transition-colors ${
                        isRowSelected
                          ? 'bg-indigo-500/10 dark:bg-indigo-500/15'
                          : 'hover:bg-neutral-200/40 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Grouped Left Sector Badge */}
                      {isFirstInGroup && (
                        <td
                          rowSpan={group.rows.length}
                          className={`sticky start-0 z-10 bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-black px-1 py-0.5 align-middle w-[52px] min-w-[52px] max-w-[52px] sm:w-[74px] sm:min-w-[74px] sm:max-w-[74px] border-s-[3px] ${
                            grpIdx > 0
                              ? 'border-t border-t-neutral-200/85 dark:border-t-neutral-800'
                              : ''
                          }`}
                          style={{ borderInlineStartColor: group.accentHex }}
                        >
                          <div className="flex flex-col leading-tight overflow-hidden">
                            <span
                              className="text-[10px] sm:text-[10.5px] [@media(max-height:560px)]:text-[9.5px] font-extrabold truncate"
                              style={{ color: group.accentHex }}
                            >
                              {group.title}
                            </span>
                            <span className="text-[8.5px] [@media(max-height:560px)]:text-[8px] font-medium text-neutral-400 dark:text-neutral-500 truncate">
                              {group.cadence}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Sticky Indicator Name */}
                      <td
                        className={`sticky start-[52px] sm:start-[74px] z-10 bg-white dark:bg-neutral-900 [.amoled-mode_&]:bg-black px-1.5 py-[2px] sm:py-[3px] [@media(max-height:560px)]:py-[1px] text-neutral-900 dark:text-neutral-100 font-semibold whitespace-nowrap ${
                          isFirstInGroup && grpIdx > 0
                            ? 'border-t border-neutral-200/85 dark:border-neutral-800'
                            : ''
                        } ${isRowSelected ? 'text-indigo-700 dark:text-indigo-300 font-bold' : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="truncate">{row.name}</span>
                          {isLiveRow && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                              title={isZh ? '实时官方接口同步' : 'Live Synced'}
                            />
                          )}
                        </div>
                      </td>

                      {/* 12 Monthly Heatmap Value Cells */}
                      {row.values.map((val, colIdx) => {
                        const bin = palette[bins[colIdx]] || palette[4];
                        const isHighlighted = colIdx === highlightIdx;
                        return (
                          <td
                            key={`${row.id}-${colIdx}`}
                            className={`text-center font-mono font-semibold tabular-nums px-0.5 py-[2.5px] sm:py-[3.5px] [@media(max-height:560px)]:py-[1px] whitespace-nowrap ${
                              isHighlighted
                                ? `border-x-2 border-rose-500/80 ${
                                    isLastRowOverall ? 'border-b-2 rounded-b' : ''
                                  }`
                                : 'rounded-[3px]'
                            }`}
                            style={{
                              backgroundColor: bin.bg,
                              color: bin.text,
                            }}
                          >
                            {formatMatrixCell(val, row)}
                          </td>
                        );
                      })}

                      {/* MoM Delta & 1-Year High/Low Tag */}
                      <td
                        className={`px-1.5 py-[2px] [@media(max-height:560px)]:py-[1px] whitespace-nowrap ${
                          isFirstInGroup && grpIdx > 0
                            ? 'border-t border-neutral-200/85 dark:border-t-neutral-800'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 font-mono font-bold tabular-nums">
                          <span
                            className={
                              momUp
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {momUp ? '▲' : '▼'}
                            {momAbs}
                          </span>
                          {row.badge === 'low' && (
                            <span className="px-1 py-[1px] rounded-[3px] bg-[#1673B1] text-white text-[8.5px] sm:text-[9px] font-sans font-bold leading-none">
                              新低
                            </span>
                          )}
                          {row.badge === 'high' && (
                            <span className="px-1 py-[1px] rounded-[3px] bg-[#D64548] text-white text-[8.5px] sm:text-[9px] font-sans font-bold leading-none">
                              新高
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>

        {/* Fixed-Height In-Place Analytical Evaluation Bar + Color Ramp Legend */}
        <div className="shrink-0 space-y-1">
          <div className="rounded-xl bg-neutral-100/90 dark:bg-neutral-800/80 [.amoled-mode_&]:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-700/70 px-2.5 py-1.5 [@media(max-height:560px)]:py-1 flex items-center justify-between gap-2 text-[10.5px] sm:text-[11px] [@media(max-height:560px)]:text-[10px]">
            {selectedContext ? (
              <>
                <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 leading-snug">
                  <span
                    className="font-extrabold shrink-0"
                    style={{ color: selectedContext.group.accentHex }}
                  >
                    {selectedContext.group.title} · {selectedContext.row.name}
                  </span>
                  <span className="font-mono tabular-nums text-[10px] text-neutral-500 dark:text-neutral-400 shrink-0">
                    均值 {selectedContext.evalData.mean.toFixed(1)} · 高{' '}
                    {formatMatrixCell(selectedContext.evalData.high, selectedContext.row)} · 低{' '}
                    {formatMatrixCell(selectedContext.evalData.low, selectedContext.row)} ·{' '}
                    {selectedContext.evalData.positionLabel}
                  </span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-medium truncate sm:whitespace-normal">
                    {selectedContext.evalData.commentary}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRowId(null)}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-[10px] font-semibold border border-neutral-200 dark:border-neutral-600 shrink-0 cursor-pointer"
                >
                  {isZh ? '总评' : 'All'}
                </button>
              </>
            ) : (
              <div className="min-w-0 flex-1 flex items-center justify-between gap-2 leading-snug">
                <span className="text-neutral-800 dark:text-neutral-100 font-medium truncate sm:whitespace-normal">
                  {dataset.regimeSummary}
                </span>
                <span className="hidden md:inline text-[10px] text-neutral-500 dark:text-neutral-400 shrink-0">
                  {isZh ? '单击选中 · 双击指标弹出分析' : 'Click select · Double-click analyze'}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Legend & Statistical Conventions */}
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[9.5px] sm:text-[10.5px] [@media(max-height:560px)]:text-[9px] text-neutral-500 dark:text-neutral-400">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span className="font-semibold text-sky-600 dark:text-sky-400 shrink-0">偏弱</span>
              <div className="flex items-center gap-[1.5px] shrink-0">
                {palette.map((bin, idx) => (
                  <span
                    key={idx}
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] inline-block"
                    style={{ backgroundColor: bin.bg }}
                  />
                ))}
              </div>
              <span className="font-semibold text-rose-600 dark:text-rose-400 shrink-0">偏强</span>
              <span className="ms-1 text-[9px] sm:text-[10px] truncate">
                {dataset.ruleNote}
              </span>
            </div>

            <div className="flex items-center gap-2 font-medium shrink-0">
              <span>新高/新低=近一年(13个月)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Double-Click Deep-Dive Analysis Modal */}
      <MajorMacroDetailModal
        open={Boolean(detailContext)}
        row={detailContext?.row || null}
        group={detailContext?.group || null}
        dataset={dataset}
        language={language}
        onCloseAll={() => {
          setDetailRowId(null);
          onClose();
        }}
      />
    </div>
  );
};
