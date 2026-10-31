'use client';

import React from 'react';
import { OrderStatus } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { t } = useI18n();

  const getStyleClass = () => {
    switch (status) {
      case 'Pending':
        return 'badge-pending';
      case 'Dispatched':
        return 'badge-dispatched';
      case 'In Transit':
        return 'badge-in-transit';
      case 'Delivered':
        return 'badge-delivered';
      case 'Delayed':
        return 'badge-delayed';
      case 'Returned':
        return 'badge-returned';
      case 'Damaged':
        return 'badge-damaged';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';
  const label = (t.status as any)[status] || status;

  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full shadow-xs ${pad} ${getStyleClass()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
}
