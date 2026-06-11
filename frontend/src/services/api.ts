import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
});

api.interceptors.request.use((config) => {
  const userJson = localStorage.getItem('rentflow_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.cargo) {
        config.headers['X-User-Role'] = user.cargo.toLowerCase();
        if (user.id_func) {
          config.headers['X-User-Id'] = user.id_func.toString();
        }
      }
    } catch (e) {
      console.error('Erro ao fazer parse do usuário do localStorage', e);
    }
  }
  return config;
});

export default api;
