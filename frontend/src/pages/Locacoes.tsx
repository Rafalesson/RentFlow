import React, { useState, useEffect } from 'react';
import { getLocacoes, createLocacao, updateLocacao, deleteLocacao } from '../services/locacaoService';
import { getClientes } from '../services/clienteService';
import { getVeiculos, updateVeiculo } from '../services/veiculoService';
import { 
  getSeguros, 
  getFuncionarios, 
  createVistoria, 
  createPagamento, 
  createCobrancaExtra,
  getVistorias,
  getPagamentos,
  getCategorias
} from '../services/auxService';
import { getCurrentUser } from '../services/authService';
import type { Locacao, Cliente, Veiculo, Seguro, Funcionario, Vistoria, Pagamento, Categoria } from '../types';

const formatDateSafe = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  if (dateStr.includes('T') && dateStr.includes(':')) {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

const Locacoes: React.FC = () => {
  const currentUser = getCurrentUser();
  const isGerente = currentUser?.cargo === 'gerente';

  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedLocDetails, setSelectedLocDetails] = useState<Locacao | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<number | null>(null);

  // Form toggles
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [activeLoc, setActiveLoc] = useState<Locacao | null>(null);

  // checkout form state
  const [checkoutData, setCheckoutData] = useState({
    id_func_autoriza: 0,
    data_retirada: new Date().toISOString().slice(0, 16),
    km_saida: 0,
    nivel_combustivel: 100,
    observacoes: ''
  });

  // checkin form state
  const [checkinData, setCheckinData] = useState({
    data_devol_real: new Date().toISOString().slice(0, 16),
    km_retorno: 0,
    nivel_combustivel: 100,
    possuiAvaria: false,
    avariaDesc: '',
    avariaValor: '0',
    cobrancaCombustivel: '0',
    cobrancaCombustivelDesc: '',
    observacoes: '',
    formaPagamento: 'pix' as 'dinheiro' | 'credito' | 'debito' | 'pix'
  });

  // Wizard reservation states
  const [wizardStep, setWizardStep] = useState(1);
  const [reserveData, setReserveData] = useState({
    cpf_cliente: '',
    placa_veiculo: '',
    id_seguro: 0,
    data_devol_prevista: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lData, cData, vData, sData, fData, visData, pData, catData] = await Promise.all([
        getLocacoes(),
        getClientes(),
        getVeiculos(),
        getSeguros(),
        getFuncionarios(),
        getVistorias(),
        getPagamentos(),
        getCategorias()
      ]);
      setLocacoes(lData);
      setClientes(cData);
      setVeiculos(vData);
      setSeguros(sData);
      setFuncionarios(fData);
      setVistorias(visData);
      setPagamentos(pData);
      setCategorias(catData);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao carregar dados de locações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handle keyboard ESC to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLocDetails(null);
        setShowCheckoutModal(false);
        setShowCheckinModal(false);
        setDeleteConfirmTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Wizard calculations & handlers
  const handleOpenReserve = () => {
    setError(null);
    setSuccess(null);
    setWizardStep(1);
    setReserveData({
      cpf_cliente: '',
      placa_veiculo: '',
      id_seguro: seguros.length > 0 ? seguros[0].id_seguro : 0,
      data_devol_prevista: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    });
    setShowCreateWizard(true);
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentUser) return;

    if (!reserveData.cpf_cliente || !reserveData.placa_veiculo || !reserveData.id_seguro || !reserveData.data_devol_prevista) {
      setError('Por favor, preencha todos os campos do agendamento.');
      return;
    }

    // Verify if client is inadimplente
    const client = clientes.find(c => c.cpf === reserveData.cpf_cliente);
    if (client?.inadimplente) {
      setError('Este cliente está marcado como INADIMPLENTE. Reservas bloqueadas.');
      return;
    }

    try {
      await createLocacao({
        cpf_cliente: reserveData.cpf_cliente,
        placa_veiculo: reserveData.placa_veiculo,
        id_func_registro: currentUser.id_func,
        id_func_autoriza: null,
        id_seguro: Number(reserveData.id_seguro),
        data_devol_prevista: new Date(reserveData.data_devol_prevista).toISOString()
      });

      setSuccess('Reserva criada com sucesso!');
      setShowCreateWizard(false);
      loadAllData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao criar reserva.');
    }
  };

  // Checkout (Retirada) Handlers
  const handleOpenCheckout = (loc: Locacao) => {
    setError(null);
    setSuccess(null);
    setActiveLoc(loc);
    const vehicle = veiculos.find(v => v.placa === loc.placa_veiculo);
    setCheckoutData({
      id_func_autoriza: currentUser?.id_func || 0,
      data_retirada: new Date().toISOString().slice(0, 16),
      km_saida: vehicle ? Number(vehicle.km_atual) : 0,
      nivel_combustivel: vehicle ? Number(vehicle.nivel_combustivel) : 100,
      observacoes: ''
    });
    setShowCheckoutModal(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!activeLoc) return;

    const vehicle = veiculos.find(v => v.placa === activeLoc.placa_veiculo);
    if (vehicle && checkoutData.km_saida < Number(vehicle.km_atual)) {
      setError(`O KM de saída não pode ser menor que o KM atual do veículo (${vehicle.km_atual} KM).`);
      return;
    }

    try {
      // 1. Atualizar Locação para ativa (deve vir primeiro para passar na validação de veículo livre no backend)
      await updateLocacao(activeLoc.id_loc, {
        ...activeLoc,
        status: 'ativa',
        data_retirada: new Date(checkoutData.data_retirada).toISOString(),
        id_func_autoriza: checkoutData.id_func_autoriza
      });

      // 2. Atualizar status do veículo para locado
      if (vehicle) {
        await updateVeiculo(vehicle.placa, {
          ...vehicle,
          km_atual: Number(checkoutData.km_saida),
          nivel_combustivel: Number(checkoutData.nivel_combustivel),
          status: 'locado'
        });
      }

      // 3. Registrar Vistoria de Saída
      await createVistoria({
        id_loc: activeLoc.id_loc,
        id_func: checkoutData.id_func_autoriza,
        tipo: 'retirada',
        km: Number(checkoutData.km_saida),
        nivel_combustivel: Number(checkoutData.nivel_combustivel),
        observacoes: checkoutData.observacoes || 'Vistoria de retirada regular.'
      });

      setSuccess(`Check-out da locação #${activeLoc.id_loc} registrado com sucesso! Veículo em uso.`);
      setShowCheckoutModal(false);
      loadAllData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao registrar check-out.');
    }
  };

  // Checkin (Devolução) Handlers
  const handleOpenCheckin = (loc: Locacao) => {
    setError(null);
    setSuccess(null);
    setActiveLoc(loc);

    const vistRet = vistorias.find(v => v.id_loc === loc.id_loc && v.tipo === 'retirada');
    const vehicle = veiculos.find(v => v.placa === loc.placa_veiculo);

    setCheckinData({
      data_devol_real: new Date().toISOString().slice(0, 16),
      km_retorno: vehicle ? Number(vehicle.km_atual) : (vistRet ? Number(vistRet.km) : 0),
      nivel_combustivel: vehicle ? Number(vehicle.nivel_combustivel) : 100,
      possuiAvaria: false,
      avariaDesc: '',
      avariaValor: '0',
      cobrancaCombustivel: '0',
      cobrancaCombustivelDesc: '',
      observacoes: '',
      formaPagamento: 'pix'
    });
    setShowCheckinModal(true);
  };

  // Billing preview helper
  const getBillingPreview = () => {
    if (!activeLoc) return { days: 0, subtotal: 0, total: 0, diariaVeiculo: 0, diariaSeguro: 0, extra: 0 };

    const insurance = seguros.find(s => s.id_seguro === activeLoc.id_seguro);
    const vehicle = veiculos.find(v => v.placa === activeLoc.placa_veiculo);
    
    // Find category details via vehicle and loaded categories list
    const category = vehicle ? categorias.find(c => c.id_cat === vehicle.id_cat) : null;
    const diariaVeiculo = category ? Number(category.valor_diaria) : 120;

    const tStart = activeLoc.data_retirada ? new Date(activeLoc.data_retirada).getTime() : new Date(activeLoc.data_reserva).getTime();
    const tEnd = new Date(checkinData.data_devol_real).getTime();
    const diff = Math.max(0, tEnd - tStart);
    const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));

    const diariaSeguro = insurance ? Number(insurance.valor_diario) : 0;

    const subtotal = days * (diariaVeiculo + diariaSeguro);
    const extra = (checkinData.possuiAvaria ? Number(checkinData.avariaValor) : 0) + Number(checkinData.cobrancaCombustivel);
    const total = subtotal + extra;

    return {
      days,
      diariaVeiculo,
      diariaSeguro,
      subtotal,
      extra,
      total
    };
  };

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!activeLoc || !currentUser) return;

    const vistRet = vistorias.find(v => v.id_loc === activeLoc.id_loc && v.tipo === 'retirada');
    if (vistRet && checkinData.km_retorno < Number(vistRet.km)) {
      setError(`O KM de retorno não pode ser menor que o KM de saída (${vistRet.km} KM).`);
      return;
    }

    const billing = getBillingPreview();

    try {
      // 1. Criar Vistoria de Devolução (Check-in)
      // Format observations to encode avaria if present
      let obs = checkinData.observacoes || 'Vistoria de devolução regular.';
      if (checkinData.possuiAvaria) {
        obs += ` [Avaria: R$ ${parseFloat(checkinData.avariaValor).toFixed(2)} - ${checkinData.avariaDesc || 'Dano Geral'}]`;
      }

      const vistDev = await createVistoria({
        id_loc: activeLoc.id_loc,
        id_func: currentUser.id_func,
        tipo: 'devolucao',
        km: Number(checkinData.km_retorno),
        nivel_combustivel: Number(checkinData.nivel_combustivel),
        observacoes: obs
      });

      // 2. Registrar Cobrança Extra se houver avaria
      if (checkinData.possuiAvaria) {
        await createCobrancaExtra({
          id_loc: activeLoc.id_loc,
          id_vistoria: vistDev.id_vistoria,
          tipo: 'avaria',
          descricao: checkinData.avariaDesc || 'Danos de Avaria na Vistoria',
          valor: Number(checkinData.avariaValor)
        });
      }

      // 3. Registrar Cobrança Extra se houver custo de combustível
      if (Number(checkinData.cobrancaCombustivel) > 0) {
        await createCobrancaExtra({
          id_loc: activeLoc.id_loc,
          id_vistoria: vistDev.id_vistoria,
          tipo: 'combustivel',
          descricao: checkinData.cobrancaCombustivelDesc || 'Taxa de Reabastecimento',
          valor: Number(checkinData.cobrancaCombustivel)
        });
      }

      // 4. Registrar Pagamento completo
      await createPagamento({
        id_loc: activeLoc.id_loc,
        forma_pagamento: checkinData.formaPagamento,
        valor: billing.total
      });

      // 5. Atualizar veículo de volta para disponivel
      const vehicle = veiculos.find(v => v.placa === activeLoc.placa_veiculo);
      if (vehicle) {
        await updateVeiculo(vehicle.placa, {
          ...vehicle,
          km_atual: Number(checkinData.km_retorno),
          nivel_combustivel: Number(checkinData.nivel_combustivel),
          status: 'disponivel'
        });
      }

      // 6. Atualizar Locação para encerrada
      await updateLocacao(activeLoc.id_loc, {
        ...activeLoc,
        status: 'encerrada',
        data_devol_real: new Date(checkinData.data_devol_real).toISOString(),
        valor_total: billing.total
      });

      setSuccess(`Check-in da locação #${activeLoc.id_loc} concluído e pagamento de R$ ${billing.total.toFixed(2)} registrado!`);
      setShowCheckinModal(false);
      loadAllData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao registrar devolução.');
    }
  };

  const handleCancelLocacao = async (loc: Locacao) => {
    if (!window.confirm(`Deseja realmente cancelar a reserva da locação #${loc.id_loc}?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await updateLocacao(loc.id_loc, {
        ...loc,
        status: 'cancelada'
      });
      setSuccess(`Reserva #${loc.id_loc} cancelada com sucesso.`);
      loadAllData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao cancelar reserva.');
    }
  };

  const handleDeleteLocacao = (id: number) => {
    setDeleteConfirmTarget(id);
  };

  const handleDeleteConfirm = async (id: number) => {
    setDeleteConfirmTarget(null);
    setError(null);
    setSuccess(null);
    try {
      await deleteLocacao(id);
      setSuccess('Locação excluída permanentemente.');
      loadAllData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao excluir locação.');
    }
  };

  // Helper text getters
  const getClientName = (cpf: string) => {
    const c = clientes.find(cli => cli.cpf === cpf);
    return c ? c.nome : cpf;
  };

  const getVehicleName = (placa: string) => {
    const v = veiculos.find(vei => vei.placa === placa);
    return v ? `${v.marca} ${v.modelo}` : placa;
  };



  const filteredLocacoes = locacoes.filter(l => {
    const clientName = getClientName(l.cpf_cliente).toLowerCase();
    const vehicleName = getVehicleName(l.placa_veiculo).toLowerCase();
    const matchesSearch = 
      l.cpf_cliente.includes(search) ||
      l.placa_veiculo.toLowerCase().includes(search.toLowerCase()) ||
      clientName.includes(search.toLowerCase()) ||
      vehicleName.includes(search.toLowerCase()) ||
      `#${l.id_loc}`.includes(search);

    const matchesStatus = statusFilter === 'todos' || l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="fw-bold text-dark mb-1 page-title">Locações & Reservas</h1>
          <p className="text-muted page-subtitle mb-0">Gerencie contratos, retiradas e devoluções</p>
        </div>
        {!showCreateWizard && (
          <button className="btn btn-gradient py-2 px-3 px-md-4 rounded-3 d-flex align-items-center" onClick={handleOpenReserve} title="Nova Reserva">
            <i className="bi bi-calendar-plus-fill fs-5"></i>
            <span className="d-none d-md-inline ms-2">Nova Reserva</span>
          </button>
        )}
      </div>

      {/* Alerts */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show card-premium border-success border-opacity-25" role="alert">
          <i className="bi bi-check-circle-fill me-2 text-success"></i>
          <strong>Sucesso:</strong> {success}
          <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show card-premium border-danger border-opacity-25" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
          <strong>Erro:</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {showCreateWizard ? (
        /* WIZARD DE RESERVA */
        <div className="row justify-content-center">
          <div className="col-xl-9 col-lg-10">
            <div className="card card-premium p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
                <h3 className="fw-bold m-0">Criar Nova Reserva</h3>
                <span className="badge bg-primary px-3 py-2">Passo {wizardStep} de 3</span>
              </div>

              <form onSubmit={handleReserveSubmit}>
                {wizardStep === 1 && (
                  <div className="fade-in">
                    <h5 className="fw-semibold text-primary mb-3"><i className="bi bi-person me-2"></i>Passo 1: Selecionar Cliente</h5>
                    <div className="mb-4">
                      <label className="form-label fw-bold">Selecione o Cliente (Regularizado)</label>
                      <select 
                        className="form-select py-2.5" 
                        value={reserveData.cpf_cliente}
                        onChange={(e) => setReserveData(prev => ({ ...prev, cpf_cliente: e.target.value }))}
                        required
                      >
                        <option value="">Selecione um cliente...</option>
                        {clientes.map(c => (
                          <option key={c.cpf} value={c.cpf}>
                            {c.nome} - CPF: {c.cpf} {c.inadimplente ? '⚠️ (INADIMPLENTE - BLOQUEADO)' : ''}
                          </option>
                        ))}
                      </select>
                      {reserveData.cpf_cliente && clientes.find(c => c.cpf === reserveData.cpf_cliente)?.inadimplente && (
                        <div className="text-danger fs-8 mt-1.5 fw-semibold">
                          <i className="bi bi-exclamation-octagon-fill"></i> Clientes inadimplentes possuem reservas suspensas pelo sistema relacional.
                        </div>
                      )}
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                      <button 
                        type="button" 
                        className="btn btn-primary px-4 py-2" 
                        onClick={() => setWizardStep(2)}
                        disabled={!reserveData.cpf_cliente || clientes.find(c => c.cpf === reserveData.cpf_cliente)?.inadimplente}
                      >
                        Avançar <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="fade-in">
                    <h5 className="fw-semibold text-primary mb-3"><i className="bi bi-car-front me-2"></i>Passo 2: Selecionar Veículo Disponível</h5>
                    <div className="mb-4">
                      <label className="form-label fw-bold">Veículos Disponíveis no Pátio</label>
                      <select 
                        className="form-select py-2.5"
                        value={reserveData.placa_veiculo}
                        onChange={(e) => setReserveData(prev => ({ ...prev, placa_veiculo: e.target.value }))}
                        required
                      >
                        <option value="">Selecione um veículo...</option>
                        {veiculos.filter(v => v.status === 'disponivel').map(v => (
                          <option key={v.placa} value={v.placa}>
                            {v.marca} {v.modelo} | Placa: {v.placa} | KM: {v.km_atual} | Comb.: {v.nivel_combustivel}%
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="d-flex justify-content-between mt-4">
                      <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => setWizardStep(1)}>
                        <i className="bi bi-arrow-left me-1"></i> Voltar
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-primary px-4 py-2" 
                        onClick={() => setWizardStep(3)}
                        disabled={!reserveData.placa_veiculo}
                      >
                        Avançar <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="fade-in">
                    <h5 className="fw-semibold text-primary mb-3"><i className="bi bi-shield-check me-2"></i>Passo 3: Seguro & Período</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Opção de Seguro</label>
                        <select 
                          className="form-select py-2"
                          value={reserveData.id_seguro}
                          onChange={(e) => setReserveData(prev => ({ ...prev, id_seguro: Number(e.target.value) }))}
                          required
                        >
                          {seguros.map(s => (
                            <option key={s.id_seguro} value={s.id_seguro}>
                              {s.nome} (Diário: R$ {parseFloat(String(s.valor_diario)).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">Data de Devolução Prevista</label>
                        <input 
                          type="datetime-local" 
                          className="form-control"
                          value={reserveData.data_devol_prevista}
                          onChange={(e) => setReserveData(prev => ({ ...prev, data_devol_prevista: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="d-flex justify-content-between mt-5 pt-3 border-top">
                      <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => setWizardStep(2)}>
                        <i className="bi bi-arrow-left me-1"></i> Voltar
                      </button>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-light px-4 py-2" onClick={() => setShowCreateWizard(false)}>
                          Cancelar
                        </button>
                        <button type="submit" className="btn btn-gradient px-5 py-2">
                          Criar Agendamento <i className="bi bi-calendar-check ms-1"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* LISTAGEM DE LOCAÇÕES */
        <>
          {/* Filters Bar */}
          <div className="card card-premium p-4 mb-4">
            <div className="row g-3">
              <div className="col-md-5">
                <label className="form-label fw-semibold fs-7 text-muted">Pesquisar</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Buscar por código, placa, nome do cliente ou CPF..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold fs-7 text-muted">Filtrar por Status</label>
                <select 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="todos">Todos os Status</option>
                  <option value="reservada">Reservada (Aguardando Retirada)</option>
                  <option value="ativa">Ativa (Veículo em Uso)</option>
                  <option value="encerrada">Encerrada (Concluída)</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end justify-content-end">
                <button className="btn btn-outline-secondary px-3 py-2 w-100" onClick={loadAllData} disabled={loading}>
                  <i className="bi bi-arrow-clockwise me-1"></i> Atualizar Tabela
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card card-premium p-4">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
              </div>
            ) : filteredLocacoes.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-calendar-x fs-1"></i>
                <p className="mt-2">Nenhuma locação correspondente encontrada.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Código</th>
                      <th>Cliente (CPF)</th>
                      <th>Veículo (Placa)</th>
                      <th>Reserva / Retirada</th>
                      <th>Prev. Devolução</th>
                      <th>Status</th>
                      <th className="text-end">Ações Operacionais</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocacoes.map((l) => (
                      <tr key={l.id_loc} className="align-middle cursor-pointer" onClick={() => setSelectedLocDetails(l)}>
                        <td><code>#{l.id_loc}</code></td>
                        <td>
                          <span className="fw-bold">{getClientName(l.cpf_cliente)}</span>
                          <div className="fs-8 text-muted">CPF: <code>{l.cpf_cliente}</code></div>
                        </td>
                        <td>
                          <span className="fw-bold">{getVehicleName(l.placa_veiculo)}</span>
                          <div className="fs-8 text-muted">Placa: <code>{l.placa_veiculo}</code></div>
                        </td>
                        <td>
                          <div className="fs-7">Res: {formatDateSafe(l.data_reserva)}</div>
                          {l.data_retirada && (
                            <div className="fs-8 text-success fw-semibold">Ret: {formatDateSafe(l.data_retirada)}</div>
                          )}
                        </td>
                        <td>
                          <div className="fs-7">{formatDateSafe(l.data_devol_prevista)}</div>
                          {l.data_devol_real && (
                            <div className="fs-8 text-secondary">Real: {formatDateSafe(l.data_devol_real)}</div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            l.status === 'ativa' ? 'bg-success' :
                            l.status === 'reservada' ? 'bg-warning text-dark' :
                            l.status === 'encerrada' ? 'bg-secondary' : 'bg-danger'
                          }`}>
                            {l.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          {l.status === 'reservada' && (
                            <div className="d-inline-flex gap-1">
                              <button 
                                className="btn btn-outline-success btn-sm px-3"
                                onClick={() => handleOpenCheckout(l)}
                              >
                                <i className="bi bi-key me-1"></i> Retirada (Check-out)
                              </button>
                              <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleCancelLocacao(l)}
                                title="Cancelar Reserva"
                              >
                                <i className="bi bi-x-circle"></i>
                              </button>
                            </div>
                          )}
                          {l.status === 'ativa' && (
                            <button 
                              className="btn btn-success btn-sm px-3"
                              onClick={() => handleOpenCheckin(l)}
                            >
                              <i className="bi bi-arrow-down-left-circle me-1"></i> Retorno (Check-in)
                            </button>
                          )}
                          {(l.status === 'encerrada' || l.status === 'cancelada') && isGerente && (
                            <button 
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteLocacao(l.id_loc)}
                              title="Excluir Registro"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL CHECKOUT (RETIRADA) */}
      {showCheckoutModal && activeLoc && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-premium border border-light">
              <div className="modal-header border-bottom border-light">
                <h5 className="modal-title fw-bold text-primary">Registrar Retirada (Locação #{activeLoc.id_loc})</h5>
                <button type="button" className="btn-close" onClick={() => setShowCheckoutModal(false)}></button>
              </div>
              <form onSubmit={handleCheckoutSubmit}>
                <div className="modal-body py-3">
                  <div className="alert alert-info py-2 fs-7">
                    Veículo: <strong>{getVehicleName(activeLoc.placa_veiculo)}</strong> (Placa: <code>{activeLoc.placa_veiculo}</code>)
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-bold">Funcionário Autorizando</label>
                    <input 
                      type="text" 
                      className="form-control bg-light" 
                      value={currentUser ? `${currentUser.nome} (${currentUser.cargo.toUpperCase()})` : ''} 
                      disabled 
                      style={{ cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Data/Hora da Retirada</label>
                    <input 
                      type="datetime-local" 
                      className="form-control"
                      value={checkoutData.data_retirada}
                      onChange={(e) => setCheckoutData(prev => ({ ...prev, data_retirada: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">KM de Saída</label>
                      <input 
                        type="number" 
                        className="form-control"
                        min={0}
                        value={checkoutData.km_saida}
                        onChange={(e) => setCheckoutData(prev => ({ ...prev, km_saida: Number(e.target.value) }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Nível Combustível (%)</label>
                      <input 
                        type="number" 
                        className="form-control"
                        min={0}
                        max={100}
                        value={checkoutData.nivel_combustivel}
                        onChange={(e) => setCheckoutData(prev => ({ ...prev, nivel_combustivel: Number(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Observações da Vistoria</label>
                    <textarea 
                      className="form-control"
                      rows={2}
                      placeholder="Algum arranhão, detalhes do tanque de combustível, etc..."
                      value={checkoutData.observacoes}
                      onChange={(e) => setCheckoutData(prev => ({ ...prev, observacoes: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top border-light gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCheckoutModal(false)}>Voltar</button>
                  <button type="submit" className="btn btn-success px-4">Liberar Veículo <i className="bi bi-key ms-1"></i></button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHECKIN (DEVOLUÇÃO & PAGAMENTO) */}
      {showCheckinModal && activeLoc && (() => {
        const billing = getBillingPreview();
        const vistRet = vistorias.find(v => v.id_loc === activeLoc.id_loc && v.tipo === 'retirada');
        
        return (
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content card-premium border border-light">
                <div className="modal-header border-bottom border-light">
                  <h5 className="modal-title fw-bold text-primary">Registrar Retorno (Locação #{activeLoc.id_loc})</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCheckinModal(false)}></button>
                </div>
                <form onSubmit={handleCheckinSubmit}>
                  <div className="modal-body py-3">
                    <div className="row g-4">
                      {/* Vistoria Input Section */}
                      <div className="col-md-6 border-end">
                        <h6 className="fw-bold text-primary mb-3"><i className="bi bi-clipboard-check me-2"></i>1. Vistoria de Devolução</h6>
                        
                        <div className="mb-3">
                          <label className="form-label fw-bold">Data/Hora de Devolução Real</label>
                          <input 
                            type="datetime-local" 
                            className="form-control"
                            value={checkinData.data_devol_real}
                            onChange={(e) => setCheckinData(prev => ({ ...prev, data_devol_real: e.target.value }))}
                            required
                          />
                        </div>

                        <div className="row g-3 mb-3">
                          <div className="col-6">
                            <label className="form-label fw-bold">KM de Retorno</label>
                            <input 
                              type="number" 
                              className="form-control"
                              min={vistRet ? Number(vistRet.km) : 0}
                              value={checkinData.km_retorno}
                              onChange={(e) => setCheckinData(prev => ({ ...prev, km_retorno: Number(e.target.value) }))}
                              required
                            />
                            {vistRet && <span className="fs-9 text-muted">Saída: {vistRet.km} KM</span>}
                          </div>
                          <div className="col-6">
                            <label className="form-label fw-bold">Combustível (%)</label>
                            <input 
                              type="number" 
                              className="form-control"
                              min={0}
                              max={100}
                              value={checkinData.nivel_combustivel}
                              onChange={(e) => setCheckinData(prev => ({ ...prev, nivel_combustivel: Number(e.target.value) }))}
                              required
                            />
                          </div>
                        </div>

                        {/* Avarias Switch */}
                        <div className="form-check form-switch p-2 bg-light border rounded mb-3 ps-5">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="possuiAvaria"
                            checked={checkinData.possuiAvaria}
                            onChange={(e) => setCheckinData(prev => ({ ...prev, possuiAvaria: e.target.checked }))}
                          />
                          <label className="form-check-label fw-bold text-danger" htmlFor="possuiAvaria">Detectou Avarias / Danos?</label>
                        </div>

                        {checkinData.possuiAvaria && (
                          <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded mb-3">
                            <div className="mb-2">
                              <label className="form-label fw-bold text-danger fs-8">Valor da Avaria (R$)</label>
                              <input 
                                type="number" 
                                className="form-control form-control-sm"
                                min={0}
                                value={checkinData.avariaValor}
                                onChange={(e) => setCheckinData(prev => ({ ...prev, avariaValor: e.target.value }))}
                                required
                              />
                            </div>
                            <div>
                              <label className="form-label fw-bold text-danger fs-8">Descrição da Avaria</label>
                              <input 
                                type="text" 
                                className="form-control form-control-sm"
                                placeholder="Arranhão na porta, quebra de retrovisor..."
                                value={checkinData.avariaDesc}
                                onChange={(e) => setCheckinData(prev => ({ ...prev, avariaDesc: e.target.value }))}
                                required
                              />
                            </div>
                          </div>
                        )}

                        <div className="mb-3">
                          <label className="form-label fw-bold">Taxa Combustível Extra (R$ - Opcional)</label>
                          <input 
                            type="number"
                            className="form-control form-control-sm"
                            min={0}
                            value={checkinData.cobrancaCombustivel}
                            onChange={(e) => setCheckinData(prev => ({ ...prev, cobrancaCombustivel: e.target.value }))}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-bold">Observações Finais</label>
                          <textarea 
                            className="form-control"
                            rows={2}
                            value={checkinData.observacoes}
                            onChange={(e) => setCheckinData(prev => ({ ...prev, observacoes: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Billing Breakdown & Payment */}
                      <div className="col-md-6">
                        <h6 className="fw-bold text-primary mb-3"><i className="bi bi-cash-coin me-2"></i>2. Faturamento & Pagamento</h6>
                        
                        <div className="bg-light p-3 rounded border mb-4 fs-7">
                          <div className="d-flex justify-content-between mb-1.5">
                            <span>Período Total:</span>
                            <span className="fw-semibold">{billing.days} diárias</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1.5">
                            <span>Diárias do Carro (padrão):</span>
                            <span>R$ {(billing.days * billing.diariaVeiculo).toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1.5">
                            <span>Diárias do Seguro:</span>
                            <span>R$ {(billing.days * billing.diariaSeguro).toFixed(2)}</span>
                          </div>
                          {billing.extra > 0 && (
                            <div className="d-flex justify-content-between text-danger mb-1.5">
                              <span>Cobranças Extras:</span>
                              <span>+ R$ {billing.extra.toFixed(2)}</span>
                            </div>
                          )}
                          <hr className="my-2" />
                          <div className="d-flex justify-content-between fw-bold text-primary fs-6">
                            <span>Valor Total Faturado:</span>
                            <span>R$ {billing.total.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-bold text-primary"><i className="bi bi-wallet2 me-1"></i>Forma de Pagamento</label>
                          <select 
                            className="form-select py-2"
                            value={checkinData.formaPagamento}
                            onChange={(e: any) => setCheckinData(prev => ({ ...prev, formaPagamento: e.target.value }))}
                            required
                          >
                            <option value="pix">PIX</option>
                            <option value="credito">Cartão de Crédito</option>
                            <option value="debito">Cartão de Débito</option>
                            <option value="dinheiro">Dinheiro em Espécie</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top border-light gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCheckinModal(false)}>Voltar</button>
                    <button type="submit" className="btn btn-success px-5 py-2.5 rounded-3">Registrar Check-in & Fechar Conta <i className="bi bi-check-circle ms-1"></i></button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DETAIL MODAL */}
      {selectedLocDetails && (() => {
        const l = selectedLocDetails;
        const client = clientes.find(c => c.cpf === l.cpf_cliente);
        const vehicle = veiculos.find(v => v.placa === l.placa_veiculo);
        const insurance = seguros.find(s => s.id_seguro === l.id_seguro);
        
        // Operadores
        const opRegistro = funcionarios.find(f => f.id_func === l.id_func_registro);
        const opAutoriza = funcionarios.find(f => f.id_func === l.id_func_autoriza);
        
        // Vistorias
        const vistRetirada = vistorias.find(v => v.id_loc === l.id_loc && v.tipo === 'retirada');
        const vistDevolucao = vistorias.find(v => v.id_loc === l.id_loc && v.tipo === 'devolucao');
        const opDevolucao = vistDevolucao ? funcionarios.find(f => f.id_func === vistDevolucao.id_func) : null;
        
        // Pagamento
        const payment = pagamentos.find(p => p.id_loc === l.id_loc);

        // Faturamento/Breakdown
        const dataRet = l.data_retirada ? new Date(l.data_retirada) : null;
        const dataDev = l.data_devol_real ? new Date(l.data_devol_real) : null;
        let diasLocados = 0;
        if (dataRet && dataDev) {
          const diffTime = Math.abs(dataDev.getTime() - dataRet.getTime());
          diasLocados = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        const diariaVeiculo = 120;
        const diariaSeguro = insurance ? Number(insurance.valor_diario) : 0;

        return (
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }} onClick={() => setSelectedLocDetails(null)}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content card-premium border border-light">
                <div className="modal-header border-bottom border-light px-4 py-3">
                  <div>
                    <h5 className="modal-title fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark-text"></i> Detalhes da Locação #{l.id_loc}
                    </h5>
                    <span className="text-muted fs-8">Registrado em {formatDateSafe(l.data_reserva)}</span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedLocDetails(null)}></button>
                </div>
                
                <div className="modal-body px-4 py-3">
                  <div className="row g-4">
                    {/* Coluna Esquerda: Cliente, Veículo e Seguro */}
                    <div className="col-md-6">
                      {/* Cliente */}
                      <div className="mb-4">
                        <h6 className="fw-bold text-primary mb-2 pb-1 border-bottom d-flex align-items-center">
                          <i className="bi bi-person me-2"></i> Dados do Cliente
                        </h6>
                        {client ? (
                          <div className="fs-7">
                            <div className="mb-1"><strong>Nome:</strong> {client.nome}</div>
                            <div className="mb-1"><strong>CPF:</strong> {client.cpf}</div>
                            <div className="mb-1"><strong>E-mail:</strong> {client.email}</div>
                            <div className="mb-1">
                              <strong>CNH:</strong> {client.cnh_numero} (Cat. {client.cnh_categoria})
                            </div>
                            <div className="mb-1">
                              <strong>Validade CNH:</strong> {formatDateSafe(client.cnh_validade)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted fs-7">—</div>
                        )}
                      </div>

                      {/* Veículo */}
                      <div className="mb-4">
                        <h6 className="fw-bold text-primary mb-2 pb-1 border-bottom d-flex align-items-center">
                          <i className="bi bi-car-front me-2"></i> Veículo e Categoria
                        </h6>
                        {vehicle ? (
                          <div className="fs-7">
                            <div className="mb-1"><strong>Marca/Modelo:</strong> {vehicle.marca} {vehicle.modelo}</div>
                            <div className="mb-1"><strong>Placa:</strong> <code>{vehicle.placa}</code></div>
                            <div className="mb-1"><strong>Cor/Ano:</strong> {vehicle.cor} / {vehicle.ano_fabricacao}</div>
                          </div>
                        ) : (
                          <div className="text-muted fs-7">—</div>
                        )}
                      </div>

                      {/* Seguro */}
                      <div>
                        <h6 className="fw-bold text-primary mb-2 pb-1 border-bottom d-flex align-items-center">
                          <i className="bi bi-shield-check me-2"></i> Seguro Contratado
                        </h6>
                        {insurance ? (
                          <div className="fs-7">
                            <div className="mb-1"><strong>Nome:</strong> {insurance.nome}</div>
                            <div className="mb-1"><strong>Valor Diário:</strong> R$ {diariaSeguro.toFixed(2)}</div>
                            <div className="text-muted fs-8"><strong>Cobertura:</strong> {insurance.descricao_cobertura}</div>
                          </div>
                        ) : (
                          <div className="text-muted fs-7">—</div>
                        )}
                      </div>
                    </div>

                    {/* Coluna Direita: Fluxo Operacional e Financeiro */}
                    <div className="col-md-6">
                      {/* Fluxo Operacional */}
                      <div className="mb-4">
                        <h6 className="fw-bold text-primary mb-2 pb-1 border-bottom d-flex align-items-center">
                          <i className="bi bi-bezier2 me-2"></i> Fluxo de Operação
                        </h6>
                        <div className="timeline-flow fs-7">
                          {/* Abertura */}
                          <div className="mb-2 border-start border-primary border-2 ps-3 position-relative">
                            <span className="fw-semibold">1. Reserva Inicial</span>
                            <div className="fs-8 text-muted">
                              Realizada em {formatDateSafe(l.data_reserva)} por:
                              <br />
                              <i className="bi bi-person-badge me-1"></i> {opRegistro ? opRegistro.nome : `Funcionário #${l.id_func_registro}`}
                            </div>
                          </div>

                          {/* Retirada */}
                          <div className={`mb-2 border-start ${l.data_retirada ? 'border-primary' : 'border-light'} border-2 ps-3`}>
                            <span className="fw-semibold">2. Retirada do Veículo</span>
                            {l.data_retirada ? (
                              <div className="fs-8 text-muted">
                                Realizada em {formatDateSafe(l.data_retirada)} por:
                                <br />
                                <i className="bi bi-person-badge me-1"></i> {opAutoriza ? opAutoriza.nome : `Funcionário #${l.id_func_autoriza}`}
                                {vistRetirada && (
                                  <div className="mt-1 bg-light p-1.5 rounded border fs-8 text-dark">
                                    <strong>KM de Saída:</strong> {vistRetirada.km} KM | <strong>Combustível:</strong> {vistRetirada.nivel_combustivel}%
                                    {vistRetirada.observacoes && <div><strong>Notas:</strong> {vistRetirada.observacoes}</div>}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="fs-8 text-muted">Pendente de retirada</div>
                            )}
                          </div>

                          {/* Devolução */}
                          <div className={`border-start ${l.data_devol_real ? 'border-primary' : 'border-light'} border-2 ps-3 pb-1`}>
                            <span className="fw-semibold">3. Devolução & Fechamento</span>
                            {l.data_devol_real ? (
                              <div className="fs-8 text-muted">
                                Concluída em {formatDateSafe(l.data_devol_real)} por:
                                <br />
                                <i className="bi bi-person-badge me-1"></i> {opDevolucao ? opDevolucao.nome : `Funcionário #${vistDevolucao?.id_func}`}
                                {vistDevolucao && (
                                  <div className="mt-1 bg-light p-1.5 rounded border fs-8 text-dark">
                                    <strong>KM de Retorno:</strong> {vistDevolucao.km} KM | <strong>Combustível:</strong> {vistDevolucao.nivel_combustivel}%
                                    {vistDevolucao.observacoes && <div><strong>Notas:</strong> {vistDevolucao.observacoes}</div>}
                                  </div>
                                )}
                              </div>
                            ) : l.status === 'cancelada' ? (
                              <div className="fs-8 text-danger fw-semibold">Locação Cancelada</div>
                            ) : (
                              <div className="fs-8 text-muted">Pendente de devolução</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Financeiro */}
                      <div>
                        <h6 className="fw-bold text-primary mb-2 pb-1 border-bottom d-flex align-items-center">
                          <i className="bi bi-cash-coin me-2"></i> Faturamento e Pagamento
                        </h6>
                        <div className="bg-light p-3 rounded-3 border">
                          {l.status === 'cancelada' ? (
                            <div className="text-center py-2 text-danger fw-semibold">
                              Reserva Cancelada — Sem cobranças
                            </div>
                          ) : (
                            <>
                              <div className="fs-7 mb-2">
                                <div className="d-flex justify-content-between mb-1">
                                  <span>Diárias Totais:</span>
                                  <span className="fw-semibold">{diasLocados || '—'} dias</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                  <span>Diárias do Carro (padrão):</span>
                                  <span>R$ {((diasLocados || 1) * diariaVeiculo).toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                  <span>Diárias do Seguro:</span>
                                  <span>R$ {((diasLocados || 1) * diariaSeguro).toFixed(2)}</span>
                                </div>
                              </div>
                              <hr className="my-2" />
                              <div className="d-flex justify-content-between fw-bold text-primary fs-6 mb-2">
                                <span>Valor Total:</span>
                                <span>R$ {l.valor_total ? parseFloat(String(l.valor_total)).toFixed(2) : '—'}</span>
                              </div>
                              {payment ? (
                                <div className="fs-8 text-success text-center bg-success bg-opacity-10 border border-success border-opacity-25 p-2 rounded-2">
                                  <i className="bi bi-check-circle-fill me-1"></i>
                                  Pago via {payment.forma_pagamento.toUpperCase()} em {formatDateSafe(payment.data)}
                                </div>
                              ) : (
                                <div className="fs-8 text-muted text-center p-1 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-2">
                                  Aguardando encerramento
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-top border-light py-2.5">
                    <button type="button" className="btn btn-primary px-4 py-2 rounded-3" onClick={() => setSelectedLocDetails(null)}>
                      Fechar Detalhes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmTarget && (() => {
        return (
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setDeleteConfirmTarget(null)}>
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content card-premium border border-danger border-opacity-25">
                <div className="modal-header border-bottom border-light">
                  <h5 className="modal-title text-danger fw-bold d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill"></i> Confirmar Exclusão
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setDeleteConfirmTarget(null)}></button>
                </div>
                <div className="modal-body py-4">
                  <p className="mb-2">Tem certeza de que deseja excluir a locação #{deleteConfirmTarget}?</p>
                  <p className="text-muted fs-8">Esta ação removerá permanentemente o histórico dessa locação e não poderá ser desfeita.</p>
                </div>
                <div className="modal-footer border-top border-light gap-2">
                  <button type="button" className="btn btn-outline-secondary px-4 py-2 rounded-3" onClick={() => setDeleteConfirmTarget(null)}>Voltar</button>
                  <button 
                    type="button" 
                    className="btn btn-danger px-4 py-2 rounded-3" 
                    onClick={() => handleDeleteConfirm(deleteConfirmTarget)}
                  >
                    Confirmar Exclusão
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Locacoes;
