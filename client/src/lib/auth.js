import { jsx as _jsx } from "react/jsx-runtime";
// auth.tsx — Authentication context and hook for user login, signup, and session state.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchCurrentUser = useCallback(async () => {
        try {
            const data = await api.get('/auth/me');
            setUser(data.user);
        }
        catch {
            setUser(null);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);
    const login = async (email, password) => {
        const data = await api.post('/auth/login', { email, password });
        setUser(data.user);
    };
    const signup = async (name, email, password, phone) => {
        const data = await api.post('/auth/signup', { name, email, password, phone });
        setUser(data.user);
    };
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        }
        finally {
            setUser(null);
        }
    };
    const refreshUser = async () => {
        await fetchCurrentUser();
    };
    return (_jsx(AuthContext.Provider, { value: { user, loading, login, signup, logout, refreshUser }, children: children }));
};
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
