import { create } from "zustand";
import { createBoard, placeMines } from "../../engine/board";
import { BOARD_PRESETS, DEFAULT_PRESET } from "../../engine/constants";
import { toggleFlag } from "../../engine/flag";
import { chordReveal, revealCell } from "../../engine/reveal";
import type { Board } from "../../engine/types";

// store is the bridge between the pure engine functions and the react UI
// holds all game state and exposes actions that call engine functions, update state, and emit events for the meta layer
interface GameStore {
  // state
  board: Board;
  presetName: string;
  startTimeMs: number | null; // null until the first click
  endTimeMs: number | null; // null until game over
  flagMode: boolean; // mobile: if true, tapping a cell toggles flag instead of revealing

  // actions
  reveal: (row: number, col: number) => void;
  flag: (row: number, col: number) => void;
  chord: (row: number, col: number) => void;
  newGame: (presetName?: string) => void;
  toggleFlagMode: () => void;
}

// generate a random seed for each new game
function randomSeed(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback to Date.now() if crypto.randomUUID is not available
  return `seed-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const useGameStore = create<GameStore>((set, get) => ({
  board: createBoard(DEFAULT_PRESET.rows, DEFAULT_PRESET.cols, DEFAULT_PRESET.mines, randomSeed()),
  presetName: "intermediate",
  startTimeMs: null,
  endTimeMs: null,
  flagMode: false,

  reveal: (row, col) => {
    const { board } = get();
    if (board.status !== "playing") return;

    let currentBoard = board;

    // on first click place mines (guaranteeing this cell is safe), then start the timer
    if (!currentBoard.firstClickDone) {
      currentBoard = placeMines(currentBoard, row, col);
      set({ startTimeMs: Date.now() });
    }

    const result = revealCell(currentBoard, row, col);

    // if the game just ended, record the end time
    const endTimeMs = result.board.status !== "playing" ? Date.now() : get().endTimeMs;

    set({ board: result.board, endTimeMs });

    // TODO: emit events to the meta layer for scrap earning
    void result.events;
  },

  flag: (row, col) => {
    const { board } = get();
    if (board.status !== "playing") return;
    // can't flag before first click (no mines to flag yet)
    if (!board.firstClickDone) return;

    const result = toggleFlag(board, row, col);
    set({ board: result.board });

    // TODO: emit flag events
    void result.events;
  },

  chord: (row, col) => {
    const { board } = get();
    if (board.status !== "playing") return;

    const result = chordReveal(board, row, col);
    const endTimeMs = result.board.status !== "playing" ? Date.now() : get().endTimeMs;
    set({ board: result.board, endTimeMs });

    void result.events;
  },

  newGame: (presetName) => {
    const name = presetName ?? get().presetName;
    const preset = BOARD_PRESETS[name] ?? DEFAULT_PRESET;
    set({
      board: createBoard(preset.rows, preset.cols, preset.mines, randomSeed()),
      presetName: name,
      startTimeMs: null,
      endTimeMs: null,
      flagMode: false,
    });
  },

  toggleFlagMode: () => {
    set((state) => ({ flagMode: !state.flagMode }));
  },
}));
