import api from './api';

export const fileService = {
  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted, progressEvent.loaded, progressEvent.total);
        }
      }
    });
    return res.data;
  },

  async getFiles(params = {}) {
    const res = await api.get('/files', { params });
    return res.data;
  },

  async getFileById(id) {
    const res = await api.get(`/files/${id}`);
    return res.data;
  },

  async downloadFile(id, fallbackName = 'downloaded_file') {
    const response = await api.get(`/files/${id}/download`, {
      responseType: 'blob'
    });

    // Extract filename from Content-Disposition header if available
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

  async deleteFile(id) {
    const res = await api.delete(`/files/${id}`);
    return res.data;
  },

  async getDashboardStats() {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },

  async getDashboardActivity() {
    const res = await api.get('/dashboard/activity');
    return res.data;
  }
};
