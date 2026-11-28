export type CountdownCategory =
  | 'anniversary'
  | 'exam'
  | 'birthday'
  | 'holiday'
  | 'life';

export interface CountdownItem {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  category: CountdownCategory;
  isPinned: boolean;
  notes?: string;
  repeatMode: 'none' | 'yearly' | 'monthly';
  createdAt: number;
}
