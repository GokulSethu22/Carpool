import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// PublishRoute.tsx — Map-first route publishing screen with OSRM polyline fetching and recurring day options.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { LocationInput } from '../components/LocationInput';
import { RouteMap } from '../components/RouteMap';
import { formatCurrency, formatDistance } from '../lib/format';
import { Plus, Trash2, MapPin, AlertCircle, Info } from 'lucide-react';
import { DEFAULT_PRICE_PER_KM } from '../../../shared/types';
const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const PublishRoute = () => {
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    // Form state
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [waypoints, setWaypoints] = useState([]);
    const [departureDate, setDepartureDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    });
    const [departureTime, setDepartureTime] = useState('08:30');
    const [isRecurring, setIsRecurring] = useState(true);
    const [recurringDays, setRecurringDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    const [seatsOffered, setSeatsOffered] = useState(3);
    const [pricePerKm, setPricePerKm] = useState(14);
    const [notes, setNotes] = useState('');
    // Routing preview state
    const [routeGeometry, setRouteGeometry] = useState('');
    const [totalDistanceKm, setTotalDistanceKm] = useState(null);
    const [fetchingRoute, setFetchingRoute] = useState(false);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    // Load vehicles
    useEffect(() => {
        api.get('/vehicles')
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
    const handleVehicleChange = (id) => {
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
        const coords = [`${origin.lng},${origin.lat}`];
        for (const wp of waypoints) {
            coords.push(`${wp.lng},${wp.lat}`);
        }
        coords.push(`${destination.lng},${destination.lat}`);
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords.join(';')}?overview=full&geometries=polyline`;
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
    const handleSubmit = async (e) => {
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
            const res = await api.post('/routes', {
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to publish route.');
        }
        finally {
            setSubmitting(false);
        }
    };
    const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId);
    return (_jsxs("div", { className: "map-page-layout", children: [_jsx("div", { className: "map-side-panel", children: _jsxs("div", { className: "panel-inner", children: [_jsxs("div", { className: "panel-header mb-4", children: [_jsx("h1", { className: "text-xl font-bold", children: "Publish your route" }), _jsx("p", { className: "text-secondary text-sm", children: "List an existing journey you make across Tamil Nadu so co-commuters can split the fare." })] }), error && (_jsxs("div", { className: "alert alert-error mb-4", role: "alert", children: [_jsx(AlertCircle, { size: 16, className: "inline-icon mr-1" }), error] })), vehicles.length === 0 && !loadingVehicles && (_jsxs("div", { className: "alert alert-warning mb-4", children: [_jsx(Info, { size: 16, className: "inline-icon mr-1" }), "You need to register a vehicle before publishing a route.", ' ', _jsx("button", { type: "button", className: "link font-semibold", onClick: () => navigate('/vehicles'), children: "Add vehicle" })] })), _jsxs("form", { onSubmit: handleSubmit, className: "route-publish-form", children: [_jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "pub-vehicle", className: "form-label", children: ["Vehicle ", _jsx("span", { className: "text-error", children: "*" })] }), _jsx("select", { id: "pub-vehicle", className: "form-select", value: selectedVehicleId, onChange: (e) => handleVehicleChange(Number(e.target.value)), required: true, children: vehicles.map((v) => (_jsxs("option", { value: v.id, children: [v.type.toUpperCase(), ": ", v.registration, " (", v.model, ") \u2014 ", v.seat_capacity, " seats"] }, v.id))) })] }), _jsx(LocationInput, { id: "pub-origin", label: "Starting point (Origin)", placeholder: "E.g. Tambaram Railway Station", value: origin, onChange: setOrigin, required: true }), _jsxs("div", { className: "waypoints-section", children: [_jsxs("div", { className: "flex-between mb-2", children: [_jsx("span", { className: "form-label mb-0", children: "Intermediate stops / waypoints" }), _jsxs("button", { type: "button", className: "btn btn-secondary btn-xs", onClick: handleAddWaypoint, children: [_jsx(Plus, { size: 12, className: "mr-1" }), "Add stop"] })] }), waypoints.map((wp, idx) => (_jsxs("div", { className: "waypoint-row mb-2", children: [_jsx("div", { className: "flex-grow", children: _jsx(LocationInput, { placeholder: `Stop ${idx + 1} (e.g. Guindy Junction)`, value: wp.name ? { name: wp.name, lat: wp.lat, lng: wp.lng } : null, onChange: (loc) => handleUpdateWaypoint(idx, loc) }) }), _jsx("button", { type: "button", className: "icon-btn text-error ml-2", title: "Remove stop", onClick: () => handleRemoveWaypoint(idx), children: _jsx(Trash2, { size: 16 }) })] }, idx)))] }), _jsx(LocationInput, { id: "pub-dest", label: "End point (Destination)", placeholder: "E.g. T. Nagar Bus Stand", value: destination, onChange: setDestination, required: true }), _jsxs("div", { className: "form-grid-2", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "pub-date", className: "form-label", children: "First travel date" }), _jsx("input", { id: "pub-date", type: "date", className: "form-input", value: departureDate, onChange: (e) => setDepartureDate(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "pub-time", className: "form-label", children: "Departure time (IST)" }), _jsx("input", { id: "pub-time", type: "time", className: "form-input", value: departureTime, onChange: (e) => setDepartureTime(e.target.value), required: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { className: "checkbox-label mb-2", children: [_jsx("input", { type: "checkbox", checked: isRecurring, onChange: (e) => setIsRecurring(e.target.checked) }), _jsx("span", { className: "font-medium text-sm", children: "Recurring daily/weekly commute" })] }), isRecurring && (_jsx("div", { className: "days-selector-chips", children: DAYS_OF_WEEK.map((day) => (_jsx("button", { type: "button", className: `day-chip ${recurringDays.includes(day) ? 'is-selected' : ''}`, onClick: () => toggleDay(day), children: day }, day))) }))] }), _jsxs("div", { className: "form-grid-2", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "pub-seats", className: "form-label", children: "Seats offered" }), _jsx("input", { id: "pub-seats", type: "number", min: 1, max: currentVehicle?.seat_capacity || 4, className: "form-input", value: seatsOffered, onChange: (e) => setSeatsOffered(Number(e.target.value)), required: true }), _jsxs("span", { className: "form-hint text-xs text-secondary", children: ["Max ", currentVehicle?.seat_capacity || 4, " for this vehicle"] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "pub-price", className: "form-label", children: "Price per km (\u20B9)" }), _jsx("input", { id: "pub-price", type: "number", min: 1, max: 50, step: 0.5, className: "form-input font-mono", value: pricePerKm, onChange: (e) => setPricePerKm(Number(e.target.value)), required: true }), _jsx("span", { className: "form-hint text-xs text-secondary", children: "Defaults \u2014 bike: \u20B95, auto: \u20B912, cab: \u20B914" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "pub-notes", className: "form-label", children: "Notes for commuters (optional)" }), _jsx("textarea", { id: "pub-notes", className: "form-input textarea", rows: 2, placeholder: "E.g. Leaving promptly at 8:30. AC on. Boots/luggage space limited.", value: notes, onChange: (e) => setNotes(e.target.value) })] }), totalDistanceKm !== null && (_jsxs("div", { className: "route-summary-card card mb-4", children: [_jsxs("div", { className: "flex-between text-sm", children: [_jsx("span", { className: "text-secondary", children: "Estimated route distance:" }), _jsx("strong", { className: "font-mono", children: formatDistance(totalDistanceKm) })] }), _jsxs("div", { className: "flex-between text-sm mt-1", children: [_jsx("span", { className: "text-secondary", children: "Baseline vehicle cost (1 passenger):" }), _jsx("strong", { className: "font-mono text-base-primary", children: formatCurrency(totalDistanceKm * pricePerKm) })] }), _jsx("p", { className: "text-xs text-secondary mt-1", children: "* With 2 riders sharing, each rider's share drops by ~50% via automated segment splitting." })] })), _jsx("button", { type: "submit", className: "btn btn-primary btn-block", disabled: submitting || vehicles.length === 0, children: submitting ? 'Publishing route...' : 'Publish route' })] })] }) }), _jsxs("div", { className: "map-surface", children: [_jsxs("div", { className: "map-header-status", children: [_jsx(MapPin, { size: 14, className: "text-accent" }), _jsx("span", { children: fetchingRoute
                                    ? 'Computing route geometry along Tamil Nadu highways...'
                                    : totalDistanceKm !== null
                                        ? `Route path loaded: ${formatDistance(totalDistanceKm)}`
                                        : 'Select origin and destination to view route geometry' })] }), _jsx(RouteMap, { origin: origin ? { name: origin.name, lat: origin.lat, lng: origin.lng } : undefined, destination: destination ? { name: destination.name, lat: destination.lat, lng: destination.lng } : undefined, waypoints: waypoints.filter((w) => w.lat !== 0), routeGeometry: routeGeometry, height: "100%" })] })] }));
};
