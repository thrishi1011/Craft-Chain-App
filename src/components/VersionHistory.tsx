import React from 'react';
import { History, GitBranch } from 'lucide-react';
import { timeAgo } from '@/utils/helpers';
import type { VersionEntry } from '@/types';

interface VersionHistoryProps {
    currentVersion: number;
    history: VersionEntry[];
}

const VersionHistory = ({ currentVersion, history }: VersionHistoryProps) => {
    const sorted = [...history].sort((a, b) => b.version - a.version);

    return (
        <div className="border-b border-border">
            <div className="px-4 py-3 flex items-center gap-2">
                <History size={16} className="text-craft-orange" />
                <span className="text-[9px] text-muted-foreground">VERSION HISTORY</span>
                <span className="ml-auto bg-orange-dim text-craft-orange text-[9px] px-2 py-0.5 rounded-full">
                    v{currentVersion}
                </span>
            </div>
            <div className="px-3 py-2 space-y-1 max-h-40 overflow-y-auto">
                {sorted.map(entry => (
                    <div
                        key={entry.version}
                        className={`flex items-start gap-2 px-3 py-2.5 rounded-xl ${entry.version === currentVersion
                                ? 'bg-orange-dim/20 border border-craft-orange/20'
                                : 'hover:bg-bg-hover/30'
                            } transition-colors`}
                    >
                        <GitBranch size={12} className="text-craft-orange mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-craft-orange">v{entry.version}</span>
                                <span className="text-[10px] text-muted-foreground">· {entry.changedBy}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(entry.timestamp)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VersionHistory;
