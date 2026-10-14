import { jsx as _jsx } from "react/jsx-runtime";
export const TripStatusBadge = ({ status }) => {
    const getBadgeClass = () => {
        switch (status) {
            case 'confirmed':
            case 'completed':
            case 'active':
                return 'badge-success';
            case 'requested':
            case 'in_progress':
            case 'paused':
                return 'badge-warning';
            case 'declined':
            case 'cancelled':
                return 'badge-error';
            default:
                return 'badge-neutral';
        }
    };
    const formatStatus = (s) => {
        return s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };
    return _jsx("span", { className: `badge ${getBadgeClass()}`, children: formatStatus(status) });
};
