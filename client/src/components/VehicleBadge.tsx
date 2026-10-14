// VehicleBadge.tsx — Visual badge for vehicle type, registration plate, and seat capacity.
import React from 'react';
import { Bike, Car, Navigation } from 'lucide-react';
import type { VehicleType } from '../../../shared/types';

interface VehicleBadgeProps {
  type: VehicleType;
  registration?: string;
  model?: string;
  colour?: string;
  capacity?: number;
}

export const VehicleBadge: React.FC<VehicleBadgeProps> = ({
  type,
  registration,
  model,
  colour,
  capacity,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'bike':
        return <Bike size={16} aria-hidden="true" />;
      case 'auto':
        return <Navigation size={16} aria-hidden="true" />;
      case 'cab':
      default:
        return <Car size={16} aria-hidden="true" />;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'bike':
        return 'Bike';
      case 'auto':
        return 'Auto';
      case 'cab':
        return 'Cab';
    }
  };

  return (
    <div className={`vehicle-badge vehicle-badge-${type}`}>
      <span className="vehicle-type-icon">{getIcon()}</span>
      <span className="vehicle-type-name">{getLabel()}</span>
      {registration && <span className="vehicle-plate">{registration}</span>}
      {model && <span className="vehicle-model text-secondary">({model})</span>}
      {colour && (
        <span
          className="colour-dot"
          style={{ backgroundColor: colour.toLowerCase() }}
          title={`Colour: ${colour}`}
        />
      )}
      {capacity !== undefined && (
        <span className="vehicle-capacity text-secondary text-xs">{capacity} seats</span>
      )}
    </div>
  );
};
