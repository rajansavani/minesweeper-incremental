import { describe, expect, it, vi } from "vitest";
import { createEventBus } from "../events";

describe("EventBus", () => {
  it("calls subscriber when matching event is emitted", () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.subscribe("CELL_REVEALED", handler);
    bus.emit({ type: "CELL_REVEALED", row: 0, col: 0, adjacentMines: 2 });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({
      type: "CELL_REVEALED",
      row: 0,
      col: 0,
      adjacentMines: 2,
    });
  });

  it("does not call subscriber for non-matching event types", () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.subscribe("BOARD_WON", handler);
    bus.emit({ type: "CELL_REVEALED", row: 0, col: 0, adjacentMines: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it("supports multiple subscribers for the same event", () => {
    const bus = createEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.subscribe("FLOOD_FILL", handler1);
    bus.subscribe("FLOOD_FILL", handler2);
    bus.emit({ type: "FLOOD_FILL", cellsRevealed: 10 });

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it("unsubscribe removes a specific listener", () => {
    const bus = createEventBus();
    const handler = vi.fn();

    bus.subscribe("FLAG_PLACED", handler);
    bus.unsubscribe("FLAG_PLACED", handler);
    bus.emit({ type: "FLAG_PLACED", row: 1, col: 1 });

    expect(handler).not.toHaveBeenCalled();
  });

  it("clear removes all listeners", () => {
    const bus = createEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    bus.subscribe("CELL_REVEALED", handler1);
    bus.subscribe("BOARD_LOST", handler2);
    bus.clear();

    bus.emit({ type: "CELL_REVEALED", row: 0, col: 0, adjacentMines: 0 });
    bus.emit({ type: "BOARD_LOST", row: 0, col: 0 });

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });

  it("emitting with no subscribers does not throw", () => {
    const bus = createEventBus();
    // should not throw
    expect(() => {
      bus.emit({ type: "BOARD_LOST", row: 0, col: 0 });
    }).not.toThrow();
  });
});
