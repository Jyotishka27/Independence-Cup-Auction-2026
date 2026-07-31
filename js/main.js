import { loadAuctionData } from './storage.js';
import { restoreAutoSavedState, autoSaveState } from './autosave.js';
import { wireEvents, renderAll } from './renderer.js';
import { loadAuctionFromCloud, uploadPlayersToCloud } from './firebase.js';
import { state } from './state.js';

(async function initAuction() {
  await loadAuctionData();

  console.log("After loadAuctionData:", state.teams);

  let restored = false;

  try {
    restored = await loadAuctionFromCloud();
  } catch (err) {
    console.warn("Cloud restore skipped:", err);
  }

  if (!restored) {
    restoreAutoSavedState();
  }

  wireEvents();
  renderAll();

  window.addEventListener("beforeunload", autoSaveState);

  console.log("✅ Auction initialized");
})();

// ==============================
// 📂 IMPORT PLAYERS (Excel Upload)
// ==============================
const uploadBtn = document.getElementById("uploadBtn");

if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput");
    const mode = document.getElementById("importMode")?.value || "replace";
    const file = fileInput?.files?.[0];

    if (!file) {
      alert("Please select a file");
      return;
    }

    // Allow import if mode is 'replace' (with a confirmation)
    if (mode === "append" && (state.sales.length > 0 || state.current)) {
      alert("⚠️ Cannot append players after auction has started. Use 'Replace All' to restart.");
      return;
    }
    
    if (mode === "replace" && (state.sales.length > 0 || state.current)) {
      if (!confirm("⚠️ Auction has started. 'Replace All' will wipe all current progress. Proceed?")) {
        return;
      }
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const players = rows.map((row) => ({
        name: row.player_name?.trim(),
        pool: row.pool?.trim()?.toUpperCase(),
        basePrice: Number(row.base_price),
      }));

      const validPlayers = validatePlayers(players);

      if (!validPlayers.length) {
        alert("No valid players found");
        return;
      }

      const success = await uploadPlayersToCloud(validPlayers, mode);

      if (!success) {
        alert("Upload failed");
        return;
      }

      alert("✅ Players uploaded!");

      await loadAuctionData();

      console.log("After loadAuctionData:", state.teams);
      
      renderAll();

    } catch (err) {
      console.error(err);
      alert("❌ Upload failed");
    }
  });
}

// ==============================
// 📥 DOWNLOAD TEMPLATE
// ==============================
const downloadBtn = document.getElementById("downloadTemplate");

if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const csv = "player_name,pool,base_price\n";

    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "player_template.csv";
    a.click();
  });
}

// ==============================
// 🧪 VALIDATION
// ==============================
function validatePlayers(players) {
  const seen = new Set();

  return players.filter((p) => {
    if (!p.name) return false;
    if (!["X", "P", "A", "B"].includes(p.pool)) return false;
    if (isNaN(p.basePrice) || p.basePrice <= 0) return false;

    if (seen.has(p.name)) return false;
    seen.add(p.name);

    return true;
  });
}
