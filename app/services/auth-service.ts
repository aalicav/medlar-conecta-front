import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Função para fazer login
export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
      device_name: navigator.userAgent
    });

    // Armazenar token no localStorage
    localStorage.setItem('token', response.data.token);
    
    // Armazenar dados do usuário no localStorage
    localStorage.setItem('user', JSON.stringify(response.data.user));

    // Redirecionar para o dashboard (usando window.location para força reload completo)
    window.location.href = '/dashboard';

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Função para fazer logout
export const logout = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (token) {
      await axios.post(
        `${API_URL}/api/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Remover dados do localStorage mesmo que a requisição falhe
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirecionar para a página de login
    window.location.href = '/login';
  }
};

// Função para verificar se o usuário está autenticado
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Função para obter o usuário atual
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Função para solicitar recuperação de senha
export const requestPasswordReset = async (email: string) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/password/reset-request`, { email });
    return response.data;
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
};

// Função para validar token de recuperação de senha
export const validateResetToken = async (email: string, token: string, resetCode?: string) => {
  try {
    const payload = resetCode 
      ? { email, reset_code: resetCode }
      : { email, token };
      
    const response = await axios.post(`${API_URL}/api/auth/password/validate-token`, payload);
    return response.data;
  } catch (error) {
    console.error('Token validation error:', error);
    throw error;
  }
};

// Função para redefinir a senha
export const resetPassword = async (
  email: string, 
  password: string, 
  passwordConfirmation: string, 
  token?: string, 
  resetCode?: string
) => {
  try {
    const payload = {
      email,
      password,
      password_confirmation: passwordConfirmation,
      ...(resetCode ? { reset_code: resetCode } : { token })
    };
    
    const response = await axios.post(`${API_URL}/api/auth/password/reset`, payload);
    return response.data;
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

// Configurar o interceptor de axios para incluir o token em todas as requisições
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com erros de autenticação
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se o erro for 401 (Unauthorized) e não estamos na página de login
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Limpar dados de autenticação
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirecionar para a página de login
      window.location.href = '/login?session=expired';
    }
    return Promise.reject(error);
  }
); 