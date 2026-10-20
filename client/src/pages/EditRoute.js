import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// EditRoute.tsx — Driver editing screen for updating stops, notes, seats, and pausing/cancelling routes.
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { LocationInput } from '../components/LocationInput';
import { RouteMap } from '../components/RouteMap';
import { TripStatusBadge } from '../components/TripStatusBadge';
import { Plus, Trash2, PauseCircle, PlayCircle, XCircle, AlertCircle } from 'lucide-react';
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const EditRoute = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [route, setRoute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Editable fields
    const [waypoints, setWaypoints] = useState([]);
    const [departureDate, setDepartureDate] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [recurringDays, setRecurringDays] = useState([]);
    const [seatsOffered, setSeatsOffered] = useState(3);
    const [pricePerKm, setPricePerKm] = useState(14);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        api.get(`/routes/${id}`)
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
    const handleUpdateWaypoint = (index, loc) => {
        setWaypoints((prev) => {
            const copy = [...prev];
            copy[index] = { name: loc.name, lat: loc.lat, lng: loc.lng };
            return copy;
        });
    };
    const handleRemoveWaypoint = (index) => {
        setWaypoints((prev) => prev.filter((_, i) => i !== index));
    };
    const toggleDay = (day) => {
        setRecurringDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
    };
    const handleStatusChange = async (newStatus) => {
        if (newStatus === 'cancelled' && !window.confirm('Cancelling will decline all pending bookings and notify riders. Proceed?')) {
            return;
        }
        try {
            const res = await api.patch(`/routes/${id}/status`, { status: newStatus });
            setRoute(res.route);
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update status');
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const departureIso = `${departureDate}T${departureTime}:00`;
            const cleanWaypoints = waypoints.filter((w) => w.name && w.lat !== 0);
            const res = await api.put(`/routes/${id}`, {
                waypoints: cleanWaypoints,
                departure_time: departureIso,
                recurring_days: recurringDays.length > 0 ? recurringDays : null,
                seats_offered: Number(seatsOffered),
                price_per_km: Number(pricePerKm),
                notes: notes.trim() || null,
            });
            setRoute(res.route);
            navigate(`/rides/${id}`);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update route.');
        }
        finally {
            setSubmitting(false);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "page-loader", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading route details..." })] }));
    }
    if (!route) {
        return _jsx("div", { className: "alert alert-error container mt-6", children: "Route not found" });
    }
    return (_jsxs("div", { className: "map-page-layout", children: [_jsx("div", { className: "map-side-panel", children: _jsxs("div", { className: "panel-inner", children: [_jsxs("div", { className: "panel-header mb-4 flex-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-xl font-bold", children: ["Edit route #", route.id] }), _jsxs("p", { className: "text-secondary text-sm", children: [route.origin_name, " to ", route.destination_name] })] }), _jsx(TripStatusBadge, { status: route.status })] }), error && (_jsxs("div", { className: "alert alert-error mb-4", role: "alert", children: [_jsx(AlertCircle, { size: 16, className: "inline-icon mr-1" }), error] })), _jsxs("div", { className: "status-toolbar card p-3 mb-4 flex-between", children: [_jsx("span", { className: "text-sm font-semibold", children: "Route control:" }), _jsxs("div", { className: "flex-gap-2", children: [route.status === 'active' && (_jsxs("button", { type: "button", className: "btn btn-secondary btn-xs", onClick: () => handleStatusChange('paused'), children: [_jsx(PauseCircle, { size: 14, className: "mr-1" }), "Pause"] })), route.status === 'paused' && (_jsxs("button", { type: "button", className: "btn btn-secondary btn-xs", onClick: () => handleStatusChange('active'), children: [_jsx(PlayCircle, { size: 14, className: "mr-1" }), "Resume"] })), route.status !== 'cancelled' && route.status !== 'completed' && (_jsxs("button", { type: "button", className: "btn btn-danger btn-xs", onClick: () => handleStatusChange('cancelled'), children: [_jsx(XCircle, { size: 14, className: "mr-1" }), "Cancel route"] }))] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "route-edit-form", children: [_jsxs("div", { className: "waypoints-section mb-4", children: [_jsxs("div", { className: "flex-between mb-2", children: [_jsx("span", { className: "form-label mb-0", children: "Waypoints / stops" }), _jsxs("button", { type: "button", className: "btn btn-secondary btn-xs", onClick: handleAddWaypoint, children: [_jsx(Plus, { size: 12, className: "mr-1" }), "Add stop"] })] }), waypoints.map((wp, idx) => (_jsxs("div", { className: "waypoint-row mb-2", children: [_jsx("div", { className: "flex-grow", children: _jsx(LocationInput, { placeholder: `Stop ${idx + 1}`, value: wp.name ? { name: wp.name, lat: wp.lat, lng: wp.lng } : null, onChange: (loc) => handleUpdateWaypoint(idx, loc) }) }), _jsx("button", { type: "button", className: "icon-btn text-error ml-2", title: "Remove stop", onClick: () => handleRemoveWaypoint(idx), children: _jsx(Trash2, { size: 16 }) })] }, idx)))] }), _jsxs("div", { className: "form-grid-2", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "edit-date", className: "form-label", children: "Departure date" }), _jsx("input", { id: "edit-date", type: "date", className: "form-input", value: departureDate, onChange: (e) => setDepartureDate(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "edit-time", className: "form-label", children: "Departure time" }), _jsx("input", { id: "edit-time", type: "time", className: "form-input", value: departureTime, onChange: (e) => setDepartureTime(e.target.value), required: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("span", { className: "form-label", children: "Recurring days" }), _jsx("div", { className: "days-selector-chips", children: DAYS_OF_WEEK.map((day) => (_jsx("button", { type: "button", className: `day-chip ${recurringDays.includes(day) ? 'is-selected' : ''}`, onClick: () => toggleDay(day), children: day }, day))) })] }), _jsxs("div", { className: "form-grid-2", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "edit-seats", className: "form-label", children: "Total seats offered" }), _jsx("input", { id: "edit-seats", type: "number", min: 1, max: route.vehicle?.seat_capacity || 6, className: "form-input", value: seatsOffered, onChange: (e) => setSeatsOffered(Number(e.target.value)), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "edit-price", className: "form-label", children: "Price per km (\u20B9)" }), _jsx("input", { id: "edit-price", type: "number", min: 1, max: 50, step: 0.5, className: "form-input", value: pricePerKm, onChange: (e) => setPricePerKm(Number(e.target.value)), required: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "edit-notes", className: "form-label", children: "Driver notes" }), _jsx("textarea", { id: "edit-notes", className: "form-input textarea", rows: 2, value: notes, onChange: (e) => setNotes(e.target.value) })] }), _jsxs("div", { className: "form-actions mt-4", children: [_jsx("button", { type: "submit", className: "btn btn-primary", disabled: submitting, children: submitting ? 'Saving changes...' : 'Save changes' }), _jsx("button", { type: "button", className: "btn btn-secondary", onClick: () => navigate(`/rides/${id}`), children: "Cancel" })] })] })] }) }), _jsx("div", { className: "map-surface", children: _jsx(RouteMap, { origin: { name: route.origin_name, lat: route.origin_lat, lng: route.origin_lng }, destination: { name: route.destination_name, lat: route.dest_lat, lng: route.dest_lng }, waypoints: waypoints.filter((w) => w.lat !== 0), routeGeometry: route.route_geometry, height: "100%" }) })] }));
};
