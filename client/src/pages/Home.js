import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Home.tsx — Home landing view with live Tamil Nadu route map and immediate search access.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { LocationInput } from '../components/LocationInput';
import { MapView } from '../components/MapView';
import { useAuth } from '../lib/auth';
import { Search, PlusCircle, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import L from 'leaflet';
export const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [pickup, setPickup] = useState(null);
    const [drop, setDrop] = useState(null);
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [activeRoutes, setActiveRoutes] = useState([]);
    const [mapInstance, setMapInstance] = useState(null);
    useEffect(() => {
        // Fetch some active routes to plot on home map
        api.get('/search?pickup_lat=13.0827&pickup_lng=80.2707&drop_lat=12.9249&drop_lng=80.1000&max_detour_km=50')
            .then((res) => {
            setActiveRoutes(res.results.slice(0, 8));
        })
            .catch(() => {
            // quiet fallback
        });
    }, []);
    // Plot routes on home map when available
    useEffect(() => {
        if (!mapInstance || activeRoutes.length === 0)
            return;
        const group = L.layerGroup().addTo(mapInstance);
        activeRoutes.forEach((route) => {
            const startMarker = L.circleMarker([route.origin_lat, route.origin_lng], {
                radius: 6,
                color: '#0D7377',
                fillColor: '#0D7377',
                fillOpacity: 0.9,
            }).bindPopup(`<strong>${route.origin_name}</strong> to <strong>${route.destination_name}</strong>`);
            startMarker.addTo(group);
            const endMarker = L.circleMarker([route.dest_lat, route.dest_lng], {
                radius: 6,
                color: '#E8A838',
                fillColor: '#E8A838',
                fillOpacity: 0.9,
            });
            endMarker.addTo(group);
        });
        return () => {
            group.clearLayers();
        };
    }, [mapInstance, activeRoutes]);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (!pickup || !drop) {
            navigate('/search');
            return;
        }
        const params = new URLSearchParams({
            pickup_lat: pickup.lat.toString(),
            pickup_lng: pickup.lng.toString(),
            pickup_name: pickup.name,
            drop_lat: drop.lat.toString(),
            drop_lng: drop.lng.toString(),
            drop_name: drop.name,
            date,
        });
        navigate(`/search?${params.toString()}`);
    };
    return (_jsxs("div", { className: "home-page", children: [_jsxs("section", { className: "home-hero-section container", children: [_jsxs("div", { className: "home-hero-text", children: [_jsx("span", { className: "badge badge-neutral", children: "Commuters across Tamil Nadu" }), _jsxs("h1", { className: "hero-title", children: ["Share your regular commute. ", _jsx("br", {}), "Split your fare."] }), _jsx("p", { className: "hero-description text-secondary", children: "Drivers travelling across Chennai, Coimbatore, Madurai, or along the OMR corridor list their existing routes. Riders heading in the same direction book a seat and split the cost per kilometre." }), _jsxs("form", { onSubmit: handleSearchSubmit, className: "home-search-panel card", children: [_jsx("h2", { className: "panel-title text-base font-semibold", children: "Find a ride along your path" }), _jsxs("div", { className: "home-search-grid", children: [_jsx(LocationInput, { id: "home-pickup", label: "Pickup", placeholder: "E.g. Tambaram or Gandhipuram", value: pickup, onChange: setPickup, required: true }), _jsx(LocationInput, { id: "home-drop", label: "Drop", placeholder: "E.g. T. Nagar or Peelamedu", value: drop, onChange: setDrop, required: true }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "home-date", className: "form-label", children: "Date" }), _jsx("input", { id: "home-date", type: "date", className: "form-input", value: date, onChange: (e) => setDate(e.target.value) })] })] }), _jsxs("div", { className: "home-search-actions", children: [_jsxs("button", { type: "submit", className: "btn btn-primary", children: [_jsx(Search, { size: 16, "aria-hidden": "true" }), "Find rides"] }), user ? (_jsxs("button", { type: "button", className: "btn btn-secondary", onClick: () => navigate('/publish'), children: [_jsx(PlusCircle, { size: 16, "aria-hidden": "true" }), "Publish your route"] })) : (_jsx("button", { type: "button", className: "btn btn-secondary", onClick: () => navigate('/signup'), children: "Join as driver" }))] })] })] }), _jsxs("div", { className: "home-map-preview", children: [_jsxs("div", { className: "map-badge-overlay", children: [_jsx(MapPin, { size: 14, className: "text-accent" }), _jsx("span", { children: "Active Tamil Nadu routes" })] }), _jsx(MapView, { height: "420px", onMapReady: setMapInstance })] })] }), _jsxs("section", { className: "home-how-it-works container", children: [_jsxs("div", { className: "how-header", children: [_jsx("h2", { className: "text-xl font-bold", children: "How the shared commute works" }), _jsx("p", { className: "text-secondary text-sm", children: "Not a taxi booking service. You share a ride on a journey someone is already making." })] }), _jsxs("div", { className: "steps-row", children: [_jsxs("div", { className: "step-item", children: [_jsx("span", { className: "step-num", children: "1" }), _jsx("h3", { className: "step-title", children: "Driver publishes regular route" }), _jsx("p", { className: "step-body text-secondary text-sm", children: "Add your origin, destination, any stops, vehicle (bike, auto, or cab), and your price per kilometre." })] }), _jsxs("div", { className: "step-item", children: [_jsx("span", { className: "step-num", children: "2" }), _jsx("h3", { className: "step-title", children: "Rider searches along the path" }), _jsx("p", { className: "step-body text-secondary text-sm", children: "Routes match if both your pickup and drop are within 1.5 km of the driver's route, in the correct direction." })] }), _jsxs("div", { className: "step-item", children: [_jsx("span", { className: "step-num", children: "3" }), _jsx("h3", { className: "step-title", children: "Automated segment fare split" }), _jsx("p", { className: "step-body text-secondary text-sm", children: "Each stretch between pickup and drop points is split equally among everyone inside the vehicle at that moment." })] })] })] }), _jsx("section", { className: "home-cities container", children: _jsxs("div", { className: "cities-card card", children: [_jsxs("div", { className: "cities-info", children: [_jsx(ShieldCheck, { size: 24, className: "text-base-primary" }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-base", children: "Statewide local coverage" }), _jsx("p", { className: "text-secondary text-sm", children: "Chennai city commutes (Tambaram, Guindy, T. Nagar, OMR IT Corridor), Coimbatore (Gandhipuram to Peelamedu), Madurai city corridors, and short runs like Chengalpattu to Tambaram." })] })] }), _jsxs("button", { type: "button", className: "btn btn-secondary btn-sm", onClick: () => navigate('/search'), children: ["Explore all rides", _jsx(ArrowRight, { size: 14, className: "ml-1" })] })] }) })] }));
};
