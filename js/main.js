import { loadAuctionData } from './storage.js';
import { restoreAutoSavedState, autoSaveState } from './autosave.js';
import { wireEvents, renderAll } from './renderer.js';
import {
  loadAuctionFromCloud,
  uploadPlayersToCloud
} from './firebase.js';
import { state } from './state.js';


// ==============================
// 🚀 INITIALIZE AUCTION
// ==============================
(async function initAuction() {

  try {

    // --------------------------------
    // 1. Load initial data
    // --------------------------------
    await loadAuctionData();

    console.log(
      "After loadAuctionData:",
      state.teams
    );


    // --------------------------------
    // 2. Restore auction state
    //    from Firebase
    // --------------------------------
    let restored = false;

    try {

      restored =
        await loadAuctionFromCloud();

      console.log(
        "After Firebase:",
        state.teams
      );

    } catch (err) {

      console.warn(
        "Cloud restore skipped:",
        err
      );
    }


    // --------------------------------
    // 3. LocalStorage fallback
    // --------------------------------
    // Keep this disabled for now.
    //
    // Firebase is our source of truth.
    //
    // if (!restored) {
    //   restoreAutoSavedState();
    //   console.log(
    //     "After LocalStorage:",
    //     state.teams
    //   );
    // }


    // --------------------------------
    // 4. Wire UI
    // --------------------------------
    wireEvents();

    renderAll();


    // --------------------------------
    // 5. Save before leaving page
    // --------------------------------
    window.addEventListener(
      "beforeunload",
      autoSaveState
    );


    console.log(
      "✅ Auction initialized"
    );

  } catch (err) {

    console.error(
      "❌ Auction initialization failed:",
      err
    );

  }

})();


// ==============================
// 📂 IMPORT PLAYERS
// ==============================
const uploadBtn =
  document.getElementById("uploadBtn");

if (uploadBtn) {

  uploadBtn.addEventListener(
    "click",
    async () => {

      const fileInput =
        document.getElementById("fileInput");

      const mode =
        document.getElementById("importMode")?.value ||
        "replace";

      const file =
        fileInput?.files?.[0];


      // --------------------------------
      // Validate file
      // --------------------------------
      if (!file) {

        alert(
          "Please select a file"
        );

        return;
      }


      // --------------------------------
      // Prevent append after auction
      // --------------------------------
      if (
        mode === "append" &&
        (
          state.sales.length > 0 ||
          state.current
        )
      ) {

        alert(
          "⚠️ Cannot append players after auction has started. Use 'Replace All' to restart."
        );

        return;
      }


      // --------------------------------
      // Confirm replace
      // --------------------------------
      if (
        mode === "replace" &&
        (
          state.sales.length > 0 ||
          state.current
        )
      ) {

        const confirmed =
          confirm(
            "⚠️ Auction has started. 'Replace All' will wipe all current progress. Proceed?"
          );

        if (!confirmed) {
          return;
        }
      }


      try {

        // --------------------------------
        // Read Excel / CSV
        // --------------------------------
        const data =
          await file.arrayBuffer();

        const workbook =
          XLSX.read(data);


        const sheet =
          workbook.Sheets[
            workbook.SheetNames[0]
          ];


        const rows =
          XLSX.utils.sheet_to_json(
            sheet,
            {
              defval: ""
            }
          );


        // --------------------------------
        // Convert spreadsheet → players
        // --------------------------------
        const players = rows.map((row) => ({
          name: row.player_name?.trim(),
          position: row.position?.trim() || '',
          pool: row.pool?.trim()?.toUpperCase(),
          basePrice: Number(row.base_price),
          img: row.img?.trim() || ''
        }));


        console.log(
          "📋 Imported players:",
          players
        );


        // --------------------------------
        // Validate players
        // --------------------------------
        const validPlayers =
          validatePlayers(players);


        if (!validPlayers.length) {

          alert(
            "No valid players found"
          );

          return;
        }


        // --------------------------------
        // Upload to Firebase
        // --------------------------------
        const success =
          await uploadPlayersToCloud(
            validPlayers,
            mode
          );


        if (!success) {

          alert(
            "Upload failed"
          );

          return;
        }


        // --------------------------------
        // Reload auction data
        // --------------------------------
        await loadAuctionData();


        console.log(
          "After player upload:",
          state.teams
        );


        // --------------------------------
        // IMPORTANT:
        // Reload Firebase auction state
        // so teams and player data are
        // both available.
        // --------------------------------
        await loadAuctionFromCloud();


        console.log(
          "After Firebase reload:",
          state.teams
        );


        renderAll();


        alert(
          "✅ Players uploaded successfully!"
        );


      } catch (err) {

        console.error(
          "❌ Player import failed:",
          err
        );

        alert(
          "❌ Upload failed. Check the console for details."
        );
      }
    }
  );
}


// ==============================
// 📥 DOWNLOAD EXCEL TEMPLATE
// ==============================
const downloadBtn =
  document.getElementById(
    "downloadTemplate"
  );

if (downloadBtn) {

  downloadBtn.addEventListener(
    "click",
    () => {

      const csv =
        "id,player_name,position,pool,base_price,img\n";


      const blob =
        new Blob(
          [csv],
          {
            type: "text/csv"
          }
        );


      const a =
        document.createElement("a");

      a.href =
        URL.createObjectURL(blob);

      a.download =
        "player_template.csv";

      a.click();

    }
  );
}


// ==============================
// 🧪 PLAYER VALIDATION
// ==============================
function validatePlayers(players) {

  const seen =
    new Set();


  return players.filter(
    (p) => {

      // Name required
      if (!p.name) {
        return false;
      }


      // Valid category
      if (
        ![
          "X",
          "P",
          "A",
          "B"
        ].includes(p.pool)
      ) {

        return false;
      }


      // Valid price
      if (
        isNaN(p.basePrice) ||
        p.basePrice <= 0
      ) {

        return false;
      }


      // Prevent duplicate names
      if (seen.has(p.name)) {

        return false;
      }

      seen.add(p.name);


      return true;
    }
  );
}
