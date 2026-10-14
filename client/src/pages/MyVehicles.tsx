// MyVehicles.tsx — Driver vehicle registry with TN registration regex checks and capacity rules.
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { VehicleBadge } from '../components/VehicleBadge';
import { EmptyState } from '../components/EmptyState';
import { Car, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { TN_PLATE_REGEX } from '../../../shared/types';
import type { Vehicle, VehicleType } from '../../../shared/types';

export const MyVehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [type, setType] = useState<VehicleType>('cab');
  const [registration, setRegistration] = useState('');
  const [model, setModel] = useState('');
  const [colour, setColour] = useState('');
  const [seatCapacity, setSeatCapacity] = useState(4);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ vehicles: Vehicle[] }>('/vehicles');
      setVehicles(data.vehicles);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not fetch your vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleTypeChange = (newType: VehicleType) => {
    setType(newType);
    if (!editingVehicleId) {
      // Default capacity
      if (newType === 'bike') setSeatCapacity(1);
      if (newType === 'auto') setSeatCapacity(3);
      if (newType === 'cab') setSeatCapacity(4);
    }
  };

  const handleStartEdit = (v: Vehicle) => {
    setEditingVehicleId(v.id);
    setType(v.type);
    setRegistration(v.registration);
    setModel(v.model);
    setColour(v.colour);
    setSeatCapacity(v.seat_capacity);
    setShowAddForm(true);
    setFormError(null);
  };

  const resetForm = () => {
    setEditingVehicleId(null);
    setType('cab');
    setRegistration('');
    setModel('');
    setColour('');
    setSeatCapacity(4);
    setShowAddForm(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanReg = registration.toUpperCase().trim();
    if (!TN_PLATE_REGEX.test(cleanReg)) {
      setFormError('Registration must follow Tamil Nadu plate format, e.g. TN 09 AB 1234 or TN 01 C 5678.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingVehicleId) {
        await api.put(`/vehicles/${editingVehicleId}`, {
          type,
          registration: cleanReg,
          model,
          colour,
          seat_capacity: Number(seatCapacity),
        });
      } else {
        await api.post('/vehicles', {
          type,
          registration: cleanReg,
          model,
          colour,
          seat_capacity: Number(seatCapacity),
        });
      }
      resetForm();
      await fetchVehicles();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not delete vehicle');
    }
  };

  return (
    <div className="vehicles-page container">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">My Vehicles</h1>
          <p className="page-subtitle text-secondary">
            Vehicles you use for publishing commuter routes in Tamil Nadu
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
          >
            <Plus size={16} className="mr-1" aria-hidden="true" />
            Add vehicle
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="card vehicle-form-card mb-6">
          <h2 className="text-base font-bold mb-4">
            {editingVehicleId ? 'Edit vehicle' : 'Add a new vehicle'}
          </h2>

          {formError && (
            <div className="alert alert-error mb-4" role="alert">
              <AlertCircle size={16} className="mr-1 inline-icon" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="vehicle-form">
            <div className="form-grid-3">
              <div className="form-group">
                <label htmlFor="veh-type" className="form-label">
                  Vehicle type
                </label>
                <select
                  id="veh-type"
                  className="form-select"
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value as VehicleType)}
                >
                  <option value="bike">Bike (Two-wheeler)</option>
                  <option value="auto">Auto (Three-wheeler)</option>
                  <option value="cab">Cab / Car</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="veh-reg" className="form-label">
                  Registration number
                </label>
                <input
                  id="veh-reg"
                  type="text"
                  className="form-input font-mono"
                  placeholder="TN 09 AB 1234"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value)}
                  required
                />
                <span className="form-hint text-xs text-secondary">
                  Tamil Nadu plate (e.g. TN 09 AB 1234)
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="veh-capacity" className="form-label">
                  Passenger seat capacity
                </label>
                <input
                  id="veh-capacity"
                  type="number"
                  min={1}
                  max={10}
                  className="form-input"
                  value={seatCapacity}
                  onChange={(e) => setSeatCapacity(Number(e.target.value))}
                  required
                />
                <span className="form-hint text-xs text-secondary">
                  Excluding driver (Bike: 1, Auto: 3, Cab: 4 default)
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="veh-model" className="form-label">
                  Vehicle model
                </label>
                <input
                  id="veh-model"
                  type="text"
                  className="form-input"
                  placeholder="E.g. Maruti Dzire, Bajaj RE, Honda Activa"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="veh-colour" className="form-label">
                  Colour
                </label>
                <input
                  id="veh-colour"
                  type="text"
                  className="form-input"
                  placeholder="E.g. White, Yellow, Black"
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-actions mt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingVehicleId ? 'Update vehicle' : 'Add vehicle'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="page-loader">
          <div className="spinner" />
          <p>Loading your vehicles...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No vehicles registered yet"
          description="Add your bike, auto, or car to start publishing regular commute routes across Tamil Nadu."
          actionLabel="Add your first vehicle"
          onAction={() => setShowAddForm(true)}
        />
      ) : (
        <div className="vehicle-list-grid">
          {vehicles.map((v) => (
            <div key={v.id} className="card vehicle-card">
              <div className="vehicle-card-header flex-between">
                <VehicleBadge
                  type={v.type}
                  registration={v.registration}
                  capacity={v.seat_capacity}
                />
                <div className="vehicle-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    title="Edit vehicle"
                    onClick={() => handleStartEdit(v)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn text-error"
                    title="Delete vehicle"
                    onClick={() => handleDelete(v.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="vehicle-card-body text-sm mt-3">
                <p>
                  <strong className="text-secondary">Model:</strong> {v.model}
                </p>
                <p>
                  <strong className="text-secondary">Colour:</strong> {v.colour}
                </p>
                <p>
                  <strong className="text-secondary">Passenger capacity:</strong>{' '}
                  {v.seat_capacity} seat{v.seat_capacity > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
