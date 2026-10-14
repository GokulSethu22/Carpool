// EditRoute.tsx — Driver editing screen for updating stops, notes, seats, and pausing/cancelling routes.
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { LocationInput, LocationValue } from '../components/LocationInput';
import { RouteMap } from '../components/RouteMap';
import { TripStatusBadge } from '../components/TripStatusBadge';
import { Plus, Trash2, PauseCircle, PlayCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Route, Waypoint, RouteStatus } from '../../../shared/types';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const EditRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [seatsOffered, setSeatsOffered] = useState(3);
  const [pricePerKm, setPricePerKm] = useState(14);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<{ route: Route }>(`/routes/${id}`)
      .then((data) => {
        setRoute(data.route);
        setWaypoints(data.route.waypoints || []);
        if (data.route.departure_time) {
          const [d, t] = data.route.departure_time.split('T');
          setDepartureDate(d || '');
          setDepartureTime(t ? t.slice(0, 5) : '08:30');
        }
        setRecurringDays(data.route.recurring_days || []);
        setSeatsOffered(data.route.seats_offered);
        setPricePerKm(data.route.price_per_km);
        setNotes(data.route.notes || '');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load route');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddWaypoint = () => {
    setWaypoints((prev) => [...prev, { name: '', lat: 0, lng: 0 }]);
  };

  const handleUpdateWaypoint = (index: number, loc: LocationValue) => {
    setWaypoints((prev) => {
      const copy = [...prev];
      copy[index] = { name: loc.name, lat: loc.lat, lng: loc.lng };
      return copy;
    });
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDay = (day: string) => {
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleStatusChange = async (newStatus: RouteStatus) => {
    if (newStatus === 'cancelled' && !window.confirm('Cancelling will decline all pending bookings and notify riders. Proceed?')) {
      return;
    }
    try {
      const res = await api.patch<{ route: Route }>(`/routes/${id}/status`, { status: newStatus });
      setRoute(res.route);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const departureIso = `${departureDate}T${departureTime}:00`;
      const cleanWaypoints = waypoints.filter((w) => w.name && w.lat !== 0);

      const res = await api.put<{ route: Route }>(`/routes/${id}`, {
        waypoints: cleanWaypoints,
        departure_time: departureIso,
        recurring_days: recurringDays.length > 0 ? recurringDays : null,
        seats_offered: Number(seatsOffered),
        price_per_km: Number(pricePerKm),
        notes: notes.trim() || null,
      });

      setRoute(res.route);
      navigate(`/rides/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update route.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p>Loading route details...</p>
      </div>
    );
  }

  if (!route) {
    return <div className="alert alert-error container mt-6">Route not found</div>;
  }

  return (
    <div className="map-page-layout">
      <div className="map-side-panel">
        <div className="panel-inner">
          <div className="panel-header mb-4 flex-between">
            <div>
              <h1 className="text-xl font-bold">Edit route #{route.id}</h1>
              <p className="text-secondary text-sm">
                {route.origin_name} to {route.destination_name}
              </p>
            </div>
            <TripStatusBadge status={route.status} />
          </div>

          {error && (
            <div className="alert alert-error mb-4" role="alert">
              <AlertCircle size={16} className="inline-icon mr-1" />
              {error}
            </div>
          )}

          {/* Quick status actions */}
          <div className="status-toolbar card p-3 mb-4 flex-between">
            <span className="text-sm font-semibold">Route control:</span>
            <div className="flex-gap-2">
              {route.status === 'active' && (
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => handleStatusChange('paused')}
                >
                  <PauseCircle size={14} className="mr-1" />
                  Pause
                </button>
              )}
              {route.status === 'paused' && (
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => handleStatusChange('active')}
                >
                  <PlayCircle size={14} className="mr-1" />
                  Resume
                </button>
              )}
              {route.status !== 'cancelled' && route.status !== 'completed' && (
                <button
                  type="button"
                  className="btn btn-danger btn-xs"
                  onClick={() => handleStatusChange('cancelled')}
                >
                  <XCircle size={14} className="mr-1" />
                  Cancel route
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="route-edit-form">
            <div className="waypoints-section mb-4">
              <div className="flex-between mb-2">
                <span className="form-label mb-0">Waypoints / stops</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={handleAddWaypoint}
                >
                  <Plus size={12} className="mr-1" />
                  Add stop
                </button>
              </div>

              {waypoints.map((wp, idx) => (
                <div key={idx} className="waypoint-row mb-2">
                  <div className="flex-grow">
                    <LocationInput
                      placeholder={`Stop ${idx + 1}`}
                      value={wp.name ? { name: wp.name, lat: wp.lat, lng: wp.lng } : null}
                      onChange={(loc) => handleUpdateWaypoint(idx, loc)}
                    />
                  </div>
                  <button
                    type="button"
                    className="icon-btn text-error ml-2"
                    title="Remove stop"
                    onClick={() => handleRemoveWaypoint(idx)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="edit-date" className="form-label">
                  Departure date
                </label>
                <input
                  id="edit-date"
                  type="date"
                  className="form-input"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-time" className="form-label">
                  Departure time
                </label>
                <input
                  id="edit-time"
                  type="time"
                  className="form-input"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <span className="form-label">Recurring days</span>
              <div className="days-selector-chips">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`day-chip ${recurringDays.includes(day) ? 'is-selected' : ''}`}
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="edit-seats" className="form-label">
                  Total seats offered
                </label>
                <input
                  id="edit-seats"
                  type="number"
                  min={1}
                  max={route.vehicle?.seat_capacity || 6}
                  className="form-input"
                  value={seatsOffered}
                  onChange={(e) => setSeatsOffered(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-price" className="form-label">
                  Price per km (₹)
                </label>
                <input
                  id="edit-price"
                  type="number"
                  min={1}
                  max={50}
                  step={0.5}
                  className="form-input"
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-notes" className="form-label">
                Driver notes
              </label>
              <textarea
                id="edit-notes"
                className="form-input textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="form-actions mt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving changes...' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/rides/${id}`)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="map-surface">
        <RouteMap
          origin={{ name: route.origin_name, lat: route.origin_lat, lng: route.origin_lng }}
          destination={{ name: route.destination_name, lat: route.dest_lat, lng: route.dest_lng }}
          waypoints={waypoints.filter((w) => w.lat !== 0)}
          routeGeometry={route.route_geometry}
          height="100%"
        />
      </div>
    </div>
  );
};
