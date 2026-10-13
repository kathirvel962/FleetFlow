import { useState, useEffect, useCallback } from "react";
import { ClipboardCheck, Camera, FileText } from "lucide-react";
import { deliveryService } from "../services/deliveryService";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
    PageHeader, Card, CardHeader, Table, StatusBadge, Select, Input, Button,
    ErrorState, EmptyState, SkeletonTable, formatDate, formatDateTime,
} from "../components/common/index";

function PodForm({ delivery, onSubmit, loading }) {
    const [form, setForm] = useState({
        recipientName: "",
        notes: "",
        deliveredAt: new Date().toISOString().slice(0, 16),
    });

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(delivery._id, form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-800">{delivery.deliveryNumber}</p>
                <p className="text-blue-600">{delivery.customerName}</p>
                <p className="text-xs text-blue-500">{delivery.deliveryAddress}</p>
            </div>
            <Input
                label="Recipient Name *"
                value={form.recipientName}
                onChange={e => set("recipientName", e.target.value)}
                required
                placeholder="Name of person who received the package"
            />
            <Input
                label="Delivered At"
                type="datetime-local"
                value={form.deliveredAt}
                onChange={e => set("deliveredAt", e.target.value)}
            />
            <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Notes</label>
                <textarea
                    value={form.notes}
                    onChange={e => set("notes", e.target.value)}
                    placeholder="Any special notes about the delivery…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
                />
            </div>
            <Button type="submit" loading={loading} className="w-full">
                <ClipboardCheck className="w-4 h-4" />
                Submit Proof of Delivery
            </Button>
        </form>
    );
}

function ProofOfDelivery() {
    const [deliveries, setDeliveries] = useState([]);
    const [completedDeliveries, setCompletedDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedLoading, setCompletedLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { hasRole } = useAuth();
    const toast = useToast();

    const fetchDeliveries = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch deliveries that need POD (OUT_FOR_DELIVERY or IN_TRANSIT)
            const [transitRes, outRes] = await Promise.all([
                deliveryService.getDeliveries({ status: "IN_TRANSIT", limit: 50 }),
                deliveryService.getDeliveries({ status: "OUT_FOR_DELIVERY", limit: 50 }),
            ]);
            const combined = [...(transitRes.data.data || []), ...(outRes.data.data || [])];
            setDeliveries(combined);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load deliveries");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCompleted = useCallback(async () => {
        setCompletedLoading(true);
        try {
            const res = await deliveryService.getDeliveries({ status: "DELIVERED", limit: 20 });
            setCompletedDeliveries(res.data.data);
        } catch {
            // Non-critical
        } finally {
            setCompletedLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDeliveries();
        fetchCompleted();
    }, [fetchDeliveries, fetchCompleted]);

    const handleSubmitPod = async (deliveryId, data) => {
        setSubmitting(true);
        try {
            await deliveryService.submitProofOfDelivery(deliveryId, data);
            toast.success("Proof of delivery submitted successfully!");
            setSelectedDelivery(null);
            fetchDeliveries();
            fetchCompleted();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit proof of delivery");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Proof of Delivery"
                subtitle="Submit and view delivery confirmations"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending POD */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader
                            title="Pending Confirmation"
                            subtitle="Deliveries awaiting proof of delivery"
                        />
                        {loading ? (
                            <SkeletonTable rows={4} cols={3} />
                        ) : error ? (
                            <ErrorState message={error} onRetry={fetchDeliveries} />
                        ) : deliveries.length === 0 ? (
                            <EmptyState
                                title="No pending deliveries"
                                description="All deliveries are up to date."
                                icon={ClipboardCheck}
                            />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {deliveries.map((d) => (
                                    <div
                                        key={d._id}
                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${selectedDelivery?._id === d._id ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                                        onClick={() => setSelectedDelivery(d)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                                        {d.deliveryNumber}
                                                    </span>
                                                    <StatusBadge status={d.status} />
                                                </div>
                                                <p className="text-sm font-medium text-slate-800">{d.customerName}</p>
                                                <p className="text-xs text-slate-500 truncate">{d.deliveryAddress}</p>
                                                {d.assignedDriver && (
                                                    <p className="text-xs text-slate-400 mt-0.5">Driver: {d.assignedDriver.name}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedDelivery(d); }}
                                                className="shrink-0 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Submit POD
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* POD Form or completed list */}
                <div className="space-y-4">
                    {selectedDelivery ? (
                        <Card>
                            <CardHeader
                                title="Submit Proof of Delivery"
                                actions={
                                    <button
                                        onClick={() => setSelectedDelivery(null)}
                                        className="text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        Cancel
                                    </button>
                                }
                            />
                            <div className="p-5">
                                <PodForm
                                    delivery={selectedDelivery}
                                    onSubmit={handleSubmitPod}
                                    loading={submitting}
                                />
                            </div>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader
                                title="Recently Completed"
                                subtitle="Last 20 delivered"
                                actions={
                                    <span className="text-xs text-slate-400">{completedDeliveries.length} deliveries</span>
                                }
                            />
                            {completedLoading ? (
                                <SkeletonTable rows={4} cols={3} />
                            ) : completedDeliveries.length === 0 ? (
                                <EmptyState title="No completed deliveries" icon={ClipboardCheck} />
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {completedDeliveries.map((d) => (
                                        <div key={d._id} className="px-4 py-3 flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-mono text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold">
                                                        {d.deliveryNumber}
                                                    </span>
                                                    <StatusBadge status={d.status} />
                                                </div>
                                                <p className="text-sm text-slate-700">{d.customerName}</p>
                                                {d.proofOfDelivery?.deliveredAt && (
                                                    <p className="text-xs text-slate-400">
                                                        {formatDateTime(d.proofOfDelivery.deliveredAt)}
                                                    </p>
                                                )}
                                            </div>
                                            {d.proofOfDelivery?.recipientName && (
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs text-slate-500">Received by</p>
                                                    <p className="text-xs font-medium text-slate-700">{d.proofOfDelivery.recipientName}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProofOfDelivery;
