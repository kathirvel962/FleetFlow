import { useState, useEffect, useCallback } from "react";
import { UserPlus, Edit2, Car } from "lucide-react";
import { driverService } from "../services/driverService";
import { userService } from "../services/userService";
import { vehicleService } from "../services/vehicleService";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
    PageHeader, Card, Table, StatusBadge, Pagination, SearchInput, Button,
    Modal, Select, Input, ErrorState, EmptyState, SkeletonTable, formatDate,
} from "../components/common/index";

const AVAILABILITY_STATUSES = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"];

function DriverForm({ initial, onSubmit, onClose, loading, driverUsers = [], vehicles = [] }) {
    const [userMode, setUserMode] = useState(driverUsers && driverUsers.length > 0 && !initial ? "existing" : "new");
    const [form, setForm] = useState({
        userId: initial?.user?._id || initial?.user || "",
        name: initial?.user?.name || "",
        email: initial?.user?.email || "",
        password: "",
        phone: initial?.phone || "",
        licenseNumber: initial?.licenseNumber || "",
        licenseExpiry: initial?.licenseExpiry ? initial.licenseExpiry.split("T")[0] : "",
        address: initial?.address || "",
        availabilityStatus: initial?.availabilityStatus || "AVAILABLE",
        assignedVehicle: initial?.assignedVehicle?._id || initial?.assignedVehicle || "",
        emergencyContactName: initial?.emergencyContact?.name || "",
        emergencyContactPhone: initial?.emergencyContact?.phone || "",
        emergencyContactRelationship: initial?.emergencyContact?.relationship || "",
    });

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            userId: (!initial && userMode === "existing") ? form.userId : (initial ? (form.userId || initial.user?._id) : undefined),
            name: (!initial && userMode === "new") ? form.name : undefined,
            email: (!initial && userMode === "new") ? form.email : undefined,
            password: (!initial && userMode === "new" && form.password) ? form.password : undefined,
            phone: form.phone,
            licenseNumber: form.licenseNumber,
            licenseExpiry: form.licenseExpiry || undefined,
            address: form.address,
            availabilityStatus: form.availabilityStatus,
            assignedVehicle: form.assignedVehicle || null,
            emergencyContact: {
                name: form.emergencyContactName,
                phone: form.emergencyContactPhone,
                relationship: form.emergencyContactRelationship,
            },
        };
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {initial ? (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500">Linked User Account</p>
                    <p className="text-sm font-semibold text-slate-800">{initial.user?.name || "Driver"} ({initial.user?.email || "No email"})</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {driverUsers && driverUsers.length > 0 && (
                        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
                            <button
                                type="button"
                                onClick={() => { setUserMode("new"); set("userId", ""); }}
                                className={`flex-1 py-1.5 rounded-md transition-all ${userMode === "new" ? "bg-white text-blue-600 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                + New Driver Account
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserMode("existing")}
                                className={`flex-1 py-1.5 rounded-md transition-all ${userMode === "existing" ? "bg-white text-blue-600 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"}`}
                            >
                                Existing User ({driverUsers.length})
                            </button>
                        </div>
                    )}

                    {userMode === "existing" && driverUsers && driverUsers.length > 0 ? (
                        <Select label="Select User (DRIVER role) *" value={form.userId} onChange={e => set("userId", e.target.value)} required>
                            <option value="">— Choose user —</option>
                            {driverUsers.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                            ))}
                        </Select>
                    ) : (
                        <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                            <p className="text-xs font-semibold text-slate-700">Driver User Account Details</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Driver Name *"
                                    value={form.name}
                                    onChange={e => set("name", e.target.value)}
                                    required
                                    placeholder="e.g. Ramesh Kumar"
                                />
                                <Input
                                    label="Email Address *"
                                    type="email"
                                    value={form.email}
                                    onChange={e => set("email", e.target.value)}
                                    required
                                    placeholder="driver@fleetflow.com"
                                />
                            </div>
                            <Input
                                label="Password (optional, default: Driver@123)"
                                type="password"
                                value={form.password}
                                onChange={e => set("password", e.target.value)}
                                placeholder="Min 6 characters (default: Driver@123)"
                            />
                        </div>
                    )}
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <Input label="License Number *" value={form.licenseNumber} onChange={e => set("licenseNumber", e.target.value)} required placeholder="DL-123456" />
                <Input label="License Expiry" type="date" value={form.licenseExpiry} onChange={e => set("licenseExpiry", e.target.value)} />
            </div>
            <Input label="Phone" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 9999999999" />
            <Input label="Address" value={form.address} onChange={e => set("address", e.target.value)} placeholder="Full address" />
            {initial && (
                <Select label="Availability Status" value={form.availabilityStatus} onChange={e => set("availabilityStatus", e.target.value)}>
                    {AVAILABILITY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
            )}
            <Select label="Assign Vehicle" value={form.assignedVehicle} onChange={e => set("assignedVehicle", e.target.value)}>
                <option value="">— No vehicle —</option>
                {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.vehicleNumber} · {v.registrationNumber}</option>
                ))}
            </Select>
            <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Emergency Contact</p>
                <div className="space-y-3">
                    <Input label="Name" value={form.emergencyContactName} onChange={e => set("emergencyContactName", e.target.value)} placeholder="Contact name" />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Phone" value={form.emergencyContactPhone} onChange={e => set("emergencyContactPhone", e.target.value)} placeholder="+91 9999999999" />
                        <Input label="Relationship" value={form.emergencyContactRelationship} onChange={e => set("emergencyContactRelationship", e.target.value)} placeholder="Spouse, Parent…" />
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
                {onClose && (
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" loading={loading}>
                    {initial ? "Update Driver" : "Create Driver Profile"}
                </Button>
            </div>
        </form>
    );
}

function Drivers() {
    const [drivers, setDrivers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState({ open: false, type: "", driver: null });
    const [submitting, setSubmitting] = useState(false);
    const [driverUsers, setDriverUsers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const toast = useToast();
    const { hasRole } = useAuth();

    const fetchDrivers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = { page, limit: 10 };
            if (search) params.search = search;
            if (statusFilter) params.availabilityStatus = statusFilter;
            const res = await driverService.getDrivers(params);
            setDrivers(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load drivers");
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    const fetchFormData = useCallback(async () => {
        try {
            const [usersRes, vehiclesRes] = await Promise.all([
                userService.getUsers({ role: "DRIVER", limit: 100 }),
                vehicleService.getVehicles({ status: "AVAILABLE", limit: 100 }),
            ]);
            setDriverUsers(usersRes.data.data);
            setVehicles(vehiclesRes.data.data);
        } catch {
            // Non-critical
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(fetchDrivers, search ? 400 : 0);
        return () => clearTimeout(t);
    }, [fetchDrivers, search]);

    useEffect(() => { fetchFormData(); }, [fetchFormData]);

    const handleCreate = async (data) => {
        setSubmitting(true);
        try {
            await driverService.createDriver(data);
            toast.success("Driver profile created");
            setModal({ open: false });
            fetchDrivers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create driver");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (data) => {
        setSubmitting(true);
        try {
            await driverService.updateDriver(modal.driver._id, data);
            toast.success("Driver updated");
            setModal({ open: false });
            fetchDrivers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update driver");
        } finally {
            setSubmitting(false);
        }
    };

    const statusColors = {
        AVAILABLE: "bg-green-100 text-green-700",
        ON_TRIP: "bg-blue-100 text-blue-700",
        OFF_DUTY: "bg-slate-100 text-slate-500",
        SUSPENDED: "bg-red-100 text-red-700",
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Driver Management"
                subtitle="Manage driver profiles and availability"
                actions={
                    hasRole("ADMIN") && (
                        <Button onClick={() => setModal({ open: true, type: "create", driver: null })}>
                            <UserPlus className="w-4 h-4" /> Add Driver
                        </Button>
                    )
                }
            />

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap gap-3">
                    <SearchInput
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by license or phone…"
                        className="flex-1 min-w-48"
                    />
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                    >
                        <option value="">All Availability</option>
                        {AVAILABILITY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </Card>

            <Card>
                {loading ? <SkeletonTable rows={8} cols={7} /> :
                    error ? <ErrorState message={error} onRetry={fetchDrivers} /> :
                        drivers.length === 0 ? (
                            <EmptyState title="No drivers found" description="No driver profiles have been created yet." icon={Car} />
                        ) : (
                            <>
                                <Table headers={["Driver", "License", "Status", "Vehicle", "Phone", "Created", "Actions"]}>
                                    {drivers.map((d) => (
                                        <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                        {d.user?.name?.charAt(0)?.toUpperCase() || "D"}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{d.user?.name || "—"}</p>
                                                        <p className="text-xs text-slate-400">{d.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-xs text-slate-700">{d.licenseNumber}</span>
                                                {d.licenseExpiry && (
                                                    <p className="text-xs text-slate-400">Exp: {formatDate(d.licenseExpiry)}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColors[d.availabilityStatus]}`}>
                                                    {d.availabilityStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {d.assignedVehicle?.vehicleNumber || <span className="text-slate-400">None</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{d.phone || "—"}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{formatDate(d.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => setModal({ open: true, type: "edit", driver: d })}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
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
                title={modal.type === "edit" ? `Edit Driver — ${modal.driver?.user?.name}` : "Create Driver Profile"}
                maxWidth="max-w-xl"
            >
                <DriverForm
                    initial={modal.type === "edit" ? modal.driver : null}
                    onSubmit={modal.type === "edit" ? handleUpdate : handleCreate}
                    onClose={() => setModal({ open: false })}
                    loading={submitting}
                    driverUsers={driverUsers}
                    vehicles={vehicles}
                />
            </Modal>
        </div>
    );
}

export default Drivers;
