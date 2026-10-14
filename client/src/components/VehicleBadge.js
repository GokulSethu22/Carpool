import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bike, Car, Navigation } from 'lucide-react';
export const VehicleBadge = ({ type, registration, model, colour, capacity, }) => {
    const getIcon = () => {
        switch (type) {
            case 'bike':
                return _jsx(Bike, { size: 16, "aria-hidden": "true" });
            case 'auto':
                return _jsx(Navigation, { size: 16, "aria-hidden": "true" });
            case 'cab':
            default:
                return _jsx(Car, { size: 16, "aria-hidden": "true" });
        }
    };
    const getLabel = () => {
        switch (type) {
            case 'bike':
                return 'Bike';
            case 'auto':
                return 'Auto';
            case 'cab':
                return 'Cab';
        }
    };
    return (_jsxs("div", { className: `vehicle-badge vehicle-badge-${type}`, children: [_jsx("span", { className: "vehicle-type-icon", children: getIcon() }), _jsx("span", { className: "vehicle-type-name", children: getLabel() }), registration && _jsx("span", { className: "vehicle-plate", children: registration }), model && _jsxs("span", { className: "vehicle-model text-secondary", children: ["(", model, ")"] }), colour && (_jsx("span", { className: "colour-dot", style: { backgroundColor: colour.toLowerCase() }, title: `Colour: ${colour}` })), capacity !== undefined && (_jsxs("span", { className: "vehicle-capacity text-secondary text-xs", children: [capacity, " seats"] }))] }));
};
