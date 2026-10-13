import { useState } from "react";
import {
    User,
    Lock,
    Sliders,
    Bell,
    Shield,
    Save,
    Check,
    AlertCircle,
    Server,
    Key,
    Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
    PageHeader,
    Button,
    Card,
    CardHeader,
    Input,
    Select,
} from "../components/common";

export default function Settings() {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState("profile");

    // Profile state
    const [profileData, setProfileData] = useState({
        name: user?.name || "Fleet Manager",
        email: user?.email || "admin@fleetflow.com",
        phone: "+1 (555) 019-2834",
        department: "Logistics & Fleet Operations",
    });
    const [savingProfile, setSavingProfile] = useState(false);

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [savingPassword, setSavingPassword] = useState(false);

    // Fleet Preferences state
    const [fleetConfig, setFleetConfig] = useState({
        depotName: "Central Logistics Hub - Bay 4",
        depotAddress: "450 Industrial Parkway, Sector 9",
        unitSystem: "metric",
        autoAssignRadius: "15",
        defaultPriority: "NORMAL",
        speedLimitWarning: "80",
    });
    const [savingFleet, setSavingFleet] = useState(false);

    // Notification Toggles
    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        smsAlerts: false,
        deliveryExceptions: true,
        driverStatusChange: true,
        vehicleMaintenanceDue: true,
        soundChimes: true,
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setTimeout(() => {
            setSavingProfile(false);
            addToast("Profile details updated successfully", "success");
        }, 600);
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (!passwordData.currentPassword) {
            addToast("Please enter your current password", "error");
            return;
        }
        if (passwordData.newPassword.length < 6) {
            addToast("New password must be at least 6 characters long", "error");
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            addToast("New password and confirmation do not match", "error");
            return;
        }

        setSavingPassword(true);
        setTimeout(() => {
            setSavingPassword(false);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            addToast("Password changed successfully", "success");
        }, 700);
    };

    const handleFleetSubmit = (e) => {
        e.preventDefault();
        setSavingFleet(true);
        setTimeout(() => {
            setSavingFleet(false);
            addToast("Fleet operations settings saved", "success");
        }, 500);
    };

    const handleNotificationToggle = (key) => {
        setNotifications((prev) => {
            const updated = { ...prev, [key]: !prev[key] };
            addToast(`Notification preference updated`, "info");
            return updated;
        });
    };

    const handleClearCache = () => {
        if (window.confirm("Are you sure you want to clear cached session preferences?")) {
            sessionStorage.clear();
            addToast("Local session cache cleared", "success");
        }
    };

    const tabs = [
        { id: "profile", label: "My Profile", icon: User },
        { id: "security", label: "Security & Password", icon: Lock },
        { id: "fleet", label: "Fleet Preferences", icon: Sliders },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "system", label: "System & Info", icon: Server },
    ];

    return (
        <div className="space-y-6 max-w-5xl">
            <PageHeader
                title="System Settings"
                subtitle="Manage user profile, fleet operations parameters, and notifications"
            />

            <div className="flex flex-col md:flex-row gap-6">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-64 shrink-0">
                    <Card className="p-2 space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                                        isActive
                                            ? "bg-blue-600 text-white shadow-xs"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </Card>

                    {/* Role info card */}
                    <Card className="mt-4 p-4 text-xs bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-slate-800">Role Privileges</span>
                        </div>
                        <p className="text-slate-600 mb-2">
                            Logged in with <span className="font-semibold text-slate-800">{user?.role || "USER"}</span> role permissions.
                        </p>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            {user?.role === "ADMIN"
                                ? "Full Platform Administration"
                                : user?.role === "DISPATCHER"
                                ? "Fleet & Dispatch Management"
                                : "Delivery & Route Execution"}
                        </span>
                    </Card>
                </div>

                {/* Tab Content Panel */}
                <div className="flex-1 min-w-0">
                    {/* Tab 1: Profile */}
                    {activeTab === "profile" && (
                        <Card className="p-6">
                            <CardHeader
                                title="Personal Profile"
                                subtitle="Update your personal details and contact information"
                            />
                            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
                                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                                        {profileData.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">{profileData.name}</h4>
                                        <p className="text-xs text-slate-500">{user?.role} • FleetFlow Operations</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Full Name"
                                        value={profileData.name}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, name: e.target.value })
                                        }
                                        required
                                    />
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, email: e.target.value })
                                        }
                                        required
                                    />
                                    <Input
                                        label="Contact Phone"
                                        value={profileData.phone}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, phone: e.target.value })
                                        }
                                    />
                                    <Input
                                        label="Department / Unit"
                                        value={profileData.department}
                                        onChange={(e) =>
                                            setProfileData({ ...profileData, department: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" loading={savingProfile}>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* Tab 2: Security */}
                    {activeTab === "security" && (
                        <Card className="p-6">
                            <CardHeader
                                title="Security & Authentication"
                                subtitle="Ensure your account stays secure with a strong password"
                            />
                            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4 max-w-md">
                                <Input
                                    label="Current Password"
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                    }
                                    required
                                    placeholder="••••••••"
                                />
                                <Input
                                    label="New Password"
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                                    }
                                    required
                                    placeholder="Minimum 6 characters"
                                />
                                <Input
                                    label="Confirm New Password"
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                    }
                                    required
                                    placeholder="Repeat new password"
                                />

                                <div className="pt-2">
                                    <Button type="submit" loading={savingPassword}>
                                        <Key className="w-4 h-4 mr-2" />
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* Tab 3: Fleet Preferences */}
                    {activeTab === "fleet" && (
                        <Card className="p-6">
                            <CardHeader
                                title="Fleet & Dispatch Parameters"
                                subtitle="Configure default behavior for routes and automatic dispatch"
                            />
                            <form onSubmit={handleFleetSubmit} className="mt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Primary Depot Name"
                                        value={fleetConfig.depotName}
                                        onChange={(e) =>
                                            setFleetConfig({ ...fleetConfig, depotName: e.target.value })
                                        }
                                    />
                                    <Input
                                        label="Depot Address"
                                        value={fleetConfig.depotAddress}
                                        onChange={(e) =>
                                            setFleetConfig({ ...fleetConfig, depotAddress: e.target.value })
                                        }
                                    />
                                    <Select
                                        label="Measurement System"
                                        value={fleetConfig.unitSystem}
                                        onChange={(e) =>
                                            setFleetConfig({ ...fleetConfig, unitSystem: e.target.value })
                                        }
                                    >
                                        <option value="metric">Metric (Kilometers / Liters / kg)</option>
                                        <option value="imperial">Imperial (Miles / Gallons / lbs)</option>
                                    </Select>
                                    <Select
                                        label="Default Dispatch Priority"
                                        value={fleetConfig.defaultPriority}
                                        onChange={(e) =>
                                            setFleetConfig({ ...fleetConfig, defaultPriority: e.target.value })
                                        }
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="NORMAL">Normal</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </Select>
                                    <Input
                                        label="Auto-Assign Search Radius (km)"
                                        type="number"
                                        value={fleetConfig.autoAssignRadius}
                                        onChange={(e) =>
                                            setFleetConfig({ ...fleetConfig, autoAssignRadius: e.target.value })
                                        }
                                    />
                                    <Input
                                        label="Fleet Speed Warning Threshold (km/h)"
                                        type="number"
                                        value={fleetConfig.speedLimitWarning}
                                        onChange={(e) =>
                                            setFleetConfig({ ...fleetConfig, speedLimitWarning: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button type="submit" loading={savingFleet}>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Preferences
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    {/* Tab 4: Notifications */}
                    {activeTab === "notifications" && (
                        <Card className="p-6">
                            <CardHeader
                                title="Notification Preferences"
                                subtitle="Configure real-time alerts and delivery event notifications"
                            />
                            <div className="mt-6 space-y-4">
                                {[
                                    {
                                        key: "emailAlerts",
                                        title: "Email Notifications",
                                        desc: "Receive daily operations summary and major alerts via email",
                                    },
                                    {
                                        key: "deliveryExceptions",
                                        title: "Delivery Exception Alerts",
                                        desc: "Instant notifications when a delivery fails or is marked delayed",
                                    },
                                    {
                                        key: "vehicleMaintenanceDue",
                                        title: "Vehicle Service Reminders",
                                        desc: "Warning alerts when fleet vehicles enter maintenance status",
                                    },
                                    {
                                        key: "driverStatusChange",
                                        title: "Driver Shift Status Updates",
                                        desc: "Alerts when drivers transition to On-Duty or Off-Duty",
                                    },
                                    {
                                        key: "soundChimes",
                                        title: "Audio Chimes",
                                        desc: "Play sound effect when new dispatches or POD submissions arrive",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.key}
                                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                                    >
                                        <div>
                                            <h5 className="text-sm font-semibold text-slate-800">{item.title}</h5>
                                            <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleNotificationToggle(item.key)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                                notifications[item.key] ? "bg-blue-600" : "bg-slate-200"
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                    notifications[item.key] ? "translate-x-5" : "translate-x-0"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Tab 5: System & Info */}
                    {activeTab === "system" && (
                        <Card className="p-6">
                            <CardHeader
                                title="System Diagnostics & Runtime"
                                subtitle="Environment configuration and local storage state"
                            />
                            <div className="mt-6 space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                                    <div className="flex justify-between py-1 border-b border-slate-200">
                                        <span className="text-slate-500 font-medium">Application:</span>
                                        <span className="font-bold text-slate-800">FleetFlow Enterprise Platform</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-200">
                                        <span className="text-slate-500 font-medium">Version:</span>
                                        <span className="font-semibold text-slate-700">v2.4.0 (Vite + React 19)</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-200">
                                        <span className="text-slate-500 font-medium">API Base URL:</span>
                                        <span className="font-mono text-slate-700">/api (Proxy to Express)</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-200">
                                        <span className="text-slate-500 font-medium">Token Status:</span>
                                        <span className="font-semibold text-emerald-600">Active JWT Session</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-slate-500 font-medium">Database State:</span>
                                        <span className="font-semibold text-emerald-600">Connected to MongoDB</span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button variant="danger" size="sm" onClick={handleClearCache}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Clear Session Cache
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
