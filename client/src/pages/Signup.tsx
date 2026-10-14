// Signup.tsx — New user registration with name, email, password, and +91 phone validation.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { UserPlus, ArrowRight } from 'lucide-react';
import { PHONE_REGEX } from '../../../shared/types';

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+91');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone if provided
    let finalPhone: string | undefined = undefined;
    if (phone.trim() && phone !== '+91') {
      const cleanPhone = phone.trim().replace(/\s+/g, '');
      if (!PHONE_REGEX.test(cleanPhone)) {
        setError('Phone must be a valid 10-digit Indian number starting with +91 (e.g. +919876543210).');
        return;
      }
      finalPhone = cleanPhone;
    }

    setSubmitting(true);
    try {
      await signup(name, email, password, finalPhone);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page container">
      <div className="auth-card card">
        <div className="auth-header">
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle text-secondary">
            Join Tamil Nadu commuters sharing daily rides
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="signup-name" className="form-label">
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Kavitha Selvam"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">
              Email address
            </label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kavitha@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-phone" className="form-label">
              Phone number <span className="text-secondary text-xs">(Hidden until booking confirmed)</span>
            </label>
            <input
              id="signup-phone"
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
            />
            <span className="form-hint text-xs text-secondary">
              10-digit Indian mobile number prefixed with +91
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex-center">Creating account...</span>
            ) : (
              <span className="flex-center">
                <UserPlus size={16} className="mr-1" aria-hidden="true" />
                Sign up
              </span>
            )}
          </button>
        </form>

        <div className="auth-footer text-sm text-secondary">
          Already registered?{' '}
          <Link to="/login" className="link font-semibold">
            Log in <ArrowRight size={13} className="inline-icon" />
          </Link>
        </div>
      </div>
    </div>
  );
};
