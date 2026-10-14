// Profile.tsx — User profile page supporting self-editing, reviews inspection, and public profile view.
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../lib/auth';
import { RatingStars } from '../components/RatingStars';
import { VehicleBadge } from '../components/VehicleBadge';
import { formatPhone, formatDate, timeAgo } from '../lib/format';
import {
  User as UserIcon,
  Phone,
  Star,
  CheckCircle,
  Ban,
  AlertCircle,
} from 'lucide-react';
import { PHONE_REGEX } from '../../../shared/types';
import type { Rating, VehicleType } from '../../../shared/types';

interface PublicProfile {
  id: number;
  name: string;
  created_at: string;
  phone: string | null;
  phone_hidden: boolean;
  average_rating: number;
  total_ratings: number;
  vehicles: Array<{
    type: VehicleType;
    model: string;
    colour: string;
    seat_capacity: number;
  }>;
  ratings: Rating[];
}

export const Profile: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const isSelf = !id || (user && user.id === Number(id));
  const targetUserId = id ? Number(id) : user?.id;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Self edit state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!targetUserId) return;

    setLoading(true);
    api.get<{ profile: PublicProfile }>(`/users/${targetUserId}/profile`)
      .then((data) => {
        setProfile(data.profile);
        setName(data.profile.name);
        setPhone(data.profile.phone || '+91');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load profile');
      })
      .finally(() => setLoading(false));
  }, [targetUserId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let cleanPhone: string | null = null;
    if (phone.trim() && phone !== '+91') {
      const p = phone.trim().replace(/\s+/g, '');
      if (!PHONE_REGEX.test(p)) {
        setError('Phone must be a valid 10-digit Indian number prefixed with +91 (e.g. +919876543210).');
        return;
      }
      cleanPhone = p;
    }

    setSaving(true);
    try {
      await api.put('/profile', { name, phone: cleanPhone });
      setSaveSuccess(true);
      await refreshUser();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleBlockUser = async () => {
    if (!targetUserId || !window.confirm('Are you sure you want to block this user?')) return;
    try {
      await api.post('/blocks', { blocked_id: targetUserId });
      alert('User has been blocked.');
      navigate('/dashboard');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to block user');
    }
  };

  if (loading) {
    return (
      <div className="page-loader container py-12">
        <div className="spinner" />
        <p>Loading user profile...</p>
      </div>
    );
  }

  if (!profile) {
    return <div className="alert alert-error container mt-6">Profile not found</div>;
  }

  return (
    <div className="profile-page container py-6 max-w-2xl">
      <div className="profile-header card mb-6">
        <div className="flex-between">
          <div className="flex-center">
            <div className="profile-avatar-circle">
              <UserIcon size={32} className="text-base-primary" />
            </div>
            <div className="ml-4">
              <h1 className="text-xl font-bold">{profile.name}</h1>
              <span className="text-xs text-secondary">
                Commuter in Tamil Nadu &bull; Member since {formatDate(profile.created_at)}
              </span>
            </div>
          </div>

          <div className="rating-badge text-right">
            <div className="flex-center">
              <Star size={16} className="text-accent mr-1 fill-accent" />
              <span className="font-bold text-lg font-mono">
                {profile.average_rating > 0 ? profile.average_rating : 'New'}
              </span>
            </div>
            <span className="text-xs text-secondary">
              {profile.total_ratings} review{profile.total_ratings !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {!isSelf && (
          <div className="profile-public-actions flex-between mt-4 pt-3 border-top">
            <div className="phone-privacy-info flex-center text-sm text-secondary">
              <Phone size={14} className="mr-1" />
              {profile.phone ? (
                <span className="font-mono font-medium">{formatPhone(profile.phone)}</span>
              ) : (
                <span className="text-xs">Phone hidden until confirmed booking</span>
              )}
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-xs text-error"
              onClick={handleBlockUser}
            >
              <Ban size={12} className="mr-1" />
              Block user
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error mb-4" role="alert">
          <AlertCircle size={16} className="inline-icon mr-1" />
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="alert alert-success mb-4" role="alert">
          <CheckCircle size={16} className="inline-icon mr-1" />
          Profile updated successfully.
        </div>
      )}

      {/* Edit Form if own profile */}
      {isSelf && (
        <div className="card mb-6">
          <h2 className="text-base font-bold mb-3">Edit your account details</h2>
          <form onSubmit={handleSaveProfile}>
            <div className="form-group mb-3">
              <label htmlFor="prof-name" className="form-label">
                Display name
              </label>
              <input
                id="prof-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="prof-phone" className="form-label">
                Mobile phone (+91 format)
              </label>
              <input
                id="prof-phone"
                type="tel"
                className="form-input font-mono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
              />
              <span className="form-hint text-xs text-secondary">
                Protected: Only revealed to passengers whose bookings you confirm.
              </span>
            </div>

            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>
      )}

      {/* Registered Vehicles */}
      {profile.vehicles.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-base font-bold mb-3">Registered vehicles</h2>
          <div className="vehicles-chips-row flex-gap-2">
            {profile.vehicles.map((v, idx) => (
              <VehicleBadge
                key={idx}
                type={v.type}
                model={v.model}
                colour={v.colour}
                capacity={v.seat_capacity}
              />
            ))}
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="card reviews-card">
        <h2 className="text-base font-bold mb-3">
          Reviews & feedback ({profile.ratings.length})
        </h2>

        {profile.ratings.length === 0 ? (
          <p className="text-secondary text-sm">No trip reviews recorded yet.</p>
        ) : (
          <div className="reviews-list">
            {profile.ratings.map((r) => (
              <div key={r.id} className="review-item py-3 border-top">
                <div className="flex-between mb-1">
                  <span className="font-semibold text-sm">{r.from_user_name || 'Commuter'}</span>
                  <div className="flex-center">
                    <RatingStars score={r.score} size={14} />
                    <span className="text-secondary text-xs ml-2">{timeAgo(r.created_at)}</span>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-secondary mt-1">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
