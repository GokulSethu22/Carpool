import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Login.tsx — User login form with error feedback, demo accounts, and redirection.
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LogIn, ArrowRight } from 'lucide-react';
export const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    // Return to intended page or dashboard
    const from = location.state?.from?.pathname || '/dashboard';
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await login(email, password);
            navigate(from, { replace: true });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
        }
        finally {
            setSubmitting(false);
        }
    };
    const fillDemoAccount = (demoEmail) => {
        setEmail(demoEmail);
        setPassword('password123');
        setError(null);
    };
    return (_jsx("div", { className: "auth-page container", children: _jsxs("div", { className: "auth-card card", children: [_jsxs("div", { className: "auth-header", children: [_jsx("h1", { className: "auth-title", children: "Log in to Carpool" }), _jsx("p", { className: "auth-subtitle text-secondary", children: "Manage your published commutes and booked seats" })] }), error && (_jsx("div", { className: "alert alert-error", role: "alert", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "auth-form", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "login-email", className: "form-label", children: "Email address" }), _jsx("input", { id: "login-email", type: "email", className: "form-input", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "kavitha@example.com", required: true, autoFocus: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "login-password", className: "form-label", children: "Password" }), _jsx("input", { id: "login-password", type: "password", className: "form-input", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] }), _jsx("button", { type: "submit", className: "btn btn-primary btn-block", disabled: submitting, children: submitting ? (_jsx("span", { className: "flex-center", children: "Logging in..." })) : (_jsxs("span", { className: "flex-center", children: [_jsx(LogIn, { size: 16, className: "mr-1", "aria-hidden": "true" }), "Log in"] })) })] }), _jsxs("div", { className: "demo-accounts-box", children: [_jsx("p", { className: "demo-label text-xs font-semibold text-secondary", children: "Quick demo logins (password: password123):" }), _jsxs("div", { className: "demo-chips", children: [_jsx("button", { type: "button", className: "demo-chip", onClick: () => fillDemoAccount('kavitha@example.com'), children: "Kavitha (Cab driver)" }), _jsx("button", { type: "button", className: "demo-chip", onClick: () => fillDemoAccount('rajesh@example.com'), children: "Rajesh (Auto driver)" }), _jsx("button", { type: "button", className: "demo-chip", onClick: () => fillDemoAccount('priya@example.com'), children: "Priya (Rider / Bike)" })] })] }), _jsxs("div", { className: "auth-footer text-sm text-secondary", children: ["Don't have an account yet?", ' ', _jsxs(Link, { to: "/signup", className: "link font-semibold", children: ["Sign up ", _jsx(ArrowRight, { size: 13, className: "inline-icon" })] })] })] }) }));
};
