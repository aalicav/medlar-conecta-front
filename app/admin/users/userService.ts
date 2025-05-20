import apiClient from '@/services/api-client';

// Lista de usuários com paginação e filtros
export const getUsers = async (params?: { 
  search?: string; 
  role?: string;
  page?: number;
  per_page?: number;
}) => {
  const res = await apiClient.get('/users', { params });
  return res.data;
};

// Obter um usuário específico
export const getUser = async (id: number) => {
  const res = await apiClient.get(`/users/${id}`);
  return res.data;
};

// Criar novo usuário
export const createUser = async (data: any) => {
  const res = await apiClient.post('/users', data);
  return res.data;
};

// Atualizar usuário existente
export const updateUser = async (id: number, data: any) => {
  const res = await apiClient.put(`/users/${id}`, data);
  return res.data;
};

// Excluir usuário
export const deleteUser = async (id: number) => {
  const res = await apiClient.delete(`/users/${id}`);
  return res.data;
};

// Obter todas as roles disponíveis
export const getRoles = async () => {
  const res = await apiClient.get('/roles');
  return res.data;
};

// Obter todas as permissões disponíveis
export const getPermissions = async () => {
  const res = await apiClient.get('/permissions');
  return res.data;
};

// Atualizar roles de um usuário
export const updateUserRoles = async (userId: number, roles: string[]) => {
  const res = await apiClient.put(`/users/${userId}/roles`, { roles });
  return res.data;
};

// Atualizar permissões de um usuário
export const updateUserPermissions = async (userId: number, permissions: string[]) => {
  const res = await apiClient.put(`/users/${userId}/permissions`, { permissions });
  return res.data;
}; 