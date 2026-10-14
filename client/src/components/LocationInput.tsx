// LocationInput.tsx — Debounced address autocomplete bounded to Tamil Nadu via OpenStreetMap Nominatim.
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { TN_BOUNDS } from '../../../shared/types';

export interface LocationValue {
  name: string;
  lat: number;
  lng: number;
}

interface LocationInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: LocationValue | null;
  onChange: (value: LocationValue) => void;
  error?: string;
  required?: boolean;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  id,
  label,
  placeholder = 'Search place in Tamil Nadu...',
  value,
  onChange,
  error,
  required = false,
}) => {
  const [query, setQuery] = useState(value?.name || '');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value) {
      setQuery(value.name);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          val,
        )}&countrycodes=in&viewbox=${viewbox}&bounded=1&limit=5&addressdetails=1`;

        const res = await fetch(url, {
          headers: {
            'Accept-Language': 'en,ta',
          },
        });

        if (res.ok) {
          const data = (await res.json()) as NominatimResult[];
          setSuggestions(data);
          setIsOpen(data.length > 0);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (item: NominatimResult) => {
    // Clean up display name (e.g. keep first 3 segments)
    const parts = item.display_name.split(', ');
    const conciseName = parts.slice(0, 3).join(', ');

    const selected: LocationValue = {
      name: conciseName,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };

    setQuery(conciseName);
    setIsOpen(false);
    onChange(selected);
  };

  return (
    <div className="location-input-container" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="location-input-wrapper">
        <MapPin className="location-icon" size={18} aria-hidden="true" />
        <input
          id={id}
          type="text"
          className={`form-input location-input-field ${error ? 'has-error' : ''}`}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          required={required}
          autoComplete="off"
        />
        {loading && <Loader2 className="spinner-icon" size={18} aria-hidden="true" />}
      </div>

      {error && <span className="form-error">{error}</span>}

      {isOpen && suggestions.length > 0 && (
        <ul className="location-suggestions-dropdown" role="listbox">
          {suggestions.map((item) => (
            <li
              key={item.place_id}
              className="location-suggestion-item"
              onClick={() => handleSelect(item)}
              role="option"
              aria-selected="false"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSelect(item);
                }
              }}
            >
              <MapPin size={16} className="item-icon" aria-hidden="true" />
              <span className="item-text">{item.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
