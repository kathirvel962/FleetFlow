import { useState, useEffect, useCallback } from "react";
import { UserPlus, Edit2, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { userService } from "../services/userService";
import { useToast } from "../context/ToastContext";
import {
    PageHeader, Card, Table, StatusBadge, Pagination, SearchInput, Button,
    Modal, Select, Input, ConfirmDialog, ErrorState, EmptyState, SkeletonTable, formatDate,
} from "../components/common/index";

const ROLES = ["ADMIN", "DISPATCHER", "DRIVER"];

function UserForm({ initial, onSubmit, loading }) {
    const [form, setForm] = useState({
        name: initial?.name || "",
        email: initial?.email || "",
        password: "",
        role: initial?.role || "DRIVER",
        phone: initial?.phone || "",
        isActive: initial?.isActive !== undefined ? initial.isActive : true,
    });

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...form };
        if (!payload.password) delete payload.password; // Don't send empty password on update
        onSubmit(payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name *" value={form.name} onChange={e => set("name", e.target.value)} required placeholder="John Smith" />
            <Input label="Email *" type="email" value={form.email} onChange={e => set("email", e.target.value)} required placeholder="john@example.com" />
            <Input
                label={initial ? "Password (leave blank to keep)" : "Password *"}
                type="password"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                required={!initial}
                placeholder="Min 6 characters"
            />
            <Select label="Role" value={form.role} onChange={e => set("role", e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </Select>
            <Input label="Phone" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 9999999999" />
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700">Active</label>
                <button
                    type="button"
                    onClick={() => set("isActive", !form.isActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-blue-600" : "bg-slate-300"}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button type="submit" loading={loading}>
                    {initial ? "Update User" : "Create User"}
                </Button>
            </div>
        </form>
    );
}

function Users() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState({ open: false, type: "", user: null });
    const [submitting, setSubmitting] = useState(false);
    const [confirm, setConfirm] = useState({ open: false, user: null });
    const toast = useToast();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = { page, limit: 10 };
            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;
            if (activeFilter !== "") params.isActive = activeFilter;
            const res = await userService.getUsers(params);
            setUsers(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load users");
        } finally {
            setLoading(false);
        }
    }, [page, search, roleFilter, activeFilter]);

    useEffect(() => {
        const t = setTimeout(fetchUsers, search ? 400 : 0);
        return () => clearTimeout(t);
    }, [fetchUsers, search]);

    const handleCreate = async (data) => {
        setSubmitting(true);
        try {
            await userService.createUser(data);
            toast.success("User created successfully");
            setModal({ open: false });
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create user");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (data) => {
        setSubmitting(true);
        try {
            await userService.updateUser(modal.user._id, data);
            toast.success("User updated successfully");
            setModal({ open: false });
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update user");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            await userService.deleteUser(confirm.user._id);
            toast.success("User deleted");
            setConfirm({ open: false });
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete user");
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await userService.updateUserStatus(user._id, !user.isActive);
            toast.success(`User ${!user.isActive ? "activated" : "deactivated"}`);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status");
        }
    };

    const roleColors = { ADMIN: "bg-blue-100 text-blue-700", DISPATCHER: "bg-purple-100 text-purple-700", DRIVER: "bg-emerald-100 text-emerald-700" };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="User Management"
                subtitle="Manage all system users and their roles"
                actions={
                    <Button onClick={() => setModal({ open: true, type: "create", user: null })}>
                        <UserPlus className="w-4 h-4" /> Add User
                    </Button>
                }
            />

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-wrap gap-3">
                    <SearchInput
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by name or email…"
                        className="flex-1 min-w-48"
                    />
                    <select
                        value={roleFilter}
                        onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                        className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                    >
                        <option value="">All Roles</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select
                        value={activeFilter}
                        onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
                        className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
            </Card>

            {/* Table */}
            <Card>
                {loading ? <SkeletonTable rows={8} cols={6} /> :
                    error ? <ErrorState message={error} onRetry={fetchUsers} /> :
                        users.length === 0 ? (
                            <EmptyState title="No users found" description="Try adjusting your search or filters." />
                        ) : (
                            <>
                                <Table headers={["User", "Role", "Phone", "Status", "Created", "Actions"]}>
                                    {users.map((u) => (
                                        <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                                        {u.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">{u.name}</p>
                                                        <p className="text-xs text-slate-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${roleColors[u.role]}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{u.phone || "—"}</td>
                                            <td className="px-4 py-3">
                                                <StatusBadge status={u.isActive ? "ACTIVE" : "INACTIVE"} />
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setModal({ open: true, type: "edit", user: u })}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(u)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                        title={u.isActive ? "Deactivate" : "Activate"}
                                                    >
                                                        {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirm({ open: true, user: u })}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </Table>
                                <Pagination pagination={pagination} onPageChange={setPage} />
                            </>
                        )
                }
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                open={modal.open}
                onClose={() => setModal({ open: false })}
                title={modal.type === "edit" ? `Edit User — ${modal.user?.name}` : "Create New User"}
            >
                <UserForm
                    initial={modal.type === "edit" ? modal.user : null}
                    onSubmit={modal.type === "edit" ? handleUpdate : handleCreate}
                    loading={submitting}
                />
            </Modal>

            {/* Delete Confirm */}
            <ConfirmDialog
                open={confirm.open}
                onClose={() => setConfirm({ open: false })}
                onConfirm={handleDelete}
                title="Delete User"
                message={`Are you sure you want to delete "${confirm.user?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}

export default Users;
