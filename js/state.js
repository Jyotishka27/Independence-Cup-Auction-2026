export const state = {
  pools: { X: [], P: [], A: [], B: [], UNSOLD: [] },
  skipped: { X: [], P: [], A: [], B: [], UNSOLD: [] },
  category: 'X',
  current: null,
  teams: [],
  sales: [],
  rules: {
    minPlayersPerTeam: 7,
    maxPlayersPerTeam: 7,
    pools: {
      X: { mandatory: false, min: 1, max: 2 },
      P: { mandatory: false, min: 1, max: 2 },
      A: { mandatory: false, min: 1, max: 2 },
      B: { mandatory: false, min: 1, max: 2 }
    }
  },
  timer: { handle: null, left: 0, running: false },
  ui: {
    activeMainTab: 'auction',
    activeAdminTab: 'budgets',
    rightPanelTab: 'budgets',
    playerManagementEditMode: false
  }
};
