import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import { state } from "./state.js";

// ===============================
// Firebase Config
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyB_99fBDK1AD2qhoPsE2JIxsEvryYS3bg8",
  authDomain: "auction-62dee.firebaseapp.com",
  projectId: "auction-62dee",
  storageBucket: "auction-62dee.firebasestorage.app",
  messagingSenderId: "247719354344",
  appId: "1:247719354344:web:cad985da4048d3aa0ce5d",
  measurementId: "G-WXGLTSQZPY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Single auction document
const AUCTION_DOC = doc(db, "auctions", "default_auction");

// ===============================
// Remove undefined values
// ===============================
function cleanForFirestore(value) {

  if (Array.isArray(value)) {
    return value.map(cleanForFirestore);
  }

  if (value !== null && typeof value === "object") {

    const cleaned = {};

    Object.entries(value).forEach(([key, val]) => {

      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }

    });

    return cleaned;
  }

  return value;
}

// ===============================
// Build auction runtime payload
// ===============================
function buildCloudPayload() {

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

  return cleanForFirestore(payload);
}

// ===============================
// Save auction state
// ===============================
async function saveAuctionToCloud() {

  try {

    await setDoc(
      AUCTION_DOC,
      buildCloudPayload(),
      { merge: true }
    );

    console.log("✅ Firebase save successful");

    return true;

  } catch (err) {

    console.error("❌ Firebase save failed:", err);

    return false;
  }
}

// ===============================
// Load complete auction state
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
      category: parsed.category ?? state.category ?? "X",

      pools: parsed.pools ?? {
        X: [],
        P: [],
        A: [],
        B: [],
        UNSOLD: []
      },

      skipped: parsed.skipped ?? {
        X: [],
        P: [],
        A: [],
        B: [],
        UNSOLD: []
      },

      current: parsed.current ?? null,

      // IMPORTANT:
      // Do NOT replace teams loaded from auction-data.json
      // with an empty Firebase array.
      teams:
        Array.isArray(parsed.teams) && parsed.teams.length > 0
          ? parsed.teams
          : state.teams,

      sales: parsed.sales ?? [],

      rules: parsed.rules ?? state.rules,

      ui: parsed.ui ?? state.ui,

      timer: {
        handle: null,
        left: 0,
        running: false
      }
    });

    console.log("✅ Firebase load successful");
    console.log("Teams after Firebase load:", state.teams);

    return true;

  } catch (err) {
    console.error("❌ Firebase load failed:", err);
    return false;
  }
}

// ===============================
// Convert players → auction pools
// ===============================
function convertPlayersToPools(players) {

  const pools = {
    X: [],
    P: [],
    A: [],
    B: [],
    UNSOLD: []
  };

  players.forEach((player, index) => {

    const pool =
      player.pool?.toUpperCase() || "UNSOLD";

    if (!pools[pool]) {
      pools[pool] = [];
    }

    pools[pool].push({

      id:
        player.id ||
        `p_${Date.now()}_${index}`,

      name:
        player.name || "",

      position:
        player.position || "",

      basePrice:
        Number(player.basePrice) || 0,

      // IMPORTANT:
      // Take the image path directly from Excel.
      img:
        player.img || "",

      soldPrice:
        player.soldPrice ?? null,

      teamId:
        player.teamId ?? null,

      pool:
        pool
    });
  });

  return pools;
}

// ===============================
// Upload players from Excel → Firebase
// ===============================
async function uploadPlayersToCloud(players, mode = "replace") {
  try {
    const snapshot = await getDoc(AUCTION_DOC);
    const existing = snapshot.exists() ? snapshot.data() : {};

    let updatedPlayers = players;

    // ===============================
    // Append mode
    // ===============================
    if (mode === "append" && Array.isArray(existing.players_master)) {
      updatedPlayers = [
        ...existing.players_master,
        ...players
      ];
    }

    // ===============================
    // Convert players to pools
    // ===============================
    const pools = convertPlayersToPools(updatedPlayers);

    // ===============================
    // Preserve teams
    // ===============================
    const teams =
      Array.isArray(existing.teams) && existing.teams.length > 0
        ? existing.teams
        : state.teams;

    // ===============================
    // Preserve rules and UI
    // ===============================
    const rules = existing.rules ?? state.rules;
    const ui = existing.ui ?? state.ui;

    // ===============================
    // Build safe Firebase payload
    // ===============================
    const payload = cleanForFirestore({
      players_master: updatedPlayers,
      pools: pools,

      // IMPORTANT: preserve teams
      teams: teams,

      sales: [],
      skipped: {
        X: [],
        P: [],
        A: [],
        B: [],
        UNSOLD: []
      },

      current: null,

      rules: rules,
      ui: ui,

      savedAt: new Date().toISOString()
    });

    await setDoc(
      AUCTION_DOC,
      payload,
      { merge: true }
    );

    console.log("✅ Players uploaded successfully");
    console.log("Teams preserved:", teams);

    return true;

  } catch (err) {
    console.error("❌ Player upload failed:", err);
    return false;
  }
}

// ===============================
// Load players from Firebase
// ===============================
async function loadPlayersFromFirebase() {

  try {

    const snapshot =
      await getDoc(AUCTION_DOC);

    if (!snapshot.exists()) {

      return [];
    }

    const data =
      snapshot.data();

    return data.players_master || [];

  } catch (err) {

    console.error(
      "❌ Failed to load players:",
      err
    );

    return [];
  }
}

// ===============================
// Reset Cloud Data
// ===============================
async function resetCloudData() {

  try {

    await deleteDoc(AUCTION_DOC);

    console.log(
      "🗑️ Cloud document deleted successfully"
    );

    return true;

  } catch (err) {

    console.error(
      "❌ Failed to delete cloud data:",
      err
    );

    return false;
  }
}

// ===============================
// Exports
// ===============================
export {
  saveAuctionToCloud,
  loadAuctionFromCloud,
  uploadPlayersToCloud,
  loadPlayersFromFirebase,
  resetCloudData
};
