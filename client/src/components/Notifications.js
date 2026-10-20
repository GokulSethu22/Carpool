import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// Notifications.tsx — In-app notification bell with real-time polling, dropdown, and unread badges.
import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { api } from '../api/client';
import { timeAgo } from '../lib/format';
export const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const fetchNotifications = async () => {
        try {
            const data = await api.get('/notifications');
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
        }
        catch {
            // Ignore background poll errors
        }
    };
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleMarkAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        catch {
            // ignore
        }
    };
    return (_jsxs("div", { className: "notifications-container", ref: containerRef, children: [_jsxs("button", { className: "icon-button notification-trigger", onClick: () => setIsOpen(!isOpen), "aria-label": `Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`, "aria-expanded": isOpen, children: [_jsx(Bell, { size: 20, "aria-hidden": "true" }), unreadCount > 0 && (_jsx("span", { className: "notification-badge", "aria-hidden": "true", children: unreadCount > 9 ? '9+' : unreadCount }))] }), isOpen && (_jsxs("div", { className: "notifications-dropdown", role: "dialog", "aria-label": "Notifications list", children: [_jsxs("div", { className: "notifications-header", children: [_jsx("h3", { children: "Notifications" }), _jsxs("span", { className: "text-secondary text-xs", children: [unreadCount, " unread"] })] }), _jsx("div", { className: "notifications-list", children: notifications.length === 0 ? (_jsx("p", { className: "notifications-empty", children: "No notifications yet." })) : (notifications.map((notif) => (_jsxs("div", { className: `notification-item ${notif.is_read ? 'is-read' : 'is-unread'}`, onClick: () => !notif.is_read && handleMarkAsRead(notif.id), children: [_jsxs("div", { className: "notification-content", children: [_jsx("p", { className: "notification-message", children: notif.message }), _jsx("span", { className: "notification-time", children: timeAgo(notif.created_at) })] }), !notif.is_read && (_jsx("button", { className: "mark-read-btn", onClick: (e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notif.id);
                                    }, title: "Mark as read", "aria-label": "Mark as read", children: _jsx(Check, { size: 14 }) }))] }, notif.id)))) })] }))] }));
};
