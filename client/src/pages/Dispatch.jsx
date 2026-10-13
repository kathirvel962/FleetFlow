import { useState, useEffect, useCallback } from "react";
import { SendHorizonal, RefreshCw } from "lucide-react";
import { dispatchService } from "../services/dispatchService";
import { driverService } from "../services/driverService";
import { vehicleService } from "../services/vehicleService";
import { deliveryService } from "../services/deliveryService";
import { useToast } from "../context/ToastContext";
import {
    PageHeader, Card, CardHeader, Table, StatusBadge, Pagination, Select,
    Button, ErrorState, EmptyState, SkeletonTable, formatDate, formatDateTime,
} from "../components/common/index";

function AssignForm({ onSubmit, loading }) {
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [form, setForm] = useState({ deliveryId: "", driverId: "", vehicleId: "" });
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchOptions = async () => {
            setFetching(true);
            try {
                const [dRes, vRes, delRes] = await Promise.all([
                    driverService.getDrivers({ availabilityStatus: "AVAILABLE", limit: 100 }),
                    vehicleService.getVehicles({ status: "AVAILABLE", limit: 100 }),
                    deliveryService.getDeliveries({ status: "PENDING", limit: 100 }),
                ]);
                setDrivers(dRes.data.data);
                setVehicles(vRes.data.data);
                setDeliveries(delRes.data.data);
            } catch {
                // Non-critical
            } finally {
                setFetching(false);
            }
        };
        fetchOptions();
    }, []);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    if (fetching) {
        return (
            <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Select
                label="Pending Delivery *"
                value={form.deliveryId}
                onChange={e => set("deliveryId", e.target.value)}
                required
            >
                <option value="">— Select delivery —</option>
                {deliveries.map(d => (
                    <option key={d._id} value={d._id}>
                        {d.deliveryNumber} · {d.customerName} · {d.deliveryAddress}
                    </option>
                ))}
            </Select>

            <Select
                label="Available Driver *"
                value={form.driverId}
                onChange={e => set("driverId", e.target.value)}
                required
            >
                <option value="">— Select driver —</option>
                {drivers.map(d => (
                    <option key={d._id} value={d._id}>
                        {d.user?.name} — {d.licenseNumber}
                    </option>
                ))}
            </Select>

            <Select
                label="Available Vehicle *"
                value={form.vehicleId}
                onChange={e => set("vehicleId", e.target.value)}
                required
            >
                <option value="">— Select vehicle —</option>
                {vehicles.map(v => (
                    <option key={v._id} value={v._id}>
                        {v.vehicleNumber} · {v.type} · {v.capacity} kg
                    </option>
                ))}
            </Select>

            {deliveries.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    No pending deliveries available. Create a delivery first.
                </p>
            )}
            {drivers.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    No available drivers. Check driver availability status.
                </p>
            )}
            {vehicles.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                    No available vehicles. Check vehicle status.
                </p>
            )}

            <Button
                type="submit"
                loading={loading}
                className="w-full"
                disabled={!form.deliveryId || !form.driverId || !form.vehicleId}
            >
                <SendHorizonal className="w-4 h-4" />
                Assign & Dispatch
            </Button>
        </form>
    );
}

function Dispatch() {
    const [activeTab, setActiveTab] = useState("assign");
    const [activeDispatches, setActiveDispatches] = useState([]);
    const [history, setHistory] = useState([]);
    const [activePagination, setActivePagination] = useState(null);
    const [historyPagination, setHistoryPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [activePage, setActivePage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const toast = useToast();

    const fetchActive = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await dispatchService.getActiveDispatches({ page: activePage, limit: 10 });
            setActiveDispatches(res.data.data);
            setActivePagination(res.data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load active dispatches");
        } finally {
            setLoading(false);
        }
    }, [activePage]);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await dispatchService.getDispatchHistory({ page: historyPage, limit: 10 });
            setHistory(res.data.data);
            setHistoryPagination(res.data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load dispatch history");
        } finally {
            setLoading(false);
        }
    }, [historyPage]);

    useEffect(() => {
        if (activeTab === "active") fetchActive();
        if (activeTab === "history") fetchHistory();
    }, [activeTab, fetchActive, fetchHistory]);

    const handleAssign = async (data) => {
        setSubmitting(true);
        try {
            await dispatchService.assign(data);
            toast.success("Delivery dispatched successfully!");
            setActiveTab("active");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to dispatch delivery");
        } finally {
            setSubmitting(false);
        }
    };

    const tabs = [
        { key: "assign", label: "Assign Delivery" },
        { key: "active", label: "Active Dispatches" },
        { key: "history", label: "Dispatch History" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Dispatch Center"
                subtitle="Assign deliveries to drivers and vehicles"
                actions={
                    activeTab !== "assign" && (
                        <Button variant="secondary" size="sm" onClick={activeTab === "active" ? fetchActive : fetchHistory}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                    )
                }
            />

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                            ${activeTab === tab.key
                                ? "bg-white text-slate-800 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Assign tab */}
            {activeTab === "assign" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader title="New Assignment" subtitle="Select delivery, driver, and vehicle" />
                        <div className="p-5">
                            <AssignForm onSubmit={handleAssign} loading={submitting} />
                        </div>
                    </Card>

                    <Card className="p-5">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4">Dispatch Checklist</h3>
                        <div className="space-y-3">
                            {[
                                { step: "1", text: "Ensure delivery is in PENDING status" },
                                { step: "2", text: "Verify driver is AVAILABLE and has valid license" },
                                { step: "3", text: "Check vehicle capacity matches package weight" },
                                { step: "4", text: "Confirm pickup and delivery addresses" },
                                { step: "5", text: "Assign and monitor progress in Active tab" },
                            ].map((item) => (
                                <div key={item.step} className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                        {item.step}
                                    </div>
                                    <p className="text-sm text-slate-600">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Active dispatches tab */}
            {activeTab === "active" && (
                <Card>
                    <CardHeader title="Active Dispatches" subtitle="Currently assigned deliveries" />
                    {loading ? <SkeletonTable rows={6} cols={6} /> :
                        error ? <ErrorState message={error} onRetry={fetchActive} /> :
                            activeDispatches.length === 0 ? (
                                <EmptyState title="No active dispatches" description="No deliveries are currently being dispatched." />
                            ) : (
                                <>
                                    <Table headers={["Delivery #", "Customer", "Status", "Driver", "Vehicle", "Assigned On"]}>
                                        {activeDispatches.map((d) => (
                                            <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                                        {d.deliveryNumber}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-slate-800">{d.customerName}</p>
                                                    <p className="text-xs text-slate-400">{d.deliveryAddress}</p>
                                                </td>
                                                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{d.assignedDriver?.name || "—"}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{d.assignedVehicle?.vehicleNumber || "—"}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(d.updatedAt)}</td>
                                            </tr>
                                        ))}
                                    </Table>
                                    <Pagination pagination={activePagination} onPageChange={setActivePage} />
                                </>
                            )
                    }
                </Card>
            )}

            {/* History tab */}
            {activeTab === "history" && (
                <Card>
                    <CardHeader title="Dispatch History" subtitle="Completed and failed deliveries" />
                    {loading ? <SkeletonTable rows={6} cols={6} /> :
                        error ? <ErrorState message={error} onRetry={fetchHistory} /> :
                            history.length === 0 ? (
                                <EmptyState title="No history yet" description="Completed deliveries will appear here." />
                            ) : (
                                <>
                                    <Table headers={["Delivery #", "Customer", "Status", "Driver", "Vehicle", "Completed"]}>
                                        {history.map((d) => (
                                            <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                                        {d.deliveryNumber}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-slate-800">{d.customerName}</p>
                                                    <p className="text-xs text-slate-400">{d.deliveryAddress}</p>
                                                </td>
                                                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{d.assignedDriver?.name || "—"}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{d.assignedVehicle?.vehicleNumber || "—"}</td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(d.updatedAt)}</td>
                                            </tr>
                                        ))}
                                    </Table>
                                    <Pagination pagination={historyPagination} onPageChange={setHistoryPage} />
                                </>
                            )
                    }
                </Card>
            )}
        </div>
    );
}

export default Dispatch;
