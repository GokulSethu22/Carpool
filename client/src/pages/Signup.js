import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Signup.tsx — New user registration with name, email, password, and +91 phone validation.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { UserPlus, ArrowRight } from 'lucide-react';
import { PHONE_REGEX } from '../../../shared/types';
export const Signup = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('+91');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        // Validate phone if provided
        let finalPhone = undefined;
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
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "auth-page container", children: _jsxs("div", { className: "auth-card card", children: [_jsxs("div", { className: "auth-header", children: [_jsx("h1", { className: "auth-title", children: "Create an account" }), _jsx("p", { className: "auth-subtitle text-secondary", children: "Join Tamil Nadu commuters sharing daily rides" })] }), error && (_jsx("div", { className: "alert alert-error", role: "alert", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "auth-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "signup-name", className: "form-label", children: "Full name" }), _jsx("input", { id: "signup-name", type: "text", className: "form-input", value: name, onChange: (e) => setName(e.target.value), placeholder: "E.g. Kavitha Selvam", required: true, autoFocus: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "signup-email", className: "form-label", children: "Email address" }), _jsx("input", { id: "signup-email", type: "email", className: "form-input", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "kavitha@example.com", required: true })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "signup-phone", className: "form-label", children: ["Phone number ", _jsx("span", { className: "text-secondary text-xs", children: "(Hidden until booking confirmed)" })] }), _jsx("input", { id: "signup-phone", type: "tel", className: "form-input", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+919876543210" }), _jsx("span", { className: "form-hint text-xs text-secondary", children: "10-digit Indian mobile number prefixed with +91" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "signup-password", className: "form-label", children: "Password" }), _jsx("input", { id: "signup-password", type: "password", className: "form-input", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Minimum 6 characters", minLength: 6, required: true })] }), _jsx("button", { type: "submit", className: "btn btn-primary btn-block", disabled: submitting, children: submitting ? (_jsx("span", { className: "flex-center", children: "Creating account..." })) : (_jsxs("span", { className: "flex-center", children: [_jsx(UserPlus, { size: 16, className: "mr-1", "aria-hidden": "true" }), "Sign up"] })) })] }), _jsxs("div", { className: "auth-footer text-sm text-secondary", children: ["Already registered?", ' ', _jsxs(Link, { to: "/login", className: "link font-semibold", children: ["Log in ", _jsx(ArrowRight, { size: 13, className: "inline-icon" })] })] })] }) }));
};
