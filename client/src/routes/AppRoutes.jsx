import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { ProtectedRoute, PublicRoute } from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";

// Pages
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Drivers from "../pages/Drivers";
import Vehicles from "../pages/Vehicles";
import Deliveries from "../pages/Deliveries";
import Dispatch from "../pages/Dispatch";
import ProofOfDelivery from "../pages/ProofOfDelivery";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";
import NotFound from "../pages/NotFound";

function AppRoutes() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <Routes>
                        {/* Public */}
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />

                        {/* Protected — wrapped in shared layout */}
                        <Route
                            element={
                                <ProtectedRoute>
                                    <AppLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />

                            {/* Admin only */}
                            <Route
                                path="/users"
                                element={
                                    <ProtectedRoute roles={["ADMIN"]}>
                                        <Users />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Admin + Dispatcher */}
                            <Route
                                path="/drivers"
                                element={
                                    <ProtectedRoute roles={["ADMIN", "DISPATCHER"]}>
                                        <Drivers />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/vehicles"
                                element={
                                    <ProtectedRoute roles={["ADMIN", "DISPATCHER"]}>
                                        <Vehicles />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/dispatch"
                                element={
                                    <ProtectedRoute roles={["ADMIN", "DISPATCHER"]}>
                                        <Dispatch />
                                    </ProtectedRoute>
                                }
                            />

                            {/* All roles */}
                            <Route path="/deliveries" element={<Deliveries />} />
                            <Route path="/proof-of-delivery" element={<ProofOfDelivery />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/settings" element={<Settings />} />
                        </Route>

                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default AppRoutes;