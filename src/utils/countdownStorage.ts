import { CountdownItem } from '../types/countdown';

const COUNTDOWNS_KEY = 'simple_calendar_countdowns_v1';

export function loadCountdownsFromStorage(): CountdownItem[] {
  try {
    const raw = localStorage.getItem(COUNTDOWNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCountdownsToStorage(items: CountdownItem[]): void {
  try {
    localStorage.setItem(COUNTDOWNS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save countdowns', e);
  }
}
