import { Link } from "react-router-dom";
import { Compass, Home, Package, ArrowLeft } from "lucide-react";
import { Button } from "../components/common";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 shadow-sm">
                <Compass className="w-10 h-10 animate-pulse" />
            </div>

            <span className="text-sm font-bold tracking-wider text-blue-600 uppercase mb-2">
                404 Route Error
            </span>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                Destination Not Found
            </h1>
            <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
                The delivery route or management page you are looking for does not exist,
                has been moved, or is temporarily out of service.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
                <Link to="/dashboard">
                    <Button variant="primary">
                        <Home className="w-4 h-4 mr-2" />
                        Return to Dashboard
                    </Button>
                </Link>
                <Link to="/deliveries">
                    <Button variant="secondary">
                        <Package className="w-4 h-4 mr-2" />
                        View Deliveries
                    </Button>
                </Link>
            </div>

            <p className="mt-12 text-xs text-slate-400">
                FleetFlow • Intelligent Fleet & Logistics Operations
            </p>
        </div>
    );
}
