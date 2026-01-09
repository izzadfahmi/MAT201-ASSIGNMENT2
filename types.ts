export interface ChartPoint {
  val: number;
  funcVal: number;
  tangentVal: number | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface DerivativeData {
  value: number;
  symbolic: string;
}
