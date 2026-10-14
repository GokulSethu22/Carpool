import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Profile.tsx — User profile page supporting self-editing, reviews inspection, and public profile view.
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../lib/auth';
import { RatingStars } from '../components/RatingStars';
import { VehicleBadge } from '../components/VehicleBadge';
import { formatPhone, formatDate, timeAgo } from '../lib/format';
import { User as UserIcon, Phone, Star, CheckCircle, Ban, AlertCircle, } from 'lucide-react';
import { PHONE_REGEX } from '../../../shared/types';
export const Profile = () => {
    const { id } = useParams();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const isSelf = !id || (user && user.id === Number(id));
    const targetUserId = id ? Number(id) : user?.id;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Self edit state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (!targetUserId)
            return;
        setLoading(true);
        api.get(`/users/${targetUserId}/profile`)
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
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setError(null);
        let cleanPhone = null;
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        }
        finally {
            setSaving(false);
        }
    };
    const handleBlockUser = async () => {
        if (!targetUserId || !window.confirm('Are you sure you want to block this user?'))
            return;
        try {
            await api.post('/blocks', { blocked_id: targetUserId });
            alert('User has been blocked.');
            navigate('/dashboard');
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to block user');
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "page-loader container py-12", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading user profile..." })] }));
    }
    if (!profile) {
        return _jsx("div", { className: "alert alert-error container mt-6", children: "Profile not found" });
    }
    return (_jsxs("div", { className: "profile-page container py-6 max-w-2xl", children: [_jsxs("div", { className: "profile-header card mb-6", children: [_jsxs("div", { className: "flex-between", children: [_jsxs("div", { className: "flex-center", children: [_jsx("div", { className: "profile-avatar-circle", children: _jsx(UserIcon, { size: 32, className: "text-base-primary" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h1", { className: "text-xl font-bold", children: profile.name }), _jsxs("span", { className: "text-xs text-secondary", children: ["Commuter in Tamil Nadu \u2022 Member since ", formatDate(profile.created_at)] })] })] }), _jsxs("div", { className: "rating-badge text-right", children: [_jsxs("div", { className: "flex-center", children: [_jsx(Star, { size: 16, className: "text-accent mr-1 fill-accent" }), _jsx("span", { className: "font-bold text-lg font-mono", children: profile.average_rating > 0 ? profile.average_rating : 'New' })] }), _jsxs("span", { className: "text-xs text-secondary", children: [profile.total_ratings, " review", profile.total_ratings !== 1 ? 's' : ''] })] })] }), !isSelf && (_jsxs("div", { className: "profile-public-actions flex-between mt-4 pt-3 border-top", children: [_jsxs("div", { className: "phone-privacy-info flex-center text-sm text-secondary", children: [_jsx(Phone, { size: 14, className: "mr-1" }), profile.phone ? (_jsx("span", { className: "font-mono font-medium", children: formatPhone(profile.phone) })) : (_jsx("span", { className: "text-xs", children: "Phone hidden until confirmed booking" }))] }), _jsxs("button", { type: "button", className: "btn btn-secondary btn-xs text-error", onClick: handleBlockUser, children: [_jsx(Ban, { size: 12, className: "mr-1" }), "Block user"] })] }))] }), error && (_jsxs("div", { className: "alert alert-error mb-4", role: "alert", children: [_jsx(AlertCircle, { size: 16, className: "inline-icon mr-1" }), error] })), saveSuccess && (_jsxs("div", { className: "alert alert-success mb-4", role: "alert", children: [_jsx(CheckCircle, { size: 16, className: "inline-icon mr-1" }), "Profile updated successfully."] })), isSelf && (_jsxs("div", { className: "card mb-6", children: [_jsx("h2", { className: "text-base font-bold mb-3", children: "Edit your account details" }), _jsxs("form", { onSubmit: handleSaveProfile, children: [_jsxs("div", { className: "form-group mb-3", children: [_jsx("label", { htmlFor: "prof-name", className: "form-label", children: "Display name" }), _jsx("input", { id: "prof-name", type: "text", className: "form-input", value: name, onChange: (e) => setName(e.target.value), required: true })] }), _jsxs("div", { className: "form-group mb-3", children: [_jsx("label", { htmlFor: "prof-phone", className: "form-label", children: "Mobile phone (+91 format)" }), _jsx("input", { id: "prof-phone", type: "tel", className: "form-input font-mono", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+919876543210" }), _jsx("span", { className: "form-hint text-xs text-secondary", children: "Protected: Only revealed to passengers whose bookings you confirm." })] }), _jsx("button", { type: "submit", className: "btn btn-primary btn-sm", disabled: saving, children: saving ? 'Saving...' : 'Save profile' })] })] })), profile.vehicles.length > 0 && (_jsxs("div", { className: "card mb-6", children: [_jsx("h2", { className: "text-base font-bold mb-3", children: "Registered vehicles" }), _jsx("div", { className: "vehicles-chips-row flex-gap-2", children: profile.vehicles.map((v, idx) => (_jsx(VehicleBadge, { type: v.type, model: v.model, colour: v.colour, capacity: v.seat_capacity }, idx))) })] })), _jsxs("div", { className: "card reviews-card", children: [_jsxs("h2", { className: "text-base font-bold mb-3", children: ["Reviews & feedback (", profile.ratings.length, ")"] }), profile.ratings.length === 0 ? (_jsx("p", { className: "text-secondary text-sm", children: "No trip reviews recorded yet." })) : (_jsx("div", { className: "reviews-list", children: profile.ratings.map((r) => (_jsxs("div", { className: "review-item py-3 border-top", children: [_jsxs("div", { className: "flex-between mb-1", children: [_jsx("span", { className: "font-semibold text-sm", children: r.from_user_name || 'Commuter' }), _jsxs("div", { className: "flex-center", children: [_jsx(RatingStars, { score: r.score, size: 14 }), _jsx("span", { className: "text-secondary text-xs ml-2", children: timeAgo(r.created_at) })] })] }), r.comment && _jsx("p", { className: "text-sm text-secondary mt-1", children: r.comment })] }, r.id))) }))] })] }));
};
