import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Edit2, Trash2 } from "lucide-react";
import { vehicleService } from "../services/vehicleService";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
    PageHeader, Card, Table, Pagination, SearchInput, Button,
    Modal, Select, Input, ConfirmDialog, ErrorState, EmptyState, SkeletonTable,
} from "../components/common/index";

const VEHICLE_TYPES = ["TRUCK", "VAN", "CAR", "BIKE", "TRAILER", "OTHER"];
const FUEL_TYPES = ["DIESEL", "PETROL", "ELECTRIC", "HYBRID", "CNG", "OTHER"];
const VEHICLE_STATUSES = ["AVAILABLE", "ASSIGNED", "IN_TRANSIT", "MAINTENANCE", "INACTIVE"];

function VehicleForm({ initial, onSubmit, onClose, loading }) {
    const [form, setForm] = useState({
        vehicleNumber: initial?.vehicleNumber || "",
        registrationNumber: initial?.registrationNumber || "",
        type: initial?.type || "VAN",
        make: initial?.make || "",
        model: initial?.model || "",
        year: initial?.year || new Date().getFullYear(),
        capacity: initial?.capacity || 1000,
        fuelType: initial?.fuelType || "DIESEL",
        status: initial?.status || "AVAILABLE",
        isActive: initial?.isActive !== undefined ? initial.isActive : true,
    });

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <Input label="Vehicle Number *" value={form.vehicleNumber} onChange={e => set("vehicleNumber", e.target.value)} required placeholder="VH-001" />
                <Input label="Registration Number *" value={form.registrationNumber} onChange={e => set("registrationNumber", e.target.value)} required placeholder="MH-12-AB-1234" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Select label="Vehicle Type" value={form.type} onChange={e => set("type", e.target.value)}>
                    {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                </Select>
                <Select label="Fuel Type" value={form.fuelType} onChange={e => set("fuelType", e.target.value)}>
                    {FUEL_TYPES.map(t => <option key={t}>{t}</option>)}
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Input label="Make" value={form.make} onChange={e => set("make", e.target.value)} placeholder="Tata, Mahindra…" />
                <Input label="Model" value={form.model} onChange={e => set("model", e.target.value)} placeholder="Ace, Bolero…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Input label="Year" type="number" value={form.year} onChange={e => set("year", +e.target.value)} min={1990} max={new Date().getFullYear() + 1} />
                <Input label="Capacity (kg)" type="number" value={form.capacity} onChange={e => set("capacity", +e.target.value)} min={1} />
            </div>
            {initial && (
                <div>
                    <Select label="Status" value={form.status} onChange={e => set("status", e.target.value)}>
                        {VEHICLE_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </Select>
                </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700">Active</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={form.isActive}
                        onClick={() => set("isActive", !form.isActive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${form.isActive ? "bg-blue-600" : "bg-slate-300"}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {onClose && (
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" loading={loading}>
                        {initial ? "Update Vehicle" : "Add Vehicle"}
                    </Button>
                </div>
            </div>
        </form>
    );
}

function Vehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState({ open: false, type: "", vehicle: null });
    const [submitting, setSubmitting] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, vehicle: null });
    const toast = useToast();
    const { hasRole } = useAuth();

    const fetchVehicles = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = { page, limit: 10 };
            if (search) params.search = search;
            if (typeFilter) params.type = typeFilter;
            if (statusFilter) params.status = statusFilter;
            const res = await vehicleService.getVehicles(params);
            setVehicles(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load vehicles");
        } finally {
            setLoading(false);
        }
    }, [page, search, typeFilter, statusFilter]);

    useEffect(() => {
        const t = setTimeout(fetchVehicles, search ? 400 : 0);
        return () => clearTimeout(t);
    }, [fetchVehicles, search]);

    const handleCreate = async (data) => {
        setSubmitting(true);
        try {
            await vehicleService.createVehicle(data);
            toast.success("Vehicle added successfully");
            setModal({ open: false });
            fetchVehicles();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add vehicle");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (data) => {
        setSubmitting(true);
        try {
            await vehicleService.updateVehicle(modal.vehicle._id, data);
            toast.success("Vehicle updated");
            setModal({ open: false });
            fetchVehicles();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update vehicle");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            await vehicleService.deleteVehicle(confirm.vehicle._id);
            toast.success("Vehicle deleted");
            setConfirm({ open: false });
            fetchVehicles();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete vehicle");
        }
    };

    const statusColors = {
        AVAILABLE: "bg-green-100 text-green-700",
        ASSIGNED: "bg-blue-100 text-blue-700",
        IN_TRANSIT: "bg-purple-100 text-purple-700",
        MAINTENANCE: "bg-orange-100 text-orange-700",
        INACTIVE: "bg-slate-100 text-slate-500",
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Vehicle Management"
                subtitle="Manage your fleet of vehicles"
                actions={
                    hasRole("ADMIN") && (
                        <Button onClick={() => setModal({ open: true, type: "create", vehicle: null })}>
                            <PlusCircle className="w-4 h-4" /> Add Vehicle
                        </Button>
                    )
                }
            />

            <Card className="p-4">
                <div className="flex flex-wrap gap-3">
                    <SearchInput
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by number, make, model…"
                        className="flex-1 min-w-48"
                    />
                    <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                        className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                        <option value="">All Types</option>
                        {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                        <option value="">All Statuses</option>
                        {VEHICLE_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                </div>
            </Card>

            <Card>
                {loading ? <SkeletonTable rows={8} cols={7} /> :
                    error ? <ErrorState message={error} onRetry={fetchVehicles} /> :
                        vehicles.length === 0 ? (
                            <EmptyState title="No vehicles found" description="No vehicles have been added yet." />
                        ) : (
                            <>
                                <Table headers={["Vehicle", "Type", "Fuel", "Capacity", "Status", "Year", "Actions"]}>
                                    {vehicles.map((v) => (
                                        <tr key={v._id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold text-slate-800">{v.vehicleNumber}</p>
                                                <p className="text-xs text-slate-400 font-mono">{v.registrationNumber}</p>
                                                {v.make && <p className="text-xs text-slate-500">{v.make} {v.model}</p>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{v.type}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{v.fuelType}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{v.capacity} kg</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[v.status]}`}>
                                                    {v.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{v.year}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => setModal({ open: true, type: "edit", vehicle: v })}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {hasRole("ADMIN") && (
                                                        <button onClick={() => setConfirm({ open: true, vehicle: v })}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </Table>
                                <Pagination pagination={pagination} onPageChange={setPage} />
                            </>
                        )
                }
            </Card>

            <Modal
                open={modal.open}
                onClose={() => setModal({ open: false })}
                title={modal.type === "edit" ? `Edit Vehicle — ${modal.vehicle?.vehicleNumber}` : "Add New Vehicle"}
                maxWidth="max-w-xl"
            >
                <VehicleForm
                    initial={modal.type === "edit" ? modal.vehicle : null}
                    onSubmit={modal.type === "edit" ? handleUpdate : handleCreate}
                    onClose={() => setModal({ open: false })}
                    loading={submitting}
                />
            </Modal>

            <ConfirmDialog
                open={confirm.open}
                onClose={() => setConfirm({ open: false })}
                onConfirm={handleDelete}
                title="Delete Vehicle"
                message={`Delete vehicle "${confirm.vehicle?.vehicleNumber}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </div>
    );
}

export default Vehicles;
