export interface Photo {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
}

export type ViewMode = "table" | "grid" | "grid-small";
