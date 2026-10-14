// RideDetail.tsx — Single route detail view with interactive seat booking and driver request management.
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../lib/auth';
import { RouteMap } from '../components/RouteMap';
import { VehicleBadge } from '../components/VehicleBadge';
import { RatingStars } from '../components/RatingStars';
import { TripStatusBadge } from '../components/TripStatusBadge';
import { LocationInput, LocationValue } from '../components/LocationInput';
import { formatCurrency, formatTime, formatDate, formatPhone } from '../lib/format';
import { estimateFare } from '../lib/fare';
import {
  Clock,
  Users,
  Shield,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flag,
  Edit,
  Play,
} from 'lucide-react';
import type { Route, Booking } from '../../../shared/types';

export const RideDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [route, setRoute] = useState<Route | null>(null);
  const [driverPhone, setDriverPhone] = useState<string | null>(null);
  const [canViewContact, setCanViewContact] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [userBooking, setUserBooking] = useState<Booking | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rider booking form state
  const [pickup, setPickup] = useState<LocationValue | null>(null);
  const [drop, setDrop] = useState<LocationValue | null>(null);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [requesting, setRequesting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Safety modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const fetchRouteData = async () => {
    try {
      setLoading(true);
      const data = await api.get<{
        route: Route;
        driver_phone: string | null;
        can_view_contact: boolean;
      }>(`/routes/${id}`);
      setRoute(data.route);
      setDriverPhone(data.driver_phone);
      setCanViewContact(data.can_view_contact);

      // Default pickup & drop to origin & destination for convenience
      setPickup({
        name: data.route.origin_name,
        lat: data.route.origin_lat,
        lng: data.route.origin_lng,
      });
      setDrop({
        name: data.route.destination_name,
        lat: data.route.dest_lat,
        lng: data.route.dest_lng,
      });

      // If current user is driver, fetch route bookings
      if (user && user.id === data.route.driver_id) {
        const bData = await api.get<{ bookings: Booking[] }>(`/bookings/route/${id}`);
        setBookings(bData.bookings);
      } else if (user) {
        // Check if user has an existing booking on this route
        const myBookings = await api.get<{ bookings: Booking[] }>('/bookings/mine');
        const active = myBookings.bookings.find((b) => b.route_id === Number(id));
        if (active) {
          setUserBooking(active);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not fetch route details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouteData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const handleRequestBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!pickup || !drop) {
      setError('Please provide pickup and drop locations.');
      return;
    }

    setRequesting(true);
    setError(null);

    try {
      const res = await api.post<{ booking: Booking }>('/bookings', {
        route_id: Number(id),
        pickup_name: pickup.name,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_name: drop.name,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        seats_booked: seatsToBook,
      });
      setUserBooking(res.booking);
      setBookingSuccess(true);
      await fetchRouteData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking request failed');
    } finally {
      setRequesting(false);
    }
  };

  const handleAcceptBooking = async (bookingId: number) => {
    try {
      await api.patch(`/bookings/${bookingId}/accept`);
      await fetchRouteData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to accept booking');
    }
  };

  const handleDeclineBooking = async (bookingId: number) => {
    try {
      await api.patch(`/bookings/${bookingId}/decline`);
      await fetchRouteData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to decline booking');
    }
  };

  const handleStartTrip = async () => {
    try {
      await api.patch(`/trips/${id}/start`);
      await fetchRouteData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to start trip');
    }
  };

  const handleCompleteTrip = async () => {
    try {
      await api.patch(`/trips/${id}/complete`);
      await fetchRouteData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to complete trip');
    }
  };

  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!route) return;
    try {
      await api.post('/reports', {
        reported_user_id: route.driver_id,
        reason: reportReason,
      });
      setShowReportModal(false);
      alert('Report submitted to safety team.');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to report user');
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p>Loading route specifications...</p>
      </div>
    );
  }

  if (!route) {
    return <div className="alert alert-error container mt-6">Route not found</div>;
  }

  const isDriver = user?.id === route.driver_id;
  const estimatedFareValue = estimateFare(15, route.price_per_km, 1) * seatsToBook;

  return (
    <div className="map-page-layout">
      {/* Side panel */}
      <div className="map-side-panel">
        <div className="panel-inner">
          <div className="panel-header mb-4 flex-between">
            <div>
              <span className="text-xs text-secondary font-mono">ROUTE #{route.id}</span>
              <h1 className="text-xl font-bold">
                {route.origin_name} to {route.destination_name}
              </h1>
            </div>
            <TripStatusBadge status={route.status} />
          </div>

          {error && (
            <div className="alert alert-error mb-4" role="alert">
              <AlertCircle size={16} className="inline-icon mr-1" />
              {error}
            </div>
          )}

          {bookingSuccess && (
            <div className="alert alert-success mb-4" role="alert">
              <CheckCircle size={16} className="inline-icon mr-1" />
              Seat requested! The driver has been notified and will review your request.
            </div>
          )}

          {/* Route Meta Card */}
          <div className="card route-specs-card mb-4">
            <div className="flex-between mb-3">
              <div>
                <span className="text-secondary text-xs">Driver</span>
                <p className="font-bold text-base">{route.driver_name}</p>
                {route.driver_rating ? (
                  <div className="flex-center mt-1">
                    <RatingStars score={Math.round(route.driver_rating)} size={14} />
                    <span className="text-secondary text-xs ml-1">
                      {route.driver_rating} rating
                    </span>
                  </div>
                ) : (
                  <span className="text-secondary text-xs">Verified driver</span>
                )}
              </div>

              <div className="text-right">
                <span className="text-secondary text-xs">Rate</span>
                <p className="font-mono font-bold text-lg text-base-primary">
                  ₹{route.price_per_km}/km
                </p>
                <span className="text-secondary text-xs">{route.seats_available} seats left</span>
              </div>
            </div>

            {route.vehicle && (
              <div className="mb-3">
                <VehicleBadge
                  type={route.vehicle.type}
                  registration={isDriver || canViewContact ? route.vehicle.registration : undefined}
                  model={route.vehicle.model}
                  colour={route.vehicle.colour}
                  capacity={route.vehicle.seat_capacity}
                />
              </div>
            )}

            <div className="route-timings text-sm text-secondary pt-2 border-top">
              <div className="flex-center mb-1">
                <Clock size={14} className="mr-2" />
                <span>
                  {formatDate(route.departure_time)} at {formatTime(route.departure_time)}
                </span>
              </div>
              {route.recurring_days && (
                <div className="flex-center">
                  <span className="text-xs">
                    Recurring on: <strong>{route.recurring_days.join(', ')}</strong>
                  </span>
                </div>
              )}
            </div>

            {route.notes && (
              <div className="route-notes-box text-sm mt-3 p-2 bg-surface-alt">
                <strong>Driver notes:</strong> {route.notes}
              </div>
            )}

            {/* Privacy contact status */}
            <div className="privacy-phone-row mt-3 text-sm flex-between">
              <div className="flex-center text-secondary">
                <Phone size={14} className="mr-1" />
                {canViewContact && driverPhone ? (
                  <span className="font-mono font-bold text-text">{formatPhone(driverPhone)}</span>
                ) : (
                  <span className="text-xs">Phone hidden until booking is confirmed</span>
                )}
              </div>
              <Shield size={14} className="text-base-primary" aria-label="Privacy protected" />
            </div>
          </div>

          {/* DRIVER VIEW: Incoming Booking Requests & Trip Actions */}
          {isDriver ? (
            <div className="driver-management-card card mb-4">
              <div className="flex-between mb-3">
                <h2 className="text-base font-bold">Manage this trip</h2>
                <Link to={`/routes/${id}/edit`} className="btn btn-secondary btn-xs">
                  <Edit size={12} className="mr-1" />
                  Edit route
                </Link>
              </div>

              {/* Status progression buttons */}
              <div className="trip-actions-row mb-4">
                {route.status === 'active' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm btn-block"
                    onClick={handleStartTrip}
                  >
                    <Play size={14} className="mr-1" />
                    Start trip (commute in progress)
                  </button>
                )}
                {route.status === 'in_progress' && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm btn-block"
                    onClick={handleCompleteTrip}
                  >
                    <CheckCircle size={14} className="mr-1" />
                    Mark trip completed
                  </button>
                )}
              </div>

              <h3 className="text-sm font-semibold mb-2">
                Passenger requests ({bookings.length})
              </h3>
              {bookings.length === 0 ? (
                <p className="text-secondary text-sm">No seat requests for this route yet.</p>
              ) : (
                <div className="requests-list">
                  {bookings.map((b) => (
                    <div key={b.id} className="request-card p-3 border mb-2">
                      <div className="flex-between">
                        <div>
                          <strong>{b.rider_name}</strong>
                          <span className="text-secondary text-xs ml-2">
                            ({b.seats_booked} seat{b.seats_booked > 1 ? 's' : ''})
                          </span>
                        </div>
                        <TripStatusBadge status={b.status} />
                      </div>

                      <div className="text-xs text-secondary mt-1">
                        <div>From: {b.pickup_name}</div>
                        <div>To: {b.drop_name}</div>
                        <div className="font-mono mt-1 font-bold">Fare: {formatCurrency(b.fare)}</div>
                      </div>

                      {b.status === 'requested' && (
                        <div className="request-actions flex-gap-2 mt-2">
                          <button
                            type="button"
                            className="btn btn-primary btn-xs flex-grow"
                            onClick={() => handleAcceptBooking(b.id)}
                          >
                            <CheckCircle size={12} className="mr-1" />
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-xs flex-grow"
                            onClick={() => handleDeclineBooking(b.id)}
                          >
                            <XCircle size={12} className="mr-1" />
                            Decline
                          </button>
                        </div>
                      )}

                      {b.status === 'confirmed' && (
                        <div className="mt-2 text-xs text-success font-medium">
                          Confirmed &bull; Seat reserved
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : userBooking ? (
            /* RIDER VIEW: Existing Booking State */
            <div className="user-booking-status-card card mb-4">
              <div className="flex-between mb-2">
                <h2 className="text-base font-bold">Your booking status</h2>
                <TripStatusBadge status={userBooking.status} />
              </div>

              <div className="booking-details text-sm mb-3">
                <p>
                  <strong>Pickup:</strong> {userBooking.pickup_name}
                </p>
                <p>
                  <strong>Drop:</strong> {userBooking.drop_name}
                </p>
                <p>
                  <strong>Seats:</strong> {userBooking.seats_booked}
                </p>
                <p>
                  <strong>Estimated fare share:</strong>{' '}
                  <span className="font-mono font-bold text-base-primary">
                    {formatCurrency(userBooking.fare)}
                  </span>
                </p>
              </div>

              {userBooking.status === 'confirmed' && (
                <div className="alert alert-success text-xs mb-3">
                  Driver confirmed your request! Please be at {userBooking.pickup_name} 5 mins before departure.
                </div>
              )}

              <div className="flex-gap-2">
                <Link to={`/trips/${userBooking.id}`} className="btn btn-primary btn-sm flex-grow">
                  View live trip
                </Link>
                {['requested', 'confirmed'].includes(userBooking.status) && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={async () => {
                      if (window.confirm('Cancel this booking?')) {
                        await api.patch(`/bookings/${userBooking.id}/cancel`);
                        await fetchRouteData();
                      }
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* RIDER VIEW: Seat Booking Form */
            <div className="rider-booking-card card mb-4">
              <h2 className="text-base font-bold mb-3">Request a seat along this path</h2>

              {route.seats_available <= 0 ? (
                <div className="alert alert-warning text-sm">
                  This route is currently full. All {route.seats_offered} seats have been booked.
                </div>
              ) : route.status !== 'active' ? (
                <div className="alert alert-warning text-sm">
                  This route is currently {route.status} and not accepting new passengers.
                </div>
              ) : (
                <form onSubmit={handleRequestBooking} className="booking-form">
                  <LocationInput
                    id="book-pickup"
                    label="Your pickup spot"
                    value={pickup}
                    onChange={setPickup}
                    required
                  />

                  <LocationInput
                    id="book-drop"
                    label="Your drop spot"
                    value={drop}
                    onChange={setDrop}
                    required
                  />

                  <div className="form-group mt-3">
                    <label htmlFor="book-seats" className="form-label">
                      Number of seats needed
                    </label>
                    <input
                      id="book-seats"
                      type="number"
                      min={1}
                      max={route.seats_available}
                      className="form-input"
                      value={seatsToBook}
                      onChange={(e) => setSeatsToBook(Number(e.target.value))}
                      required
                    />
                    <span className="form-hint text-xs text-secondary">
                      {route.seats_available} seat{route.seats_available > 1 ? 's' : ''} available
                    </span>
                  </div>

                  <div className="fare-estimate-box card p-3 my-3 bg-surface-alt">
                    <div className="flex-between">
                      <span className="text-sm font-medium">Estimated fare split:</span>
                      <strong className="font-mono text-base-primary text-lg">
                        {formatCurrency(estimatedFareValue)}
                      </strong>
                    </div>
                    <span className="text-xs text-secondary">
                      Final fare computed on the server based on exact segment distance and passenger count.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={requesting}
                  >
                    <Users size={15} className="mr-1" />
                    {requesting ? 'Submitting request...' : `Request ${seatsToBook} seat(s)`}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Safety & Report links */}
          <div className="safety-section text-center pt-2">
            <button
              type="button"
              className="text-xs text-secondary link flex-center mx-auto"
              onClick={() => setShowReportModal(true)}
            >
              <Flag size={12} className="mr-1" />
              Report this driver or route
            </button>
          </div>
        </div>
      </div>

      {/* Map surface */}
      <div className="map-surface">
        <RouteMap
          origin={{ name: route.origin_name, lat: route.origin_lat, lng: route.origin_lng }}
          destination={{ name: route.destination_name, lat: route.dest_lat, lng: route.dest_lng }}
          waypoints={route.waypoints}
          routeGeometry={route.route_geometry}
          pickup={pickup ? { name: pickup.name, lat: pickup.lat, lng: pickup.lng } : undefined}
          drop={drop ? { name: drop.name, lat: drop.lat, lng: drop.lng } : undefined}
          height="100%"
        />
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content card">
            <h3 className="font-bold text-base mb-2">Report User</h3>
            <p className="text-secondary text-sm mb-3">
              Help keep our commuter community safe in Tamil Nadu.
            </p>
            <form onSubmit={handleReportUser}>
              <textarea
                className="form-input textarea mb-3"
                rows={3}
                placeholder="Reason for report (minimum 5 characters)..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
                minLength={5}
              />
              <div className="flex-gap-2">
                <button type="submit" className="btn btn-danger btn-sm">
                  Submit report
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
