import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// LocationInput.tsx — Debounced address autocomplete bounded to Tamil Nadu via OpenStreetMap Nominatim.
import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { TN_BOUNDS } from '../../../shared/types';
export const LocationInput = ({ id, label, placeholder = 'Search place in Tamil Nadu...', value, onChange, error, required = false, }) => {
    const [query, setQuery] = useState(value?.name || '');
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const debounceTimerRef = useRef(null);
    useEffect(() => {
        if (value) {
            setQuery(value.name);
        }
    }, [value]);
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        if (!val || val.trim().length < 3) {
            setSuggestions([]);
            setIsOpen(false);
            setLoading(false);
            return;
        }
        setLoading(true);
        debounceTimerRef.current = setTimeout(async () => {
            try {
                // Tamil Nadu Viewbox: left,top,right,bottom -> min_lon,max_lat,max_lon,min_lat
                const viewbox = `${TN_BOUNDS.west},${TN_BOUNDS.north},${TN_BOUNDS.east},${TN_BOUNDS.south}`;
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=in&viewbox=${viewbox}&bounded=1&limit=5&addressdetails=1`;
                const res = await fetch(url, {
                    headers: {
                        'Accept-Language': 'en,ta',
                    },
                });
                if (res.ok) {
                    const data = (await res.json());
                    setSuggestions(data);
                    setIsOpen(data.length > 0);
                }
            }
            catch {
                setSuggestions([]);
            }
            finally {
                setLoading(false);
            }
        }, 400);
    };
    const handleSelect = (item) => {
        // Clean up display name (e.g. keep first 3 segments)
        const parts = item.display_name.split(', ');
        const conciseName = parts.slice(0, 3).join(', ');
        const selected = {
            name: conciseName,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
        };
        setQuery(conciseName);
        setIsOpen(false);
        onChange(selected);
    };
    return (_jsxs("div", { className: "location-input-container", ref: containerRef, children: [label && (_jsxs("label", { htmlFor: id, className: "form-label", children: [label, " ", required && _jsx("span", { className: "text-error", children: "*" })] })), _jsxs("div", { className: "location-input-wrapper", children: [_jsx(MapPin, { className: "location-icon", size: 18, "aria-hidden": "true" }), _jsx("input", { id: id, type: "text", className: `form-input location-input-field ${error ? 'has-error' : ''}`, placeholder: placeholder, value: query, onChange: handleInputChange, onFocus: () => suggestions.length > 0 && setIsOpen(true), required: required, autoComplete: "off" }), loading && _jsx(Loader2, { className: "spinner-icon", size: 18, "aria-hidden": "true" })] }), error && _jsx("span", { className: "form-error", children: error }), isOpen && suggestions.length > 0 && (_jsx("ul", { className: "location-suggestions-dropdown", role: "listbox", children: suggestions.map((item) => (_jsxs("li", { className: "location-suggestion-item", onClick: () => handleSelect(item), role: "option", "aria-selected": "false", tabIndex: 0, onKeyDown: (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            handleSelect(item);
                        }
                    }, children: [_jsx(MapPin, { size: 16, className: "item-icon", "aria-hidden": "true" }), _jsx("span", { className: "item-text", children: item.display_name })] }, item.place_id))) }))] }));
};
