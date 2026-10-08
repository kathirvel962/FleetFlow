import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
    const user = JSON.parse(localStorage.getItem("user"));

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem("token");
                const userRole = user?.role;

                let endpoint = "";

                if (userRole === "ADMIN") {
                    endpoint = "/dashboard/admin";
                } else if (userRole === "DISPATCHER") {
                    endpoint = "/dashboard/dispatcher";
                } else if (userRole === "DRIVER") {
                    endpoint = "/dashboard/driver";
                } else {
                    throw new Error("Invalid user role");
                }

                console.log("Dashboard endpoint:", endpoint);

                const response = await api.get(endpoint, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log("Dashboard response:", response.data);

                setDashboardData(response.data);
            } catch (err) {
                console.error("Dashboard error:", err);

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Unable to load dashboard data."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    if (loading) {
        return <h2>Loading dashboard...</h2>;
    }

    if (error) {
        return (
            <div>
                <h1>FleetFlow Dashboard</h1>
                <p>Welcome, {user?.name || "User"}</p>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div>
            <h1>FleetFlow Dashboard</h1>

            <p>
                Welcome, {user?.name || "User"}
            </p>

            <p>
                Role: {user?.role || "Unknown"}
            </p>

            <hr />

            <h2>Dashboard Data</h2>

            <pre>
                {JSON.stringify(dashboardData, null, 2)}
            </pre>
        </div>
    );
}

export default Dashboard;