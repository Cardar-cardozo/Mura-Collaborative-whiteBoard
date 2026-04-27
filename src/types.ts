export interface Note {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  rotation: number;
  isLocked?: boolean;
}

export interface Participant {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  dashArray?: string;
}
