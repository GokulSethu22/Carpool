// Dashboard.tsx — User dashboard with earnings/savings metrics, published routes, active bookings, and history.
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { TripStatusBadge } from '../components/TripStatusBadge';
import { VehicleBadge } from '../components/VehicleBadge';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatDate, formatTime } from '../lib/format';
import {
  Car,
  Calendar,
  History,
  TrendingUp,
  Wallet,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import type { Route, Booking, DashboardStats } from '../../../shared/types';

export const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'routes';
  const [activeTab, setActiveTab] = useState<'routes' | 'bookings' | 'history'>(
    initialTab as 'routes' | 'bookings' | 'history',
  );

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, routesRes, bookingsRes] = await Promise.all([
        api.get<{ stats: DashboardStats }>('/dashboard/stats'),
        api.get<{ routes: Route[] }>('/routes/mine'),
        api.get<{ bookings: Booking[] }>('/bookings/mine'),
      ]);
      setStats(statsRes.stats);
      setRoutes(routesRes.routes);
      setBookings(bookingsRes.bookings);
    } catch {
      // quiet fail / handle in UI
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const activeBookings = bookings.filter((b) => ['requested', 'confirmed', 'in_progress'].includes(b.status));
  const historyBookings = bookings.filter((b) => ['completed', 'cancelled', 'declined'].includes(b.status));

  return (
    <div className="dashboard-page container py-6">
      <div className="page-header flex-between mb-6">
        <div>
          <h1 className="page-title text-2xl font-bold">Commuter Dashboard</h1>
          <p className="page-subtitle text-secondary">
            Your regular Tamil Nadu routes, shared rides, and commuter savings
          </p>
        </div>
        <div className="dashboard-quick-actions flex-gap-2">
          <Link to="/publish" className="btn btn-primary btn-sm">
            <PlusCircle size={15} className="mr-1" />
            Publish route
          </Link>
          <Link to="/search" className="btn btn-secondary btn-sm">
            Find rides
          </Link>
        </div>
      </div>

      {/* Top metrics summary */}
      <div className="stats-grid mb-6">
        <div className="stat-card card">
          <div className="stat-icon-wrapper bg-teal-subtle">
            <Wallet size={20} className="text-base-primary" />
          </div>
          <div className="stat-details">
            <span className="stat-label text-xs text-secondary">Driver earnings</span>
            <p className="stat-value font-mono font-bold text-xl">
              {formatCurrency(stats?.total_earned || 0)}
            </p>
            <span className="stat-sub text-xs text-secondary">
              {stats?.rides_as_driver || 0} trips completed
            </span>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon-wrapper bg-amber-subtle">
            <TrendingUp size={20} className="text-accent" />
          </div>
          <div className="stat-details">
            <span className="stat-label text-xs text-secondary">Rider fare share</span>
            <p className="stat-value font-mono font-bold text-xl">
              {formatCurrency(stats?.total_saved || 0)}
            </p>
            <span className="stat-sub text-xs text-secondary">
              {stats?.rides_as_rider || 0} shared commutes
            </span>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon-wrapper bg-teal-subtle">
            <Users size={20} className="text-base-primary" />
          </div>
          <div className="stat-details">
            <span className="stat-label text-xs text-secondary">Active routes</span>
            <p className="stat-value font-mono font-bold text-xl">
              {routes.filter((r) => r.status === 'active').length}
            </p>
            <span className="stat-sub text-xs text-secondary">Published by you</span>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon-wrapper bg-amber-subtle">
            <CheckCircle size={20} className="text-accent" />
          </div>
          <div className="stat-details">
            <span className="stat-label text-xs text-secondary">Active bookings</span>
            <p className="stat-value font-mono font-bold text-xl">{activeBookings.length}</p>
            <span className="stat-sub text-xs text-secondary">Seats reserved</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs-bar mb-4">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'routes' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          <Car size={15} className="mr-1 inline-icon" />
          My Published Routes ({routes.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'bookings' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <Calendar size={15} className="mr-1 inline-icon" />
          My Bookings ({activeBookings.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'history' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={15} className="mr-1 inline-icon" />
          History ({historyBookings.length})
        </button>
      </div>

      {/* Content based on tab */}
      {loading ? (
        <div className="page-loader py-12">
          <div className="spinner" />
          <p>Loading dashboard details...</p>
        </div>
      ) : activeTab === 'routes' ? (
        routes.length === 0 ? (
          <EmptyState
            icon={Car}
            title="You haven't published any routes"
            description="If you commute regularly across Tamil Nadu, publish your route to offer empty seats and split petrol or fuel costs."
            actionLabel="Publish your first route"
            onAction={() => (window.location.href = '/publish')}
          />
        ) : (
          <div className="routes-list-grid">
            {routes.map((r) => (
              <div key={r.id} className="card route-item-card">
                <div className="flex-between mb-2">
                  <div className="flex-center">
                    <span className="text-xs text-secondary font-mono mr-2">#{r.id}</span>
                    <TripStatusBadge status={r.status} />
                  </div>
                  <span className="font-mono font-bold text-base-primary">
                    ₹{r.price_per_km}/km
                  </span>
                </div>

                <h3 className="font-bold text-base mb-1">
                  {r.origin_name} &rarr; {r.destination_name}
                </h3>

                {r.vehicle && (
                  <div className="my-2">
                    <VehicleBadge
                      type={r.vehicle.type}
                      registration={r.vehicle.registration}
                      model={r.vehicle.model}
                      capacity={r.vehicle.seat_capacity}
                    />
                  </div>
                )}

                <div className="route-item-meta text-xs text-secondary my-2">
                  <div className="flex-center mb-1">
                    <Clock size={12} className="mr-1" />
                    <span>
                      {formatDate(r.departure_time)} at {formatTime(r.departure_time)}
                    </span>
                  </div>
                  <div>
                    {r.seats_available} of {r.seats_offered} seats available
                  </div>
                </div>

                <div className="route-card-actions flex-gap-2 mt-3 pt-2 border-top">
                  <Link to={`/rides/${r.id}`} className="btn btn-primary btn-xs flex-grow">
                    View & manage requests
                  </Link>
                  <Link to={`/routes/${r.id}/edit`} className="btn btn-secondary btn-xs">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'bookings' ? (
        activeBookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No active bookings"
            description="You don't have any pending or confirmed seat reservations. Search for routes along your commute to request a seat."
            actionLabel="Find a ride"
            onAction={() => (window.location.href = '/search')}
          />
        ) : (
          <div className="bookings-list-grid">
            {activeBookings.map((b) => (
              <div key={b.id} className="card booking-item-card">
                <div className="flex-between mb-2">
                  <span className="text-xs text-secondary font-mono">BOOKING #{b.id}</span>
                  <TripStatusBadge status={b.status} />
                </div>

                <h3 className="font-bold text-base mb-1">
                  {b.pickup_name} &rarr; {b.drop_name}
                </h3>

                <p className="text-xs text-secondary mb-2">Driver: {b.driver_name}</p>

                <div className="booking-meta text-sm flex-between my-2 p-2 bg-surface-alt">
                  <span>Seats: {b.seats_booked}</span>
                  <span className="font-mono font-bold text-base-primary">
                    {formatCurrency(b.fare)}
                  </span>
                </div>

                <div className="booking-card-actions flex-gap-2 mt-3">
                  <Link to={`/trips/${b.id}`} className="btn btn-primary btn-xs flex-grow">
                    Live trip view
                    <ArrowRight size={13} className="ml-1" />
                  </Link>
                  <Link to={`/rides/${b.route_id}`} className="btn btn-secondary btn-xs">
                    Route info
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* History tab */
        historyBookings.length === 0 ? (
          <EmptyState
            icon={History}
            title="No trip history yet"
            description="Once you complete rides as a passenger or driver, your trip history and reviews will appear here."
          />
        ) : (
          <div className="history-list-grid">
            {historyBookings.map((b) => (
              <div key={b.id} className="card history-item-card">
                <div className="flex-between mb-2">
                  <span className="text-xs text-secondary">{formatDate(b.created_at)}</span>
                  <TripStatusBadge status={b.status} />
                </div>

                <h3 className="font-medium text-sm">
                  {b.pickup_name} &rarr; {b.drop_name}
                </h3>
                <p className="text-xs text-secondary">Driver: {b.driver_name}</p>

                <div className="flex-between mt-2 pt-2 border-top text-xs">
                  <span>{b.seats_booked} seat(s)</span>
                  <span className="font-mono font-bold">{formatCurrency(b.fare)}</span>
                </div>

                {b.status === 'completed' && (
                  <div className="mt-3">
                    <Link to={`/trips/${b.id}`} className="btn btn-secondary btn-xs btn-block">
                      View details or review
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
