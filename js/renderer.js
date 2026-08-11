import { state } from './state.js';
import { fmt, catLabel } from './utils.js';
import { resetCloudData } from './firebase.js';
import { AUTOSAVE_KEY } from "./config.js";

import {
  saveState,
  loadState,
  exportCSV
} from './storage.js';

import {
  autoSaveState
} from './autosave.js';

import {
  placeBid,
  nextPlayer,
  skipPlayer,
  undoLastSale,
  sell,
  setCategory,
  setRightPanelTab
} from './actions.js';

// -- Cached DOM elements --
export const dom = {

  tabAdminImportExport: document.getElementById('tabAdminImportExport'),
  adminImportExportTabContent: document.getElementById('adminImportExportTabContent'),
  
  // Auction view
  auctionView: document.getElementById('auctionView'),
  adminView: document.getElementById('adminView'),

  // Top-level tabs
  tabAuctionView: document.getElementById('tabAuctionView'),
  tabAdminView: document.getElementById('tabAdminView'),

  // Auction right-side tabs
  tabBudgets: document.getElementById('tabBudgets'),
  tabResults: document.getElementById('tabResults'),
  budgetsTabContent: document.getElementById('budgetsTabContent'),
  resultsTabContent: document.getElementById('resultsTabContent'),

  // Auction data areas
  teamsTable: document.getElementById('teamsTable'),
  results: document.getElementById('results'),

  // Admin subtabs
  tabAdminBudgets: document.getElementById('tabAdminBudgets'),
  tabAdminResults: document.getElementById('tabAdminResults'),
  tabAdminPlayerManagement: document.getElementById('tabAdminPlayerManagement'),
  tabAdminReauction: document.getElementById('tabAdminReauction'),
  tabAdminRules: document.getElementById('tabAdminRules'),
  adminBudgetsTabContent: document.getElementById('adminBudgetsTabContent'),
  adminResultsTabContent: document.getElementById('adminResultsTabContent'),
  adminPlayerManagementTabContent: document.getElementById('adminPlayerManagementTabContent'),
  adminRulesTabContent: document.getElementById('adminRulesTabContent'),

  // Admin content areas
  adminTeamsTable: document.getElementById('adminTeamsTable'),
  adminResults: document.getElementById('adminResults'),
  playerManagementPools: document.getElementById('playerManagementPools'),
  btnTogglePlayerManagementEdit: document.getElementById('btnTogglePlayerManagementEdit'),
  adminReauctionTabContent: document.getElementById('adminReauctionTabContent'),
  adminReauctionList: document.getElementById('adminReauctionList'),
  ruleMinPlayersPerTeam: document.getElementById('ruleMinPlayersPerTeam'),
  ruleMaxPlayersPerTeam: document.getElementById('ruleMaxPlayersPerTeam'),
  rulesPoolsTableBody: document.getElementById('rulesPoolsTableBody'),
  btnSaveRules: document.getElementById('btnSaveRules'),
  rulesMessage: document.getElementById('rulesMessage'),

  // Shared auction controls
  remainCat: document.getElementById('remainCat'),
  remainCount: document.getElementById('remainCount'),
  remainList: document.getElementById('remainList'),
  currentPlayerCard: document.getElementById('currentPlayerCard'),
  playerImg: document.getElementById('playerImg'),
  playerName: document.getElementById('playerName'),
  playerCat: document.getElementById('playerCat'),
  playerPosition: document.getElementById('playerPosition'),
  playerBase: document.getElementById('playerBase'),
  currentBid: document.getElementById('currentBid'),
  currentBidderName: document.getElementById('currentBidderName'),
  countdown: document.getElementById('countdown'),
  warn: document.getElementById('warn'),
  bidTeamsContainer: document.getElementById('bidTeamsContainer'),
  btnNext: document.getElementById('btnNext'),
  btnSkip: document.getElementById('btnSkip'),
  btnUndo: document.getElementById('btnUndo'),
  btnSell: document.getElementById('btnSell'),
  btnSaveState: document.getElementById('btnSaveState'),
  btnExportCSV: document.getElementById('btnExportCSV'),
  btnResetAll: document.getElementById('btnResetAll'),
  fileLoadState: document.getElementById('fileLoadState'),
  catButtons: document.querySelectorAll('.catBtn'),
  bidStepInput: document.getElementById('bidStep')
};

// ===============================
// Master render
// ===============================
export function renderAll() {
  renderTeams();
  renderResults();
  renderRemain();
  renderCurrent();
  renderPlayerManagement();
  renderReauction();
  renderRules();
  highlightCat();
  renderMainTabs();
  renderAuctionRightPanelTabs();
  renderAdminTabs();
}

function renderMainTabs() {
  const activeTab = state.ui.activeMainTab;

  dom.auctionView.classList.add('hidden');
  dom.adminView.classList.add('hidden');

  dom.tabAuctionView.classList.remove('bg-slate-900', 'text-white');
  dom.tabAuctionView.classList.add('bg-slate-100', 'text-slate-700');

  dom.tabAdminView.classList.remove('bg-slate-900', 'text-white');
  dom.tabAdminView.classList.add('bg-slate-100', 'text-slate-700');

  if (activeTab === 'auction') {
    dom.auctionView.classList.remove('hidden');
    dom.tabAuctionView.classList.add('bg-slate-900', 'text-white');
    dom.tabAuctionView.classList.remove('bg-slate-100', 'text-slate-700');
  } else {
    dom.adminView.classList.remove('hidden');
    dom.tabAdminView.classList.add('bg-slate-900', 'text-white');
    dom.tabAdminView.classList.remove('bg-slate-100', 'text-slate-700');
  }
}

function renderAuctionRightPanelTabs() {
  const activeTab = state.ui.rightPanelTab;

  dom.budgetsTabContent.classList.add('hidden');
  dom.resultsTabContent.classList.add('hidden');

  dom.tabBudgets.classList.remove('bg-slate-900', 'text-white');
  dom.tabBudgets.classList.add('bg-slate-100', 'text-slate-700');

  dom.tabResults.classList.remove('bg-slate-900', 'text-white');
  dom.tabResults.classList.add('bg-slate-100', 'text-slate-700');

  if (activeTab === 'budgets') {
    dom.budgetsTabContent.classList.remove('hidden');
    dom.tabBudgets.classList.add('bg-slate-900', 'text-white');
    dom.tabBudgets.classList.remove('bg-slate-100', 'text-slate-700');
  } else {
    dom.resultsTabContent.classList.remove('hidden');
    dom.tabResults.classList.add('bg-slate-900', 'text-white');
    dom.tabResults.classList.remove('bg-slate-100', 'text-slate-700');
  }
}

function renderAdminTabs() {
  const activeTab = state.ui.activeAdminTab;

  dom.adminBudgetsTabContent.classList.add('hidden');
  dom.adminResultsTabContent.classList.add('hidden');
  dom.adminPlayerManagementTabContent.classList.add('hidden');
  dom.adminReauctionTabContent.classList.add('hidden');
  dom.adminRulesTabContent.classList.add('hidden');
  dom.adminImportExportTabContent.classList.add('hidden');

  dom.tabAdminBudgets.classList.remove('bg-slate-900', 'text-white');
  dom.tabAdminBudgets.classList.add('bg-slate-100', 'text-slate-700');

  dom.tabAdminResults.classList.remove('bg-slate-900', 'text-white');
  dom.tabAdminResults.classList.add('bg-slate-100', 'text-slate-700');

  dom.tabAdminPlayerManagement.classList.remove('bg-slate-900', 'text-white');
  dom.tabAdminPlayerManagement.classList.add('bg-slate-100', 'text-slate-700');

  dom.tabAdminReauction.classList.remove('bg-slate-900', 'text-white');
  dom.tabAdminReauction.classList.add('bg-slate-100', 'text-slate-700');
  dom.tabAdminRules.classList.remove('bg-slate-900', 'text-white');
  dom.tabAdminImportExport.classList.remove('bg-slate-900', 'text-white');
  dom.tabAdminImportExport.classList.add('bg-slate-100', 'text-slate-700');
  dom.tabAdminRules.classList.add('bg-slate-100', 'text-slate-700');

  if (activeTab === 'budgets') {
    dom.adminBudgetsTabContent.classList.remove('hidden');
    dom.tabAdminBudgets.classList.add('bg-slate-900', 'text-white');
    dom.tabAdminBudgets.classList.remove('bg-slate-100', 'text-slate-700');
  } else if (activeTab === 'results') {
    dom.adminResultsTabContent.classList.remove('hidden');
    dom.tabAdminResults.classList.add('bg-slate-900', 'text-white');
    dom.tabAdminResults.classList.remove('bg-slate-100', 'text-slate-700');
  } else if (activeTab === 'playerManagement') {
    dom.adminPlayerManagementTabContent.classList.remove('hidden');
    dom.tabAdminPlayerManagement.classList.add('bg-slate-900', 'text-white');
    dom.tabAdminPlayerManagement.classList.remove('bg-slate-100', 'text-slate-700');
  } else if (activeTab === 'reauction') {
    dom.adminReauctionTabContent.classList.remove('hidden');
    dom.tabAdminReauction.classList.add('bg-slate-900', 'text-white');
    dom.tabAdminReauction.classList.remove('bg-slate-100', 'text-slate-700');
  } else if (activeTab === 'rules') {
    dom.adminRulesTabContent.classList.remove('hidden');
    dom.tabAdminRules.classList.add('bg-slate-900', 'text-white');
    dom.tabAdminRules.classList.remove('bg-slate-100', 'text-slate-700');
  } else if (activeTab === 'importExport') {
    dom.adminImportExportTabContent.classList.remove('hidden');
    dom.tabAdminImportExport.classList.add('bg-slate-900', 'text-white');
    dom.tabAdminImportExport.classList.remove('bg-slate-100', 'text-slate-700');
  }
}

function renderPlayerManagement() {
  if (!dom.playerManagementPools) return;

  const categories = [
    { key: 'X', label: 'Elite' },
    { key: 'P', label: 'Prime' },
    { key: 'A', label: 'Core' },
    { key: 'B', label: 'Developing' },
    { key: 'UNSOLD', label: 'UnSold' }
  ];

  dom.playerManagementPools.innerHTML = '';

  if (dom.btnTogglePlayerManagementEdit) {
    dom.btnTogglePlayerManagementEdit.textContent = state.ui.playerManagementEditMode
      ? 'Disable Edit Mode'
      : 'Enable Edit Mode';
  }

  categories.forEach(({ key, label }) => {
    const players = [
      ...(state.pools[key] || []),
      ...(state.skipped[key] || [])
    ];

    const section = document.createElement('div');
    section.className = 'rounded-xl border border-slate-200 p-3';

    section.innerHTML = `
      <div class="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <h4 class="font-semibold">${label}</h4>
          <span class="text-sm text-slate-500">${players.length} players</span>
        </div>
        ${
          state.ui.playerManagementEditMode
            ? `
              <button
                data-bulk-price-category="${key}"
                class="px-2 py-1 rounded-lg border border-slate-300 text-sm"
              >
                Bulk Change Price
              </button>
            `
            : ''
        }
      </div>
      <div class="grid gap-2" id="pool-${key}"></div>
    `;

    dom.playerManagementPools.appendChild(section);

    const poolContainer = section.querySelector(`#pool-${key}`);

    if (state.ui.playerManagementEditMode) {
      const bulkPriceButton = section.querySelector(`[data-bulk-price-category="${key}"]`);
    
      if (bulkPriceButton) {
        bulkPriceButton.addEventListener('click', () => {
          const input = prompt(`Enter new base price for all players in ${label}`, '');
          if (input === null) return;
    
          updatePoolBasePrice(key, input);
        });
      }
    }
    
    if (players.length === 0) {
      poolContainer.innerHTML = `<div class="text-sm text-slate-500">No players</div>`;
      return;
    }

    players.forEach((player) => {
      const card = document.createElement('div');
      card.className = 'rounded-lg border border-slate-200 p-2 bg-slate-50';

      card.innerHTML = `
        <div class="font-medium">${player.name}</div>
        <div class="text-xs text-slate-500 mb-2">
          ${player.position || 'N/A'} • ₹ ${fmt(player.basePrice)}
        </div>
          ${
            state.ui.playerManagementEditMode
              ? `
                <div class="flex items-center gap-2 flex-wrap">
                  <select data-move-player="${player.id}" class="border rounded-lg px-2 py-1 text-sm">
                    <option value="">Move to...</option>
                    <option value="X">Elite</option>
                    <option value="P">Prime</option>
                    <option value="A">Core</option>
                    <option value="B">Developing</option>
                    <option value="UNSOLD">UnSold</option>
                  </select>
                  <button
                    data-move-player-btn="${player.id}"
                    data-from-category="${key}"
                    class="px-2 py-1 rounded-lg bg-slate-900 text-white text-sm"
                  >
                    Move
                  </button>
                  <button
                    data-edit-price-player="${player.id}"
                    data-edit-price-category="${key}"
                    class="px-2 py-1 rounded-lg border border-slate-300 text-sm"
                  >
                    Edit Price
                  </button>
                </div>
              `
              : ''
          }
      `;

      poolContainer.appendChild(card);

      if (state.ui.playerManagementEditMode) {
        const select = card.querySelector(`[data-move-player="${player.id}"]`);
        const moveButton = card.querySelector(`[data-move-player-btn="${player.id}"]`);
        const editPriceButton = card.querySelector(`[data-edit-price-player="${player.id}"]`);
      
        moveButton.addEventListener('click', () => {
          const targetCategory = select.value;
          if (!targetCategory) {
            alert('Please select a target pool.');
            return;
          }
      
          movePlayer(player.id, key, targetCategory);
        });
      
        editPriceButton.addEventListener('click', () => {
          const input = prompt(`Enter new base price for ${player.name}`, player.basePrice);
          if (input === null) return;
      
          updatePlayerBasePrice(player.id, key, input);
        });
      }
    });
  });
}

function renderReauction() {
  if (!dom.adminReauctionList) return;

  dom.adminReauctionList.innerHTML = '';

  if (!state.sales.length) {
    dom.adminReauctionList.innerHTML = `
      <div class="text-sm text-slate-500">No sold players available for reauction.</div>
    `;
    return;
  }

  state.sales.forEach((sale, index) => {
    const card = document.createElement('div');
    card.className = 'rounded-xl border border-slate-200 p-3 bg-white';

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div class="font-semibold">${sale.playerName}</div>
          <div class="text-sm text-slate-600 mt-1">
            Team: <strong>${sale.team}</strong>
            &bull;
            Category: <strong>${catLabel(sale.category)}</strong>
            &bull;
            Sold: <strong>₹ ${fmt(sale.price)}</strong>
          </div>
        </div>
        <button
          data-reauction-sale="${index}"
          class="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-sm"
        >
          Reauction
        </button>
      </div>
    `;

    dom.adminReauctionList.appendChild(card);

    const btn = card.querySelector(`[data-reauction-sale="${index}"]`);
    btn.addEventListener('click', () => {
      const ok = confirm(
        `Reauction ${sale.playerName}? This will refund ${sale.team} and return the player to ${catLabel(sale.category)} pool.`
      );
      if (!ok) return;

      reauctionPlayer(index);
    });
  });
}

function renderRules() {
  if (!dom.ruleMinPlayersPerTeam || !dom.ruleMaxPlayersPerTeam || !dom.rulesPoolsTableBody) return;
  if (!state.rules) return;

  dom.ruleMinPlayersPerTeam.value = state.rules.minPlayersPerTeam ?? '';
  dom.ruleMaxPlayersPerTeam.value = state.rules.maxPlayersPerTeam ?? '';

  dom.rulesPoolsTableBody.innerHTML = '';

  Object.keys(state.rules.pools || {}).forEach((poolId) => {
    const poolRule = state.rules.pools[poolId];

    const tr = document.createElement('tr');
    tr.className = 'border-t border-slate-200';

    tr.innerHTML = `
      <td class="px-3 py-2 font-medium">${catLabel(poolId)}</td>
      <td class="px-3 py-2">
        <input
          type="checkbox"
          data-rule-pool-mandatory="${poolId}"
          ${poolRule.mandatory ? 'checked' : ''}
        />
      </td>
      <td class="px-3 py-2">
        <input
          type="number"
          min="0"
          data-rule-pool-min="${poolId}"
          value="${poolRule.min}"
          class="w-20 border rounded-lg p-1"
        />
      </td>
      <td class="px-3 py-2">
        <input
          type="number"
          min="0"
          data-rule-pool-max="${poolId}"
          value="${poolRule.max}"
          class="w-20 border rounded-lg p-1"
        />
      </td>
    `;

    dom.rulesPoolsTableBody.appendChild(tr);
  });
}

function saveRulesFromUI() {

  if (!state.rules) return;

  state.rules.minPlayersPerTeam =
    Number(dom.ruleMinPlayersPerTeam.value) || 0;

  state.rules.maxPlayersPerTeam =
    Number(dom.ruleMaxPlayersPerTeam.value) || 0;

  Object.keys(state.rules.pools).forEach(poolId => {

    state.rules.pools[poolId].mandatory =
      document.querySelector(
        `[data-rule-pool-mandatory="${poolId}"]`
      ).checked;

    state.rules.pools[poolId].min =
      Number(
        document.querySelector(
          `[data-rule-pool-min="${poolId}"]`
        ).value
      ) || 0;

    state.rules.pools[poolId].max =
      Number(
        document.querySelector(
          `[data-rule-pool-max="${poolId}"]`
        ).value
      ) || 0;

  });

  autoSaveState();
  renderAll();
  
  alert("Rules saved successfully.");

}

// ===============================
// Category UI
// ===============================
function highlightCat() {
  dom.catButtons.forEach((btn) => {
    if (btn.dataset.cat === state.category) {
      btn.classList.add('bg-slate-900', 'text-white');
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('tabindex', '0');
    } else {
      btn.classList.remove('bg-slate-900', 'text-white');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('tabindex', '-1');
    }
  });

  dom.remainCat.textContent = catLabel(state.category);
}

// ===============================
// Teams / Budgets
// ===============================
function renderTeams() {
  dom.teamsTable.innerHTML = '';
  dom.adminTeamsTable.innerHTML = '';

  state.teams.forEach((team, i) => {
    const rowHtml = `
      <div class="py-2 flex items-center justify-between gap-3">
        <div class="font-medium">${team.name}</div>
        <div class="text-right">
          <div class="text-xs text-slate-500">Remaining</div>
          <div class="font-semibold">
            <button data-edit-team="${i}" class="editable underline-offset-2 hover:underline">
              ₹ <span>${fmt(team.budget)}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const auctionWrapper = document.createElement('div');
    auctionWrapper.innerHTML = rowHtml;
    const auctionRow = auctionWrapper.firstElementChild;
    dom.teamsTable.appendChild(auctionRow);

    const adminWrapper = document.createElement('div');
    adminWrapper.innerHTML = rowHtml;
    const adminRow = adminWrapper.firstElementChild;
    dom.adminTeamsTable.appendChild(adminRow);

    [auctionRow, adminRow].forEach((row) => {
      row.querySelector('[data-edit-team]').addEventListener('click', () => {
        const input = prompt(`Edit remaining budget for ${team.name}`, team.budget);
        if (input === null) return;

        const newVal = Number(input);
        if (!isNaN(newVal) && newVal >= 0) {
          state.teams[i].budget = Math.floor(newVal);
          renderTeams();
          renderBidButtons();
          renderResults();
        }
      });
    });
  });
}

// ===============================
// Results (Live)
// ===============================
function renderResults() {
  dom.results.innerHTML = '';
  dom.adminResults.innerHTML = '';

  const byTeam = new Map(
    state.teams.map((t, i) => [i, { teamName: t.name, players: [], spent: 0 }])
  );

  state.sales.forEach((sale) => {
    const teamData = byTeam.get(sale.teamIndex);
    if (!teamData) return;

    teamData.players.push(sale);
    teamData.spent += sale.price;
  });

  const renderInto = (target) => {
    byTeam.forEach((teamData, idx) => {
      const container = document.createElement('div');
      container.className = 'rounded-xl border border-slate-200 p-3 mb-4';

      const playerList =
        teamData.players.length === 0
          ? '<li class="text-slate-500 text-sm">No players yet</li>'
          : teamData.players
              .map(
                (p) => `
                  <li class="flex justify-between">
                    <span>
                      ${p.playerName}
                      <span class="text-xs text-slate-500">(${catLabel(p.category)})</span>
                    </span>
                    <span>₹ ${fmt(p.price)}</span>
                  </li>`
              )
              .join('');

      container.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <div class="font-semibold">${teamData.teamName}</div>
          <div class="text-sm text-slate-600">
            Spent: <strong>₹ ${fmt(teamData.spent)}</strong>
            &bull;
            Left: <strong>₹ ${fmt(state.teams[idx].budget)}</strong>
          </div>
        </div>
        <ul class="space-y-1 list-disc pl-5">${playerList}</ul>
      `;

      target.appendChild(container);
    });

    const unsoldSection = document.createElement('div');
    unsoldSection.className = 'rounded-xl border border-rose-300 p-3 bg-rose-50';

    unsoldSection.innerHTML = `
      <h4 class="font-semibold text-rose-700 mb-2">UnSold Players</h4>
      <ul class="list-disc pl-5 space-y-1">
        ${
          state.pools.UNSOLD.length
            ? state.pools.UNSOLD
                .map(
                  (p) => `
                    <li>
                      ${p.name}
                      <span class="text-xs text-slate-500">(${p.position || 'N/A'})</span>
                      &mdash; ₹ ${fmt(p.basePrice)}
                    </li>`
                )
                .join('')
            : '<li class="text-slate-500 text-sm">No unsold players</li>'
        }
      </ul>
    `;

    target.appendChild(unsoldSection);
  };

  renderInto(dom.results);
  renderInto(dom.adminResults);
}

// ===============================
// Remaining Players
// ===============================
function renderRemain() {
  const pool = [
    ...(state.pools[state.category] || []),
    ...(state.skipped[state.category] || [])
  ];

  dom.remainCount.textContent = pool.length;

  dom.remainList.innerHTML = pool
    .map(
      (p) => `
        <div class="rounded-lg border border-slate-200 p-2">
          ${p.name}
          <div class="text-xs text-slate-500">₹ ${fmt(p.basePrice)}</div>
        </div>`
    )
    .join('');
}

// ===============================
// Current Player
// ===============================
export function renderCurrent() {
  if (!state.current) {
    dom.currentPlayerCard.hidden = true;
    if (dom.currentBidderName) dom.currentBidderName.textContent = '—';
    return;
  }

  const { player, category, bid } = state.current;
  dom.currentPlayerCard.hidden = false;

  dom.playerImg.src =
    player.img ||
    './players/defaultimage.jpg';

  dom.playerName.textContent =
    player.unsoldCount > 0
      ? `${player.name} (↓${player.unsoldCount})`
      : player.name;

  dom.playerCat.textContent = catLabel(category);
  dom.playerPosition.textContent = player.position || '';
  dom.playerBase.textContent = `₹ ${fmt(player.basePrice)}`;
  dom.currentBid.value = bid;

  if (dom.currentBidderName) {
    if (state.current.bidder === null) {
      dom.currentBidderName.textContent = '—';
    } else {
      dom.currentBidderName.textContent = state.teams[state.current.bidder]?.name || '—';
    }
  }
  
  if (state.timer.running) {
    dom.countdown.textContent = `${state.timer.left}s`;
    dom.countdown.classList.toggle('blink', state.timer.left <= 10);
  } else {
    dom.countdown.textContent = '—';
    dom.countdown.classList.remove('blink');
  }

  renderBidButtons();
  updateButtonStates();
}

// ===============================
// Bid Buttons
// ===============================
function renderBidButtons() {
  dom.bidTeamsContainer.innerHTML = '';
  if (!state.current) return;

  const step = Math.max(1, Number(dom.bidStepInput.value) || 0);
  const currentBid = state.current.bid;
  const hasBidder = state.current.bidder !== null;

  state.teams.forEach((team, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      i === state.current.bidder
        ? 'px-2 py-1 rounded-xl bg-emerald-600 text-white text-xs'
        : 'px-2 py-1 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs';
    btn.textContent = team.name;

    const nextBid = hasBidder ? currentBid + step : currentBid;
    const isCurrentBidder = i === state.current.bidder;
    const cannotAfford = nextBid > team.budget;
    
    if (isCurrentBidder || cannotAfford) {
      btn.disabled = true;
    }

    btn.addEventListener('click', () => placeBid(i));
    dom.bidTeamsContainer.appendChild(btn);
  });
}

// ===============================
// Button states
// ===============================
export function updateButtonStates() {
  const disable = state.timer.running;
  dom.btnNext.disabled = disable;
  dom.btnSkip.disabled = disable;
  dom.btnSell.disabled = !state.current || state.current.bidder === null;
}

// ===============================
// Wire Initial DOM Events
// ===============================
export function wireEvents() {

  // Category buttons
  dom.catButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setCategory(btn.dataset.cat);
    });
  });

  // Core buttons
  dom.btnNext.addEventListener('click', nextPlayer);
  dom.btnSkip.addEventListener('click', skipPlayer);
  dom.btnUndo.addEventListener('click', undoLastSale);
  dom.btnSell.addEventListener('click', sell);

  // Top-level tabs
  dom.tabAuctionView.addEventListener('click', () => {
    state.ui.activeMainTab = 'auction';
    renderAll();
  });

  dom.tabAdminView.addEventListener('click', () => {
    state.ui.activeMainTab = 'admin';
    renderAll();
  });

  // Auction right panel tabs
  dom.tabBudgets.addEventListener('click', () => {
    setRightPanelTab('budgets');
  });

  dom.tabResults.addEventListener('click', () => {
    setRightPanelTab('results');
  });

  // Admin subtabs
  dom.tabAdminBudgets.addEventListener('click', () => {
    state.ui.activeAdminTab = 'budgets';
    renderAll();
  });

  dom.tabAdminResults.addEventListener('click', () => {
    state.ui.activeAdminTab = 'results';
    renderAll();
  });

  dom.tabAdminPlayerManagement.addEventListener('click', () => {
    state.ui.activeAdminTab = 'playerManagement';
    renderAll();
  });

  dom.tabAdminReauction.addEventListener('click', () => {
    state.ui.activeAdminTab = 'reauction';
    renderAll();
  });
  
  if (dom.tabAdminRules) {
    dom.tabAdminRules.addEventListener('click', () => {
      state.ui.activeAdminTab = 'rules';
      renderAll();
    });
  }
  
  if (dom.btnSaveRules) {
    dom.btnSaveRules.addEventListener('click', () => {
      saveRulesFromUI();
    });
  }

  if (dom.tabAdminImportExport) {
    dom.tabAdminImportExport.addEventListener('click', () => {
      state.ui.activeAdminTab = 'importExport';
      renderAll();
    });
  }

  // Player Management edit mode
  dom.btnTogglePlayerManagementEdit.addEventListener('click', () => {
    state.ui.playerManagementEditMode = !state.ui.playerManagementEditMode;
    renderAll();
  });

  // Save state
  dom.btnSaveState.addEventListener('click', () => {
    saveState();
  });

  // Export CSV
  dom.btnExportCSV.addEventListener('click', () => {
    exportCSV();
  });

  // Load state
  dom.fileLoadState.addEventListener('change', (e) => {
    loadState(e.target.files);
  });

  // Reset auction
    dom.btnResetAll.addEventListener('click', async () => {
    if (!confirm('Reset the entire auction? This will wipe Cloud and Local data.')) return;
  
    // Stop any timers
    if (typeof cancelTimer === 'function') cancelTimer();
    
    // 1. Wipe the memory (This fixes the "Cannot Import" error)
    state.sales = [];
    state.current = null;
    state.history = [];
    // Reset pools to empty
    state.pools = { X: [], P: [], A: [], B: [], UNSOLD: [] };
  
    // 2. Clear Local Storage (Ghosting fix)
    localStorage.removeItem(AUTOSAVE_KEY); // Check your AUTOSAVE_KEY name
  
    // 3. Wipe the Cloud (Firestore fix)
    await resetCloudData();
  
    // 4. Force UI to update
    renderAll();
    
    alert("System fully reset. Please refresh the page before uploading new players.");
    window.location.reload(); 
  });

  // Bid step change should re-render bid buttons
  dom.bidStepInput.addEventListener('input', () => {
    renderBidButtons();
  });

}

