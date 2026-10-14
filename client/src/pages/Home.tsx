// Home.tsx — Home landing view with live Tamil Nadu route map and immediate search access.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { LocationInput, LocationValue } from '../components/LocationInput';
import { MapView } from '../components/MapView';
import { useAuth } from '../lib/auth';
import { Search, PlusCircle, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import type { Route } from '../../../shared/types';
import L from 'leaflet';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pickup, setPickup] = useState<LocationValue | null>(null);
  const [drop, setDrop] = useState<LocationValue | null>(null);
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [activeRoutes, setActiveRoutes] = useState<Route[]>([]);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    // Fetch some active routes to plot on home map
    api.get<{ results: Route[] }>(
      '/search?pickup_lat=13.0827&pickup_lng=80.2707&drop_lat=12.9249&drop_lng=80.1000&max_detour_km=50',
    )
      .then((res) => {
        setActiveRoutes(res.results.slice(0, 8));
      })
      .catch(() => {
        // quiet fallback
      });
  }, []);

  // Plot routes on home map when available
  useEffect(() => {
    if (!mapInstance || activeRoutes.length === 0) return;

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

  const handleSearchSubmit = (e: React.FormEvent) => {
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

  return (
    <div className="home-page">
      <section className="home-hero-section container">
        <div className="home-hero-text">
          <span className="badge badge-neutral">Commuters across Tamil Nadu</span>
          <h1 className="hero-title">
            Share your regular commute. <br />
            Split your fare.
          </h1>
          <p className="hero-description text-secondary">
            Drivers travelling across Chennai, Coimbatore, Madurai, or along the OMR corridor list their existing routes. Riders heading in the same direction book a seat and split the cost per kilometre.
          </p>

          <form onSubmit={handleSearchSubmit} className="home-search-panel card">
            <h2 className="panel-title text-base font-semibold">Find a ride along your path</h2>
            <div className="home-search-grid">
              <LocationInput
                id="home-pickup"
                label="Pickup"
                placeholder="E.g. Tambaram or Gandhipuram"
                value={pickup}
                onChange={setPickup}
                required
              />

              <LocationInput
                id="home-drop"
                label="Drop"
                placeholder="E.g. T. Nagar or Peelamedu"
                value={drop}
                onChange={setDrop}
                required
              />

              <div className="form-group">
                <label htmlFor="home-date" className="form-label">Date</label>
                <input
                  id="home-date"
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="home-search-actions">
              <button type="submit" className="btn btn-primary">
                <Search size={16} aria-hidden="true" />
                Find rides
              </button>

              {user ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/publish')}
                >
                  <PlusCircle size={16} aria-hidden="true" />
                  Publish your route
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/signup')}
                >
                  Join as driver
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="home-map-preview">
          <div className="map-badge-overlay">
            <MapPin size={14} className="text-accent" />
            <span>Active Tamil Nadu routes</span>
          </div>
          <MapView height="420px" onMapReady={setMapInstance} />
        </div>
      </section>

      <section className="home-how-it-works container">
        <div className="how-header">
          <h2 className="text-xl font-bold">How the shared commute works</h2>
          <p className="text-secondary text-sm">
            Not a taxi booking service. You share a ride on a journey someone is already making.
          </p>
        </div>

        <div className="steps-row">
          <div className="step-item">
            <span className="step-num">1</span>
            <h3 className="step-title">Driver publishes regular route</h3>
            <p className="step-body text-secondary text-sm">
              Add your origin, destination, any stops, vehicle (bike, auto, or cab), and your price per kilometre.
            </p>
          </div>

          <div className="step-item">
            <span className="step-num">2</span>
            <h3 className="step-title">Rider searches along the path</h3>
            <p className="step-body text-secondary text-sm">
              Routes match if both your pickup and drop are within 1.5 km of the driver's route, in the correct direction.
            </p>
          </div>

          <div className="step-item">
            <span className="step-num">3</span>
            <h3 className="step-title">Automated segment fare split</h3>
            <p className="step-body text-secondary text-sm">
              Each stretch between pickup and drop points is split equally among everyone inside the vehicle at that moment.
            </p>
          </div>
        </div>
      </section>

      <section className="home-cities container">
        <div className="cities-card card">
          <div className="cities-info">
            <ShieldCheck size={24} className="text-base-primary" />
            <div>
              <h3 className="font-semibold text-base">Statewide local coverage</h3>
              <p className="text-secondary text-sm">
                Chennai city commutes (Tambaram, Guindy, T. Nagar, OMR IT Corridor), Coimbatore (Gandhipuram to Peelamedu), Madurai city corridors, and short runs like Chengalpattu to Tambaram.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/search')}
          >
            Explore all rides
            <ArrowRight size={14} className="ml-1" />
          </button>
        </div>
      </section>
    </div>
  );
};
