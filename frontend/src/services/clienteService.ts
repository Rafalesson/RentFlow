import api from './api';
import type { Cliente } from '../types';

export const getClientes = async (): Promise<Cliente[]> => {
  const response = await api.get('/clientes');
  return response.data.data;
};

export const getClienteByCpf = async (cpf: string): Promise<Cliente> => {
  const response = await api.get(`/clientes/${cpf}`);
  return response.data.data;
};

export const createCliente = async (cliente: Cliente): Promise<Cliente> => {
  const response = await api.post('/clientes', cliente);
  return response.data.data;
};

export const updateCliente = async (cpf: string, cliente: Omit<Cliente, 'cpf'>): Promise<Cliente> => {
  const response = await api.put(`/clientes/${cpf}`, cliente);
  return response.data.data;
};

export const deleteCliente = async (cpf: string): Promise<void> => {
  await api.delete(`/clientes/${cpf}`);
};
