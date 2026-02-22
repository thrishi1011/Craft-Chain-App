import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { getSuggestedTasks, getItemStatus, getRoleEmoji } from '@/utils/helpers';
import type { RequiredItem } from '@/types';

interface SuggestedTasksProps {
    role: string;
    items: RequiredItem[];
    onContribute: (itemId: string, qty: number) => void;
}

const SuggestedTasks = ({ role, items, onContribute }: SuggestedTasksProps) => {
    const suggestions = getSuggestedTasks(role, items);

    return (
        <div className="border-b border-border">
            <div className="px-4 py-3 flex items-center gap-2">
                <Lightbulb size={16} className="text-craft-yellow" />
                <span className="text-[9px] text-muted-foreground">SUGGESTED FOR YOU</span>
                <span className="ml-auto text-[9px] text-craft-yellow px-2 py-0.5 bg-yellow-dim rounded-full">
                    {getRoleEmoji(role)} {role}
                </span>
            </div>
            <div className="px-3 py-2 space-y-1.5">
                {suggestions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                        🎉 No tasks for your role right now!
                    </p>
                ) : (
                    suggestions.map(item => {
                        const status = getItemStatus(item);
                        const pct = item.quantityRequired > 0
                            ? Math.round((item.quantityCollected / item.quantityRequired) * 100)
                            : 0;
                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-2 bg-base rounded-xl px-3 py-2.5 hover:bg-bg-hover/40 transition-colors group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground truncate">{item.name}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                        {item.quantityCollected}/{item.quantityRequired} · {pct}%
                                    </div>
                                </div>
                                <button
                                    onClick={() => onContribute(item.id, 1)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-craft-green hover:text-green-300 "
                                >
                                    +1 <ArrowRight size={10} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default SuggestedTasks;
