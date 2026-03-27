import { create } from "zustand";
import { autoRevealSafeCells } from "../../engine/assist";
import { createBoard, placeMines } from "../../engine/board";
import { toggleFlag } from "../../engine/flag";
import { chordReveal, revealCell } from "../../engine/reveal";
import type { Board, EngineEvent } from "../../engine/types";
import { eventBus } from "../../meta/events";
import { performPrestige } from "../../meta/prestige";
import { computeScrapReward } from "../../meta/scrap";
import type { Currencies, RunStats, UpgradeState } from "../../meta/types";
import { createDefaultRunStats } from "../../meta/types";
import { BOARD_SIZE_LEVELS, getUpgradeCost, UPGRADES } from "../../meta/upgrades";
import { loadGame } from "../../storage/load";
import { deleteSave } from "../../storage/save";

// store is the bridge between the pure engine functions and the react UI
// holds all game state and exposes actions that call engine functions, update state, and emit events for the meta layer
interface GameStore {
  // engine state
  board: Board;
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
  buyUpgrade: (upgradeId: string) => void;
  prestige: () => void;
  hardReset: () => void;
}

// generate a random seed for each new game
function randomSeed(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback to Date.now() if crypto.randomUUID is not available
  return `seed-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// looks up the board dimensions for the current board_size upgrade level
function getBoardConfig(upgrades: UpgradeState) {
  const level = upgrades.board_size ?? 0;
  const clamped = Math.min(level, BOARD_SIZE_LEVELS.length - 1);
  return BOARD_SIZE_LEVELS[clamped];
}

// computes starting scrap from the "supply cache" intel upgrade
function getStartingScrap(upgrades: UpgradeState): number {
  const level = upgrades.intel_starting_scrap ?? 0;
  return level * 50; // 50 scrap per level
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

// creates a fresh board based on current upgrade levels
function createBoardFromUpgrades(upgrades: UpgradeState): Board {
  const config = getBoardConfig(upgrades);
  return createBoard(config.rows, config.cols, config.mines, randomSeed());
}

// tries to load from localStorage, returns defaults if no save exists
function loadInitialState() {
  const save = loadGame();
  if (save) {
    return {
      currencies: save.currencies,
      upgrades: save.upgrades,
      prestigeCount: save.prestigeCount,
    };
  }
  return {
    currencies: { scrap: 0, lifetimeScrap: 0, intel: 0, totalIntelEarned: 0 } as Currencies,
    upgrades: {} as UpgradeState,
    prestigeCount: 0,
  };
}

const initial = loadInitialState();

export const useGameStore = create<GameStore>((set, get) => ({
  // engine state
  board: createBoardFromUpgrades(initial.upgrades),
  startTimeMs: null,
  endTimeMs: null,
  flagMode: false,

  // meta state
  currencies: initial.currencies,
  upgrades: initial.upgrades,
  currentRun: createDefaultRunStats(),
  prestigeCount: initial.prestigeCount,

  reveal: (row, col) => {
    const { board, currencies, upgrades, currentRun } = get();
    if (board.status !== "playing") return;

    let currentBoard = board;

    if (!currentBoard.firstClickDone) {
      currentBoard = placeMines(currentBoard, row, col);
      set({ startTimeMs: Date.now() });

      // apply "starting_reveals" (recon drone) upgrade
      const startingRevealsLevel = upgrades.starting_reveals ?? 0;
      if (startingRevealsLevel > 0) {
        const count = 3 + (startingRevealsLevel - 1) * 2;
        const autoResult = autoRevealSafeCells(currentBoard, count);
        currentBoard = autoResult.board;

        // process auto-reveal events for scrap
        const autoMeta = processEvents(
          autoResult.events,
          autoResult.board,
          currencies,
          upgrades,
          currentRun,
        );
        // update currencies/run before the player's actual click
        set({
          currencies: autoMeta.currencies,
          currentRun: autoMeta.currentRun,
        });
      }
    }

    const result = revealCell(currentBoard, row, col);
    const endTimeMs = result.board.status !== "playing" ? Date.now() : get().endTimeMs;

    // re-read currencies / currentRun in case starting reveals updated them
    const meta = processEvents(
      result.events,
      result.board,
      get().currencies,
      upgrades,
      get().currentRun,
    );

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

  newGame: () => {
    const { upgrades } = get();
    set({
      board: createBoardFromUpgrades(upgrades),
      startTimeMs: null,
      endTimeMs: null,
      flagMode: false,
      currentRun: createDefaultRunStats(),
    });
  },

  toggleFlagMode: () => {
    set((state) => ({ flagMode: !state.flagMode }));
  },

  buyUpgrade: (upgradeId) => {
    const { currencies, upgrades } = get();
    const def = UPGRADES.find((u) => u.id === upgradeId);
    if (!def) return;

    const currentLevel = upgrades[upgradeId] ?? 0;
    if (currentLevel >= def.maxLevel) return; // already maxed

    // check affordability
    const cost = getUpgradeCost(def, currentLevel, upgrades);
    if (def.currency === "scrap" && currencies.scrap < cost) return;
    if (def.currency === "intel" && currencies.intel < cost) return;

    // deduct cost
    const newCurrencies = { ...currencies };
    if (def.currency === "scrap") {
      newCurrencies.scrap -= cost;
    } else {
      newCurrencies.intel -= cost;
    }

    // increase upgrade level
    const newUpgrades = { ...upgrades, [upgradeId]: currentLevel + 1 };

    set({ currencies: newCurrencies, upgrades: newUpgrades });

    // if board_size was upgraded, the next game will use the new size
    // so we don't resize the current board midgame
  },

  prestige: () => {
    const { currencies, upgrades, prestigeCount } = get();
    const result = performPrestige(currencies, upgrades, prestigeCount);

    // if prestige didn't happen, do nothing
    if (result.prestigeCount === prestigeCount) return;

    // apply starting scrap from supply cache intel upgrade
    const startingScrap = getStartingScrap(result.upgrades);
    result.currencies.scrap = startingScrap;

    set({
      currencies: result.currencies,
      upgrades: result.upgrades,
      prestigeCount: result.prestigeCount,
      // start a fresh board with the new upgrade set
      board: createBoardFromUpgrades(result.upgrades),
      startTimeMs: null,
      endTimeMs: null,
      flagMode: false,
      currentRun: createDefaultRunStats(),
    });
  },

  hardReset: () => {
    deleteSave();
    set({
      board: createBoardFromUpgrades({}),
      startTimeMs: null,
      endTimeMs: null,
      flagMode: false,
      currencies: { scrap: 0, lifetimeScrap: 0, intel: 0, totalIntelEarned: 0 },
      upgrades: {},
      currentRun: createDefaultRunStats(),
      prestigeCount: 0,
    });
  },
}));
