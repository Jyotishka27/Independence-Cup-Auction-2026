import {
  CATEGORY_LABELS,
  REDUCTION_FACTOR,
  MIN_PRICE,
  UNSOLD_FIXED_PRICE
} from './config.js';
import { dom } from './renderer.js';

export function fmt(num) {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function catLabel(cat) {
  return CATEGORY_LABELS[cat] || 'Unknown';
}

export function applyUnsoldReduction(player) {
  
  player.basePrice = UNSOLD_FIXED_PRICE;
  player.unsoldCount = (player.unsoldCount || 0) + 1;
  //player.basePrice = Math.max(
  //  Math.floor(player.basePrice * REDUCTION_FACTOR),
  //  MIN_PRICE
  //);
}

export function showWarn(message) {
  if (!dom || !dom.warn) return;
  dom.warn.textContent = message || '';
}
