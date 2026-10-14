// Login.tsx — User login form with error feedback, demo accounts, and redirection.
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LogIn, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Return to intended page or dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="auth-page container">
      <div className="auth-card card">
        <div className="auth-header">
          <h1 className="auth-title">Log in to Carpool</h1>
          <p className="auth-subtitle text-secondary">
            Manage your published commutes and booked seats
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kavitha@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex-center">Logging in...</span>
            ) : (
              <span className="flex-center">
                <LogIn size={16} className="mr-1" aria-hidden="true" />
                Log in
              </span>
            )}
          </button>
        </form>

        <div className="demo-accounts-box">
          <p className="demo-label text-xs font-semibold text-secondary">
            Quick demo logins (password: password123):
          </p>
          <div className="demo-chips">
            <button
              type="button"
              className="demo-chip"
              onClick={() => fillDemoAccount('kavitha@example.com')}
            >
              Kavitha (Cab driver)
            </button>
            <button
              type="button"
              className="demo-chip"
              onClick={() => fillDemoAccount('rajesh@example.com')}
            >
              Rajesh (Auto driver)
            </button>
            <button
              type="button"
              className="demo-chip"
              onClick={() => fillDemoAccount('priya@example.com')}
            >
              Priya (Rider / Bike)
            </button>
          </div>
        </div>

        <div className="auth-footer text-sm text-secondary">
          Don't have an account yet?{' '}
          <Link to="/signup" className="link font-semibold">
            Sign up <ArrowRight size={13} className="inline-icon" />
          </Link>
        </div>
      </div>
    </div>
  );
};
