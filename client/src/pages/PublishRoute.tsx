// PublishRoute.tsx — Map-first route publishing screen with OSRM polyline fetching and recurring day options.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { LocationInput, LocationValue } from '../components/LocationInput';
import { RouteMap } from '../components/RouteMap';
import { formatCurrency, formatDistance } from '../lib/format';
import { Plus, Trash2, MapPin, AlertCircle, Info } from 'lucide-react';
import { DEFAULT_PRICE_PER_KM } from '../../../shared/types';
import type { Vehicle, Waypoint } from '../../../shared/types';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PublishRoute: React.FC = () => {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Form state
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [origin, setOrigin] = useState<LocationValue | null>(null);
  const [destination, setDestination] = useState<LocationValue | null>(null);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [departureTime, setDepartureTime] = useState('08:30');
  const [isRecurring, setIsRecurring] = useState(true);
  const [recurringDays, setRecurringDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [seatsOffered, setSeatsOffered] = useState<number>(3);
  const [pricePerKm, setPricePerKm] = useState<number>(14);
  const [notes, setNotes] = useState('');

  // Routing preview state
  const [routeGeometry, setRouteGeometry] = useState<string>('');
  const [totalDistanceKm, setTotalDistanceKm] = useState<number | null>(null);
  const [fetchingRoute, setFetchingRoute] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load vehicles
  useEffect(() => {
    api.get<{ vehicles: Vehicle[] }>('/vehicles')
      .then((data) => {
        setVehicles(data.vehicles);
        if (data.vehicles.length > 0) {
          const first = data.vehicles[0];
          setSelectedVehicleId(first.id);
          setSeatsOffered(Math.min(first.seat_capacity, 3));
          setPricePerKm(DEFAULT_PRICE_PER_KM[first.type]);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not fetch vehicles');
      })
      .finally(() => setLoadingVehicles(false));
  }, []);

  // Update default price when vehicle changes
  const handleVehicleChange = (id: number) => {
    setSelectedVehicleId(id);
    const chosen = vehicles.find((v) => v.id === id);
    if (chosen) {
      setSeatsOffered(chosen.seat_capacity);
      setPricePerKm(DEFAULT_PRICE_PER_KM[chosen.type]);
    }
  };

  // Fetch route geometry from OSRM when origin or destination changes
  useEffect(() => {
    if (!origin || !destination) {
      setRouteGeometry('');
      setTotalDistanceKm(null);
      return;
    }

    setFetchingRoute(true);

    // Build coords: origin -> waypoints -> destination
    const coords: string[] = [`${origin.lng},${origin.lat}`];
    for (const wp of waypoints) {
      coords.push(`${wp.lng},${wp.lat}`);
    }
    coords.push(`${destination.lng},${destination.lat}`);

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords.join(
      ';',
    )}?overview=full&geometries=polyline`;

    fetch(osrmUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteGeometry(route.geometry);
          setTotalDistanceKm(route.distance / 1000); // meters to km
        }
      })
      .catch(() => {
        // Fallback gracefully: draw straight segments
        setRouteGeometry('');
      })
      .finally(() => {
        setFetchingRoute(false);
      });
  }, [origin, destination, waypoints]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedVehicleId) {
      setError('Please choose or register a vehicle.');
      return;
    }
    if (!origin || !destination) {
      setError('Please select both origin and destination.');
      return;
    }

    const departureIso = `${departureDate}T${departureTime}:00`;

    setSubmitting(true);
    try {
      const cleanWaypoints = waypoints.filter((wp) => wp.name && wp.lat !== 0);

      const res = await api.post<{ route: { id: number } }>('/routes', {
        vehicle_id: Number(selectedVehicleId),
        origin_name: origin.name,
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        destination_name: destination.name,
        dest_lat: destination.lat,
        dest_lng: destination.lng,
        waypoints: cleanWaypoints,
        route_geometry: routeGeometry,
        departure_time: departureIso,
        recurring_days: isRecurring ? recurringDays : null,
        seats_offered: Number(seatsOffered),
        price_per_km: Number(pricePerKm),
        notes: notes.trim() || null,
      });

      navigate(`/rides/${res.route.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to publish route.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <div className="map-page-layout">
      {/* Left / Bottom Panel: Form */}
      <div className="map-side-panel">
        <div className="panel-inner">
          <div className="panel-header mb-4">
            <h1 className="text-xl font-bold">Publish your route</h1>
            <p className="text-secondary text-sm">
              List an existing journey you make across Tamil Nadu so co-commuters can split the fare.
            </p>
          </div>

          {error && (
            <div className="alert alert-error mb-4" role="alert">
              <AlertCircle size={16} className="inline-icon mr-1" />
              {error}
            </div>
          )}

          {vehicles.length === 0 && !loadingVehicles && (
            <div className="alert alert-warning mb-4">
              <Info size={16} className="inline-icon mr-1" />
              You need to register a vehicle before publishing a route.{' '}
              <button
                type="button"
                className="link font-semibold"
                onClick={() => navigate('/vehicles')}
              >
                Add vehicle
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="route-publish-form">
            <div className="form-group">
              <label htmlFor="pub-vehicle" className="form-label">
                Vehicle <span className="text-error">*</span>
              </label>
              <select
                id="pub-vehicle"
                className="form-select"
                value={selectedVehicleId}
                onChange={(e) => handleVehicleChange(Number(e.target.value))}
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.type.toUpperCase()}: {v.registration} ({v.model}) — {v.seat_capacity} seats
                  </option>
                ))}
              </select>
            </div>

            <LocationInput
              id="pub-origin"
              label="Starting point (Origin)"
              placeholder="E.g. Tambaram Railway Station"
              value={origin}
              onChange={setOrigin}
              required
            />

            {/* Waypoints */}
            <div className="waypoints-section">
              <div className="flex-between mb-2">
                <span className="form-label mb-0">Intermediate stops / waypoints</span>
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
                      placeholder={`Stop ${idx + 1} (e.g. Guindy Junction)`}
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

            <LocationInput
              id="pub-dest"
              label="End point (Destination)"
              placeholder="E.g. T. Nagar Bus Stand"
              value={destination}
              onChange={setDestination}
              required
            />

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="pub-date" className="form-label">
                  First travel date
                </label>
                <input
                  id="pub-date"
                  type="date"
                  className="form-input"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pub-time" className="form-label">
                  Departure time (IST)
                </label>
                <input
                  id="pub-time"
                  type="time"
                  className="form-input"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Recurring days */}
            <div className="form-group">
              <label className="checkbox-label mb-2">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <span className="font-medium text-sm">Recurring daily/weekly commute</span>
              </label>

              {isRecurring && (
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
              )}
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="pub-seats" className="form-label">
                  Seats offered
                </label>
                <input
                  id="pub-seats"
                  type="number"
                  min={1}
                  max={currentVehicle?.seat_capacity || 4}
                  className="form-input"
                  value={seatsOffered}
                  onChange={(e) => setSeatsOffered(Number(e.target.value))}
                  required
                />
                <span className="form-hint text-xs text-secondary">
                  Max {currentVehicle?.seat_capacity || 4} for this vehicle
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="pub-price" className="form-label">
                  Price per km (₹)
                </label>
                <input
                  id="pub-price"
                  type="number"
                  min={1}
                  max={50}
                  step={0.5}
                  className="form-input font-mono"
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(Number(e.target.value))}
                  required
                />
                <span className="form-hint text-xs text-secondary">
                  Defaults — bike: ₹5, auto: ₹12, cab: ₹14
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pub-notes" className="form-label">
                Notes for commuters (optional)
              </label>
              <textarea
                id="pub-notes"
                className="form-input textarea"
                rows={2}
                placeholder="E.g. Leaving promptly at 8:30. AC on. Boots/luggage space limited."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {totalDistanceKm !== null && (
              <div className="route-summary-card card mb-4">
                <div className="flex-between text-sm">
                  <span className="text-secondary">Estimated route distance:</span>
                  <strong className="font-mono">{formatDistance(totalDistanceKm)}</strong>
                </div>
                <div className="flex-between text-sm mt-1">
                  <span className="text-secondary">Baseline vehicle cost (1 passenger):</span>
                  <strong className="font-mono text-base-primary">
                    {formatCurrency(totalDistanceKm * pricePerKm)}
                  </strong>
                </div>
                <p className="text-xs text-secondary mt-1">
                  * With 2 riders sharing, each rider's share drops by ~50% via automated segment splitting.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting || vehicles.length === 0}
            >
              {submitting ? 'Publishing route...' : 'Publish route'}
            </button>
          </form>
        </div>
      </div>

      {/* Right: Map surface */}
      <div className="map-surface">
        <div className="map-header-status">
          <MapPin size={14} className="text-accent" />
          <span>
            {fetchingRoute
              ? 'Computing route geometry along Tamil Nadu highways...'
              : totalDistanceKm !== null
                ? `Route path loaded: ${formatDistance(totalDistanceKm)}`
                : 'Select origin and destination to view route geometry'}
          </span>
        </div>
        <RouteMap
          origin={origin ? { name: origin.name, lat: origin.lat, lng: origin.lng } : undefined}
          destination={destination ? { name: destination.name, lat: destination.lat, lng: destination.lng } : undefined}
          waypoints={waypoints.filter((w) => w.lat !== 0)}
          routeGeometry={routeGeometry}
          height="100%"
        />
      </div>
    </div>
  );
};
