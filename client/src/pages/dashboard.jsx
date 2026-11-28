import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users, Truck, Car, Package, Clock, CheckCircle, XCircle, AlertTriangle,
    RefreshCw, TrendingUp, MapPin, Zap, Send, PackageCheck, Scale, Boxes, AlertCircle
} from "lucide-react";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { dashboardService } from "../services/dashboardService";
import { deliveryService } from "../services/deliveryService";
import {
    KpiCard, StatusBadge, PriorityBadge, PageHeader, Card, CardHeader,
    Table, SkeletonCard, ErrorState, EmptyState, formatDate, Button,
} from "../components/common/index";

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await dashboardService.getAdminDashboard();
            setData(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    const { overview, vehicleStats, driverStats, deliveryStats, recentDeliveries } = data || {};

    const deliveryChartData = [
        { name: "Pending", value: deliveryStats?.pending || 0, color: "#f59e0b" },
        { name: "Active", value: deliveryStats?.active || 0, color: "#3b82f6" },
        { name: "Delivered", value: deliveryStats?.completed || 0, color: "#22c55e" },
        { name: "Failed", value: deliveryStats?.failed || 0, color: "#ef4444" },
    ].filter(d => d.value > 0);

    const vehicleChartData = [
        { name: "Available", value: vehicleStats?.available || 0 },
        { name: "In Transit", value: vehicleStats?.inTransit || 0 },
        { name: "Maintenance", value: vehicleStats?.maintenance || 0 },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Admin Dashboard"
                subtitle="Fleet-wide operational overview"
                actions={
                    <Button variant="secondary" size="sm" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                }
            />

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KpiCard title="Total Users" value={overview?.totalUsers} icon={Users} color="blue" />
                <KpiCard title="Total Drivers" value={overview?.totalDrivers} icon={Truck} color="indigo" />
                <KpiCard title="Total Vehicles" value={overview?.totalVehicles} icon={Car} color="purple" />
                <KpiCard title="Total Deliveries" value={overview?.totalDeliveries} icon={Package} color="teal" />
                <KpiCard title="Pending" value={overview?.pendingDeliveries} icon={Clock} color="yellow" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KpiCard title="Active Deliveries" value={overview?.activeDeliveries} icon={TrendingUp} color="blue" />
                <KpiCard title="Completed" value={overview?.completedDeliveries} icon={CheckCircle} color="green" />
                <KpiCard title="Failed" value={overview?.failedDeliveries} icon={XCircle} color="red" />
                <KpiCard title="Available Vehicles" value={overview?.availableVehicles} icon={Car} color="green" />
                <KpiCard title="Available Drivers" value={overview?.availableDrivers} icon={Truck} color="green" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Delivery Status Pie */}
                <Card>
                    <CardHeader title="Delivery Status Distribution" />
                    <div className="p-5">
                        {deliveryChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={deliveryChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                        labelLine={false}
                                    >
                                        {deliveryChartData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No delivery data</div>
                        )}
                    </div>
                </Card>

                {/* Vehicle availability */}
                <Card>
                    <CardHeader title="Vehicle & Driver Availability" />
                    <div className="p-5">
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={vehicleChartData} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Manage Users", icon: Users, path: "/users", color: "text-blue-600 bg-blue-50" },
                    { label: "View Drivers", icon: Truck, path: "/drivers", color: "text-indigo-600 bg-indigo-50" },
                    { label: "Fleet Vehicles", icon: Car, path: "/vehicles", color: "text-purple-600 bg-purple-50" },
                    { label: "All Deliveries", icon: Package, path: "/deliveries", color: "text-teal-600 bg-teal-50" },
                ].map((a) => (
                    <button
                        key={a.label}
                        onClick={() => navigate(a.path)}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
                    >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                            <a.icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{a.label}</span>
                    </button>
                ))}
            </div>

            {/* Recent Deliveries */}
            <Card>
                <CardHeader
                    title="Recent Deliveries"
                    subtitle="Last 5 deliveries"
                    actions={
                        <Button variant="ghost" size="sm" onClick={() => navigate("/deliveries")}>
                            View all →
                        </Button>
                    }
                />
                {!recentDeliveries || recentDeliveries.length === 0 ? (
                    <EmptyState title="No recent deliveries" icon={Package} />
                ) : (
                    <Table headers={["Delivery #", "Customer", "Status", "Priority", "Driver", "Scheduled", ""]}>
                        {recentDeliveries.map((d) => (
                            <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-4 py-3">
                                    <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                        {d.deliveryNumber}
                                    </span>
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
                                    <button
                                        onClick={() => navigate("/deliveries")}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}

// ─── Dispatcher Dashboard ──────────────────────────────────────────────────────
function DispatcherDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await dashboardService.getDispatcherDashboard();
            setData(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }
    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    const {
        pendingDeliveries, activeDeliveries, availableDrivers, availableVehicles,
        activeAssignments, completedDeliveries, recentAssignments
    } = data || {};

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Dispatcher Dashboard"
                subtitle="Delivery assignment and fleet overview"
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => navigate("/dispatch")}>
                            <Send className="w-4 h-4" /> Dispatch
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KpiCard title="Pending" value={pendingDeliveries} icon={Clock} color="yellow" />
                <KpiCard title="Active" value={activeDeliveries} icon={TrendingUp} color="blue" />
                <KpiCard title="Assigned" value={activeAssignments} icon={Send} color="indigo" />
                <KpiCard title="Completed" value={completedDeliveries} icon={CheckCircle} color="green" />
                <KpiCard title="Available Drivers" value={availableDrivers} icon={Truck} color="purple" />
                <KpiCard title="Available Vehicles" value={availableVehicles} icon={Car} color="teal" />
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Assign Delivery", icon: Send, path: "/dispatch", color: "text-blue-600 bg-blue-50" },
                    { label: "Active Deliveries", icon: Package, path: "/deliveries", color: "text-indigo-600 bg-indigo-50" },
                    { label: "Drivers", icon: Truck, path: "/drivers", color: "text-purple-600 bg-purple-50" },
                    { label: "Vehicles", icon: Car, path: "/vehicles", color: "text-teal-600 bg-teal-50" },
                ].map((a) => (
                    <button key={a.label} onClick={() => navigate(a.path)}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                            <a.icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{a.label}</span>
                    </button>
                ))}
            </div>

            {/* Active Assignments Table */}
            <Card>
                <CardHeader
                    title="Active Assignments"
                    subtitle="Deliveries currently in progress"
                    actions={<Button variant="ghost" size="sm" onClick={() => navigate("/dispatch")}>View all →</Button>}
                />
                {!recentAssignments || recentAssignments.length === 0 ? (
                    <EmptyState title="No active assignments" description="No deliveries are currently assigned." icon={Package} />
                ) : (
                    <Table headers={["Delivery #", "Customer", "Status", "Driver", "Vehicle", "Updated"]}>
                        {recentAssignments.map((d) => (
                            <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-4 py-3">
                                    <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                        {d.deliveryNumber}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-700">{d.customerName}</td>
                                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {d.assignedDriver?.name || <span className="text-slate-400">—</span>}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {d.assignedVehicle?.vehicleNumber || <span className="text-slate-400">—</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(d.updatedAt)}</td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Card>
        </div>
    );
}

// ─── Driver Dashboard ──────────────────────────────────────────────────────────
function DriverDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await dashboardService.getDriverDashboard();
            setData(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpdateStatus = async (deliveryId, newStatus) => {
        setUpdatingStatus(true);
        try {
            await deliveryService.updateDeliveryStatus(deliveryId, newStatus);
            toast.success(`Delivery status updated to ${newStatus.replace(/_/g, " ")}`);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update delivery status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
        );
    }
    if (error) return <ErrorState message={error} onRetry={fetchData} />;

    const {
        assignedDeliveries, todayDeliveries, completedDeliveries, pendingDeliveries,
        assignedVehicle, currentDeliveryStatus, currentDelivery
    } = data || {};

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Driver Dashboard"
                subtitle="Your deliveries and current status"
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={fetchData}>
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => navigate("/deliveries")}>
                            <Package className="w-4 h-4" /> My Deliveries
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard title="Total Assigned" value={assignedDeliveries} icon={Package} color="blue" />
                <KpiCard title="Today's Deliveries" value={todayDeliveries} icon={Clock} color="orange" />
                <KpiCard title="Completed" value={completedDeliveries} icon={CheckCircle} color="green" />
                <KpiCard title="In Progress" value={pendingDeliveries} icon={TrendingUp} color="indigo" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Delivery */}
                <Card>
                    <CardHeader title="Current Delivery" subtitle={`Status: ${currentDeliveryStatus || "—"}`} />
                    <div className="p-5">
                        {currentDelivery ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                                        {currentDelivery.deliveryNumber}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {currentDelivery.priority && (
                                            <PriorityBadge priority={currentDelivery.priority} />
                                        )}
                                        <StatusBadge status={currentDelivery.status} />
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <p className="font-semibold text-slate-800">{currentDelivery.customerName}</p>
                                    <div className="flex items-start gap-2 text-slate-600">
                                        <MapPin className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <p className="text-xs">{currentDelivery.pickupAddress}</p>
                                    </div>
                                    <div className="flex items-start gap-2 text-slate-600">
                                        <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                        <p className="text-xs">{currentDelivery.deliveryAddress}</p>
                                    </div>
                                </div>

                                {/* Cargo / Load Information */}
                                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2.5">
                                    <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5 text-slate-700">
                                            <Package className="w-3.5 h-3.5 text-blue-600" />
                                            Cargo & Load Details
                                        </span>
                                        {(currentDelivery.packageWeight !== undefined || currentDelivery.weight !== undefined) && (
                                            <span className="text-blue-700 bg-blue-100 font-mono px-2 py-0.5 rounded text-[11px] font-bold">
                                                {currentDelivery.packageWeight ?? currentDelivery.weight} kg
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                                                <span className="font-medium">Cargo Weight</span>
                                            </div>
                                            <p className="font-bold text-slate-800 text-sm">
                                                {currentDelivery.packageWeight ?? currentDelivery.weight ?? "1"} kg
                                            </p>
                                            {assignedVehicle?.capacity && (
                                                <div className="pt-0.5">
                                                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                                        <span>Vehicle capacity</span>
                                                        <span>{assignedVehicle.capacity} kg</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500"
                                                            style={{
                                                                width: `${Math.min(100, Math.max(5, Math.round(((currentDelivery.packageWeight ?? currentDelivery.weight ?? 1) / assignedVehicle.capacity) * 100)))}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Boxes className="w-3.5 h-3.5 text-amber-500" />
                                                <span className="font-medium">Package Content</span>
                                            </div>
                                            <p className="font-semibold text-slate-800 text-xs line-clamp-2" title={currentDelivery.packageDescription || "Standard delivery items"}>
                                                {currentDelivery.packageDescription || "Standard delivery items"}
                                            </p>
                                        </div>
                                    </div>

                                    {currentDelivery.notes && (
                                        <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2 text-xs text-amber-900 flex items-start gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                                            <p><span className="font-semibold">Handling Note:</span> {currentDelivery.notes}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                                    {currentDelivery.status === "ASSIGNED" && (
                                        <Button
                                            variant="success"
                                            size="sm"
                                            loading={updatingStatus}
                                            onClick={() => handleUpdateStatus(currentDelivery._id, "PICKED_UP")}
                                        >
                                            <PackageCheck className="w-4 h-4 mr-1" /> Mark Picked Up
                                        </Button>
                                    )}
                                    {currentDelivery.status === "PICKED_UP" && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            loading={updatingStatus}
                                            onClick={() => handleUpdateStatus(currentDelivery._id, "IN_TRANSIT")}
                                        >
                                            <Truck className="w-4 h-4 mr-1" /> Start Transit
                                        </Button>
                                    )}
                                    {currentDelivery.status === "IN_TRANSIT" && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            loading={updatingStatus}
                                            onClick={() => handleUpdateStatus(currentDelivery._id, "OUT_FOR_DELIVERY")}
                                        >
                                            <MapPin className="w-4 h-4 mr-1" /> Out for Delivery
                                        </Button>
                                    )}
                                    {currentDelivery.status === "OUT_FOR_DELIVERY" && (
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={() => navigate("/proof-of-delivery", { state: { delivery: currentDelivery } })}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" /> Submit POD
                                        </Button>
                                    )}
                                    <Button variant="secondary" size="sm" onClick={() => navigate("/deliveries")}>
                                        View Details
                                    </Button>
                                    {currentDelivery.status !== "OUT_FOR_DELIVERY" && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => navigate("/proof-of-delivery", { state: { delivery: currentDelivery } })}
                                        >
                                            Submit POD
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                title="No active delivery"
                                description="You don't have an active delivery right now."
                                icon={Package}
                            />
                        )}
                    </div>
                </Card>

                {/* Assigned Vehicle */}
                <Card>
                    <CardHeader title="Assigned Vehicle" />
                    <div className="p-5">
                        {assignedVehicle ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <Car className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{assignedVehicle.vehicleNumber}</p>
                                        <p className="text-xs text-slate-500">{assignedVehicle.registrationNumber}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-0.5">Type</p>
                                        <p className="font-semibold text-slate-700">{assignedVehicle.type}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-0.5">Status</p>
                                        <StatusBadge status={assignedVehicle.status} />
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-0.5">Fuel</p>
                                        <p className="font-semibold text-slate-700">{assignedVehicle.fuelType || "—"}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-0.5">Capacity</p>
                                        <p className="font-semibold text-slate-700">{assignedVehicle.capacity} kg</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <EmptyState title="No vehicle assigned" description="No vehicle has been assigned to you yet." icon={Car} />
                        )}
                    </div>
                </Card>
            </div>

            <Card>
                <CardHeader title="Quick Actions" />
                <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { label: "My Deliveries", icon: Package, path: "/deliveries" },
                        { label: "Submit Proof", icon: CheckCircle, path: "/proof-of-delivery" },
                        { label: "Settings", icon: Zap, path: "/settings" },
                    ].map((a) => (
                        <button key={a.label} onClick={() => navigate(a.path)}
                            className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-200 transition-all text-left">
                            <a.icon className="w-5 h-5 text-blue-600 shrink-0" />
                            <span className="text-sm font-medium text-slate-700">{a.label}</span>
                        </button>
                    ))}
                </div>
            </Card>
        </div>
    );
}

// ─── Main Dashboard router ────────────────────────────────────────────────────
function Dashboard() {
    const { user } = useAuth();

    if (user?.role === "ADMIN") return <AdminDashboard />;
    if (user?.role === "DISPATCHER") return <DispatcherDashboard />;
    if (user?.role === "DRIVER") return <DriverDashboard />;

    return (
        <div className="flex items-center justify-center min-h-64">
            <p className="text-slate-500">Unknown role. Please contact your administrator.</p>
        </div>
    );
}

export default Dashboard;