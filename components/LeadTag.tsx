'use client';

import type { LeadTag as LeadTagType } from '@/types';
import { X } from 'lucide-react';

interface LeadTagProps {
  tag: LeadTagType;
  removable?: boolean;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

const TAG_CONFIG: Record<LeadTagType, { label: string; color: string; bgColor: string; borderColor: string }> = {
  vip: {
    label: 'VIP',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300'
  },
  urgente: {
    label: 'Urgente',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300'
  },
  quente: {
    label: 'Quente',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300'
  },
  frio: {
    label: 'Frio',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300'
  },
  pendente: {
    label: 'Pendente',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300'
  }
};

export default function LeadTag({ tag, removable = false, onRemove, size = 'sm' }: LeadTagProps) {
  const config = TAG_CONFIG[tag];
  
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium border rounded-full
        ${config.color} ${config.bgColor} ${config.borderColor}
        ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
      `}
    >
      {config.label}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 transition"
        >
          <X className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        </button>
      )}
    </span>
  );
}
