import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { state } from "./state.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// ===============================
// 🔧 Firebase Config
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyB_99fBDK1AD2qhoPsE2JIxsEvryYS3bg8",
  authDomain: "auction-62dee.firebaseapp.com",
  projectId: "auction-62dee",
  storageBucket: "auction-62dee.firebasestorage.app",
  messagingSenderId: "247719354344",
  appId: "1:247719354344:web:cad985da40408d3aa0ce5d",
  measurementId: "G-WXGLTSQZPY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔥 Single auction doc (current design)
const AUCTION_DOC = doc(db, "auctions", "default_auction");


// ===============================
// 📦 Build payload (existing)
// ===============================
function buildCloudPayload() {
  return {
    category: state.category,
    pools: state.pools,
    skipped: state.skipped,
    current: state.current,
    teams: state.teams,
    sales: state.sales,
    ui: state.ui,
    savedAt: new Date().toISOString()
  };
}


// ===============================
// ☁️ Save auction state
// ===============================
async function saveAuctionToCloud() {
  try {
    await setDoc(AUCTION_DOC, buildCloudPayload(), { merge: true });
    console.log("✅ Firebase save successful");
    return true;
  } catch (err) {
    console.error("❌ Firebase save failed:", err);
    return false;
  }
}


// ===============================
// ☁️ Load auction state
// ===============================
async function loadAuctionFromCloud() {
  try {
    const snapshot = await getDoc(AUCTION_DOC);

    if (!snapshot.exists()) {
      console.log("No Firebase auction document found");
      return false;
    }

    const parsed = snapshot.data();

    Object.assign(state, {
      category: parsed.category ?? "X",
      pools: parsed.pools ?? { X: [], P: [], A: [], B: [], UNSOLD: [] },
      skipped: parsed.skipped ?? { X: [], P: [], A: [], B: [], UNSOLD: [] },
      current: parsed.current ?? null,
      teams: parsed.teams ?? [],
      sales: parsed.sales ?? [],
      ui: parsed.ui ?? {
        activeMainTab: "auction",
        activeAdminTab: "budgets",
        rightPanelTab: "budgets",
        playerManagementEditMode: false
      },
      timer: { handle: null, left: 0, running: false }
    });

    console.log("✅ Firebase load successful");
    return true;
  } catch (err) {
    console.error("❌ Firebase load failed:", err);
    return false;
  }
}


// ===============================
// 🔄 Helper: Convert players → pools
// ===============================
function convertPlayersToPools(players) {
  const pools = { X: [], P: [], A: [], B: [], UNSOLD: [] };

  players.forEach((player, index) => {
    const pool = player.pool?.toUpperCase() || "UNSOLD";

    if (!pools[pool]) pools[pool] = [];

    pools[pool].push({
      id: `p_${Date.now()}_${index}`,
      name: player.name,
      basePrice: player.basePrice,
      soldPrice: null,
      teamId: null
    });
  });

  return pools;
}


// ===============================
// 📥 Upload players (Excel → Firebase)
// ===============================
async function uploadPlayersToCloud(players, mode = "replace") {
  try {
    const snapshot = await getDoc(AUCTION_DOC);
    const existing = snapshot.exists() ? snapshot.data() : {};

    let updatedPlayers = players;

    // 🔁 Append mode
    if (mode === "append" && existing.players_master) {
      updatedPlayers = [...existing.players_master, ...players];
    }

    const pools = convertPlayersToPools(updatedPlayers);

    await setDoc(
      AUCTION_DOC,
      {
        players_master: updatedPlayers, // 🔥 source of truth
        pools: pools,                  // reset pools
        sales: [],
        skipped: { X: [], P: [], A: [], B: [], UNSOLD: [] },
        current: null
      },
      { merge: true }
    );

    console.log("✅ Players uploaded successfully");
    return true;
  } catch (err) {
    console.error("❌ Player upload failed:", err);
    return false;
  }
}


// ===============================
// 📤 Load players (for storage.js)
// ===============================
async function loadPlayersFromFirebase() {
  try {
    const snapshot = await getDoc(AUCTION_DOC);

    if (!snapshot.exists()) return [];

    const data = snapshot.data();

    return data.players_master || [];
  } catch (err) {
    console.error("❌ Failed to load players:", err);
    return [];
  }
}

import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-database.js"; // Ensure path matches your version

async function resetCloudData() { 
  const db = getDatabase();
  const auctionRef = ref(db, 'auction'); 
  return set(auctionRef, null);
}

export {
  saveAuctionToCloud,
  loadAuctionFromCloud,
  uploadPlayersToCloud,
  loadPlayersFromFirebase,
  resetCloudData
};
