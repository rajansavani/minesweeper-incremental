import { describe, expect, it } from "vitest";
import { createBoard, getNeighbors, placeMines } from "../board";

describe("createBoard", () => {
  it("returns correct dimensions", () => {
    const board = createBoard(9, 9, 10, "test-seed");
    expect(board.rows).toBe(9);
    expect(board.cols).toBe(9);
    expect(board.cells.length).toBe(9);
    expect(board.cells[0].length).toBe(9);
  });

  it("starts with all cells hidden", () => {
    const board = createBoard(9, 9, 10, "test-seed");
    for (const row of board.cells) {
      for (const cell of row) {
        expect(cell.state).toBe("hidden");
        expect(cell.isMine).toBe(false);
      }
    }
  });

  it("has no mines placed yet (firstClickDone = false)", () => {
    const board = createBoard(9, 9, 10, "test-seed");
    expect(board.firstClickDone).toBe(false);
    const mineCount = board.cells.flat().filter((c) => c.isMine).length;
    expect(mineCount).toBe(0);
  });

  it("starts in playing status with zero counts", () => {
    const board = createBoard(16, 16, 40, "seed");
    expect(board.status).toBe("playing");
    expect(board.revealedCount).toBe(0);
    expect(board.flaggedCount).toBe(0);
  });
});

describe("placeMines", () => {
  it("places the correct number of mines", () => {
    const board = createBoard(9, 9, 10, "seed-a");
    const withMines = placeMines(board, 4, 4);
    const mineCount = withMines.cells.flat().filter((c) => c.isMine).length;
    expect(mineCount).toBe(10);
  });

  it("marks firstClickDone as true", () => {
    const board = createBoard(9, 9, 10, "seed-b");
    const withMines = placeMines(board, 0, 0);
    expect(withMines.firstClickDone).toBe(true);
  });

  it("same seed produces same mine positions", () => {
    const board1 = placeMines(createBoard(9, 9, 10, "same-seed"), 4, 4);
    const board2 = placeMines(createBoard(9, 9, 10, "same-seed"), 4, 4);

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(board1.cells[r][c].isMine).toBe(board2.cells[r][c].isMine);
      }
    }
  });

  it("different seed produces different mine positions", () => {
    const board1 = placeMines(createBoard(9, 9, 10, "seed-one"), 4, 4);
    const board2 = placeMines(createBoard(9, 9, 10, "seed-two"), 4, 4);

    // collect mine positions as strings for easy comparison
    const mines1 = board1.cells
      .flat()
      .filter((c) => c.isMine)
      .map((c) => `${c.row},${c.col}`)
      .sort();
    const mines2 = board2.cells
      .flat()
      .filter((c) => c.isMine)
      .map((c) => `${c.row},${c.col}`)
      .sort();

    expect(mines1).not.toEqual(mines2);
  });

  it("first click and all 8 neighbors are safe", () => {
    // test with a center click where all 8 neighbors exist
    const board = createBoard(9, 9, 10, "safety-test");
    const withMines = placeMines(board, 4, 4);

    // the clicked cell must be safe
    expect(withMines.cells[4][4].isMine).toBe(false);

    // all neighbors of the clicked cell must be safe
    const neighbors = getNeighbors(4, 4, 9, 9);
    for (const n of neighbors) {
      expect(withMines.cells[n.row][n.col].isMine).toBe(false);
    }
  });

  it("first click safety works in a corner (fewer neighbors)", () => {
    const board = createBoard(9, 9, 10, "corner-test");
    const withMines = placeMines(board, 0, 0);

    // corner cell + its 3 neighbors must be safe
    expect(withMines.cells[0][0].isMine).toBe(false);
    expect(withMines.cells[0][1].isMine).toBe(false);
    expect(withMines.cells[1][0].isMine).toBe(false);
    expect(withMines.cells[1][1].isMine).toBe(false);
  });

  it("computes adjacency counts correctly", () => {
    const board = createBoard(9, 9, 10, "adj-test");
    const withMines = placeMines(board, 4, 4);

    // for every non-mine cell, manually count mine neighbors and compare
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (withMines.cells[r][c].isMine) continue;
        const neighbors = getNeighbors(r, c, 9, 9);
        const expected = neighbors.filter((n) => withMines.cells[n.row][n.col].isMine).length;
        expect(withMines.cells[r][c].adjacentMines).toBe(expected);
      }
    }
  });

  it("does not mutate the original board", () => {
    const board = createBoard(9, 9, 10, "immutable-test");
    const minesBefore = board.cells.flat().filter((c) => c.isMine).length;
    placeMines(board, 4, 4);
    const minesAfter = board.cells.flat().filter((c) => c.isMine).length;
    expect(minesAfter).toBe(minesBefore); // still 0
    expect(board.firstClickDone).toBe(false);
  });
});
