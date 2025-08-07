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
export const getRoles = async (params?: { 
  search?: string; 
  guard_name?: string;
  page?: number;
  per_page?: number;
}) => {
  const res = await apiClient.get('/roles', { params });
  
  // Se a resposta tem dados paginados, retornar apenas os dados
  if (res.data?.data?.data) {
    return { data: res.data.data.data };
  }
  
  // Se a resposta tem dados diretos
  if (res.data?.data) {
    return { data: res.data.data };
  }
  
  // Fallback
  return { data: [] };
};

// Obter uma role específica
export const getRole = async (id: number) => {
  const res = await apiClient.get(`/roles/${id}`);
  return res.data;
};

// Criar nova role
export const createRole = async (data: { 
  name: string; 
  guard_name?: string;
  permissions?: string[];
}) => {
  const res = await apiClient.post('/roles', data);
  return res.data;
};

// Atualizar role existente
export const updateRole = async (id: number, data: {
  name?: string;
  guard_name?: string;
  permissions?: string[];
}) => {
  const res = await apiClient.put(`/roles/${id}`, data);
  return res.data;
};

// Excluir role
export const deleteRole = async (id: number) => {
  const res = await apiClient.delete(`/roles/${id}`);
  return res.data;
};

// Sincronizar permissões com uma role
export const syncRolePermissions = async (roleId: number, permissions: string[]) => {
  const res = await apiClient.post(`/roles/${roleId}/permissions`, { permissions });
  return res.data;
};

// Obter todas as permissões disponíveis
export const getPermissions = async () => {
  const res = await apiClient.get('/roles/permissions/all');
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