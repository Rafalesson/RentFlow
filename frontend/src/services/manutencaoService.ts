import api from './api';
import type { Manutencao } from '../types';

export const getManutencoes = async (): Promise<Manutencao[]> => {
  const response = await api.get('/manutencoes');
  return response.data.data;
};

export const createManutencao = async (manutencao: Omit<Manutencao, 'id_manut' | 'data_saida_real'>): Promise<Manutencao> => {
  const response = await api.post('/manutencoes', manutencao);
  return response.data.data;
};

export const updateManutencao = async (id: number, manutencao: Partial<Manutencao>): Promise<Manutencao> => {
  const response = await api.put(`/manutencoes/${id}`, manutencao);
  return response.data.data;
};

export const deleteManutencao = async (id: number): Promise<void> => {
  await api.delete(`/manutencoes/${id}`);
};
