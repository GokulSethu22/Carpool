import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// SearchRides.tsx — Map-first search interface matching commuter trips within 1.5 km of driver routes.
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { LocationInput } from '../components/LocationInput';
import { RouteMap } from '../components/RouteMap';
import { VehicleBadge } from '../components/VehicleBadge';
import { RatingStars } from '../components/RatingStars';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, formatTime, formatDate, formatDistance } from '../lib/format';
import { Search, Filter, AlertCircle, ArrowRight, Clock, Users } from 'lucide-react';
export const SearchRides = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    // Search inputs
    const [pickup, setPickup] = useState(() => {
        const lat = searchParams.get('pickup_lat');
        const lng = searchParams.get('pickup_lng');
        const name = searchParams.get('pickup_name');
        return lat && lng && name ? { lat: Number(lat), lng: Number(lng), name } : null;
    });
    const [drop, setDrop] = useState(() => {
        const lat = searchParams.get('drop_lat');
        const lng = searchParams.get('drop_lng');
        const name = searchParams.get('drop_name');
        return lat && lng && name ? { lat: Number(lat), lng: Number(lng), name } : null;
    });
    const [date, setDate] = useState(() => searchParams.get('date') || new Date().toISOString().split('T')[0]);
    const [vehicleType, setVehicleType] = useState(searchParams.get('vehicle_type') || '');
    const [seatsNeeded, setSeatsNeeded] = useState(() => Number(searchParams.get('seats_needed')) || 1);
    // Results state
    const [results, setResults] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const executeSearch = async (p, d, travelDate, vType, seats) => {
        if (!p || !d)
            return;
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
            if (vType)
                q.set('vehicle_type', vType);
            const data = await api.get(`/search?${q.toString()}`);
            setResults(data.results);
            if (data.results.length > 0) {
                setSelectedRoute(data.results[0]);
            }
            else {
                setSelectedRoute(null);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search for matching rides');
        }
        finally {
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
    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!pickup || !drop) {
            setError('Please provide both pickup and drop locations in Tamil Nadu.');
            return;
        }
        const params = {
            pickup_lat: pickup.lat.toString(),
            pickup_lng: pickup.lng.toString(),
            pickup_name: pickup.name,
            drop_lat: drop.lat.toString(),
            drop_lng: drop.lng.toString(),
            drop_name: drop.name,
            date,
            seats_needed: seatsNeeded.toString(),
        };
        if (vehicleType)
            params.vehicle_type = vehicleType;
        setSearchParams(params);
        executeSearch(pickup, drop, date, vehicleType, seatsNeeded);
    };
    return (_jsxs("div", { className: "map-page-layout", children: [_jsx("div", { className: "map-side-panel", children: _jsxs("div", { className: "panel-inner", children: [_jsxs("div", { className: "panel-header mb-4", children: [_jsx("h1", { className: "text-xl font-bold", children: "Find a shared ride" }), _jsx("p", { className: "text-secondary text-sm", children: "Connecting you with drivers travelling on your route across Tamil Nadu." })] }), error && (_jsxs("div", { className: "alert alert-error mb-4", role: "alert", children: [_jsx(AlertCircle, { size: 16, className: "inline-icon mr-1" }), error] })), _jsxs("form", { onSubmit: handleFormSubmit, className: "search-query-form card p-4 mb-4", children: [_jsx(LocationInput, { id: "search-pickup", label: "Pickup location", placeholder: "E.g. Tambaram Railway Station", value: pickup, onChange: setPickup, required: true }), _jsx(LocationInput, { id: "search-drop", label: "Drop location", placeholder: "E.g. T. Nagar Bus Stand", value: drop, onChange: setDrop, required: true }), _jsxs("div", { className: "form-grid-3 mt-3", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "search-date", className: "form-label", children: "Travel date" }), _jsx("input", { id: "search-date", type: "date", className: "form-input", value: date, onChange: (e) => setDate(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "search-type", className: "form-label", children: "Vehicle" }), _jsxs("select", { id: "search-type", className: "form-select", value: vehicleType, onChange: (e) => setVehicleType(e.target.value), children: [_jsx("option", { value: "", children: "Any vehicle" }), _jsx("option", { value: "bike", children: "Bike (\u20B95/km avg)" }), _jsx("option", { value: "auto", children: "Auto (\u20B912/km avg)" }), _jsx("option", { value: "cab", children: "Cab (\u20B914/km avg)" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "search-seats", className: "form-label", children: "Seats" }), _jsx("input", { id: "search-seats", type: "number", min: 1, max: 6, className: "form-input", value: seatsNeeded, onChange: (e) => setSeatsNeeded(Number(e.target.value)), required: true })] })] }), _jsxs("button", { type: "submit", className: "btn btn-primary btn-block mt-3", disabled: loading, children: [_jsx(Search, { size: 15, className: "mr-1", "aria-hidden": "true" }), loading ? 'Finding matching routes...' : 'Search rides'] })] }), _jsxs("div", { className: "search-results-section", children: [_jsxs("div", { className: "flex-between mb-2", children: [_jsx("h2", { className: "text-sm font-semibold", children: hasSearched ? `Matching rides (${results.length})` : 'Search to view available rides' }), results.length > 0 && (_jsxs("span", { className: "text-secondary text-xs flex-center", children: [_jsx(Filter, { size: 12, className: "mr-1" }), "Sorted by detour & departure"] }))] }), loading ? (_jsxs("div", { className: "page-loader py-8", children: [_jsx("div", { className: "spinner" }), _jsx("p", { className: "text-sm", children: "Matching routes along your path..." })] })) : hasSearched && results.length === 0 ? (_jsx(EmptyState, { icon: Search, title: "No rides found along this route", description: "We couldn't find a driver route passing within 1.5 km of both your pickup and drop points. Try adjusting your locations or search for a nearby major junction." })) : (_jsx("div", { className: "search-results-list", children: results.map((ride) => {
                                        const isSelected = selectedRoute?.id === ride.id;
                                        return (_jsxs("article", { className: `card result-card ${isSelected ? 'is-selected' : ''}`, onClick: () => setSelectedRoute(ride), tabIndex: 0, role: "button", "aria-pressed": isSelected, children: [_jsxs("div", { className: "result-card-top flex-between", children: [_jsxs("div", { className: "driver-info", children: [_jsx("span", { className: "driver-name font-bold", children: ride.driver_name }), ride.driver_rating ? (_jsxs("div", { className: "flex-center text-xs", children: [_jsx(RatingStars, { score: Math.round(ride.driver_rating), size: 13 }), _jsxs("span", { className: "ml-1 text-secondary", children: ["(", ride.driver_rating, ")"] })] })) : (_jsx("span", { className: "text-secondary text-xs", children: "New driver" }))] }), _jsxs("div", { className: "fare-badge", children: [_jsx("span", { className: "fare-amount font-mono font-bold text-lg text-base-primary", children: formatCurrency(ride.estimated_fare) }), _jsx("span", { className: "text-xs text-secondary", children: "est. share" })] })] }), _jsx("div", { className: "result-vehicle-row mt-2", children: ride.vehicle && (_jsx(VehicleBadge, { type: ride.vehicle.type, model: ride.vehicle.model, colour: ride.vehicle.colour })) }), _jsxs("div", { className: "result-route-stops mt-3 text-sm", children: [_jsxs("div", { className: "stop-line", children: [_jsx("span", { className: "dot dot-origin" }), _jsx("span", { className: "stop-name text-ellipsis", children: ride.origin_name })] }), ride.waypoints.length > 0 && (_jsxs("div", { className: "stop-line text-secondary text-xs", children: [_jsx("span", { className: "dot dot-waypoint" }), _jsxs("span", { children: ["Via ", ride.waypoints.map((w) => w.name).join(', ')] })] })), _jsxs("div", { className: "stop-line", children: [_jsx("span", { className: "dot dot-dest" }), _jsx("span", { className: "stop-name text-ellipsis", children: ride.destination_name })] })] }), _jsxs("div", { className: "result-card-footer flex-between mt-3 text-xs text-secondary", children: [_jsxs("div", { className: "flex-center", children: [_jsx(Clock, { size: 13, className: "mr-1" }), _jsxs("span", { children: [formatDate(ride.departure_time), ", ", formatTime(ride.departure_time)] })] }), _jsxs("div", { className: "flex-center", children: [_jsx(Users, { size: 13, className: "mr-1" }), _jsxs("span", { children: [ride.seats_available, " seats left"] })] })] }), _jsxs("div", { className: "detour-meta text-xs text-secondary mt-1", children: ["Detour from path: ", formatDistance(ride.detour_km), " (pickup + drop)"] }), _jsx("div", { className: "card-action mt-3", children: _jsxs("button", { type: "button", className: "btn btn-primary btn-sm btn-block", onClick: (e) => {
                                                            e.stopPropagation();
                                                            navigate(`/rides/${ride.id}`);
                                                        }, children: ["View route & book seat", _jsx(ArrowRight, { size: 14, className: "ml-1" })] }) })] }, ride.id));
                                    }) }))] })] }) }), _jsx("div", { className: "map-surface", children: selectedRoute ? (_jsx(RouteMap, { origin: {
                        name: selectedRoute.origin_name,
                        lat: selectedRoute.origin_lat,
                        lng: selectedRoute.origin_lng,
                    }, destination: {
                        name: selectedRoute.destination_name,
                        lat: selectedRoute.dest_lat,
                        lng: selectedRoute.dest_lng,
                    }, waypoints: selectedRoute.waypoints, routeGeometry: selectedRoute.route_geometry, pickup: pickup ? { name: pickup.name, lat: pickup.lat, lng: pickup.lng } : undefined, drop: drop ? { name: drop.name, lat: drop.lat, lng: drop.lng } : undefined, height: "100%" })) : (_jsx("div", { className: "empty-map-placeholder flex-center", children: _jsx("p", { className: "text-secondary text-sm", children: "Search for commuter routes above to visualize matches on the map" }) })) })] }));
};
