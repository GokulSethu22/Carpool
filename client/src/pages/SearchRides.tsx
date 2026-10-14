// SearchRides.tsx — Map-first search interface matching commuter trips within 1.5 km of driver routes.
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { LocationInput, LocationValue } from '../components/LocationInput';
import { RouteMap } from '../components/RouteMap';
import { VehicleBadge } from '../components/VehicleBadge';
import { RatingStars } from '../components/RatingStars';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatTime, formatDate, formatDistance } from '../lib/format';
import { Search, Filter, AlertCircle, ArrowRight, Clock, Users } from 'lucide-react';
import type { SearchResult, VehicleType } from '../../../shared/types';

export const SearchRides: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search inputs
  const [pickup, setPickup] = useState<LocationValue | null>(() => {
    const lat = searchParams.get('pickup_lat');
    const lng = searchParams.get('pickup_lng');
    const name = searchParams.get('pickup_name');
    return lat && lng && name ? { lat: Number(lat), lng: Number(lng), name } : null;
  });

  const [drop, setDrop] = useState<LocationValue | null>(() => {
    const lat = searchParams.get('drop_lat');
    const lng = searchParams.get('drop_lng');
    const name = searchParams.get('drop_name');
    return lat && lng && name ? { lat: Number(lat), lng: Number(lng), name } : null;
  });

  const [date, setDate] = useState(() => searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>(
    (searchParams.get('vehicle_type') as VehicleType) || '',
  );
  const [seatsNeeded, setSeatsNeeded] = useState<number>(() => Number(searchParams.get('seats_needed')) || 1);

  // Results state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const executeSearch = async (
    p: LocationValue | null,
    d: LocationValue | null,
    travelDate: string,
    vType: string,
    seats: number,
  ) => {
    if (!p || !d) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const q = new URLSearchParams({
        pickup_lat: p.lat.toString(),
        pickup_lng: p.lng.toString(),
        drop_lat: d.lat.toString(),
        drop_lng: d.lng.toString(),
        date: travelDate,
        seats_needed: seats.toString(),
      });
      if (vType) q.set('vehicle_type', vType);

      const data = await api.get<{ results: SearchResult[]; count: number }>(`/search?${q.toString()}`);
      setResults(data.results);
      if (data.results.length > 0) {
        setSelectedRoute(data.results[0]);
      } else {
        setSelectedRoute(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to search for matching rides');
    } finally {
      setLoading(false);
    }
  };

  // Run search if URL already has pickup and drop
  useEffect(() => {
    if (pickup && drop) {
      executeSearch(pickup, drop, date, vehicleType, seatsNeeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !drop) {
      setError('Please provide both pickup and drop locations in Tamil Nadu.');
      return;
    }

    const params: Record<string, string> = {
      pickup_lat: pickup.lat.toString(),
      pickup_lng: pickup.lng.toString(),
      pickup_name: pickup.name,
      drop_lat: drop.lat.toString(),
      drop_lng: drop.lng.toString(),
      drop_name: drop.name,
      date,
      seats_needed: seatsNeeded.toString(),
    };
    if (vehicleType) params.vehicle_type = vehicleType;

    setSearchParams(params);
    executeSearch(pickup, drop, date, vehicleType, seatsNeeded);
  };

  return (
    <div className="map-page-layout">
      {/* Side search panel */}
      <div className="map-side-panel">
        <div className="panel-inner">
          <div className="panel-header mb-4">
            <h1 className="text-xl font-bold">Find a shared ride</h1>
            <p className="text-secondary text-sm">
              Connecting you with drivers travelling on your route across Tamil Nadu.
            </p>
          </div>

          {error && (
            <div className="alert alert-error mb-4" role="alert">
              <AlertCircle size={16} className="inline-icon mr-1" />
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="search-query-form card p-4 mb-4">
            <LocationInput
              id="search-pickup"
              label="Pickup location"
              placeholder="E.g. Tambaram Railway Station"
              value={pickup}
              onChange={setPickup}
              required
            />

            <LocationInput
              id="search-drop"
              label="Drop location"
              placeholder="E.g. T. Nagar Bus Stand"
              value={drop}
              onChange={setDrop}
              required
            />

            <div className="form-grid-3 mt-3">
              <div className="form-group">
                <label htmlFor="search-date" className="form-label">
                  Travel date
                </label>
                <input
                  id="search-date"
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="search-type" className="form-label">
                  Vehicle
                </label>
                <select
                  id="search-type"
                  className="form-select"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
                >
                  <option value="">Any vehicle</option>
                  <option value="bike">Bike (₹5/km avg)</option>
                  <option value="auto">Auto (₹12/km avg)</option>
                  <option value="cab">Cab (₹14/km avg)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="search-seats" className="form-label">
                  Seats
                </label>
                <input
                  id="search-seats"
                  type="number"
                  min={1}
                  max={6}
                  className="form-input"
                  value={seatsNeeded}
                  onChange={(e) => setSeatsNeeded(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block mt-3" disabled={loading}>
              <Search size={15} className="mr-1" aria-hidden="true" />
              {loading ? 'Finding matching routes...' : 'Search rides'}
            </button>
          </form>

          {/* Results list */}
          <div className="search-results-section">
            <div className="flex-between mb-2">
              <h2 className="text-sm font-semibold">
                {hasSearched ? `Matching rides (${results.length})` : 'Search to view available rides'}
              </h2>
              {results.length > 0 && (
                <span className="text-secondary text-xs flex-center">
                  <Filter size={12} className="mr-1" />
                  Sorted by detour & departure
                </span>
              )}
            </div>

            {loading ? (
              <div className="page-loader py-8">
                <div className="spinner" />
                <p className="text-sm">Matching routes along your path...</p>
              </div>
            ) : hasSearched && results.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No rides found along this route"
                description="We couldn't find a driver route passing within 1.5 km of both your pickup and drop points. Try adjusting your locations or search for a nearby major junction."
              />
            ) : (
              <div className="search-results-list">
                {results.map((ride) => {
                  const isSelected = selectedRoute?.id === ride.id;
                  return (
                    <article
                      key={ride.id}
                      className={`card result-card ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedRoute(ride)}
                      tabIndex={0}
                      role="button"
                      aria-pressed={isSelected}
                    >
                      <div className="result-card-top flex-between">
                        <div className="driver-info">
                          <span className="driver-name font-bold">{ride.driver_name}</span>
                          {ride.driver_rating ? (
                            <div className="flex-center text-xs">
                              <RatingStars score={Math.round(ride.driver_rating)} size={13} />
                              <span className="ml-1 text-secondary">({ride.driver_rating})</span>
                            </div>
                          ) : (
                            <span className="text-secondary text-xs">New driver</span>
                          )}
                        </div>

                        <div className="fare-badge">
                          <span className="fare-amount font-mono font-bold text-lg text-base-primary">
                            {formatCurrency(ride.estimated_fare)}
                          </span>
                          <span className="text-xs text-secondary">est. share</span>
                        </div>
                      </div>

                      <div className="result-vehicle-row mt-2">
                        {ride.vehicle && (
                          <VehicleBadge
                            type={ride.vehicle.type}
                            model={ride.vehicle.model}
                            colour={ride.vehicle.colour}
                          />
                        )}
                      </div>

                      <div className="result-route-stops mt-3 text-sm">
                        <div className="stop-line">
                          <span className="dot dot-origin" />
                          <span className="stop-name text-ellipsis">{ride.origin_name}</span>
                        </div>
                        {ride.waypoints.length > 0 && (
                          <div className="stop-line text-secondary text-xs">
                            <span className="dot dot-waypoint" />
                            <span>Via {ride.waypoints.map((w) => w.name).join(', ')}</span>
                          </div>
                        )}
                        <div className="stop-line">
                          <span className="dot dot-dest" />
                          <span className="stop-name text-ellipsis">{ride.destination_name}</span>
                        </div>
                      </div>

                      <div className="result-card-footer flex-between mt-3 text-xs text-secondary">
                        <div className="flex-center">
                          <Clock size={13} className="mr-1" />
                          <span>
                            {formatDate(ride.departure_time)}, {formatTime(ride.departure_time)}
                          </span>
                        </div>

                        <div className="flex-center">
                          <Users size={13} className="mr-1" />
                          <span>{ride.seats_available} seats left</span>
                        </div>
                      </div>

                      <div className="detour-meta text-xs text-secondary mt-1">
                        Detour from path: {formatDistance(ride.detour_km)} (pickup + drop)
                      </div>

                      <div className="card-action mt-3">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm btn-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/rides/${ride.id}`);
                          }}
                        >
                          View route & book seat
                          <ArrowRight size={14} className="ml-1" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map surface showing selected route and pickup/drop */}
      <div className="map-surface">
        {selectedRoute ? (
          <RouteMap
            origin={{
              name: selectedRoute.origin_name,
              lat: selectedRoute.origin_lat,
              lng: selectedRoute.origin_lng,
            }}
            destination={{
              name: selectedRoute.destination_name,
              lat: selectedRoute.dest_lat,
              lng: selectedRoute.dest_lng,
            }}
            waypoints={selectedRoute.waypoints}
            routeGeometry={selectedRoute.route_geometry}
            pickup={pickup ? { name: pickup.name, lat: pickup.lat, lng: pickup.lng } : undefined}
            drop={drop ? { name: drop.name, lat: drop.lat, lng: drop.lng } : undefined}
            height="100%"
          />
        ) : (
          <div className="empty-map-placeholder flex-center">
            <p className="text-secondary text-sm">
              Search for commuter routes above to visualize matches on the map
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
