// TripView.tsx — Live trip monitoring screen with status progression, contact access, and post-ride ratings.
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../lib/auth';
import { RouteMap } from '../components/RouteMap';
import { TripStatusBadge } from '../components/TripStatusBadge';
import { RatingStars } from '../components/RatingStars';
import { formatCurrency, formatTime, formatDate, formatPhone } from '../lib/format';
import {
  Phone,
  Shield,
  Star,
  CheckCircle,
  XCircle,
  Play,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import type { Booking, Route } from '../../../shared/types';

export const TripView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [driverPhone, setDriverPhone] = useState<string | null>(null);
  const [canViewContact, setCanViewContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rating submission
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const fetchTripData = async () => {
    try {
      setLoading(true);
      const bRes = await api.get<{ booking: Booking }>(`/bookings/${id}`);
      setBooking(bRes.booking);

      const rRes = await api.get<{
        route: Route;
        driver_phone: string | null;
        can_view_contact: boolean;
      }>(`/routes/${bRes.booking.route_id}`);
      setRoute(rRes.route);
      setDriverPhone(rRes.driver_phone);
      setCanViewContact(rRes.can_view_contact);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load trip');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStartTrip = async () => {
    if (!route) return;
    try {
      await api.patch(`/trips/${route.id}/start`);
      await fetchTripData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to start trip');
    }
  };

  const handleCompleteTrip = async () => {
    if (!route) return;
    try {
      await api.patch(`/trips/${route.id}/complete`);
      await fetchTripData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to complete trip');
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.patch(`/bookings/${booking.id}/cancel`);
      await fetchTripData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to cancel booking');
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setSubmittingRating(true);
    try {
      await api.post('/ratings', {
        booking_id: booking.id,
        score: ratingScore,
        comment: ratingComment.trim() || null,
      });
      setRatingSuccess(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Rating submission failed');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p>Loading live trip status...</p>
      </div>
    );
  }

  if (!booking || !route) {
    return <div className="alert alert-error container mt-6">Trip record not found</div>;
  }

  const isDriver = user?.id === route.driver_id;
  const isRider = user?.id === booking.rider_id;

  return (
    <div className="map-page-layout">
      {/* Side panel */}
      <div className="map-side-panel">
        <div className="panel-inner">
          <div className="panel-header mb-4 flex-between">
            <div>
              <Link to="/dashboard" className="text-secondary text-xs flex-center mb-1 link">
                <ArrowLeft size={12} className="mr-1" />
                Back to dashboard
              </Link>
              <h1 className="text-xl font-bold">Trip #{booking.id}</h1>
              <p className="text-secondary text-sm">
                {booking.pickup_name} to {booking.drop_name}
              </p>
            </div>
            <TripStatusBadge status={booking.status} />
          </div>

          {error && (
            <div className="alert alert-error mb-4" role="alert">
              <AlertCircle size={16} className="inline-icon mr-1" />
              {error}
            </div>
          )}

          {/* Trip Status Progress Card */}
          <div className="card trip-progress-card mb-4">
            <h2 className="text-sm font-semibold mb-2">Commute status</h2>
            <div className="progress-steps-row">
              <div
                className={`p-step ${
                  ['requested', 'confirmed', 'in_progress', 'completed'].includes(booking.status)
                    ? 'is-done'
                    : ''
                }`}
              >
                <span>Requested</span>
              </div>
              <div
                className={`p-step ${
                  ['confirmed', 'in_progress', 'completed'].includes(booking.status) ? 'is-done' : ''
                }`}
              >
                <span>Confirmed</span>
              </div>
              <div
                className={`p-step ${
                  ['in_progress', 'completed'].includes(booking.status) ? 'is-done' : ''
                }`}
              >
                <span>In progress</span>
              </div>
              <div className={`p-step ${booking.status === 'completed' ? 'is-done' : ''}`}>
                <span>Completed</span>
              </div>
            </div>

            <div className="booking-summary-box text-sm mt-3 pt-3 border-top">
              <div className="flex-between">
                <span className="text-secondary">Departure:</span>
                <span>
                  {formatDate(route.departure_time)} at {formatTime(route.departure_time)}
                </span>
              </div>
              <div className="flex-between mt-1">
                <span className="text-secondary">Seats reserved:</span>
                <span>{booking.seats_booked}</span>
              </div>
              <div className="flex-between mt-1">
                <span className="text-secondary">Your fare share:</span>
                <span className="font-mono font-bold text-base-primary">
                  {formatCurrency(booking.fare)}
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Safety */}
          <div className="card contact-card mb-4">
            <h2 className="text-sm font-semibold mb-2">Trip participants</h2>

            <div className="participant-row flex-between text-sm py-2">
              <div>
                <strong>Driver:</strong> {route.driver_name}
              </div>
              {canViewContact && driverPhone ? (
                <div className="flex-center font-mono font-semibold">
                  <Phone size={14} className="mr-1 text-base-primary" />
                  {formatPhone(driverPhone)}
                </div>
              ) : (
                <span className="text-xs text-secondary flex-center">
                  <Shield size={12} className="mr-1" />
                  Phone hidden
                </span>
              )}
            </div>

            <div className="participant-row flex-between text-sm py-2 border-top">
              <div>
                <strong>Passenger:</strong> {booking.rider_name}
              </div>
              <span className="text-xs text-secondary">{booking.seats_booked} seat</span>
            </div>
          </div>

          {/* Driver Controls */}
          {isDriver && (
            <div className="driver-controls card mb-4">
              <h2 className="text-sm font-semibold mb-2">Driver trip actions</h2>
              {route.status === 'active' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-block mb-2"
                  onClick={handleStartTrip}
                >
                  <Play size={14} className="mr-1" />
                  Start journey now
                </button>
              )}
              {route.status === 'in_progress' && (
                <button
                  type="button"
                  className="btn btn-success btn-sm btn-block mb-2"
                  onClick={handleCompleteTrip}
                >
                  <CheckCircle size={14} className="mr-1" />
                  Complete journey
                </button>
              )}
            </div>
          )}

          {/* Rider Cancel Option */}
          {isRider && ['requested', 'confirmed'].includes(booking.status) && (
            <div className="rider-controls mb-4">
              <button
                type="button"
                className="btn btn-danger btn-sm btn-block"
                onClick={handleCancelBooking}
              >
                <XCircle size={14} className="mr-1" />
                Cancel seat reservation
              </button>
            </div>
          )}

          {/* Post-ride Rating Form */}
          {booking.status === 'completed' && (
            <div className="rating-form-card card mb-4">
              <h2 className="text-base font-bold mb-2">
                <Star size={16} className="text-accent inline-icon mr-1" />
                {ratingSuccess ? 'Rating submitted!' : 'Rate your journey'}
              </h2>

              {ratingSuccess ? (
                <div className="alert alert-success text-sm">
                  Thank you! Your feedback helps drivers and commuters across Tamil Nadu travel reliably.
                </div>
              ) : (
                <form onSubmit={handleSubmitRating}>
                  <div className="form-group mb-3">
                    <label className="form-label">Overall rating (1 to 5 stars)</label>
                    <RatingStars
                      score={ratingScore}
                      interactive
                      onChange={setRatingScore}
                      size={24}
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="rating-comment" className="form-label">
                      Feedback / Comments (optional)
                    </label>
                    <textarea
                      id="rating-comment"
                      className="form-input textarea"
                      rows={2}
                      placeholder="E.g. On-time pickup, polite driver, smooth driving on GST Road."
                      value={ratingComment}
                      onChange={(e) => setRatingComment(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm btn-block"
                    disabled={submittingRating}
                  >
                    {submittingRating ? 'Submitting...' : 'Submit trip review'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map surface showing route + specific booking pickup & drop */}
      <div className="map-surface">
        <RouteMap
          origin={{ name: route.origin_name, lat: route.origin_lat, lng: route.origin_lng }}
          destination={{ name: route.destination_name, lat: route.dest_lat, lng: route.dest_lng }}
          waypoints={route.waypoints}
          routeGeometry={route.route_geometry}
          pickup={{ name: booking.pickup_name, lat: booking.pickup_lat, lng: booking.pickup_lng }}
          drop={{ name: booking.drop_name, lat: booking.drop_lat, lng: booking.drop_lng }}
          height="100%"
        />
      </div>
    </div>
  );
};
