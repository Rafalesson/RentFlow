import api from './api';
import type { Locacao } from '../types';

export const getLocacoes = async (): Promise<Locacao[]> => {
  const response = await api.get('/locacoes');
  return response.data.data;
};

export const getLocacaoById = async (id: number): Promise<Locacao> => {
  const response = await api.get(`/locacoes/${id}`);
  return response.data.data;
};

export const createLocacao = async (locacao: Omit<Locacao, 'id_loc' | 'status' | 'data_reserva' | 'data_retirada' | 'data_devol_real' | 'valor_total'>): Promise<Locacao> => {
  const response = await api.post('/locacoes', locacao);
  return response.data.data;
};

export const updateLocacao = async (id: number, locacao: Partial<Locacao>): Promise<Locacao> => {
  const response = await api.put(`/locacoes/${id}`, locacao);
  return response.data.data;
};

export const deleteLocacao = async (id: number): Promise<void> => {
  await api.delete(`/locacoes/${id}`);
};
