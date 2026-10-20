import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// RideDetail.tsx — Single route detail view with interactive seat booking and driver request management.
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../lib/auth';
import { RouteMap } from '../components/RouteMap';
import { VehicleBadge } from '../components/VehicleBadge';
import { RatingStars } from '../components/RatingStars';
import { TripStatusBadge } from '../components/TripStatusBadge';
import { LocationInput } from '../components/LocationInput';
import { formatCurrency, formatTime, formatDate, formatPhone } from '../lib/format';
import { estimateFare } from '../lib/fare';
import { Clock, Users, Shield, Phone, CheckCircle, XCircle, AlertCircle, Flag, Edit, Play, } from 'lucide-react';
export const RideDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [route, setRoute] = useState(null);
    const [driverPhone, setDriverPhone] = useState(null);
    const [canViewContact, setCanViewContact] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [userBooking, setUserBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Rider booking form state
    const [pickup, setPickup] = useState(null);
    const [drop, setDrop] = useState(null);
    const [seatsToBook, setSeatsToBook] = useState(1);
    const [requesting, setRequesting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    // Safety modal
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const fetchRouteData = async () => {
        try {
            setLoading(true);
            const data = await api.get(`/routes/${id}`);
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
                const bData = await api.get(`/bookings/route/${id}`);
                setBookings(bData.bookings);
            }
            else if (user) {
                // Check if user has an existing booking on this route
                const myBookings = await api.get('/bookings/mine');
                const active = myBookings.bookings.find((b) => b.route_id === Number(id));
                if (active) {
                    setUserBooking(active);
                }
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Could not fetch route details');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchRouteData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, user]);
    const handleRequestBooking = async (e) => {
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
            const res = await api.post('/bookings', {
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Booking request failed');
        }
        finally {
            setRequesting(false);
        }
    };
    const handleAcceptBooking = async (bookingId) => {
        try {
            await api.patch(`/bookings/${bookingId}/accept`);
            await fetchRouteData();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to accept booking');
        }
    };
    const handleDeclineBooking = async (bookingId) => {
        try {
            await api.patch(`/bookings/${bookingId}/decline`);
            await fetchRouteData();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to decline booking');
        }
    };
    const handleStartTrip = async () => {
        try {
            await api.patch(`/trips/${id}/start`);
            await fetchRouteData();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to start trip');
        }
    };
    const handleCompleteTrip = async () => {
        try {
            await api.patch(`/trips/${id}/complete`);
            await fetchRouteData();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to complete trip');
        }
    };
    const handleReportUser = async (e) => {
        e.preventDefault();
        if (!route)
            return;
        try {
            await api.post('/reports', {
                reported_user_id: route.driver_id,
                reason: reportReason,
            });
            setShowReportModal(false);
            alert('Report submitted to safety team.');
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to report user');
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "page-loader", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading route specifications..." })] }));
    }
    if (!route) {
        return _jsx("div", { className: "alert alert-error container mt-6", children: "Route not found" });
    }
    const isDriver = user?.id === route.driver_id;
    const estimatedFareValue = estimateFare(15, route.price_per_km, 1) * seatsToBook;
    return (_jsxs("div", { className: "map-page-layout", children: [_jsx("div", { className: "map-side-panel", children: _jsxs("div", { className: "panel-inner", children: [_jsxs("div", { className: "panel-header mb-4 flex-between", children: [_jsxs("div", { children: [_jsxs("span", { className: "text-xs text-secondary font-mono", children: ["ROUTE #", route.id] }), _jsxs("h1", { className: "text-xl font-bold", children: [route.origin_name, " to ", route.destination_name] })] }), _jsx(TripStatusBadge, { status: route.status })] }), error && (_jsxs("div", { className: "alert alert-error mb-4", role: "alert", children: [_jsx(AlertCircle, { size: 16, className: "inline-icon mr-1" }), error] })), bookingSuccess && (_jsxs("div", { className: "alert alert-success mb-4", role: "alert", children: [_jsx(CheckCircle, { size: 16, className: "inline-icon mr-1" }), "Seat requested! The driver has been notified and will review your request."] })), _jsxs("div", { className: "card route-specs-card mb-4", children: [_jsxs("div", { className: "flex-between mb-3", children: [_jsxs("div", { children: [_jsx("span", { className: "text-secondary text-xs", children: "Driver" }), _jsx("p", { className: "font-bold text-base", children: route.driver_name }), route.driver_rating ? (_jsxs("div", { className: "flex-center mt-1", children: [_jsx(RatingStars, { score: Math.round(route.driver_rating), size: 14 }), _jsxs("span", { className: "text-secondary text-xs ml-1", children: [route.driver_rating, " rating"] })] })) : (_jsx("span", { className: "text-secondary text-xs", children: "Verified driver" }))] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "text-secondary text-xs", children: "Rate" }), _jsxs("p", { className: "font-mono font-bold text-lg text-base-primary", children: ["\u20B9", route.price_per_km, "/km"] }), _jsxs("span", { className: "text-secondary text-xs", children: [route.seats_available, " seats left"] })] })] }), route.vehicle && (_jsx("div", { className: "mb-3", children: _jsx(VehicleBadge, { type: route.vehicle.type, registration: isDriver || canViewContact ? route.vehicle.registration : undefined, model: route.vehicle.model, colour: route.vehicle.colour, capacity: route.vehicle.seat_capacity }) })), _jsxs("div", { className: "route-timings text-sm text-secondary pt-2 border-top", children: [_jsxs("div", { className: "flex-center mb-1", children: [_jsx(Clock, { size: 14, className: "mr-2" }), _jsxs("span", { children: [formatDate(route.departure_time), " at ", formatTime(route.departure_time)] })] }), route.recurring_days && (_jsx("div", { className: "flex-center", children: _jsxs("span", { className: "text-xs", children: ["Recurring on: ", _jsx("strong", { children: route.recurring_days.join(', ') })] }) }))] }), route.notes && (_jsxs("div", { className: "route-notes-box text-sm mt-3 p-2 bg-surface-alt", children: [_jsx("strong", { children: "Driver notes:" }), " ", route.notes] })), _jsxs("div", { className: "privacy-phone-row mt-3 text-sm flex-between", children: [_jsxs("div", { className: "flex-center text-secondary", children: [_jsx(Phone, { size: 14, className: "mr-1" }), canViewContact && driverPhone ? (_jsx("span", { className: "font-mono font-bold text-text", children: formatPhone(driverPhone) })) : (_jsx("span", { className: "text-xs", children: "Phone hidden until booking is confirmed" }))] }), _jsx(Shield, { size: 14, className: "text-base-primary", "aria-label": "Privacy protected" })] })] }), isDriver ? (_jsxs("div", { className: "driver-management-card card mb-4", children: [_jsxs("div", { className: "flex-between mb-3", children: [_jsx("h2", { className: "text-base font-bold", children: "Manage this trip" }), _jsxs(Link, { to: `/routes/${id}/edit`, className: "btn btn-secondary btn-xs", children: [_jsx(Edit, { size: 12, className: "mr-1" }), "Edit route"] })] }), _jsxs("div", { className: "trip-actions-row mb-4", children: [route.status === 'active' && (_jsxs("button", { type: "button", className: "btn btn-primary btn-sm btn-block", onClick: handleStartTrip, children: [_jsx(Play, { size: 14, className: "mr-1" }), "Start trip (commute in progress)"] })), route.status === 'in_progress' && (_jsxs("button", { type: "button", className: "btn btn-success btn-sm btn-block", onClick: handleCompleteTrip, children: [_jsx(CheckCircle, { size: 14, className: "mr-1" }), "Mark trip completed"] }))] }), _jsxs("h3", { className: "text-sm font-semibold mb-2", children: ["Passenger requests (", bookings.length, ")"] }), bookings.length === 0 ? (_jsx("p", { className: "text-secondary text-sm", children: "No seat requests for this route yet." })) : (_jsx("div", { className: "requests-list", children: bookings.map((b) => (_jsxs("div", { className: "request-card p-3 border mb-2", children: [_jsxs("div", { className: "flex-between", children: [_jsxs("div", { children: [_jsx("strong", { children: b.rider_name }), _jsxs("span", { className: "text-secondary text-xs ml-2", children: ["(", b.seats_booked, " seat", b.seats_booked > 1 ? 's' : '', ")"] })] }), _jsx(TripStatusBadge, { status: b.status })] }), _jsxs("div", { className: "text-xs text-secondary mt-1", children: [_jsxs("div", { children: ["From: ", b.pickup_name] }), _jsxs("div", { children: ["To: ", b.drop_name] }), _jsxs("div", { className: "font-mono mt-1 font-bold", children: ["Fare: ", formatCurrency(b.fare)] })] }), b.status === 'requested' && (_jsxs("div", { className: "request-actions flex-gap-2 mt-2", children: [_jsxs("button", { type: "button", className: "btn btn-primary btn-xs flex-grow", onClick: () => handleAcceptBooking(b.id), children: [_jsx(CheckCircle, { size: 12, className: "mr-1" }), "Accept"] }), _jsxs("button", { type: "button", className: "btn btn-danger btn-xs flex-grow", onClick: () => handleDeclineBooking(b.id), children: [_jsx(XCircle, { size: 12, className: "mr-1" }), "Decline"] })] })), b.status === 'confirmed' && (_jsx("div", { className: "mt-2 text-xs text-success font-medium", children: "Confirmed \u2022 Seat reserved" }))] }, b.id))) }))] })) : userBooking ? (
                        /* RIDER VIEW: Existing Booking State */
                        _jsxs("div", { className: "user-booking-status-card card mb-4", children: [_jsxs("div", { className: "flex-between mb-2", children: [_jsx("h2", { className: "text-base font-bold", children: "Your booking status" }), _jsx(TripStatusBadge, { status: userBooking.status })] }), _jsxs("div", { className: "booking-details text-sm mb-3", children: [_jsxs("p", { children: [_jsx("strong", { children: "Pickup:" }), " ", userBooking.pickup_name] }), _jsxs("p", { children: [_jsx("strong", { children: "Drop:" }), " ", userBooking.drop_name] }), _jsxs("p", { children: [_jsx("strong", { children: "Seats:" }), " ", userBooking.seats_booked] }), _jsxs("p", { children: [_jsx("strong", { children: "Estimated fare share:" }), ' ', _jsx("span", { className: "font-mono font-bold text-base-primary", children: formatCurrency(userBooking.fare) })] })] }), userBooking.status === 'confirmed' && (_jsxs("div", { className: "alert alert-success text-xs mb-3", children: ["Driver confirmed your request! Please be at ", userBooking.pickup_name, " 5 mins before departure."] })), _jsxs("div", { className: "flex-gap-2", children: [_jsx(Link, { to: `/trips/${userBooking.id}`, className: "btn btn-primary btn-sm flex-grow", children: "View live trip" }), ['requested', 'confirmed'].includes(userBooking.status) && (_jsx("button", { type: "button", className: "btn btn-danger btn-sm", onClick: async () => {
                                                if (window.confirm('Cancel this booking?')) {
                                                    await api.patch(`/bookings/${userBooking.id}/cancel`);
                                                    await fetchRouteData();
                                                }
                                            }, children: "Cancel" }))] })] })) : (
                        /* RIDER VIEW: Seat Booking Form */
                        _jsxs("div", { className: "rider-booking-card card mb-4", children: [_jsx("h2", { className: "text-base font-bold mb-3", children: "Request a seat along this path" }), route.seats_available <= 0 ? (_jsxs("div", { className: "alert alert-warning text-sm", children: ["This route is currently full. All ", route.seats_offered, " seats have been booked."] })) : route.status !== 'active' ? (_jsxs("div", { className: "alert alert-warning text-sm", children: ["This route is currently ", route.status, " and not accepting new passengers."] })) : (_jsxs("form", { onSubmit: handleRequestBooking, className: "booking-form", children: [_jsx(LocationInput, { id: "book-pickup", label: "Your pickup spot", value: pickup, onChange: setPickup, required: true }), _jsx(LocationInput, { id: "book-drop", label: "Your drop spot", value: drop, onChange: setDrop, required: true }), _jsxs("div", { className: "form-group mt-3", children: [_jsx("label", { htmlFor: "book-seats", className: "form-label", children: "Number of seats needed" }), _jsx("input", { id: "book-seats", type: "number", min: 1, max: route.seats_available, className: "form-input", value: seatsToBook, onChange: (e) => setSeatsToBook(Number(e.target.value)), required: true }), _jsxs("span", { className: "form-hint text-xs text-secondary", children: [route.seats_available, " seat", route.seats_available > 1 ? 's' : '', " available"] })] }), _jsxs("div", { className: "fare-estimate-box card p-3 my-3 bg-surface-alt", children: [_jsxs("div", { className: "flex-between", children: [_jsx("span", { className: "text-sm font-medium", children: "Estimated fare split:" }), _jsx("strong", { className: "font-mono text-base-primary text-lg", children: formatCurrency(estimatedFareValue) })] }), _jsx("span", { className: "text-xs text-secondary", children: "Final fare computed on the server based on exact segment distance and passenger count." })] }), _jsxs("button", { type: "submit", className: "btn btn-primary btn-block", disabled: requesting, children: [_jsx(Users, { size: 15, className: "mr-1" }), requesting ? 'Submitting request...' : `Request ${seatsToBook} seat(s)`] })] }))] })), _jsx("div", { className: "safety-section text-center pt-2", children: _jsxs("button", { type: "button", className: "text-xs text-secondary link flex-center mx-auto", onClick: () => setShowReportModal(true), children: [_jsx(Flag, { size: 12, className: "mr-1" }), "Report this driver or route"] }) })] }) }), _jsx("div", { className: "map-surface", children: _jsx(RouteMap, { origin: { name: route.origin_name, lat: route.origin_lat, lng: route.origin_lng }, destination: { name: route.destination_name, lat: route.dest_lat, lng: route.dest_lng }, waypoints: route.waypoints, routeGeometry: route.route_geometry, pickup: pickup ? { name: pickup.name, lat: pickup.lat, lng: pickup.lng } : undefined, drop: drop ? { name: drop.name, lat: drop.lat, lng: drop.lng } : undefined, height: "100%" }) }), showReportModal && (_jsx("div", { className: "modal-backdrop", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "modal-content card", children: [_jsx("h3", { className: "font-bold text-base mb-2", children: "Report User" }), _jsx("p", { className: "text-secondary text-sm mb-3", children: "Help keep our commuter community safe in Tamil Nadu." }), _jsxs("form", { onSubmit: handleReportUser, children: [_jsx("textarea", { className: "form-input textarea mb-3", rows: 3, placeholder: "Reason for report (minimum 5 characters)...", value: reportReason, onChange: (e) => setReportReason(e.target.value), required: true, minLength: 5 }), _jsxs("div", { className: "flex-gap-2", children: [_jsx("button", { type: "submit", className: "btn btn-danger btn-sm", children: "Submit report" }), _jsx("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => setShowReportModal(false), children: "Cancel" })] })] })] }) }))] }));
};
