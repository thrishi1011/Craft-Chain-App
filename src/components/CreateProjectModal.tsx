import React, { useState } from 'react';
import { X, Hammer, Plus, Trash2, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastContext';
import { Sounds } from '@/utils/soundEngine';
import { generateId } from '@/utils/helpers';
import { ENCHANTMENT_OPTIONS } from '@/types';
import type { RequiredItem, Enchantment } from '@/types';
import recipesDataRaw from '@/data/recipes.json';

const recipesData = recipesDataRaw as { name: string, resultCount: number, dependencies: { name: string, quantityRequired: number }[] }[];

interface CreateProjectModalProps {
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

function buildRecipeTree(itemName: string, quantityNeeded: number = 1, visited: Set<string> = new Set()): EditableItem {
  const recipe = recipesData.find(r => r.name.toLowerCase() === itemName.toLowerCase());

  // Ignore decompression recipes (e.g. Diamond from Block of Diamond)
  // These usually yield 9 items from exactly 1 block-like dependency
  const isDecompression = recipe && recipe.resultCount === 9 &&
    recipe.dependencies?.length === 1 &&
    recipe.dependencies[0].name.toLowerCase().includes('block');

  if (!recipe || !recipe.dependencies || recipe.dependencies.length === 0 || visited.has(itemName.toLowerCase()) || isDecompression) {
    return {
      id: generateId(),
      name: itemName,
      quantity: quantityNeeded,
      children: [],
      expanded: true
    };
  }

  visited.add(itemName.toLowerCase());
  const craftsNeeded = Math.ceil(quantityNeeded / Math.max(1, recipe.resultCount));

  return {
    id: generateId(),
    name: itemName,
    quantity: quantityNeeded,
    children: recipe.dependencies.map(dep =>
      buildRecipeTree(dep.name, dep.quantityRequired * craftsNeeded, new Set(visited))
    ),
    expanded: true
  };
}

const ItemRow = ({
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
    <div>
      <div
        className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-bg-hover/20 transition-colors"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasDeps ? (
          <button onClick={() => onUpdate({ ...item, expanded: !item.expanded })} className="text-muted-foreground hover:text-foreground p-0.5 shrink-0">
            {item.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <div className="w-[16px] shrink-0" />
        )}

        {depth > 0 && <div className="w-3 border-l-2 border-b-2 border-dashed border-border h-4 shrink-0 -ml-1 mr-0.5 rounded-bl-sm" />}

        <input value={item.name} onChange={e => onUpdate({ ...item, name: e.target.value })}
          placeholder="Iron Ingot, Obsidian..."
          className="flex-1 bg-bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:border-craft-blue outline-none min-w-0" />
        <input type="number" min={1} value={item.quantity}
          onChange={e => onUpdate({ ...item, quantity: parseInt(e.target.value) || 1 })}
          className="w-16 bg-bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-foreground text-center focus:border-craft-blue outline-none shrink-0" placeholder="Qty" />

        {/* Enchantment */}
        <select value={item.enchantmentName || ''}
          onChange={e => onUpdate({ ...item, enchantmentName: e.target.value || undefined, enchantmentLevel: e.target.value ? 1 : undefined })}
          className="w-20 bg-bg-input border border-border rounded-lg px-1 py-1.5 text-[10px] text-foreground focus:border-craft-purple outline-none shrink-0">
          <option value="">✨None</option>
          {ENCHANTMENT_OPTIONS.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
        </select>

        {item.enchantmentName && enchOption && (
          <input type="number" min={1} max={enchOption.maxLevel}
            value={item.enchantmentLevel || 1}
            onChange={e => onUpdate({ ...item, enchantmentLevel: Math.min(parseInt(e.target.value) || 1, enchOption.maxLevel) })}
            className="w-10 bg-bg-input border border-craft-purple/30 rounded-lg px-1 py-1.5 text-[10px] text-craft-purple text-center outline-none shrink-0"
            title={`Lvl (max ${enchOption.maxLevel})`} />
        )}

        <button onClick={onAddChild} className="text-muted-foreground hover:text-craft-green p-1 shrink-0" title="Add sub-dependency">
          <Plus size={14} />
        </button>
        <button onClick={onRemove} className="text-muted-foreground hover:text-craft-red p-1 shrink-0"><Trash2 size={14} /></button>
      </div>

      {hasDeps && item.expanded && (
        <div>
          {item.children.map((child, ci) => (
            <ItemRow key={child.id} item={child} depth={depth + 1}
              onUpdate={updated => { const n = [...item.children]; n[ci] = updated; onUpdate({ ...item, children: n }); }}
              onRemove={() => onUpdate({ ...item, children: item.children.filter((_, i) => i !== ci) })}
              onAddChild={() => {
                const nc: EditableItem = { id: generateId(), name: '', quantity: 1, children: [], expanded: true };
                const n = [...item.children];
                n[ci] = { ...child, children: [...child.children, nc], expanded: true };
                onUpdate({ ...item, children: n });
              }} />
          ))}
        </div>
      )}
    </div>
  );
};

const CreateProjectModal = ({ onClose }: CreateProjectModalProps) => {
  const { currentUser } = useAuth();
  const { createProject } = useApp();
  const { addToast } = useToast();
  const [finalItem, setFinalItem] = useState('');
  const [projectName, setProjectName] = useState('');
  const [items, setItems] = useState<EditableItem[]>([{ id: generateId(), name: '', quantity: 1, children: [], expanded: true }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const filteredRecipes = finalItem.trim() ? recipesData.filter(r => r.name.toLowerCase().includes(finalItem.toLowerCase())).slice(0, 10) : [];

  const addItem = () => {
    Sounds.click();
    setItems([...items, { id: generateId(), name: '', quantity: 1, children: [], expanded: true }]);
  };

  const handleCreate = async () => {
    const newErrors: Record<string, string> = {};
    if (!finalItem.trim()) newErrors.finalItem = 'Required';
    if (items.length === 0) newErrors.items = 'Add at least 1 required item';
    const hasEmpty = items.some(function check(i: EditableItem): boolean { return !i.name.trim() || i.children.some(check); });
    if (hasEmpty) newErrors.items = 'Fill in all item names';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) { Sounds.error(); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 300));
    const requiredItems = toRequiredItems(items);
    createProject(
      { name: projectName.trim() || `${finalItem} Project`, finalItem: finalItem.trim(), items: requiredItems },
      currentUser!,
    );
    Sounds.success();
    addToast('success', 'Project created! Share your invite code.');
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="bg-elevated border border-border rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hammer size={20} className="text-craft-green" />
            <span className="text-xs text-foreground">NEW PROJECT</span>
          </div>
          <button onClick={() => { Sounds.dismiss(); onClose(); }} className="hover:text-craft-red hover:bg-red-dim/20 rounded-lg p-1 text-muted-foreground"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="relative">
            <label className="text-[9px] text-muted-foreground mb-1.5 block">WHAT ARE YOU CRAFTING?</label>
            <input value={finalItem}
              onChange={e => {
                setFinalItem(e.target.value);
                setShowAutocomplete(true);
                if (!projectName) setProjectName(e.target.value ? `${e.target.value} Project` : '');
              }}
              onFocus={() => setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              placeholder="e.g. Beacon, Diamond Sword, Netherite Armor"
              className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-craft-blue outline-none transition-all" />

            {showAutocomplete && filteredRecipes.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-elevated border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {filteredRecipes.map(recipe => (
                  <button key={recipe.name}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setFinalItem(recipe.name);
                      if (!projectName) setProjectName(`${recipe.name} Project`);
                      setShowAutocomplete(false);
                      setItems([buildRecipeTree(recipe.name, 1)]);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-bg-hover transition-colors flex flex-col items-start border-b border-border/50 last:border-0"
                  >
                    <span className="font-semibold">{recipe.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Requires: {recipe.dependencies.map(d => `${d.quantityRequired}x ${d.name}`).join(', ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {errors.finalItem && <p className="text-xs text-craft-red mt-1 animate-shake">{errors.finalItem}</p>}
            <p className="text-xs text-muted-foreground mt-1">The ultimate item your team is working toward</p>
          </div>

          <div>
            <label className="text-[9px] text-muted-foreground mb-1.5 block">PROJECT NAME</label>
            <input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Diamond Sword Project"
              className="w-full bg-bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-craft-blue outline-none transition-all" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] text-muted-foreground">REQUIRED ITEMS & DEPENDENCIES</label>
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                <span className="bg-base px-2 py-0.5 rounded-full">{items.length} items</span>
                <Sparkles size={10} className="text-craft-purple" />
                <span>= enchantable</span>
              </div>
            </div>
            {errors.items && <p className="text-xs text-craft-red mb-2 animate-shake">{errors.items}</p>}

            <div className="bg-base rounded-xl border border-border p-2 space-y-0.5 max-h-[350px] overflow-y-auto">
              {items.map((item, i) => (
                <ItemRow key={item.id} item={item} depth={0}
                  onUpdate={updated => { const n = [...items]; n[i] = updated; setItems(n); }}
                  onRemove={() => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); }}
                  onAddChild={() => {
                    const nc: EditableItem = { id: generateId(), name: '', quantity: 1, children: [], expanded: true };
                    const n = [...items];
                    n[i] = { ...item, children: [...item.children, nc], expanded: true };
                    setItems(n);
                  }} />
              ))}
            </div>

            <button onClick={addItem} className="w-full mt-2 border border-dashed border-border text-muted-foreground text-xs py-2.5 rounded-xl hover:border-craft-green hover:text-craft-green transition-all flex items-center justify-center gap-1">
              <Plus size={14} /> ADD ITEM
            </button>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Use the <Plus size={10} className="inline" /> button on each item to add sub-dependencies</p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-border flex gap-3">
          <button onClick={() => { Sounds.dismiss(); onClose(); }} className="border border-border text-muted-foreground rounded-lg px-5 py-2.5 text-sm hover:bg-elevated">Cancel</button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-1 bg-craft-green text-primary-foreground font-bold text-sm rounded-lg px-6 py-2.5 hover:shadow-glow-green active:scale-95 transition-all disabled:opacity-50">
            {loading ? '⏳ Creating...' : 'CREATE PROJECT ⛏'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
