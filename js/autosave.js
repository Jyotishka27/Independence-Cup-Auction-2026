import { state } from './state.js';
import { AUTOSAVE_KEY } from './config.js';
import { saveAuctionToCloud } from './firebase.js';

export function autoSaveState() {
  const payload = {
      category: state.category,
      pools: state.pools,
      skipped: state.skipped,
      current: state.current,
      teams: state.teams,
      sales: state.sales,
      rules: state.rules,
      ui: state.ui,
      savedAt: new Date().toISOString()
  };

  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));

  // 🔥 direct call (no window)
  saveAuctionToCloud();
}

export function restoreAutoSavedState() {
  const raw = localStorage.getItem(AUTOSAVE_KEY);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);

    Object.assign(state, {
        category: parsed.category ?? 'X',
        pools: parsed.pools ?? { X: [], P: [], A: [], B: [], UNSOLD: [] },
        skipped: parsed.skipped ?? { X: [], P: [], A: [], B: [], UNSOLD: [] },
        current: parsed.current ?? null,
        teams: parsed.teams ?? [],
        sales: parsed.sales ?? [],
        rules: parsed.rules ?? state.rules,
        ui: parsed.ui ?? {},
        timer: { handle: null, left: 0, running: false }
    });

    return true;
  } catch (err) {
    console.error('Autosave restore failed:', err);
    return false;
  }
}
