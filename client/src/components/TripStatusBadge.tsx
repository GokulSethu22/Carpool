// TripStatusBadge.tsx — Color-coded status badge for routes and bookings.
import React from 'react';
import type { BookingStatus, RouteStatus } from '../../../shared/types';

interface TripStatusBadgeProps {
  status: BookingStatus | RouteStatus;
}

export const TripStatusBadge: React.FC<TripStatusBadgeProps> = ({ status }) => {
  const getBadgeClass = () => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'active':
        return 'badge-success';
      case 'requested':
      case 'in_progress':
      case 'paused':
        return 'badge-warning';
      case 'declined':
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  const formatStatus = (s: string) => {
    return s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return <span className={`badge ${getBadgeClass()}`}>{formatStatus(status)}</span>;
};
