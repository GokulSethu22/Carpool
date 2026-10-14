// Layout.tsx — Main responsive navigation shell with Driver/Rider mode switch and notification center.
import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Notifications } from './Notifications';
import { Car, Search, PlusCircle, User, LogOut } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Mode: 'driver' or 'rider'
  const [mode, setMode] = useState<'driver' | 'rider'>(() => {
    return (localStorage.getItem('carpool_mode') as 'driver' | 'rider') || 'rider';
  });

  useEffect(() => {
    localStorage.setItem('carpool_mode', mode);
  }, [mode]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="header" role="banner">
        <div className="header-inner container">
          <div className="header-left">
            <Link to="/" className="brand-logo" aria-label="Carpool Home">
              <span className="brand-title">Carpool</span>
              <span className="brand-region">TN</span>
            </Link>

            {user && (
              <div className="mode-toggle" role="group" aria-label="Switch between rider and driver view">
                <button
                  type="button"
                  className={`mode-btn ${mode === 'rider' ? 'is-active' : ''}`}
                  onClick={() => setMode('rider')}
                  aria-pressed={mode === 'rider'}
                >
                  <Search size={14} aria-hidden="true" />
                  <span>Rider</span>
                </button>
                <button
                  type="button"
                  className={`mode-btn ${mode === 'driver' ? 'is-active' : ''}`}
                  onClick={() => setMode('driver')}
                  aria-pressed={mode === 'driver'}
                >
                  <Car size={14} aria-hidden="true" />
                  <span>Driver</span>
                </button>
              </div>
            )}
          </div>

          <nav className="header-nav" role="navigation" aria-label="Main Navigation">
            {user ? (
              <>
                {mode === 'rider' ? (
                  <>
                    <NavLink to="/search" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                      Find a ride
                    </NavLink>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                      Dashboard
                    </NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/publish" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                      <PlusCircle size={15} className="mr-1" aria-hidden="true" />
                      Publish route
                    </NavLink>
                    <NavLink to="/vehicles" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                      My vehicles
                    </NavLink>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                      Dashboard
                    </NavLink>
                  </>
                )}

                <div className="header-actions">
                  <Notifications />

                  <Link to="/profile" className="user-profile-link" title="My Profile" aria-label="My Profile">
                    <User size={18} aria-hidden="true" />
                    <span className="user-name">{user.name.split(' ')[0]}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="logout-btn"
                    title="Log out"
                    aria-label="Log out"
                  >
                    <LogOut size={17} aria-hidden="true" />
                  </button>
                </div>
              </>
            ) : (
              <div className="auth-links">
                <Link to="/search" className="nav-link">
                  Search rides
                </Link>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Log in
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Sign up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content" role="main">
        <Outlet />
      </main>

      <footer className="footer" role="contentinfo">
        <div className="footer-inner container">
          <p className="footer-copy text-secondary text-sm">
            Carpool — Shared commuter routes across Tamil Nadu. Fares split by distance and vehicle occupancy.
          </p>
          <div className="footer-cities text-secondary text-xs">
            <span>Chennai</span> &bull; <span>Coimbatore</span> &bull; <span>Madurai</span> &bull; <span>Tiruchirappalli</span> &bull; <span>Salem</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
