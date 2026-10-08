import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/login";
import Dashboard from "../pages/dashboard";
function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<h1>FleetFlow</h1>} />
                <Route path="/login" element={<Login />} />
                <Route path="/users" element={<h1>Users</h1>} />
                <Route path="/vehicles" element={<h1>Vehicles</h1>} />
                <Route path="/drivers" element={<h1>Drivers</h1>} />
                <Route path="/deliveries" element={<h1>Deliveries</h1>} />
                <Route path="/dispatch" element={<h1>Dispatch</h1>} />
                <Route path="/my-deliveries" element={<h1>My Deliveries</h1>} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;