import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  User,
  MoreVertical,
  Check,
  ShieldAlert
} from 'lucide-react';

const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const AdminUsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [userToToggleStatus, setUserToToggleStatus] = useState(null);
  const [userToChangeRole, setUserToChangeRole] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const toast = useToast();

  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await adminService.getUsers({
        search,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: pagination.limit
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load user directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleStatusConfirm = async () => {
    if (!userToToggleStatus) return;
    const newStatus = userToToggleStatus.status === 'active' ? 'disabled' : 'active';
    setActionLoading(true);
    try {
      await adminService.updateUserStatus(userToToggleStatus._id, newStatus);
      toast.success(`User marked as ${newStatus}`);
      setUserToToggleStatus(null);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleConfirm = async () => {
    if (!userToChangeRole) return;
    const newRole = userToChangeRole.role === 'admin' ? 'user' : 'admin';
    setActionLoading(true);
    try {
      await adminService.updateUserRole(userToChangeRole._id, newRole);
      toast.success(`User role updated to ${newRole}`);
      setUserToChangeRole(null);
      fetchUsers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review accounts, inspect individual quota usage, elevate roles, and toggle account access
        </p>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">All Roles</option>
            <option value="user">Standard Users</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Loading user directory..." />
        </div>
      ) : users.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50/75 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th scope="col" className="py-3.5 pl-6 pr-3">
                  User
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Role
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Storage Used
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Joined
                </th>
                <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isSelf = u._id === currentUser?._id;

                return (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* User info */}
                    <td className="py-4 pl-6 pr-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block truncate">
                            {u.name} {isSelf && <span className="text-[11px] text-primary-600 font-normal">(You)</span>}
                          </span>
                          <span className="text-xs text-slate-400 block truncate">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Badge variant={u.role === 'admin' ? 'purple' : 'primary'} size="sm">
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </td>

                    {/* Storage */}
                    <td className="px-3 py-4 whitespace-nowrap text-xs font-medium text-slate-700">
                      {formatBytes(u.storageUsed || 0)} / {formatBytes(u.storageLimit || 5368709120)}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Badge variant={u.status === 'active' ? 'success' : 'danger'} size="sm">
                        {u.status}
                      </Badge>
                    </td>

                    {/* Created */}
                    <td className="px-3 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-3 pr-6 whitespace-nowrap text-right text-xs">
                      {!isSelf ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setUserToChangeRole(u)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-250 hover:bg-slate-100 text-slate-700 transition"
                            title="Change Role"
                          >
                            {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          </button>
                          <button
                            onClick={() => setUserToToggleStatus(u)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                              u.status === 'active'
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.status === 'active' ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Self Account</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
          No users match the search filter.
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(userToToggleStatus)}
        onClose={() => setUserToToggleStatus(null)}
        onConfirm={handleStatusConfirm}
        isLoading={actionLoading}
        title={userToToggleStatus?.status === 'active' ? 'Disable User Account' : 'Reactivate User Account'}
        message={
          userToToggleStatus?.status === 'active'
            ? `Are you sure you want to disable ${userToToggleStatus?.name} (${userToToggleStatus?.email})? They will immediately be logged out and blocked from logging in or accessing files.`
            : `Reactivate account for ${userToToggleStatus?.name}? They will regain access to their files.`
        }
        confirmText={userToToggleStatus?.status === 'active' ? 'Disable User' : 'Reactivate User'}
        isDanger={userToToggleStatus?.status === 'active'}
      />

      <ConfirmDialog
        isOpen={Boolean(userToChangeRole)}
        onClose={() => setUserToChangeRole(null)}
        onConfirm={handleRoleConfirm}
        isLoading={actionLoading}
        title="Change User Role"
        message={`Are you sure you want to change role for ${userToChangeRole?.name} to ${
          userToChangeRole?.role === 'admin' ? 'Standard User' : 'System Administrator'
        }?`}
        confirmText="Change Role"
        isDanger={false}
      />
    </div>
  );
};

export default AdminUsersPage;
