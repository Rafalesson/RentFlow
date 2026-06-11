import api from './api';
import type { Categoria, Seguro, Funcionario, Vistoria, Pagamento, CobrancaExtra } from '../types';

// Categorias
export const getCategorias = async (): Promise<Categoria[]> => {
  const response = await api.get('/categorias');
  return response.data.data;
};

export const createCategoria = async (categoria: Omit<Categoria, 'id_cat'>): Promise<Categoria> => {
  const response = await api.post('/categorias', categoria);
  return response.data.data;
};

export const deleteCategoria = async (id: number): Promise<void> => {
  await api.delete(`/categorias/${id}`);
};

// Seguros
export const getSeguros = async (): Promise<Seguro[]> => {
  const response = await api.get('/seguros');
  return response.data.data;
};

export const createSeguro = async (seguro: Omit<Seguro, 'id_seguro'>): Promise<Seguro> => {
  const response = await api.post('/seguros', seguro);
  return response.data.data;
};

export const deleteSeguro = async (id: number): Promise<void> => {
  await api.delete(`/seguros/${id}`);
};

// Funcionários
export const getFuncionarios = async (): Promise<Funcionario[]> => {
  const response = await api.get('/funcionarios');
  return response.data.data;
};

export const createFuncionario = async (funcionario: Omit<Funcionario, 'id_func'>): Promise<Funcionario> => {
  const response = await api.post('/funcionarios', funcionario);
  return response.data.data;
};

export const deleteFuncionario = async (id: number): Promise<void> => {
  await api.delete(`/funcionarios/${id}`);
};

// Vistorias
export const getVistorias = async (): Promise<Vistoria[]> => {
  const response = await api.get('/vistorias');
  return response.data.data;
};

export const createVistoria = async (vistoria: Omit<Vistoria, 'id_vistoria' | 'data_hora'>): Promise<Vistoria> => {
  const response = await api.post('/vistorias', vistoria);
  return response.data.data;
};

// Pagamentos
export const getPagamentos = async (): Promise<Pagamento[]> => {
  const response = await api.get('/pagamentos');
  return response.data.data;
};

export const createPagamento = async (pagamento: Omit<Pagamento, 'id_pagamento' | 'data'>): Promise<Pagamento> => {
  const response = await api.post('/pagamentos', pagamento);
  return response.data.data;
};

// Cobrancas Extras
export const getCobrancasExtrasByLocacao = async (id_loc: number): Promise<CobrancaExtra[]> => {
  const response = await api.get(`/locacoes/${id_loc}/cobrancas`);
  return response.data.data;
};

export const createCobrancaExtra = async (cobranca: Omit<CobrancaExtra, 'id_cobranca'>): Promise<CobrancaExtra> => {
  const response = await api.post('/cobrancas-extras', cobranca);
  return response.data.data;
};
