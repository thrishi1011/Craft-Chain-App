import type { RequiredItem } from '@/types';

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** Recursively flatten a dependency tree into a single array */
export function flattenItems(items: RequiredItem[]): RequiredItem[] {
  const result: RequiredItem[] = [];
  const walk = (list: RequiredItem[]) => {
    for (const item of list) {
      result.push(item);
      if (item.dependencies && item.dependencies.length > 0) {
        walk(item.dependencies);
      }
    }
  };
  walk(items);
  return result;
}

/** Check whether all direct dependencies of an item are fully collected */
export function areDependenciesMet(item: RequiredItem): boolean {
  if (!item.dependencies || item.dependencies.length === 0) return true;
  return item.dependencies.every(dep => {
    const depMet = dep.quantityCollected >= dep.quantityRequired;
    const subsMet = areDependenciesMet(dep);
    return depMet && subsMet;
  });
}

/** Calculate project progress considering the full dependency tree */
export function getProjectProgress(items: RequiredItem[]): number {
  const all = flattenItems(items);
  const totalRequired = all.reduce((sum, i) => sum + i.quantityRequired, 0);
  if (totalRequired === 0) return 0;
  const totalCollected = all.reduce((sum, i) => sum + Math.min(i.quantityCollected, i.quantityRequired), 0);
  return Math.round((totalCollected / totalRequired) * 100);
}

export function getItemStatus(item: RequiredItem): 'Completed' | 'In Progress' | 'Blocked' | 'Blocking' {
  if (item.quantityCollected >= item.quantityRequired) return 'Completed';
  if (!areDependenciesMet(item)) return 'Blocked';
  if (item.quantityCollected > 0) return 'In Progress';
  return 'Blocking';
}

export function getProjectStatus(items: RequiredItem[]): 'Completed' | 'In Progress' | 'Blocked' {
  const progress = getProjectProgress(items);
  if (progress === 100) return 'Completed';
  const all = flattenItems(items);
  if (all.some(i => i.quantityCollected === 0)) return 'Blocked';
  return 'In Progress';
}

/** Find items that block the most downstream progress */
export function getBottleneckItems(items: RequiredItem[]): RequiredItem[] {
  const all = flattenItems(items);
  // items with 0 collected that have things depending on them, or top-level blockers
  const blockers = all.filter(i => getItemStatus(i) === 'Blocking');
  // Sort by quantity required descending (bigger bottleneck first)
  return blockers.sort((a, b) => b.quantityRequired - a.quantityRequired);
}

/** Role-based task suggestions */
export function getSuggestedTasks(role: string, items: RequiredItem[]): RequiredItem[] {
  const all = flattenItems(items);
  const incomplete = all.filter(i => i.quantityCollected < i.quantityRequired && areDependenciesMet(i));

  switch (role) {
    case 'Miner':
      // Prioritize leaf nodes (raw resources) — items with no dependencies
      return incomplete
        .filter(i => !i.dependencies || i.dependencies.length === 0)
        .sort((a, b) => (a.quantityCollected / a.quantityRequired) - (b.quantityCollected / b.quantityRequired))
        .slice(0, 5);
    case 'Crafter':
      // Prioritize items WITH dependencies (crafted items)
      return incomplete
        .filter(i => i.dependencies && i.dependencies.length > 0)
        .sort((a, b) => (a.quantityCollected / a.quantityRequired) - (b.quantityCollected / b.quantityRequired))
        .slice(0, 5);
    case 'Planner':
      // Show bottleneck items that need attention
      return getBottleneckItems(items).slice(0, 5);
    default:
      return incomplete.slice(0, 5);
  }
}

/** Calculate adjusted resource cost with enchantment */
export function calculateEnchantmentCost(baseQuantity: number, enchantment?: { extraResourceCost: number; level: number }): number {
  if (!enchantment) return baseQuantity;
  const multiplier = 1 + (enchantment.extraResourceCost * enchantment.level) / 100;
  return Math.ceil(baseQuantity * multiplier);
}

/** Convert level number to Roman numeral */
export function toRoman(num: number): string {
  const map: [number, string][] = [[5, 'V'], [4, 'IV'], [3, 'III'], [2, 'II'], [1, 'I']];
  let result = '';
  for (const [value, symbol] of map) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

export function getRoleEmoji(role: string): string {
  switch (role) {
    case 'Miner': return '⛏️';
    case 'Crafter': return '🔨';
    case 'Planner': return '📋';
    default: return '👤';
  }
}

/** Recursively find and update an item in a dependency tree */
export function findItemInTree(items: RequiredItem[], itemId: string): RequiredItem | null {
  for (const item of items) {
    if (item.id === itemId) return item;
    if (item.dependencies) {
      const found = findItemInTree(item.dependencies, itemId);
      if (found) return found;
    }
  }
  return null;
}

/** Recursively update an item in a dependency tree (returns new tree) */
export function updateItemInTree(items: RequiredItem[], itemId: string, updater: (item: RequiredItem) => RequiredItem): RequiredItem[] {
  return items.map(item => {
    if (item.id === itemId) return updater(item);
    if (item.dependencies) {
      return { ...item, dependencies: updateItemInTree(item.dependencies, itemId, updater) };
    }
    return item;
  });
}
