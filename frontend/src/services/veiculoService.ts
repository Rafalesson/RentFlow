import api from './api';
import type { Veiculo } from '../types';

export const getVeiculos = async (): Promise<Veiculo[]> => {
  const response = await api.get('/veiculos');
  return response.data.data;
};

export const getVeiculoByPlaca = async (placa: string): Promise<Veiculo> => {
  const response = await api.get(`/veiculos/${placa}`);
  return response.data.data;
};

export const createVeiculo = async (veiculo: Veiculo): Promise<Veiculo> => {
  const response = await api.post('/veiculos', veiculo);
  return response.data.data;
};

export const updateVeiculo = async (placa: string, veiculo: Omit<Veiculo, 'placa'>): Promise<Veiculo> => {
  const response = await api.put(`/veiculos/${placa}`, veiculo);
  return response.data.data;
};

export const deleteVeiculo = async (placa: string): Promise<void> => {
  await api.delete(`/veiculos/${placa}`);
};
