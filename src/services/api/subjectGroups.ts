import api from './index';

export const subjectGroupsApi = {
  getAll: () => api.get('/subject-groups'),
  create: (data: { name: string; subjects: string[] }) => api.post('/subject-groups', data),
  update: (id: string, data: { name: string; subjects: string[] }) => api.put(`/subject-groups/${id}`, data),
  delete: (id: string) => api.delete(`/subject-groups/${id}`),
};
