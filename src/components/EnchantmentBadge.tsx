import React from 'react';
import { Sparkles } from 'lucide-react';
import { toRoman } from '@/utils/helpers';
import type { Enchantment } from '@/types';

interface EnchantmentBadgeProps {
    enchantment: Enchantment;
    size?: 'sm' | 'md';
}

const EnchantmentBadge = ({ enchantment, size = 'sm' }: EnchantmentBadgeProps) => {
    const sizeClasses = size === 'sm'
        ? 'text-[9px] px-2 py-0.5 gap-1'
        : 'text-xs px-3 py-1 gap-1.5';

    return (
        <span className={`inline-flex items-center rounded-full bg-gradient-to-r from-purple-dim to-craft-purple/20 text-craft-purple border border-craft-purple/30 enchant-sparkle ${sizeClasses}`}>
            <Sparkles size={size === 'sm' ? 10 : 14} className="animate-pulse-slow" />
            {enchantment.name} {toRoman(enchantment.level)}
        </span>
    );
};

export default EnchantmentBadge;
