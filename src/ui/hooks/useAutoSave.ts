import { useEffect, useRef, useState } from "react";
import { saveGame } from "../../storage/save";
import { useGameStore } from "./useGameStore";

// auto-saves the game state at a regular interval and on tab close
// returns a "saved" flag that flashes true for 2 seconds after each save (for UI to show saved indicator)

const AUTO_SAVE_INTERVAL_MS = 30_000; // 30 seconds

export function useAutoSave() {
  const [showSaved, setShowSaved] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const doSave = () => {
      const state = useGameStore.getState();
      return saveGame({
        currencies: state.currencies,
        upgrades: state.upgrades,
        prestigeCount: state.prestigeCount,
        level: state.level,
        xp: state.xp,
      });
    };

    const interval = setInterval(() => {
      const success = doSave();
      if (success) {
        setShowSaved(true);
        // clear previous timeout if save happens again quickly
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
      }
    }, AUTO_SAVE_INTERVAL_MS);

    const handleBeforeUnload = () => doSave();
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // manual save function for the UI
  const manualSave = () => {
    const state = useGameStore.getState();
    const success = saveGame({
      currencies: state.currencies,
      upgrades: state.upgrades,
      prestigeCount: state.prestigeCount,
      level: state.level,
      xp: state.xp,
    });

    if (success) {
      setShowSaved(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
    }
  };

  return { showSaved, manualSave };
}
