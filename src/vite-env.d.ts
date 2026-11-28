/// <reference types="vite/client" />

import type { WeatherLocation, DetailedWeatherData } from './types/weather';

export interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence?: number;
}

export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  0: SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

export interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export interface AndroidExploreSpeechBridge {
  isAvailable?: () => boolean | string;
  speak?: (text: string, langTag: string, rate: number) => void;
  stopSpeak?: () => void;
  startRecognition?: (langTag: string) => void;
  stopRecognition?: () => void;
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    AndroidExploreSpeech?: AndroidExploreSpeechBridge;
    __onNativeSpeechResult?: (payload: string) => void;
    __onNativeSpeechError?: (code: string) => void;
    __onNativeSpeechEnd?: () => void;
    __onNativeTtsEnd?: (ok: boolean) => void;
  }

  interface WindowEventMap {
    'weather-updated': CustomEvent<DetailedWeatherData>;
    'location-updated': CustomEvent<WeatherLocation>;
    'holiday-cn-updated': CustomEvent<unknown>;
    'app-live-sync': CustomEvent<{ timestamp: number; utcIso: string; forceRefresh: boolean }>;
    'app-live-sync-start': CustomEvent<{ timestamp: number; utcIso: string; forceRefresh: boolean }>;
    'app-push-undo': CustomEvent<{ label?: string; restore?: () => void }>;
    'app-system-back-at-root': CustomEvent<undefined>;
    capacitorBackButton: Event;
  }
}
