import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, type CreateUserData, type UpdateUserData } from '../services/authService';
import { Plus, Search, ChevronLeft, ChevronRight, UserX, UserCheck, X, Pencil } from 'lucide-react';
import Swal from 'sweetalert2';

interface UserItem {
    _id: string;
    name: string;
    email: string;
    role: 'TEAM_MEMBER' | 'MANAGER';
    isActive?: boolean;
    createdAt?: string;
}

const PAGE_SIZE = 10;

export const Users: React.FC = () => {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);
    const [createFormData, setCreateFormData] = useState<CreateUserData>({
        name: '',
        email: '',
        password: '',
        role: 'TEAM_MEMBER',
    });

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [submittingEdit, setSubmittingEdit] = useState<boolean>(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<UpdateUserData>({
        name: '',
        email: '',
        role: 'TEAM_MEMBER',
    });

    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const [usersData, currentUser] = await Promise.all([
                authService.getUsers(),
                authService.getMe().catch(() => null)
            ]);
            
            setUsers(usersData);
            if (currentUser?._id || currentUser?.id) {
                setCurrentUserId(currentUser._id || currentUser.id);
            }
        } catch (err) {
            console.error('Failed to fetch users', err);
            Swal.fire({
                icon: 'error',
                title: 'Error Loading Users',
                text: 'Failed to retrieve user accounts. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Search filter
    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
    const visibleUsers = filteredUsers.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handlePageChange = (nextPage: number) => {
        if (nextPage >= 1 && nextPage <= totalPages) {
            setCurrentPage(nextPage);
        }
    };

    // Create User Handler
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createFormData.name || !createFormData.email || !createFormData.password) {
            Swal.fire('Warning', 'Please fill in all required fields.', 'warning');
            return;
        }

        try {
            setSubmittingCreate(true);
            await authService.createUser(createFormData);
            Swal.fire({
                icon: 'success',
                title: 'User Created',
                text: 'New user account created successfully.',
                timer: 1800,
                showConfirmButton: false,
            });
            setIsCreateModalOpen(false);
            setCreateFormData({ name: '', email: '', password: '', role: 'TEAM_MEMBER' });
            await fetchUsers();
        } catch (err: any) {
            console.error('Failed to create user', err);
            Swal.fire({
                icon: 'error',
                title: 'Creation Failed',
                text: err.response?.data?.message || 'Could not create user account.',
            });
        } finally {
            setSubmittingCreate(false);
        }
    };

    // Open Edit Modal Handler
    const handleOpenEditModal = (user: UserItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingUserId(user._id);
        setEditFormData({
            name: user.name,
            email: user.email,
            role: user.role,
        });
        setIsEditModalOpen(true);
    };

    // Edit User Submit Handler
    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUserId || !editFormData.name || !editFormData.email) {
            Swal.fire('Warning', 'Please fill in all required fields.', 'warning');
            return;
        }

        try {
            setSubmittingEdit(true);
            await authService.updateUser(editingUserId, editFormData);
            Swal.fire({
                icon: 'success',
                title: 'User Updated',
                text: 'User profile updated successfully.',
                timer: 1800,
                showConfirmButton: false,
            });
            setIsEditModalOpen(false);
            setEditingUserId(null);
            await fetchUsers();
        } catch (err: any) {
            console.error('Failed to update user', err);
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: err.response?.data?.message || 'Could not update user profile.',
            });
        } finally {
            setSubmittingEdit(false);
        }
    };

    // Deactivate / Activate User Status Handler
    const handleToggleActiveStatus = async (user: UserItem, e: React.MouseEvent) => {
        e.stopPropagation();

        if (user._id === currentUserId) {
            Swal.fire('Action Restricted', 'You cannot deactivate your own account.', 'info');
            return;
        }

        const nextStatus = user.isActive === false;
        const actionText = nextStatus ? 'activate' : 'deactivate';

        const result = await Swal.fire({
            title: `Are you sure?`,
            text: `Do you want to ${actionText} ${user.name}'s account?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: `Yes, ${actionText}`,
            cancelButtonText: 'Cancel',
            confirmButtonColor: nextStatus ? '#10B981' : '#EF4444',
        });

        if (result.isConfirmed) {
            try {
                await authService.updateUser(user._id, {
                    isActive: nextStatus,
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    text: `User account has been ${actionText}d.`,
                    timer: 1500,
                    showConfirmButton: false,
                });

                await fetchUsers();
            } catch (err: any) {
                console.error('Failed to update status', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: err.response?.data?.message || 'Could not update user status.',
                });
            }
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'MANAGER':
                return <span className="badge badge-info">Manager</span>;
            default:
                return <span className="badge badge-default">Team Member</span>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="page-title">User Management</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add User
                </button>
            </div>

            {/* Search Bar */}
            <div className="card p-4">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="input-field !pl-10 !py-2"
                    />
                </div>
            </div>

            {/* User Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400 animate-pulse font-bold">
                        Loading users...
                    </div>
                ) : visibleUsers.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-bold">
                        No users found.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="table-header">Name</th>
                                    <th className="table-header">Email</th>
                                    <th className="table-header">Role</th>
                                    <th className="table-header">Status</th>
                                    <th className="table-header text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
                                {visibleUsers.map((user) => {
                                    const isSelf = user._id === currentUserId;
                                    return (
                                        <tr
                                            key={user._id}
                                            className="table-row cursor-pointer"
                                            onClick={() => navigate(`/users/${user._id}`)}
                                        >
                                            <td className="table-cell font-bold text-gray-900 dark:text-white">
                                                {user.name} {isSelf && <span className="text-xs text-indigo-500 font-normal ml-1">(You)</span>}
                                            </td>
                                            <td className="table-cell text-gray-600 dark:text-gray-300">
                                                {user.email}
                                            </td>
                                            <td className="table-cell">{getRoleBadge(user.role)}</td>
                                            <td className="table-cell">
                                                {user.isActive === false ? (
                                                    <span className="badge badge-warning">Inactive</span>
                                                ) : (
                                                    <span className="badge badge-success">Active</span>
                                                )}
                                            </td>
                                            <td className="table-cell text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Edit Button */}
                                                    <button
                                                        onClick={(e) => handleOpenEditModal(user, e)}
                                                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>

                                                    {/* Toggle Active/Deactivate Button */}
                                                    <button
                                                        onClick={(e) => handleToggleActiveStatus(user, e)}
                                                        disabled={isSelf && user.isActive !== false}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            isSelf && user.isActive !== false
                                                                ? 'text-gray-300 cursor-not-allowed dark:text-gray-600'
                                                                : user.isActive === false
                                                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                                                : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                                                        }`}
                                                        title={
                                                            isSelf && user.isActive !== false
                                                                ? 'You cannot deactivate your own account'
                                                                : user.isActive === false
                                                                ? 'Activate User'
                                                                : 'Deactivate User'
                                                        }
                                                    >
                                                        {user.isActive === false ? <UserCheck size={18} /> : <UserX size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="btn-secondary !p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="btn-secondary !p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="card w-full max-w-md p-6 space-y-6 bg-white dark:bg-gray-900 shadow-xl">
                        <div className="flex justify-between items-center border-b border-gray-200/50 dark:border-white/10 pb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New User</h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createFormData.name}
                                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={createFormData.email}
                                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={createFormData.password}
                                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                                    Role
                                </label>
                                <select
                                    value={createFormData.role}
                                    onChange={(e) =>
                                        setCreateFormData({ ...createFormData, role: e.target.value as CreateUserData['role'] })
                                    }
                                    className="input-field"
                                >
                                    <option value="TEAM_MEMBER">Team Member</option>
                                    <option value="MANAGER">Manager</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="btn-secondary"
                                    disabled={submittingCreate}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submittingCreate}>
                                    {submittingCreate ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="card w-full max-w-md p-6 space-y-6 bg-white dark:bg-gray-900 shadow-xl">
                        <div className="flex justify-between items-center border-b border-gray-200/50 dark:border-white/10 pb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit User Profile</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">
                                    Role
                                </label>
                                <select
                                    value={editFormData.role}
                                    onChange={(e) =>
                                        setEditFormData({ ...editFormData, role: e.target.value as UpdateUserData['role'] })
                                    }
                                    className="input-field"
                                >
                                    <option value="TEAM_MEMBER">Team Member</option>
                                    <option value="MANAGER">Manager</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="btn-secondary"
                                    disabled={submittingEdit}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={submittingEdit}>
                                    {submittingEdit ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};