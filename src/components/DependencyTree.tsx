import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, Clock, AlertOctagon, Lock } from 'lucide-react';
import { getItemStatus, areDependenciesMet } from '@/utils/helpers';
import { Sounds } from '@/utils/soundEngine';
import EnchantmentBadge from './EnchantmentBadge';
import type { RequiredItem } from '@/types';

interface DependencyTreeProps {
    items: RequiredItem[];
    depth?: number;
    contributeAmounts: Record<string, number>;
    setContributeAmounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    onContribute: (itemId: string, qty: number) => void;
    isProjectComplete: boolean;
}

const statusIcon = (status: string) => {
    switch (status) {
        case 'Completed': return <CheckCircle2 size={14} className="text-craft-green shrink-0" />;
        case 'In Progress': return <Clock size={14} className="text-craft-yellow shrink-0" />;
        case 'Blocked': return <Lock size={14} className="text-craft-red shrink-0" />;
        default: return <Clock size={14} className="text-muted-foreground shrink-0" />;
    }
};

const statusBadge = (status: string) => {
    switch (status) {
        case 'Completed': return 'bg-green-dim text-craft-green border-craft-green/30';
        case 'In Progress': return 'bg-yellow-dim text-craft-yellow border-craft-yellow/30';
        case 'Blocked': return 'bg-red-dim text-craft-red border-craft-red/30';
        default: return 'bg-muted/10 text-muted-foreground border-border/50';
    }
};

const statusLabel = (status: string) => {
    switch (status) {
        case 'Completed': return 'DONE';
        case 'In Progress': return 'WIP';
        case 'Blocked': return 'LOCKED';
        default: return 'WAIT';
    }
};

const DependencyTreeNode = ({
    item,
    depth,
    contributeAmounts,
    setContributeAmounts,
    onContribute,
    isProjectComplete,
}: {
    item: RequiredItem;
    depth: number;
    contributeAmounts: Record<string, number>;
    setContributeAmounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    onContribute: (itemId: string, qty: number) => void;
    isProjectComplete: boolean;
}) => {
    const hasDeps = item.dependencies && item.dependencies.length > 0;
    const [expanded, setExpanded] = useState(depth < 2);
    const status = getItemStatus(item);
    const depsMet = areDependenciesMet(item);
    const pct = item.quantityRequired > 0
        ? Math.round((Math.min(item.quantityCollected, item.quantityRequired) / item.quantityRequired) * 100)
        : 0;
    const remaining = item.quantityRequired - item.quantityCollected;
    const barColor = pct === 100 ? 'bg-craft-green' : pct > 0 ? 'bg-craft-yellow' : 'bg-craft-red';

    return (
        <div className="animate-fade-in">
            <div
                className={`flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-bg-hover/30 transition-colors group ${status === 'Completed' ? 'opacity-60' : ''
                    } ${status === 'Blocked' ? 'bg-orange-dim/5' : ''}`}
                style={{ paddingLeft: `${depth * 24 + 12}px` }}
            >
                {/* Expand/collapse for items with dependencies */}
                {hasDeps ? (
                    <button
                        onClick={() => { Sounds.click(); setExpanded(!expanded); }}
                        className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
                    >
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                ) : (
                    <div className="w-[18px] shrink-0" />
                )}

                {/* Tree connector line */}
                {depth > 0 && (
                    <div className="w-3 border-l-2 border-b-2 border-dashed border-border h-4 shrink-0 -ml-1 mr-1 rounded-bl-sm" />
                )}

                {/* Status icon */}
                {statusIcon(status)}

                {/* Item name */}
                <span className={`text-sm font-medium truncate flex-shrink ${status === 'Completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}>
                    {item.name}
                </span>

                {/* Enchantment badge */}
                {item.enchantment && <EnchantmentBadge enchantment={item.enchantment} />}

                {/* Quantity */}
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto mr-2">
                    <span className={item.quantityCollected >= item.quantityRequired ? 'text-craft-green font-semibold' : item.quantityCollected > 0 ? 'text-craft-yellow' : ''}>
                        {item.quantityCollected}
                    </span>
                    /{item.quantityRequired}
                </span>

                {/* Progress bar */}
                <div className="w-16 shrink-0">
                    <div className="h-1.5 bg-base rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                </div>

                {/* Status badge */}
                <span className={`text-[9px] rounded-full px-2 py-0.5 border whitespace-nowrap shrink-0 ${statusBadge(status)}`}>
                    {statusLabel(status)}
                </span>

                {/* Contribute controls */}
                <div className="flex items-center gap-1 ml-2 shrink-0" style={{ minWidth: '100px' }}>
                    {status === 'Completed' ? (
                        <span className="text-[8px] text-craft-green">✅</span>
                    ) : isProjectComplete ? (
                        <span className="text-xs text-muted-foreground opacity-40">—</span>
                    ) : !depsMet ? (
                        <div className="flex items-center gap-1.5 text-craft-red opacity-80 bg-red-dim/20 px-2 py-1 rounded-md">
                            <Lock size={10} />
                            <span className="text-[9px] font-bold">LOCKED</span>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => onContribute(item.id, 1)}
                                className="w-7 h-7 bg-craft-green text-primary-foreground rounded-lg text-xs font-bold hover:shadow-glow-green active:scale-90 transition-all"
                            >
                                +1
                            </button>
                            <input
                                type="number" min={1} max={remaining}
                                value={contributeAmounts[item.id] || ''}
                                onChange={e => setContributeAmounts(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 1 }))}
                                placeholder="1"
                                className="w-12 h-7 bg-bg-input border border-border rounded-lg text-center text-xs text-foreground focus:border-craft-blue outline-none"
                            />
                            <button
                                onClick={() => onContribute(item.id, contributeAmounts[item.id] || 1)}
                                className="h-7 px-1.5 border border-border text-muted-foreground rounded-lg text-[10px] hover:border-craft-green hover:text-craft-green transition-all"
                            >
                                ADD
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Render sub-dependencies */}
            {hasDeps && expanded && (
                <div className="tree-connector">
                    {item.dependencies!.map(dep => (
                        <DependencyTreeNode
                            key={dep.id}
                            item={dep}
                            depth={depth + 1}
                            contributeAmounts={contributeAmounts}
                            setContributeAmounts={setContributeAmounts}
                            onContribute={onContribute}
                            isProjectComplete={isProjectComplete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const DependencyTree = ({
    items,
    depth = 0,
    contributeAmounts,
    setContributeAmounts,
    onContribute,
    isProjectComplete,
}: DependencyTreeProps) => {
    return (
        <div className="space-y-0.5">
            {items.map((item, idx) => (
                <DependencyTreeNode
                    key={item.id}
                    item={item}
                    depth={depth}
                    contributeAmounts={contributeAmounts}
                    setContributeAmounts={setContributeAmounts}
                    onContribute={onContribute}
                    isProjectComplete={isProjectComplete}
                />
            ))}
        </div>
    );
};

export default DependencyTree;
