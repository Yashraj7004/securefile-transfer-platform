import api from './api';

export const shareService = {
  async createShare(data) {
    const res = await api.post('/share', data);
    return res.data;
  },

  async getUserShares() {
    const res = await api.get('/share');
    return res.data;
  },

  async getPublicShareInfo(token) {
    const res = await api.get(`/share/${token}`);
    return res.data;
  },

  async verifyPassword(token, password) {
    const res = await api.post(`/share/${token}/verify`, { password });
    return res.data;
  },

  async downloadSharedFile(token, password = '', fallbackName = 'shared_file') {
    const query = password ? `?password=${encodeURIComponent(password)}` : '';
    const response = await api.get(`/share/${token}/download${query}`, {
      responseType: 'blob'
    });

    let fileName = fallbackName;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (matches && matches[1]) {
        fileName = matches[1].replace(/['"]/g, '');
      }
    }

    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);

    return true;
  },

  async updateShare(id, data) {
    const res = await api.patch(`/share/${id}`, data);
    return res.data;
  },

  async deleteShare(id) {
    const res = await api.delete(`/share/${id}`);
    return res.data;
  }
};
