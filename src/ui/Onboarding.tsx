import { useEffect, useState } from "react";

const ONBOARDING_KEY = "minesweeper-incremental-onboarded";

// shows a brief intro tooltip on the very first visit
// dismissed by clicking, and never shows again (stored in localStorage)
export function Onboarding() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(ONBOARDING_KEY);
      if (!seen) setVisible(true);
    } catch {
      // localStorage unavailable -> skip onboarding
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div className="w-full max-w-[min(95vw,32rem)] mx-auto mb-3">
      <div className="bg-amber-900/30 border border-amber-600/30 rounded px-4 py-3 relative">
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-2 right-3 text-amber-400/60 hover:text-amber-300 text-xs"
        >
          ✕
        </button>
        <p className="text-sm text-amber-200/90 font-mono leading-relaxed">
          <span className="text-amber-400 font-bold">welcome to minesweeper dopamine edition!</span>{" "}
          left-click to reveal cells. right-click (or 🚩 toggle) to flag mines. earn{" "}
          <span className="text-amber-400">scrap</span> by clearing boards, then spend it on
          upgrades below.
        </p>
      </div>
    </div>
  );
}
