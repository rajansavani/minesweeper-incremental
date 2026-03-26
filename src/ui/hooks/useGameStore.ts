import { create } from "zustand";
import { createBoard, placeMines } from "../../engine/board";
import { BOARD_PRESETS, DEFAULT_PRESET } from "../../engine/constants";
import { toggleFlag } from "../../engine/flag";
import { chordReveal, revealCell } from "../../engine/reveal";
import type { Board, EngineEvent } from "../../engine/types";
import { eventBus } from "../../meta/events";
import { computeScrapReward } from "../../meta/scrap";
import type { Currencies, RunStats, UpgradeState } from "../../meta/types";
import { createDefaultRunStats } from "../../meta/types";

// store is the bridge between the pure engine functions and the react UI
// holds all game state and exposes actions that call engine functions, update state, and emit events for the meta layer
interface GameStore {
  // engine state
  board: Board;
  presetName: string;
  startTimeMs: number | null; // null until the first click
  endTimeMs: number | null; // null until game over
  flagMode: boolean; // mobile: if true, tapping a cell toggles flag instead of revealing

  // meta state
  currencies: Currencies;
  upgrades: UpgradeState;
  currentRun: RunStats;
  prestigeCount: number;

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

// process engine events: awards scrap, updates run stats, emits to event bus
// called after every engine action and bridges the pure engine to the meta layer
function processEvents(
  events: EngineEvent[],
  board: Board,
  currencies: Currencies,
  upgrades: UpgradeState,
  currentRun: RunStats,
): { currencies: Currencies; currentRun: RunStats } {
  let newScrap = currencies.scrap;
  let newLifetimeScrap = currencies.lifetimeScrap;
  let runScrapEarned = currentRun.scrapEarned;
  let cellsRevealed = currentRun.cellsRevealed;
  let floodFillCells = currentRun.floodFillCells;
  let flagsPlaced = currentRun.flagsPlaced;
  let won = currentRun.won;

  for (const event of events) {
    // compute scrap for this event
    const reward = computeScrapReward(event, upgrades, board);
    newScrap += reward;
    newLifetimeScrap += reward;
    runScrapEarned += reward;

    // update run stats based on event type
    switch (event.type) {
      case "CELL_REVEALED":
        cellsRevealed++;
        break;
      case "FLOOD_FILL":
        cellsRevealed += event.cellsRevealed;
        floodFillCells += event.cellsRevealed;
        break;
      case "FLAG_PLACED":
        flagsPlaced++;
        break;
      case "BOARD_WON":
        won = true;
        break;
      case "BOARD_LOST":
        won = false;
        break;
    }

    // emit to the event bus so other systems (achievements, etc.) can listen
    eventBus.emit(event);
  }

  return {
    currencies: {
      ...currencies,
      scrap: newScrap,
      lifetimeScrap: newLifetimeScrap,
    },
    currentRun: {
      ...currentRun,
      cellsRevealed,
      floodFillCells,
      flagsPlaced,
      scrapEarned: runScrapEarned,
      won,
    },
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  // engine state
  board: createBoard(DEFAULT_PRESET.rows, DEFAULT_PRESET.cols, DEFAULT_PRESET.mines, randomSeed()),
  presetName: "beginner",
  startTimeMs: null,
  endTimeMs: null,
  flagMode: false,

  // meta state
  currencies: { scrap: 0, lifetimeScrap: 0, intel: 0 },
  upgrades: {},
  currentRun: createDefaultRunStats(),
  prestigeCount: 0,

  reveal: (row, col) => {
    const { board, currencies, upgrades, currentRun } = get();
    if (board.status !== "playing") return;

    let currentBoard = board;

    if (!currentBoard.firstClickDone) {
      currentBoard = placeMines(currentBoard, row, col);
      set({ startTimeMs: Date.now() });
    }

    const result = revealCell(currentBoard, row, col);
    const endTimeMs = result.board.status !== "playing" ? Date.now() : get().endTimeMs;

    const meta = processEvents(result.events, result.board, currencies, upgrades, currentRun);

    set({
      board: result.board,
      endTimeMs,
      currencies: meta.currencies,
      currentRun: meta.currentRun,
    });
  },

  flag: (row, col) => {
    const { board, currencies, upgrades, currentRun } = get();
    if (board.status !== "playing") return;
    if (!board.firstClickDone) return;

    const result = toggleFlag(board, row, col);
    const meta = processEvents(result.events, result.board, currencies, upgrades, currentRun);

    set({
      board: result.board,
      currencies: meta.currencies,
      currentRun: meta.currentRun,
    });
  },

  chord: (row, col) => {
    const { board, currencies, upgrades, currentRun } = get();
    if (board.status !== "playing") return;

    const result = chordReveal(board, row, col);
    const endTimeMs = result.board.status !== "playing" ? Date.now() : get().endTimeMs;

    const meta = processEvents(result.events, result.board, currencies, upgrades, currentRun);

    set({
      board: result.board,
      endTimeMs,
      currencies: meta.currencies,
      currentRun: meta.currentRun,
    });
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
      currentRun: createDefaultRunStats(),
    });
  },

  toggleFlagMode: () => {
    set((state) => ({ flagMode: !state.flagMode }));
  },
}));
