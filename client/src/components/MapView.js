import { jsx as _jsx } from "react/jsx-runtime";
// MapView.tsx — Interactive Leaflet map container restricted to Tamil Nadu state boundaries.
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { TN_BOUNDS } from '../../../shared/types';
export const MapView = ({ center = [TN_BOUNDS.center.lat, TN_BOUNDS.center.lng], zoom = 7, height = '400px', className = '', onMapReady, }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    useEffect(() => {
        if (!mapContainerRef.current)
            return;
        if (mapInstanceRef.current)
            return;
        // Tamil Nadu strict bounding box
        const southWest = L.latLng(TN_BOUNDS.south - 0.2, TN_BOUNDS.west - 0.2);
        const northEast = L.latLng(TN_BOUNDS.north + 0.2, TN_BOUNDS.east + 0.2);
        const bounds = L.latLngBounds(southWest, northEast);
        const map = L.map(mapContainerRef.current, {
            center,
            zoom,
            minZoom: 6,
            maxBounds: bounds,
            maxBoundsViscosity: 0.9,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        mapInstanceRef.current = map;
        if (onMapReady) {
            onMapReady(map);
        }
        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount
    return (_jsx("div", { ref: mapContainerRef, style: { height, width: '100%', borderRadius: 'var(--radius-md)' }, className: `map-view-wrapper ${className}`, role: "region", "aria-label": "Map showing route details in Tamil Nadu" }));
};
