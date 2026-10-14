import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction, }) => {
    return (_jsxs("div", { className: "empty-state", role: "status", children: [_jsx("div", { className: "empty-state-icon", children: _jsx(Icon, { size: 40, "aria-hidden": "true", strokeWidth: 1.5 }) }), _jsx("h3", { className: "empty-state-title", children: title }), _jsx("p", { className: "empty-state-description", children: description }), actionLabel && onAction && (_jsx("button", { type: "button", className: "btn btn-primary", onClick: onAction, children: actionLabel }))] }));
};
