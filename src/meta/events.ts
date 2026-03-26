import type { EngineEvent } from "../engine/types";

// use event bus publish/subscribe pattern to decouple the game engine from the meta layer (for scrap earning, achievements, etc)

type Listener = (event: EngineEvent) => void;

interface EventBus {
  emit: (event: EngineEvent) => void;
  subscribe: (eventType: EngineEvent["type"], listener: Listener) => void;
  unsubscribe: (eventType: EngineEvent["type"], listener: Listener) => void;
  clear: () => void;
}

export function createEventBus(): EventBus {
  // map of event type -> set of listener functions
  // using a Map<string, Set> so subscribe/unsubscribe are O(1)
  const listeners = new Map<EngineEvent["type"], Set<Listener>>();

  return {
    emit: (event) => {
      const set = listeners.get(event.type);
      if (!set) return;
      // iterate a copy so listeners can safely unsubscribe during emit
      for (const listener of [...set]) {
        listener(event);
      }
    },

    subscribe: (eventType, listener) => {
      if (!listeners.has(eventType)) {
        listeners.set(eventType, new Set());
      }
      listeners.get(eventType)?.add(listener);
    },

    unsubscribe: (eventType, listener) => {
      listeners.get(eventType)?.delete(listener);
    },

    // removes all listeners
    clear: () => {
      listeners.clear();
    },
  };
}

export const eventBus = createEventBus();
