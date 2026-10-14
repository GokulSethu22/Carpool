import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// MyVehicles.tsx — Driver vehicle registry with TN registration regex checks and capacity rules.
import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { VehicleBadge } from '../components/VehicleBadge';
import { EmptyState } from '../components/EmptyState';
import { Car, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { TN_PLATE_REGEX } from '../../../shared/types';
export const MyVehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Form states
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingVehicleId, setEditingVehicleId] = useState(null);
    const [type, setType] = useState('cab');
    const [registration, setRegistration] = useState('');
    const [model, setModel] = useState('');
    const [colour, setColour] = useState('');
    const [seatCapacity, setSeatCapacity] = useState(4);
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const fetchVehicles = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.get('/vehicles');
            setVehicles(data.vehicles);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Could not fetch your vehicles');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchVehicles();
    }, []);
    const handleTypeChange = (newType) => {
        setType(newType);
        if (!editingVehicleId) {
            // Default capacity
            if (newType === 'bike')
                setSeatCapacity(1);
            if (newType === 'auto')
                setSeatCapacity(3);
            if (newType === 'cab')
                setSeatCapacity(4);
        }
    };
    const handleStartEdit = (v) => {
        setEditingVehicleId(v.id);
        setType(v.type);
        setRegistration(v.registration);
        setModel(v.model);
        setColour(v.colour);
        setSeatCapacity(v.seat_capacity);
        setShowAddForm(true);
        setFormError(null);
    };
    const resetForm = () => {
        setEditingVehicleId(null);
        setType('cab');
        setRegistration('');
        setModel('');
        setColour('');
        setSeatCapacity(4);
        setShowAddForm(false);
        setFormError(null);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        const cleanReg = registration.toUpperCase().trim();
        if (!TN_PLATE_REGEX.test(cleanReg)) {
            setFormError('Registration must follow Tamil Nadu plate format, e.g. TN 09 AB 1234 or TN 01 C 5678.');
            return;
        }
        setSubmitting(true);
        try {
            if (editingVehicleId) {
                await api.put(`/vehicles/${editingVehicleId}`, {
                    type,
                    registration: cleanReg,
                    model,
                    colour,
                    seat_capacity: Number(seatCapacity),
                });
            }
            else {
                await api.post('/vehicles', {
                    type,
                    registration: cleanReg,
                    model,
                    colour,
                    seat_capacity: Number(seatCapacity),
                });
            }
            resetForm();
            await fetchVehicles();
        }
        catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to save vehicle.');
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this vehicle?'))
            return;
        try {
            await api.delete(`/vehicles/${id}`);
            setVehicles((prev) => prev.filter((v) => v.id !== id));
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Could not delete vehicle');
        }
    };
    return (_jsxs("div", { className: "vehicles-page container", children: [_jsxs("div", { className: "page-header flex-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "page-title", children: "My Vehicles" }), _jsx("p", { className: "page-subtitle text-secondary", children: "Vehicles you use for publishing commuter routes in Tamil Nadu" })] }), !showAddForm && (_jsxs("button", { type: "button", className: "btn btn-primary btn-sm", onClick: () => {
                            resetForm();
                            setShowAddForm(true);
                        }, children: [_jsx(Plus, { size: 16, className: "mr-1", "aria-hidden": "true" }), "Add vehicle"] }))] }), showAddForm && (_jsxs("div", { className: "card vehicle-form-card mb-6", children: [_jsx("h2", { className: "text-base font-bold mb-4", children: editingVehicleId ? 'Edit vehicle' : 'Add a new vehicle' }), formError && (_jsxs("div", { className: "alert alert-error mb-4", role: "alert", children: [_jsx(AlertCircle, { size: 16, className: "mr-1 inline-icon" }), formError] })), _jsxs("form", { onSubmit: handleSubmit, className: "vehicle-form", children: [_jsxs("div", { className: "form-grid-3", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "veh-type", className: "form-label", children: "Vehicle type" }), _jsxs("select", { id: "veh-type", className: "form-select", value: type, onChange: (e) => handleTypeChange(e.target.value), children: [_jsx("option", { value: "bike", children: "Bike (Two-wheeler)" }), _jsx("option", { value: "auto", children: "Auto (Three-wheeler)" }), _jsx("option", { value: "cab", children: "Cab / Car" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "veh-reg", className: "form-label", children: "Registration number" }), _jsx("input", { id: "veh-reg", type: "text", className: "form-input font-mono", placeholder: "TN 09 AB 1234", value: registration, onChange: (e) => setRegistration(e.target.value), required: true }), _jsx("span", { className: "form-hint text-xs text-secondary", children: "Tamil Nadu plate (e.g. TN 09 AB 1234)" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "veh-capacity", className: "form-label", children: "Passenger seat capacity" }), _jsx("input", { id: "veh-capacity", type: "number", min: 1, max: 10, className: "form-input", value: seatCapacity, onChange: (e) => setSeatCapacity(Number(e.target.value)), required: true }), _jsx("span", { className: "form-hint text-xs text-secondary", children: "Excluding driver (Bike: 1, Auto: 3, Cab: 4 default)" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "veh-model", className: "form-label", children: "Vehicle model" }), _jsx("input", { id: "veh-model", type: "text", className: "form-input", placeholder: "E.g. Maruti Dzire, Bajaj RE, Honda Activa", value: model, onChange: (e) => setModel(e.target.value), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "veh-colour", className: "form-label", children: "Colour" }), _jsx("input", { id: "veh-colour", type: "text", className: "form-input", placeholder: "E.g. White, Yellow, Black", value: colour, onChange: (e) => setColour(e.target.value), required: true })] })] }), _jsxs("div", { className: "form-actions mt-4", children: [_jsx("button", { type: "submit", className: "btn btn-primary", disabled: submitting, children: submitting ? 'Saving...' : editingVehicleId ? 'Update vehicle' : 'Add vehicle' }), _jsx("button", { type: "button", className: "btn btn-secondary", onClick: resetForm, children: "Cancel" })] })] })] })), loading ? (_jsxs("div", { className: "page-loader", children: [_jsx("div", { className: "spinner" }), _jsx("p", { children: "Loading your vehicles..." })] })) : error ? (_jsx("div", { className: "alert alert-error", children: error })) : vehicles.length === 0 ? (_jsx(EmptyState, { icon: Car, title: "No vehicles registered yet", description: "Add your bike, auto, or car to start publishing regular commute routes across Tamil Nadu.", actionLabel: "Add your first vehicle", onAction: () => setShowAddForm(true) })) : (_jsx("div", { className: "vehicle-list-grid", children: vehicles.map((v) => (_jsxs("div", { className: "card vehicle-card", children: [_jsxs("div", { className: "vehicle-card-header flex-between", children: [_jsx(VehicleBadge, { type: v.type, registration: v.registration, capacity: v.seat_capacity }), _jsxs("div", { className: "vehicle-actions", children: [_jsx("button", { type: "button", className: "icon-btn", title: "Edit vehicle", onClick: () => handleStartEdit(v), children: _jsx(Edit2, { size: 16 }) }), _jsx("button", { type: "button", className: "icon-btn text-error", title: "Delete vehicle", onClick: () => handleDelete(v.id), children: _jsx(Trash2, { size: 16 }) })] })] }), _jsxs("div", { className: "vehicle-card-body text-sm mt-3", children: [_jsxs("p", { children: [_jsx("strong", { className: "text-secondary", children: "Model:" }), " ", v.model] }), _jsxs("p", { children: [_jsx("strong", { className: "text-secondary", children: "Colour:" }), " ", v.colour] }), _jsxs("p", { children: [_jsx("strong", { className: "text-secondary", children: "Passenger capacity:" }), ' ', v.seat_capacity, " seat", v.seat_capacity > 1 ? 's' : ''] })] })] }, v.id))) }))] }));
};
