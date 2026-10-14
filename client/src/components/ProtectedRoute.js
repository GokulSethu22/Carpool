import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
export const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (_jsxs("div", { className: "page-loader", role: "status", "aria-label": "Loading authentication state", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Verifying session..." })] }));
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", state: { from: location }, replace: true });
    }
    return _jsx(Outlet, {});
};
