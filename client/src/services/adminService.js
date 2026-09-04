import api from './api';

export const adminService = {
  async getSystemStats() {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  async getUsers(params = {}) {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  async updateUserStatus(id, status) {
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    return res.data;
  },

  async updateUserRole(id, role) {
    const res = await api.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },

  async getAllFiles(params = {}) {
    const res = await api.get('/admin/files', { params });
    return res.data;
  },

  async deleteFile(id) {
    const res = await api.delete(`/admin/files/${id}`);
    return res.data;
  }
};
