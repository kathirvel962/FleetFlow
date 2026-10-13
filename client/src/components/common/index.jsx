// Shared reusable UI components for FleetFlow

import { Loader2, AlertCircle, RefreshCw, Package, Inbox } from "lucide-react";

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
export function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="w-9 h-9 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
    );
}

export function SkeletonRow() {
    return (
        <tr className="border-b border-slate-100">
            {[...Array(5)].map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <div className="h-4 bg-slate-200 rounded animate-pulse" />
                </td>
            ))}
        </tr>
    );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                        {[...Array(cols)].map((_, i) => (
                            <th key={i} className="px-4 py-3">
                                <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[...Array(rows)].map((_, i) => (
                        <SkeletonRow key={i} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Loading Spinner ───────────────────────────────────────────────────────────
export function LoadingSpinner({ size = "md", className = "" }) {
    const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
    return (
        <Loader2 className={`animate-spin text-blue-600 ${sizes[size]} ${className}`} />
    );
}

// ─── Page Loading ──────────────────────────────────────────────────────────────
export function PageLoading() {
    return (
        <div className="flex items-center justify-center min-h-64">
            <div className="flex flex-col items-center gap-3">
                <LoadingSpinner size="lg" />
                <p className="text-slate-500 text-sm">Loading data…</p>
            </div>
        </div>
    );
}

// ─── Error State ───────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-64 text-center px-4">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1">Something went wrong</h3>
            <p className="text-sm text-slate-500 mb-4 max-w-sm">{message || "Failed to load data. Please try again."}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            )}
        </div>
    );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ title = "No results", description, icon: Icon = Inbox, action }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-64 text-center px-4">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
            {description && <p className="text-sm text-slate-500 mb-4 max-w-sm">{description}</p>}
            {action}
        </div>
    );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export function KpiCard({ title, value, icon: Icon, color = "blue", subtitle, trend }) {
    const colors = {
        blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
        green: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
        purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
        orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100" },
        red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-100" },
        yellow: { bg: "bg-yellow-50", icon: "text-yellow-600", border: "border-yellow-100" },
        indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", border: "border-indigo-100" },
        teal: { bg: "bg-teal-50", icon: "text-teal-600", border: "border-teal-100" },
    };
    const c = colors[color] || colors.blue;

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg} ${c.border} border`}>
                    <Icon className={`w-5 h-5 ${c.icon}`} />
                </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">{value ?? "—"}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-1.5">{subtitle}</p>}
        </div>
    );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
    const map = {
        // Delivery statuses
        PENDING: "bg-yellow-100 text-yellow-800",
        ASSIGNED: "bg-blue-100 text-blue-800",
        PICKED_UP: "bg-indigo-100 text-indigo-800",
        IN_TRANSIT: "bg-purple-100 text-purple-800",
        OUT_FOR_DELIVERY: "bg-cyan-100 text-cyan-800",
        DELIVERED: "bg-green-100 text-green-800",
        FAILED: "bg-red-100 text-red-800",
        CANCELLED: "bg-slate-100 text-slate-600",
        // Vehicle statuses
        AVAILABLE: "bg-green-100 text-green-800",
        IN_USE: "bg-blue-100 text-blue-800",
        MAINTENANCE: "bg-orange-100 text-orange-800",
        INACTIVE: "bg-slate-100 text-slate-500",
        // Driver statuses
        ON_TRIP: "bg-purple-100 text-purple-800",
        OFF_DUTY: "bg-slate-100 text-slate-500",
        SUSPENDED: "bg-red-100 text-red-700",
        // User
        ACTIVE: "bg-green-100 text-green-800",
    };

    const displayText = status?.replace(/_/g, " ") ?? "—";
    const style = map[status] || "bg-slate-100 text-slate-600";

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
            {displayText}
        </span>
    );
}

// ─── Priority Badge ────────────────────────────────────────────────────────────
export function PriorityBadge({ priority }) {
    const map = {
        LOW: "bg-slate-100 text-slate-600",
        MEDIUM: "bg-blue-100 text-blue-700",
        HIGH: "bg-orange-100 text-orange-700",
        URGENT: "bg-red-100 text-red-700",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${map[priority] || "bg-slate-100 text-slate-600"}`}>
            {priority}
        </span>
    );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = "primary", size = "md", loading, className = "", ...props }) {
    const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm",
        secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400",
        danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        ghost: "text-slate-600 hover:bg-slate-100",
        success: "bg-emerald-600 text-white hover:bg-emerald-700",
    };
    const sizes = {
        sm: "text-xs px-3 py-1.5 h-7",
        md: "text-sm px-4 py-2 h-9",
        lg: "text-sm px-5 py-2.5 h-10",
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = "", ...props }) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-sm font-medium text-slate-700">{label}</label>
            )}
            <input
                className={`h-9 px-3 rounded-lg border text-sm transition-colors placeholder:text-slate-400
                    ${error
                        ? "border-red-400 focus:ring-red-300 focus:border-red-400"
                        : "border-slate-300 focus:ring-blue-200 focus:border-blue-400"
                    }
                    focus:outline-none focus:ring-2 bg-white w-full ${className}`}
                {...props}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = "", ...props }) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
            <select
                className={`h-9 px-3 rounded-lg border text-sm transition-colors bg-white
                    ${error ? "border-red-400" : "border-slate-300 focus:border-blue-400"}
                    focus:outline-none focus:ring-2 focus:ring-blue-200 w-full ${className}`}
                {...props}
            >
                {children}
            </select>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} animate-fade-in max-h-[90vh] flex flex-col`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                    <h2 className="text-base font-semibold text-slate-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <Package className="w-4 h-4 rotate-45" />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirm", variant = "danger" }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in p-6">
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                        <p className="text-sm text-slate-500">{message}</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
                </div>
            </div>
        </div>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ pagination, onPageChange }) {
    if (!pagination || pagination.pages <= 1) return null;
    const { page, pages, total } = pagination;

    const pages_arr = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
        pages_arr.push(i);
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">
                Page {page} of {pages} · {total} total
            </p>
            <div className="flex gap-1">
                <button
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="px-2 py-1 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Prev
                </button>
                {pages_arr.map((p) => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`px-2.5 py-1 text-xs rounded border font-medium transition-colors
                            ${p === page
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    disabled={page >= pages}
                    onClick={() => onPageChange(page + 1)}
                    className="px-2 py-1 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="flex items-start justify-between mb-6 gap-4">
            <div>
                <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
    );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "" }) {
    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({ title, subtitle, actions, className = "" }) {
    return (
        <div className={`flex items-center justify-between px-5 py-4 border-b border-slate-200 ${className}`}>
            <div>
                <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, className = "" }) {
    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">{children}</tbody>
            </table>
        </div>
    );
}

// ─── Search Input ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = "Search…", className = "" }) {
    return (
        <div className={`relative ${className}`}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
            </span>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="h-9 pl-9 pr-4 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white w-full placeholder:text-slate-400"
            />
        </div>
    );
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export function formatDate(date) {
    if (!date) return "—";
    try {
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(new Date(date));
    } catch {
        return "—";
    }
}

export function formatDateTime(date) {
    if (!date) return "—";
    try {
        return new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(date));
    } catch {
        return "—";
    }
}
