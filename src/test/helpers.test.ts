import { describe, it, expect } from 'vitest';
import {
    flattenItems,
    areDependenciesMet,
    getProjectProgress,
    getItemStatus,
    getBottleneckItems,
    getSuggestedTasks,
    calculateEnchantmentCost,
    toRoman,
    findItemInTree,
    updateItemInTree,
} from '@/utils/helpers';
import type { RequiredItem } from '@/types';

function makeItem(overrides: Partial<RequiredItem> & { id: string; name: string }): RequiredItem {
    return {
        quantityRequired: 1,
        quantityCollected: 0,
        contributions: [],
        dependencies: [],
        ...overrides,
    };
}

describe('flattenItems', () => {
    it('returns flat list from nested tree', () => {
        const items: RequiredItem[] = [
            makeItem({ id: '1', name: 'A', dependencies: [makeItem({ id: '2', name: 'B' })] }),
            makeItem({ id: '3', name: 'C' }),
        ];
        const flat = flattenItems(items);
        expect(flat).toHaveLength(3);
        expect(flat.map(i => i.name)).toEqual(['A', 'B', 'C']);
    });

    it('handles deeply nested items', () => {
        const items: RequiredItem[] = [
            makeItem({
                id: '1', name: 'A',
                dependencies: [
                    makeItem({
                        id: '2', name: 'B',
                        dependencies: [makeItem({ id: '3', name: 'C' })],
                    }),
                ],
            }),
        ];
        expect(flattenItems(items)).toHaveLength(3);
    });

    it('handles empty array', () => {
        expect(flattenItems([])).toHaveLength(0);
    });
});

describe('areDependenciesMet', () => {
    it('returns true when no dependencies', () => {
        const item = makeItem({ id: '1', name: 'A' });
        expect(areDependenciesMet(item)).toBe(true);
    });

    it('returns true when all deps complete', () => {
        const item = makeItem({
            id: '1', name: 'A',
            dependencies: [
                makeItem({ id: '2', name: 'B', quantityRequired: 3, quantityCollected: 3 }),
            ],
        });
        expect(areDependenciesMet(item)).toBe(true);
    });

    it('returns false when dep incomplete', () => {
        const item = makeItem({
            id: '1', name: 'A',
            dependencies: [
                makeItem({ id: '2', name: 'B', quantityRequired: 3, quantityCollected: 1 }),
            ],
        });
        expect(areDependenciesMet(item)).toBe(false);
    });

    it('returns false when nested dep incomplete', () => {
        const item = makeItem({
            id: '1', name: 'A',
            dependencies: [
                makeItem({
                    id: '2', name: 'B', quantityRequired: 1, quantityCollected: 1,
                    dependencies: [
                        makeItem({ id: '3', name: 'C', quantityRequired: 5, quantityCollected: 2 }),
                    ],
                }),
            ],
        });
        expect(areDependenciesMet(item)).toBe(false);
    });
});

describe('getProjectProgress', () => {
    it('returns 0 for empty items', () => {
        expect(getProjectProgress([])).toBe(0);
    });

    it('calculates progress across tree', () => {
        const items: RequiredItem[] = [
            makeItem({ id: '1', name: 'A', quantityRequired: 10, quantityCollected: 5 }),
            makeItem({ id: '2', name: 'B', quantityRequired: 10, quantityCollected: 10 }),
        ];
        expect(getProjectProgress(items)).toBe(75);
    });

    it('includes nested items in progress', () => {
        const items: RequiredItem[] = [
            makeItem({
                id: '1', name: 'A', quantityRequired: 2, quantityCollected: 2,
                dependencies: [
                    makeItem({ id: '2', name: 'B', quantityRequired: 2, quantityCollected: 0 }),
                ],
            }),
        ];
        expect(getProjectProgress(items)).toBe(50);
    });
});

describe('getItemStatus', () => {
    it('returns Completed when fully collected', () => {
        expect(getItemStatus(makeItem({ id: '1', name: 'A', quantityRequired: 5, quantityCollected: 5 }))).toBe('Completed');
    });

    it('returns Blocking when zero collected and no deps', () => {
        expect(getItemStatus(makeItem({ id: '1', name: 'A', quantityRequired: 5, quantityCollected: 0 }))).toBe('Blocking');
    });

    it('returns In Progress when partially collected', () => {
        expect(getItemStatus(makeItem({ id: '1', name: 'A', quantityRequired: 5, quantityCollected: 2 }))).toBe('In Progress');
    });

    it('returns Blocked when deps not met', () => {
        const item = makeItem({
            id: '1', name: 'A', quantityRequired: 5, quantityCollected: 0,
            dependencies: [
                makeItem({ id: '2', name: 'B', quantityRequired: 3, quantityCollected: 0 }),
            ],
        });
        expect(getItemStatus(item)).toBe('Blocked');
    });
});

describe('getBottleneckItems', () => {
    it('returns blocking items sorted by quantity', () => {
        const items: RequiredItem[] = [
            makeItem({ id: '1', name: 'A', quantityRequired: 5, quantityCollected: 0 }),
            makeItem({ id: '2', name: 'B', quantityRequired: 10, quantityCollected: 0 }),
            makeItem({ id: '3', name: 'C', quantityRequired: 3, quantityCollected: 3 }),
        ];
        const blockers = getBottleneckItems(items);
        expect(blockers).toHaveLength(2);
        expect(blockers[0].name).toBe('B');
        expect(blockers[1].name).toBe('A');
    });
});

describe('getSuggestedTasks', () => {
    const items: RequiredItem[] = [
        makeItem({
            id: '1', name: 'Crafted', quantityRequired: 1, quantityCollected: 0,
            dependencies: [
                makeItem({ id: '2', name: 'Raw', quantityRequired: 3, quantityCollected: 3 }),
            ],
        }),
        makeItem({ id: '3', name: 'RawMaterial', quantityRequired: 5, quantityCollected: 2 }),
    ];

    it('Miner gets raw resources (leaf nodes)', () => {
        const tasks = getSuggestedTasks('Miner', items);
        expect(tasks.every(t => !t.dependencies || t.dependencies.length === 0)).toBe(true);
    });

    it('Crafter gets crafted items (with dependencies)', () => {
        const tasks = getSuggestedTasks('Crafter', items);
        expect(tasks.length).toBeGreaterThanOrEqual(0);
        tasks.forEach(t => {
            expect(t.dependencies && t.dependencies.length > 0).toBe(true);
        });
    });
});

describe('calculateEnchantmentCost', () => {
    it('returns base quantity with no enchantment', () => {
        expect(calculateEnchantmentCost(10)).toBe(10);
    });

    it('increases cost with enchantment', () => {
        expect(calculateEnchantmentCost(10, { extraResourceCost: 20, level: 2 })).toBe(14);
    });

    it('rounds up', () => {
        expect(calculateEnchantmentCost(3, { extraResourceCost: 10, level: 1 })).toBe(4);
    });
});

describe('toRoman', () => {
    it('converts numbers to roman numerals', () => {
        expect(toRoman(1)).toBe('I');
        expect(toRoman(2)).toBe('II');
        expect(toRoman(3)).toBe('III');
        expect(toRoman(4)).toBe('IV');
        expect(toRoman(5)).toBe('V');
    });
});

describe('findItemInTree', () => {
    it('finds a nested item by id', () => {
        const items: RequiredItem[] = [
            makeItem({
                id: '1', name: 'A',
                dependencies: [makeItem({ id: '2', name: 'B' })],
            }),
        ];
        const found = findItemInTree(items, '2');
        expect(found).not.toBeNull();
        expect(found!.name).toBe('B');
    });

    it('returns null for non-existent id', () => {
        expect(findItemInTree([], 'nope')).toBeNull();
    });
});

describe('updateItemInTree', () => {
    it('updates a nested item', () => {
        const items: RequiredItem[] = [
            makeItem({
                id: '1', name: 'A',
                dependencies: [makeItem({ id: '2', name: 'B', quantityCollected: 0 })],
            }),
        ];
        const updated = updateItemInTree(items, '2', item => ({ ...item, quantityCollected: 5 }));
        expect(updated[0].dependencies![0].quantityCollected).toBe(5);
    });
});
