import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Edit2, Trash2, MapPin, Package } from "lucide-react";
import { deliveryService } from "../services/deliveryService";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
    PageHeader, Card, Table, StatusBadge, PriorityBadge, Pagination, SearchInput, Button,
    Modal, Select, Input, ConfirmDialog, ErrorState, EmptyState, SkeletonTable, formatDate, formatDateTime,
} from "../components/common/index";

const DELIVERY_STATUSES = [
    "PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "CANCELLED",
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function DeliveryForm({ initial, onSubmit, onClose, loading }) {
    const [form, setForm] = useState({
        customerName: initial?.customerName || "",
        customerPhone: initial?.customerPhone || "",
        customerEmail: initial?.customerEmail || "",
        pickupAddress: initial?.pickupAddress || "",
        deliveryAddress: initial?.deliveryAddress || "",
        priority: initial?.priority || "MEDIUM",
        scheduledDate: initial?.scheduledDate ? initial.scheduledDate.split("T")[0] : "",
        notes: initial?.notes || "",
        weight: initial?.weight || "",
        packageDescription: initial?.packageDescription || "",
        status: initial?.status || "PENDING",
    });

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...form };
        if (!payload.weight) delete payload.weight;
        if (!payload.scheduledDate) delete payload.scheduledDate;
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer Info</p>
            <div className="grid grid-cols-2 gap-3">
                <Input label="Customer Name *" value={form.customerName} onChange={e => set("customerName", e.target.value)} required placeholder="John Smith" />
                <Input label="Phone *" value={form.customerPhone} onChange={e => set("customerPhone", e.target.value)} required placeholder="+91 9999999999" />
            </div>
            <Input label="Email" type="email" value={form.customerEmail} onChange={e => set("customerEmail", e.target.value)} placeholder="customer@email.com" />

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">Addresses</p>
            <Input label="Pickup Address *" value={form.pickupAddress} onChange={e => set("pickupAddress", e.target.value)} required placeholder="Full pickup address" />
            <Input label="Delivery Address *" value={form.deliveryAddress} onChange={e => set("deliveryAddress", e.target.value)} required placeholder="Full delivery address" />

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1">Package & Schedule</p>
            <div className="grid grid-cols-2 gap-3">
                <Select label="Priority" value={form.priority} onChange={e => set("priority", e.target.value)}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </Select>
                <Input label="Scheduled Date" type="date" value={form.scheduledDate} onChange={e => set("scheduledDate", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Input label="Weight (kg)" type="number" value={form.weight} onChange={e => set("weight", +e.target.value)} placeholder="0.0" min={0} step={0.1} />
                <Input label="Package Description" value={form.packageDescription} onChange={e => set("packageDescription", e.target.value)} placeholder="Fragile, electronics…" />
            </div>
            {initial && (
                <Select label="Status" value={form.status} onChange={e => set("status", e.target.value)}>
                    {DELIVERY_STATUSES.map(s => <option key={s}>{s}</option>)}
                </Select>
            )}
            <Input label="Notes" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Special instructions…" />
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-2">
                {onClose && (
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" loading={loading}>
                    {initial ? "Update Delivery" : "Create Delivery"}
                </Button>
            </div>
        </form>
    );
}

function DeliveryDetailModal({ delivery, onClose }) {
    if (!delivery) return null;
    return (
        <Modal open={!!delivery} onClose={onClose} title={`Delivery — ${delivery.deliveryNumber}`} maxWidth="max-w-2xl">
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <StatusBadge status={delivery.status} />
                    <PriorityBadge priority={delivery.priority} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">Customer</p>
                            <p className="font-semibold text-slate-800">{delivery.customerName}</p>
                            <p className="text-slate-500">{delivery.customerPhone}</p>
                            {delivery.customerEmail && <p className="text-slate-400 text-xs">{delivery.customerEmail}</p>}
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">Pickup</p>
                            <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                <p className="text-slate-600">{delivery.pickupAddress}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">Delivery To</p>
                            <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                                <p className="text-slate-600">{delivery.deliveryAddress}</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">Assignment</p>
                            <p className="text-slate-700">Driver: {delivery.assignedDriver?.name || "—"}</p>
                            <p className="text-slate-700">Vehicle: {delivery.assignedVehicle?.vehicleNumber || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-semibold uppercase">Schedule</p>
                            <p className="text-slate-700">{formatDate(delivery.scheduledDate)}</p>
                        </div>
                        {delivery.weight && (
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase">Weight</p>
                                <p className="text-slate-700">{delivery.weight} kg</p>
                            </div>
                        )}
                        {delivery.packageDescription && (
                            <div>
                                <p className="text-xs text-slate-400 font-semibold uppercase">Package</p>
                                <p className="text-slate-700">{delivery.packageDescription}</p>
                            </div>
                        )}
                    </div>
                </div>

                {delivery.notes && (
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Notes</p>
                        <p className="text-sm text-slate-700">{delivery.notes}</p>
                    </div>
                )}

                {delivery.proofOfDelivery?.isSubmitted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-700 mb-1">✓ Proof of Delivery Submitted</p>
                        <p className="text-xs text-green-600">at {formatDateTime(delivery.proofOfDelivery?.deliveredAt)}</p>
                    </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                    <span>Created: {formatDateTime(delivery.createdAt)}</span>
                    <span>Updated: {formatDateTime(delivery.updatedAt)}</span>
                </div>
            </div>
        </Modal>
    );
}

function Deliveries() {
    const [deliveries, setDeliveries] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState({ open: false, type: "", delivery: null });
    const [viewDelivery, setViewDelivery] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, delivery: null });
    const toast = useToast();
    const { hasRole } = useAuth();

    const fetchDeliveries = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = { page, limit: 10 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (priorityFilter) params.priority = priorityFilter;
            const res = await deliveryService.getDeliveries(params);
            setDeliveries(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load deliveries");
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, priorityFilter]);

    useEffect(() => {
        const t = setTimeout(fetchDeliveries, search ? 400 : 0);
        return () => clearTimeout(t);
    }, [fetchDeliveries, search]);

    const handleCreate = async (data) => {
        setSubmitting(true);
        try {
            await deliveryService.createDelivery(data);
            toast.success("Delivery created");
            setModal({ open: false });
            fetchDeliveries();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create delivery");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (data) => {
        setSubmitting(true);
        try {
            await deliveryService.updateDelivery(modal.delivery._id, data);
            toast.success("Delivery updated");
            setModal({ open: false });
            fetchDeliveries();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update delivery");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            await deliveryService.deleteDelivery(confirm.delivery._id);
            toast.success("Delivery deleted");
            setConfirm({ open: false });
            fetchDeliveries();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete delivery");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Deliveries"
                subtitle="Track and manage all deliveries"
                actions={
                    hasRole("ADMIN", "DISPATCHER") && (
                        <Button onClick={() => setModal({ open: true, type: "create", delivery: null })}>
                            <PlusCircle className="w-4 h-4" /> New Delivery
                        </Button>
                    )
                }
            />

            <Card className="p-4">
                <div className="flex flex-wrap gap-3">
                    <SearchInput
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by number, customer, address…"
                        className="flex-1 min-w-48"
                    />
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                        <option value="">All Statuses</option>
                        {DELIVERY_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
                        className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white">
                        <option value="">All Priorities</option>
                        {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                </div>
            </Card>

            <Card>
                {loading ? <SkeletonTable rows={10} cols={7} /> :
                    error ? <ErrorState message={error} onRetry={fetchDeliveries} /> :
                        deliveries.length === 0 ? (
                            <EmptyState title="No deliveries found" description="No deliveries match your filters." icon={Package} />
                        ) : (
                            <>
                                <Table headers={["Delivery #", "Customer", "Status", "Priority", "Driver", "Scheduled", "Actions"]}>
                                    {deliveries.map((d) => (
                                        <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-3">
                                                <button onClick={() => setViewDelivery(d)}
                                                    className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors">
                                                    {d.deliveryNumber}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-medium text-slate-800">{d.customerName}</p>
                                                <p className="text-xs text-slate-400">{d.customerPhone}</p>
                                            </td>
                                            <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                                            <td className="px-4 py-3"><PriorityBadge priority={d.priority} /></td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {d.assignedDriver?.name || <span className="text-slate-400">Unassigned</span>}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{formatDate(d.scheduledDate)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {hasRole("ADMIN", "DISPATCHER") && (
                                                        <button onClick={() => setModal({ open: true, type: "edit", delivery: d })}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {hasRole("ADMIN") && (
                                                        <button onClick={() => setConfirm({ open: true, delivery: d })}
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

            {/* Create/Edit Modal */}
            <Modal
                open={modal.open}
                onClose={() => setModal({ open: false })}
                title={modal.type === "edit" ? `Edit Delivery — ${modal.delivery?.deliveryNumber}` : "New Delivery"}
                maxWidth="max-w-xl"
            >
                <DeliveryForm
                    initial={modal.type === "edit" ? modal.delivery : null}
                    onSubmit={modal.type === "edit" ? handleUpdate : handleCreate}
                    onClose={() => setModal({ open: false })}
                    loading={submitting}
                />
            </Modal>

            {/* Detail view */}
            <DeliveryDetailModal delivery={viewDelivery} onClose={() => setViewDelivery(null)} />

            {/* Delete confirm */}
            <ConfirmDialog
                open={confirm.open}
                onClose={() => setConfirm({ open: false })}
                onConfirm={handleDelete}
                title="Delete Delivery"
                message={`Delete delivery "${confirm.delivery?.deliveryNumber}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </div>
    );
}

export default Deliveries;
