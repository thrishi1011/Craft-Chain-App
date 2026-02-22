import React, { useState } from 'react';
import { X, Hammer, Plus, Trash2, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { Sounds } from '@/utils/soundEngine';
import { generateId } from '@/utils/helpers';
import { ENCHANTMENT_OPTIONS } from '@/types';
import type { RequiredItem, Enchantment } from '@/types';

interface EditPlanModalProps {
    projectId: string;
    currentItems: RequiredItem[];
    onClose: () => void;
}

interface EditableItem {
    id: string;
    name: string;
    quantity: number;
    enchantmentName?: string;
    enchantmentLevel?: number;
    children: EditableItem[];
    expanded: boolean;
}

function toEditable(items: RequiredItem[]): EditableItem[] {
    return items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantityRequired,
        enchantmentName: item.enchantment?.name,
        enchantmentLevel: item.enchantment?.level,
        children: item.dependencies ? toEditable(item.dependencies) : [],
        expanded: true,
    }));
}

function toRequiredItems(editables: EditableItem[], parentId?: string): RequiredItem[] {
    return editables.map(e => {
        const enchOption = ENCHANTMENT_OPTIONS.find(o => o.name === e.enchantmentName);
        const enchantment: Enchantment | undefined = e.enchantmentName && enchOption
            ? { name: e.enchantmentName, level: e.enchantmentLevel || 1, extraResourceCost: enchOption.costPct }
            : undefined;
        return {
            id: e.id,
            name: e.name,
            quantityRequired: e.quantity,
            quantityCollected: 0,
            contributions: [],
            dependencies: e.children.length > 0 ? toRequiredItems(e.children, e.id) : [],
            enchantment,
            parentId,
        };
    });
}

const ItemEditor = ({
    item,
    depth,
    onUpdate,
    onRemove,
    onAddChild,
}: {
    item: EditableItem;
    depth: number;
    onUpdate: (updated: EditableItem) => void;
    onRemove: () => void;
    onAddChild: () => void;
}) => {
    const hasDeps = item.children.length > 0;
    const enchOption = ENCHANTMENT_OPTIONS.find(o => o.name === item.enchantmentName);

    return (
        <div className="animate-fade-in">
            <div
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-bg-hover/20 transition-colors"
                style={{ paddingLeft: `${depth * 20 + 8}px` }}
            >
                {hasDeps ? (
                    <button
                        onClick={() => onUpdate({ ...item, expanded: !item.expanded })}
                        className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
                    >
                        {item.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                ) : (
                    <div className="w-[16px] shrink-0" />
                )}

                <input
                    value={item.name}
                    onChange={e => onUpdate({ ...item, name: e.target.value })}
                    placeholder="Item name"
                    className="flex-1 bg-bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-craft-blue outline-none min-w-0"
                />
                <input
                    type="number" min={1}
                    value={item.quantity}
                    onChange={e => onUpdate({ ...item, quantity: parseInt(e.target.value) || 1 })}
                    className="w-16 bg-bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-foreground text-center focus:border-craft-blue outline-none shrink-0"
                />

                {/* Enchantment selector */}
                <select
                    value={item.enchantmentName || ''}
                    onChange={e => onUpdate({ ...item, enchantmentName: e.target.value || undefined, enchantmentLevel: e.target.value ? 1 : undefined })}
                    className="w-24 bg-bg-input border border-border rounded-lg px-1 py-1.5 text-[10px] text-foreground focus:border-craft-purple outline-none shrink-0"
                >
                    <option value="">None</option>
                    {ENCHANTMENT_OPTIONS.map(opt => (
                        <option key={opt.name} value={opt.name}>{opt.name}</option>
                    ))}
                </select>

                {item.enchantmentName && enchOption && (
                    <input
                        type="number" min={1} max={enchOption.maxLevel}
                        value={item.enchantmentLevel || 1}
                        onChange={e => onUpdate({ ...item, enchantmentLevel: Math.min(parseInt(e.target.value) || 1, enchOption.maxLevel) })}
                        className="w-12 bg-bg-input border border-craft-purple/30 rounded-lg px-1 py-1.5 text-[10px] text-craft-purple text-center focus:border-craft-purple outline-none shrink-0"
                        title={`Level (max ${enchOption.maxLevel})`}
                    />
                )}

                <button onClick={onAddChild} className="text-muted-foreground hover:text-craft-green p-1 shrink-0" title="Add sub-item">
                    <Plus size={14} />
                </button>
                <button onClick={onRemove} className="text-muted-foreground hover:text-craft-red p-1 shrink-0" title="Remove">
                    <Trash2 size={14} />
                </button>
            </div>

            {hasDeps && item.expanded && (
                <div>
                    {item.children.map((child, ci) => (
                        <ItemEditor
                            key={child.id}
                            item={child}
                            depth={depth + 1}
                            onUpdate={updated => {
                                const newChildren = [...item.children];
                                newChildren[ci] = updated;
                                onUpdate({ ...item, children: newChildren });
                            }}
                            onRemove={() => {
                                onUpdate({ ...item, children: item.children.filter((_, i) => i !== ci) });
                            }}
                            onAddChild={() => {
                                const newChild: EditableItem = { id: generateId(), name: '', quantity: 1, children: [], expanded: true };
                                const newChildren = [...item.children];
                                newChildren[ci] = { ...child, children: [...child.children, newChild], expanded: true };
                                onUpdate({ ...item, children: newChildren });
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const EditPlanModal = ({ projectId, currentItems, onClose }: EditPlanModalProps) => {
    const { currentUser } = useAuth();
    const { updateProjectPlan } = useApp();
    const { addToast } = useToast();
    const [items, setItems] = useState<EditableItem[]>(toEditable(currentItems));
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const addTopItem = () => {
        Sounds.click();
        setItems([...items, { id: generateId(), name: '', quantity: 1, children: [], expanded: true }]);
    };

    const handleSave = async () => {
        if (!currentUser) return;
        if (items.length === 0) { Sounds.error(); addToast('error', 'Add at least one item'); return; }
        const hasEmpty = items.some(function check(i: EditableItem): boolean { return !i.name.trim() || i.children.some(check); });
        if (hasEmpty) { Sounds.error(); addToast('error', 'Fill in all item names'); return; }

        setLoading(true);
        await new Promise(r => setTimeout(r, 300));
        const requiredItems = toRequiredItems(items);
        updateProjectPlan(projectId, requiredItems, currentUser, description.trim() || 'Updated crafting plan');
        Sounds.success();
        addToast('success', 'Plan updated!');
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-elevated border border-border rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Hammer size={20} className="text-craft-orange" />
                        <span className="text-xs text-foreground">EDIT CRAFTING PLAN</span>
                    </div>
                    <button onClick={() => { Sounds.dismiss(); onClose(); }} className="hover:text-craft-red hover:bg-red-dim/20 rounded-lg p-1 text-muted-foreground"><X size={20} /></button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-[9px] text-muted-foreground mb-1.5 block">CHANGE DESCRIPTION</label>
                        <input
                            value={description} onChange={e => setDescription(e.target.value)}
                            placeholder="What changed? e.g. Added Netherite upgrade path"
                            className="w-full bg-bg-input border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-craft-orange outline-none transition-all"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[9px] text-muted-foreground">ITEMS & DEPENDENCIES</label>
                            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                                <span className="bg-base px-2 py-0.5 rounded-full">{items.length} items</span>
                                <Sparkles size={10} className="text-craft-purple" />
                                <span>= enchanted</span>
                            </div>
                        </div>

                        <div className="bg-base rounded-xl border border-border p-2 space-y-0.5 max-h-[400px] overflow-y-auto">
                            {items.map((item, i) => (
                                <ItemEditor
                                    key={item.id}
                                    item={item}
                                    depth={0}
                                    onUpdate={updated => { const n = [...items]; n[i] = updated; setItems(n); }}
                                    onRemove={() => { if (items.length > 0) setItems(items.filter((_, idx) => idx !== i)); }}
                                    onAddChild={() => {
                                        const newChild: EditableItem = { id: generateId(), name: '', quantity: 1, children: [], expanded: true };
                                        const n = [...items];
                                        n[i] = { ...item, children: [...item.children, newChild], expanded: true };
                                        setItems(n);
                                    }}
                                />
                            ))}
                        </div>

                        <button onClick={addTopItem} className="w-full mt-2 border border-dashed border-border text-muted-foreground text-xs py-2.5 rounded-xl hover:border-craft-green hover:text-craft-green transition-all flex items-center justify-center gap-1">
                            <Plus size={14} /> ADD TOP-LEVEL ITEM
                        </button>
                    </div>
                </div>

                <div className="px-6 pb-6 pt-4 border-t border-border flex gap-3">
                    <button onClick={() => { Sounds.dismiss(); onClose(); }} className="border border-border text-muted-foreground rounded-lg px-5 py-2.5 text-sm hover:bg-elevated">Cancel</button>
                    <button onClick={handleSave} disabled={loading}
                        className="flex-1 bg-craft-orange text-primary-foreground font-bold text-sm rounded-lg px-6 py-2.5 hover:shadow-glow-green active:scale-95 transition-all disabled:opacity-50">
                        {loading ? '⏳ Saving...' : 'SAVE & VERSION UP ⚡'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPlanModal;
