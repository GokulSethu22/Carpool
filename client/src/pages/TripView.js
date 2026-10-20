import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// TripView.tsx — Live trip monitoring screen with status progression, contact access, and post-ride ratings.
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../lib/auth';
import { RouteMap } from '../components/RouteMap';
import { TripStatusBadge } from '../components/TripStatusBadge';
import { RatingStars } from '../components/RatingStars';
import { formatCurrency, formatTime, formatDate, formatPhone } from '../lib/format';
import { Phone, Shield, Star, CheckCircle, XCircle, Play, ArrowLeft, AlertCircle, } from 'lucide-react';
export const TripView = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null);
    const [route, setRoute] = useState(null);
    const [driverPhone, setDriverPhone] = useState(null);
    const [canViewContact, setCanViewContact] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Rating submission
    const [ratingScore, setRatingScore] = useState(5);
    const [ratingComment, setRatingComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);
    const [ratingSuccess, setRatingSuccess] = useState(false);
    const fetchTripData = async () => {
        try {
            setLoading(true);
            const bRes = await api.get(`/bookings/${id}`);
            setBooking(bRes.booking);
            const rRes = await api.get(`/routes/${bRes.booking.route_id}`);
            setRoute(rRes.route);
            setDriverPhone(rRes.driver_phone);
            setCanViewContact(rRes.can_view_contact);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load trip');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchTripData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
    const handleStartTrip = async () => {
        if (!route)
            return;
        try {
            await api.patch(`/trips/${route.id}/start`);
            await fetchTripData();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to start trip');
        }
    };
    const handleCompleteTrip = async () => {
        if (!route)
            return;
        try {
            await api.patch(`/trips/${route.id}/complete`);
            await fetchTripData();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to complete trip');
        }
    };
    const handleCancelBooking = async () => {
        if (!booking)
            return;
        if (!window.confirm('Are you sure you want to cancel this booking?'))
            return;
        try {
            await api.patch(`/bookings/${booking.id}/cancel`);
            await fetchTripData();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to cancel booking');
        }
    };
    const handleSubmitRating = async (e) => {
        e.preventDefault();
        if (!booking)
            return;
        setSubmittingRating(true);
        try {
            await api.post('/ratings', {
                booking_id: booking.id,
                score: ratingScore,
                comment: ratingComment.trim() || null,
            });
            setRatingSuccess(true);
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Rating submission failed');
        }
        finally {
            setSubmittingRating(false);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "page-loader", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading live trip status..." })] }));
    }
    if (!booking || !route) {
        return _jsx("div", { className: "alert alert-error container mt-6", children: "Trip record not found" });
    }
    const isDriver = user?.id === route.driver_id;
    const isRider = user?.id === booking.rider_id;
    return (_jsxs("div", { className: "map-page-layout", children: [_jsx("div", { className: "map-side-panel", children: _jsxs("div", { className: "panel-inner", children: [_jsxs("div", { className: "panel-header mb-4 flex-between", children: [_jsxs("div", { children: [_jsxs(Link, { to: "/dashboard", className: "text-secondary text-xs flex-center mb-1 link", children: [_jsx(ArrowLeft, { size: 12, className: "mr-1" }), "Back to dashboard"] }), _jsxs("h1", { className: "text-xl font-bold", children: ["Trip #", booking.id] }), _jsxs("p", { className: "text-secondary text-sm", children: [booking.pickup_name, " to ", booking.drop_name] })] }), _jsx(TripStatusBadge, { status: booking.status })] }), error && (_jsxs("div", { className: "alert alert-error mb-4", role: "alert", children: [_jsx(AlertCircle, { size: 16, className: "inline-icon mr-1" }), error] })), _jsxs("div", { className: "card trip-progress-card mb-4", children: [_jsx("h2", { className: "text-sm font-semibold mb-2", children: "Commute status" }), _jsxs("div", { className: "progress-steps-row", children: [_jsx("div", { className: `p-step ${['requested', 'confirmed', 'in_progress', 'completed'].includes(booking.status)
                                                ? 'is-done'
                                                : ''}`, children: _jsx("span", { children: "Requested" }) }), _jsx("div", { className: `p-step ${['confirmed', 'in_progress', 'completed'].includes(booking.status) ? 'is-done' : ''}`, children: _jsx("span", { children: "Confirmed" }) }), _jsx("div", { className: `p-step ${['in_progress', 'completed'].includes(booking.status) ? 'is-done' : ''}`, children: _jsx("span", { children: "In progress" }) }), _jsx("div", { className: `p-step ${booking.status === 'completed' ? 'is-done' : ''}`, children: _jsx("span", { children: "Completed" }) })] }), _jsxs("div", { className: "booking-summary-box text-sm mt-3 pt-3 border-top", children: [_jsxs("div", { className: "flex-between", children: [_jsx("span", { className: "text-secondary", children: "Departure:" }), _jsxs("span", { children: [formatDate(route.departure_time), " at ", formatTime(route.departure_time)] })] }), _jsxs("div", { className: "flex-between mt-1", children: [_jsx("span", { className: "text-secondary", children: "Seats reserved:" }), _jsx("span", { children: booking.seats_booked })] }), _jsxs("div", { className: "flex-between mt-1", children: [_jsx("span", { className: "text-secondary", children: "Your fare share:" }), _jsx("span", { className: "font-mono font-bold text-base-primary", children: formatCurrency(booking.fare) })] })] })] }), _jsxs("div", { className: "card contact-card mb-4", children: [_jsx("h2", { className: "text-sm font-semibold mb-2", children: "Trip participants" }), _jsxs("div", { className: "participant-row flex-between text-sm py-2", children: [_jsxs("div", { children: [_jsx("strong", { children: "Driver:" }), " ", route.driver_name] }), canViewContact && driverPhone ? (_jsxs("div", { className: "flex-center font-mono font-semibold", children: [_jsx(Phone, { size: 14, className: "mr-1 text-base-primary" }), formatPhone(driverPhone)] })) : (_jsxs("span", { className: "text-xs text-secondary flex-center", children: [_jsx(Shield, { size: 12, className: "mr-1" }), "Phone hidden"] }))] }), _jsxs("div", { className: "participant-row flex-between text-sm py-2 border-top", children: [_jsxs("div", { children: [_jsx("strong", { children: "Passenger:" }), " ", booking.rider_name] }), _jsxs("span", { className: "text-xs text-secondary", children: [booking.seats_booked, " seat"] })] })] }), isDriver && (_jsxs("div", { className: "driver-controls card mb-4", children: [_jsx("h2", { className: "text-sm font-semibold mb-2", children: "Driver trip actions" }), route.status === 'active' && (_jsxs("button", { type: "button", className: "btn btn-primary btn-sm btn-block mb-2", onClick: handleStartTrip, children: [_jsx(Play, { size: 14, className: "mr-1" }), "Start journey now"] })), route.status === 'in_progress' && (_jsxs("button", { type: "button", className: "btn btn-success btn-sm btn-block mb-2", onClick: handleCompleteTrip, children: [_jsx(CheckCircle, { size: 14, className: "mr-1" }), "Complete journey"] }))] })), isRider && ['requested', 'confirmed'].includes(booking.status) && (_jsx("div", { className: "rider-controls mb-4", children: _jsxs("button", { type: "button", className: "btn btn-danger btn-sm btn-block", onClick: handleCancelBooking, children: [_jsx(XCircle, { size: 14, className: "mr-1" }), "Cancel seat reservation"] }) })), booking.status === 'completed' && (_jsxs("div", { className: "rating-form-card card mb-4", children: [_jsxs("h2", { className: "text-base font-bold mb-2", children: [_jsx(Star, { size: 16, className: "text-accent inline-icon mr-1" }), ratingSuccess ? 'Rating submitted!' : 'Rate your journey'] }), ratingSuccess ? (_jsx("div", { className: "alert alert-success text-sm", children: "Thank you! Your feedback helps drivers and commuters across Tamil Nadu travel reliably." })) : (_jsxs("form", { onSubmit: handleSubmitRating, children: [_jsxs("div", { className: "form-group mb-3", children: [_jsx("label", { className: "form-label", children: "Overall rating (1 to 5 stars)" }), _jsx(RatingStars, { score: ratingScore, interactive: true, onChange: setRatingScore, size: 24 })] }), _jsxs("div", { className: "form-group mb-3", children: [_jsx("label", { htmlFor: "rating-comment", className: "form-label", children: "Feedback / Comments (optional)" }), _jsx("textarea", { id: "rating-comment", className: "form-input textarea", rows: 2, placeholder: "E.g. On-time pickup, polite driver, smooth driving on GST Road.", value: ratingComment, onChange: (e) => setRatingComment(e.target.value) })] }), _jsx("button", { type: "submit", className: "btn btn-primary btn-sm btn-block", disabled: submittingRating, children: submittingRating ? 'Submitting...' : 'Submit trip review' })] }))] }))] }) }), _jsx("div", { className: "map-surface", children: _jsx(RouteMap, { origin: { name: route.origin_name, lat: route.origin_lat, lng: route.origin_lng }, destination: { name: route.destination_name, lat: route.dest_lat, lng: route.dest_lng }, waypoints: route.waypoints, routeGeometry: route.route_geometry, pickup: { name: booking.pickup_name, lat: booking.pickup_lat, lng: booking.pickup_lng }, drop: { name: booking.drop_name, lat: booking.drop_lat, lng: booking.drop_lng }, height: "100%" }) })] }));
};
