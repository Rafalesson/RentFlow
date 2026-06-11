import api from './api';
import type { Funcionario } from '../types';

export interface LoginResponse {
  status: string;
  data: Funcionario;
}

export interface SuggestLoginResponse {
  status: string;
  data: {
    suggestion: string;
  };
}

export const login = async (identifier: string, password: string): Promise<Funcionario> => {
  const response = await api.post<LoginResponse>('/auth/login', { identifier, password });
  const user = response.data.data;
  localStorage.setItem('rentflow_user', JSON.stringify(user));
  return user;
};

export const logout = (): void => {
  localStorage.removeItem('rentflow_user');
};

export const updateProfile = async (payload: Partial<Funcionario> & { senha_antiga?: string }): Promise<Funcionario> => {
  const response = await api.put<LoginResponse>('/auth/profile', payload);
  const updatedUser = response.data.data;
  localStorage.setItem('rentflow_user', JSON.stringify(updatedUser));
  return updatedUser;
};

export const getCurrentUser = (): Funcionario | null => {
  const userJson = localStorage.getItem('rentflow_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as Funcionario;
  } catch {
    return null;
  }
};

export const getLoginSuggestion = async (nome: string): Promise<string> => {
  const response = await api.post<SuggestLoginResponse>('/auth/suggest-login', { nome });
  return response.data.data.suggestion;
};
