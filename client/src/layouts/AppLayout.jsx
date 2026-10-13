import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard,
    Users,
    Truck,
    Car,
    Package,
    SendHorizonal,
    ClipboardCheck,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronRight,
    Bell,
    User,
    ChevronDown,
    Zap,
} from "lucide-react";

// Navigation items per role
const navItems = [
    {
        path: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "DISPATCHER", "DRIVER"],
    },
    {
        path: "/users",
        label: "Users",
        icon: Users,
        roles: ["ADMIN"],
    },
    {
        path: "/drivers",
        label: "Drivers",
        icon: Truck,
        roles: ["ADMIN", "DISPATCHER"],
    },
    {
        path: "/vehicles",
        label: "Vehicles",
        icon: Car,
        roles: ["ADMIN", "DISPATCHER"],
    },
    {
        path: "/deliveries",
        label: "Deliveries",
        icon: Package,
        roles: ["ADMIN", "DISPATCHER", "DRIVER"],
    },
    {
        path: "/dispatch",
        label: "Dispatch",
        icon: SendHorizonal,
        roles: ["ADMIN", "DISPATCHER"],
    },
    {
        path: "/proof-of-delivery",
        label: "Proof of Delivery",
        icon: ClipboardCheck,
        roles: ["ADMIN", "DISPATCHER", "DRIVER"],
    },
    {
        path: "/analytics",
        label: "Analytics",
        icon: BarChart3,
        roles: ["ADMIN", "DISPATCHER"],
    },
    {
        path: "/settings",
        label: "Settings",
        icon: Settings,
        roles: ["ADMIN", "DISPATCHER", "DRIVER"],
    },
];

function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const visibleItems = navItems.filter(
        (item) => !item.roles || item.roles.includes(user?.role)
    );

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const roleColors = {
        ADMIN: "bg-blue-500",
        DISPATCHER: "bg-purple-500",
        DRIVER: "bg-emerald-500",
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar panel */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 flex flex-col
                    bg-[#0f1729] text-white
                    transition-all duration-300 ease-in-out
                    lg:relative lg:z-auto lg:translate-x-0
                    ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                    ${collapsed ? "lg:w-18" : "w-64"}
                `}
                style={{ width: collapsed ? "72px" : "256px" }}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden">
                                <p className="text-base font-bold text-white leading-tight whitespace-nowrap">
                                    FleetFlow
                                </p>
                                <p className="text-xs text-slate-400 whitespace-nowrap">Fleet Management</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 rounded text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 px-2">
                    <ul className="space-y-1">
                        {visibleItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        onClick={onClose}
                                        title={collapsed ? item.label : undefined}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                                            ${isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                                                : "text-slate-400 hover:bg-white/8 hover:text-white"
                                            }`
                                        }
                                    >
                                        <Icon className="w-5 h-5 shrink-0" />
                                        {!collapsed && (
                                            <span className="flex-1 truncate">{item.label}</span>
                                        )}
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User + logout */}
                <div className="border-t border-white/10 p-3 space-y-2">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div
                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${roleColors[user?.role] || "bg-slate-600"}`}
                        >
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.role}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition-all duration-150"
                        title={collapsed ? "Logout" : undefined}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}

function Topbar({ onMenuClick, onCollapseClick, collapsed }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [profileOpen, setProfileOpen] = useState(false);

    // Build breadcrumb from path
    const pathLabel = navItems.find((i) => i.path === location.pathname)?.label || "FleetFlow";

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const roleColors = {
        ADMIN: "bg-blue-100 text-blue-700",
        DISPATCHER: "bg-purple-100 text-purple-700",
        DRIVER: "bg-emerald-100 text-emerald-700",
    };

    return (
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-6 h-16 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
            {/* Mobile menu toggle */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
                onClick={onCollapseClick}
                className="hidden lg:flex p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
                <span className="hidden sm:inline text-slate-400">FleetFlow</span>
                <ChevronRight className="hidden sm:inline w-4 h-4 text-slate-300 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">{pathLabel}</span>
            </div>

            <div className="flex-1" />

            {/* Right actions */}
            <div className="flex items-center gap-2">
                {/* Notification bell placeholder */}
                <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative">
                    <Bell className="w-5 h-5" />
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setProfileOpen((o) => !o)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium text-slate-800 leading-none truncate max-w-[120px]">
                                {user?.name}
                            </p>
                            <p className="text-xs text-slate-500 leading-none mt-0.5">
                                {user?.role}
                            </p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>

                    {profileOpen && (
                        <div
                            className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-fade-in"
                        >
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                <span className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user?.role]}`}>
                                    {user?.role}
                                </span>
                            </div>
                            <button
                                onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <User className="w-4 h-4" />
                                Profile & Settings
                            </button>
                            <div className="border-t border-slate-100 mt-1" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Close profile dropdown on outside click */}
            {profileOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                />
            )}
        </header>
    );
}

function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // Close sidebar on large screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setSidebarOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed((c) => !c)}
            />

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Topbar
                    onMenuClick={() => setSidebarOpen(true)}
                    onCollapseClick={() => setCollapsed((c) => !c)}
                    collapsed={collapsed}
                />
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 lg:p-6 animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AppLayout;
