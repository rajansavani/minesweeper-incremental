// board presets match classic microsoft minesweeper sizes for now
export interface BoardPreset {
  name: string;
  rows: number;
  cols: number;
  mines: number;
}

export const BOARD_PRESETS: Record<string, BoardPreset> = {
  beginner: { name: "Beginner", rows: 9, cols: 9, mines: 10 },
  intermediate: { name: "Intermediate", rows: 16, cols: 16, mines: 40 },
  expert: { name: "Expert", rows: 16, cols: 30, mines: 99 },
};

// default to beginner (player can upgrade and expand their board later)
export const DEFAULT_PRESET = BOARD_PRESETS.beginner;
