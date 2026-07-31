import { loadPlayersFromFirebase } from "./firebase.js";
import { state } from "./state.js";
import { renderAll } from "./renderer.js";
import { cancelTimer } from "./timer.js";
import { catLabel } from "./utils.js";

// -------------------------------
// Load initial auction data
// -------------------------------
export async function loadAuctionData() {
  try {
    let playersFromFirebase = [];

    // 🔥 Try Firebase first
    try {
      playersFromFirebase = await loadPlayersFromFirebase();
    } catch (err) {
      console.warn("Firebase load failed:", err);
    }

    // ============================
    // ✅ CASE 1: Firebase has data
    // ============================
    if (playersFromFirebase && playersFromFirebase.length > 0) {
      console.log("✅ Using Firebase player data");

      state.pools = { X: [], P: [], A: [], B: [], UNSOLD: [] };

      playersFromFirebase.forEach(player => {
        const pool = player.pool?.toUpperCase() || "UNSOLD";

        if (!state.pools[pool]) {
          state.pools[pool] = [];
        }

        state.pools[pool].push({
          id: player.id,
          name: player.name,
          basePrice: player.basePrice,
          soldPrice: player.soldPrice || null,
          teamId: player.teamId || null
        });
      });

      const response = await fetch('./data/auction-data.json');
      const data = await response.json();

      state.teams = data.captains || [];

      console.log("Teams loaded from JSON:", state.teams);
    }

    // ============================
    // ✅ CASE 2: Fallback to JSON
    // ============================
    else {
      console.log("📁 Using local JSON data");

      const response = await fetch('./data/auction-data.json');

      if (!response.ok) {
        throw new Error('Failed to load auction data');
      }

      const data = await response.json();

      if (data.players) {
        Object.keys(data.players).forEach(cat => {
          state.pools[cat] = data.players[cat];
        });
      }

      state.teams = data.captains || [];
    }

    // ============================
    // 🔄 Reset runtime values
    // ============================
    state.sales = [];
    state.skipped = { X: [], P: [], A: [], B: [], UNSOLD: [] };
    state.current = null;
    state.timer = { handle: null, left: 0, running: false };

  } catch (err) {
    console.error('Auction data load error:', err);
  }
}

// -------------------------------
// Export auction results as CSV
// -------------------------------
export function exportCSV() {
  const rows = [];

  state.teams.forEach((team, idx) => {
    rows.push([`Team: ${team.name}`, '', '', '', '']);
    rows.push(['Time', 'Player', 'Category', 'Position', 'Price']);

    const teamSales = state.sales.filter(s => s.teamIndex === idx);

    teamSales.forEach(sale => {
      rows.push([
        sale.timeISO,
        sale.playerName,
        catLabel(sale.category),
        sale.position || '',
        String(sale.price)
      ]);
    });

    rows.push([]);
  });

  const csvContent = rows
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'auction-results-teamwise.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// -------------------------------
// Manual save auction state
// -------------------------------
export function saveState() {
  const snapshot = {
    state: {
      category: state.category,
      pools: state.pools,
      skipped: state.skipped,
      current: state.current,
      teams: state.teams,
      sales: state.sales,
      rules: state.rules
    },
    savedAt: new Date().toISOString(),
    note: 'Football Auctioneer snapshot'
  };

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json'
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'auction-state.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// -------------------------------
// Load auction state from file
// -------------------------------
export function loadState(fileList) {
  const file = fileList[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);

      if (!data || !data.state) {
        throw new Error('Invalid auction state file.');
      }

      Object.assign(state, {
          category: data.state.category,
          pools: data.state.pools,
          skipped: data.state.skipped,
          current: data.state.current,
          teams: data.state.teams,
          sales: data.state.sales,
          rules: data.state.rules,
          timer: { handle: null, left: 0, running: false }
      });

      cancelTimer();
      renderAll();

    } catch (err) {
      alert(`Failed to load state: ${err.message}`);
    }
  };

  reader.readAsText(file);
}
