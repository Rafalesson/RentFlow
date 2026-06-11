import React, { useState, useEffect } from 'react';
import { getManutencoes, createManutencao, updateManutencao } from '../services/manutencaoService';
import { getVeiculos, updateVeiculo } from '../services/veiculoService';
import { getFuncionarios } from '../services/auxService';
import { getCurrentUser } from '../services/authService';
import type { Manutencao, Veiculo, Funcionario, TipoManutencao } from '../types';

const cleanNumericString = (val: string): string => {
  if (/^0\d/.test(val)) {
    return val.replace(/^0+/, '');
  }
  return val;
};

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

const Manutencoes: React.FC = () => {
  const currentUser = getCurrentUser();
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedManutencaoDetails, setSelectedManutencaoDetails] = useState<Manutencao | null>(null);

  // Search and filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todas');
  const [tipoFilter, setTipoFilter] = useState('todos');

  // Esc key closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedManutencaoDetails(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedManutencaoDetails]);

  // Form toggles
  const [showSendForm, setShowSendForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedManut, setSelectedManut] = useState<Manutencao | null>(null);

  // Form states
  const [sendData, setSendData] = useState({
    placa_veiculo: '',
    id_func: 0,
    tipo: '' as (TipoManutencao | ''),
    motivo: '',
    descricao: '',
    data_entrada: new Date().toISOString().split('T')[0],
    previsao_saida: '',
  });

  const [returnData, setReturnData] = useState({
    data_saida_real: new Date().toISOString().split('T')[0],
    custo: '0',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mData, vData, fData] = await Promise.all([
        getManutencoes(),
        getVeiculos(),
        getFuncionarios(),
      ]);
      setManutencoes(mData);
      setVeiculos(vData);
      setFuncionarios(fData);

      // Defaults for send form
      const defaultFuncId = currentUser ? currentUser.id_func : (fData.length > 0 ? fData[0].id_func : 0);
      if (fData.length > 0) {
        setSendData((prev) => ({ ...prev, id_func: defaultFuncId, placa_veiculo: '' }));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao carregar dados de manutenção.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSendInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSendData((prev) => ({
      ...prev,
      [name]: name === 'id_func' ? Number(value) : value,
    }));
  };

  const handleOpenSend = () => {
    setError(null);
    setSuccess(null);
    const defaultFuncId = currentUser ? currentUser.id_func : (funcionarios.length > 0 ? funcionarios[0].id_func : 0);
    setSendData({
      placa_veiculo: '',
      id_func: defaultFuncId,
      tipo: '',
      motivo: '',
      descricao: '',
      data_entrada: new Date().toISOString().split('T')[0],
      previsao_saida: '',
    });
    setShowSendForm(true);
  };

  const handleOpenReturn = (manut: Manutencao) => {
    setError(null);
    setSuccess(null);
    setSelectedManut(manut);
    setReturnData({
      data_saida_real: new Date().toISOString().split('T')[0],
      custo: '0',
    });
    setShowReturnForm(true);
  };

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sendData.placa_veiculo || !sendData.id_func || !sendData.tipo || !sendData.previsao_saida || !sendData.motivo) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      // 1. Criar manutenção
      await createManutencao({
        placa_veiculo: sendData.placa_veiculo,
        id_func: sendData.id_func,
        tipo: sendData.tipo as TipoManutencao,
        motivo: sendData.motivo,
        descricao: sendData.descricao || null,
        data_entrada: sendData.data_entrada,
        previsao_saida: sendData.previsao_saida,
        custo: null,
      });

      // 2. Atualizar status do veículo para em_manutencao
      const vehicle = veiculos.find((v) => v.placa === sendData.placa_veiculo);
      if (vehicle) {
        await updateVeiculo(vehicle.placa, {
          ...vehicle,
          status: 'em_manutencao',
        });
      }

      setSuccess('Veículo enviado para manutenção com sucesso!');
      setShowSendForm(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao enviar veículo para manutenção.');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedManut) return;

    try {
      // 1. Atualizar manutenção com retorno (enviando dados completos para evitar erros de validação)
      await updateManutencao(selectedManut.id_manut, {
        ...selectedManut,
        data_saida_real: returnData.data_saida_real,
        custo: Number(returnData.custo),
      });

      // 2. Atualizar status do veículo de volta para disponivel
      const vehicle = veiculos.find((v) => v.placa === selectedManut.placa_veiculo);
      if (vehicle) {
        await updateVeiculo(vehicle.placa, {
          ...vehicle,
          status: 'disponivel',
        });
      }

      setSuccess('Retorno registrado! Veículo liberado para novas locações.');
      setShowReturnForm(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao registrar retorno de manutenção.');
    }
  };

  const getFuncName = (id_func: number) => {
    const f = funcionarios.find((func) => func.id_func === id_func);
    return f ? f.nome : String(id_func);
  };

  const getVehicleModel = (placa: string) => {
    const v = veiculos.find((vei) => vei.placa === placa);
    return v ? `${v.marca} ${v.modelo}` : placa;
  };

  const filteredManutencoes = manutencoes.filter((m) => {
    const searchLower = search.toLowerCase();
    const modelStr = getVehicleModel(m.placa_veiculo).toLowerCase();
    const funcStr = getFuncName(m.id_func).toLowerCase();
    const motivoStr = m.motivo.toLowerCase();
    const descStr = (m.descricao || '').toLowerCase();
    const tipoStr = m.tipo.toLowerCase();
    const idStr = `#${m.id_manut}`;
    
    const matchesSearch = (
      m.placa_veiculo.toLowerCase().includes(searchLower) ||
      modelStr.includes(searchLower) ||
      funcStr.includes(searchLower) ||
      motivoStr.includes(searchLower) ||
      descStr.includes(searchLower) ||
      tipoStr.includes(searchLower) ||
      idStr.includes(searchLower)
    );

    const matchesTipo = tipoFilter === 'todos' || m.tipo === tipoFilter;
    const isConcluida = !!m.data_saida_real;
    const matchesStatus = statusFilter === 'todas' ||
                          (statusFilter === 'concluida' && isConcluida) ||
                          (statusFilter === 'em_andamento' && !isConcluida);

    return matchesSearch && matchesTipo && matchesStatus;
  });

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold text-dark mb-1">Manutenções</h1>
          <p className="text-muted">Gerencie o envio de veículos para manutenção preventiva e corretiva</p>
        </div>
        {!showSendForm && !showReturnForm && (
          <button className="btn btn-gradient py-2 px-4 rounded-3 d-flex align-items-center" onClick={handleOpenSend}>
            <i className="bi bi-tools me-2 fs-5"></i> Enviar Veículo
          </button>
        )}
      </div>

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

      {showSendForm ? (
        /* FORMULARIO DE ENVIO */
        <div className="row justify-content-center">
          <div className="col-xl-9 col-lg-10">
            <div className="card card-premium p-4">
              <h3 className="fw-bold mb-4">Enviar Veículo para Manutenção</h3>
          <form onSubmit={handleSendSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Veículo (Apenas Disponíveis)</label>
                <select
                  name="placa_veiculo"
                  className="form-select"
                  value={sendData.placa_veiculo}
                  onChange={handleSendInputChange}
                  required
                >
                  <option value="">Selecione um veículo...</option>
                  {veiculos.filter((v) => v.status === 'disponivel').map((v) => (
                    <option key={v.placa} value={v.placa}>
                      {v.marca} {v.modelo} - Placa: {v.placa}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Responsável pelo Registro</label>
                <select
                  name="id_func"
                  className="form-select"
                  value={sendData.id_func}
                  onChange={handleSendInputChange}
                  required
                  disabled
                  style={{ cursor: 'not-allowed' }}
                >
                  {funcionarios.map((f) => (
                    <option key={f.id_func} value={f.id_func}>
                      {f.nome} ({f.cargo.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Tipo de Manutenção</label>
                <select
                  name="tipo"
                  className="form-select"
                  value={sendData.tipo}
                  onChange={handleSendInputChange}
                  required
                >
                  <option value="">Selecione o tipo...</option>
                  <option value="preventiva">Preventiva</option>
                  <option value="corretiva">Corretiva</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Data de Entrada</label>
                <input
                  type="date"
                  name="data_entrada"
                  className="form-control"
                  value={sendData.data_entrada}
                  onChange={handleSendInputChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Previsão de Saída</label>
                <input
                  type="date"
                  name="previsao_saida"
                  className="form-control"
                  value={sendData.previsao_saida}
                  onChange={handleSendInputChange}
                  required
                />
              </div>
              <div className="col-md-12">
                <label className="form-label fw-bold">Motivo</label>
                <input
                  type="text"
                  name="motivo"
                  className="form-control"
                  placeholder="Ex: Troca de óleo, barulho no motor..."
                  value={sendData.motivo}
                  onChange={handleSendInputChange}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-bold">Descrição Detalhada</label>
                <textarea
                  name="descricao"
                  className="form-control"
                  rows={3}
                  value={sendData.descricao}
                  onChange={handleSendInputChange}
                />
              </div>
            </div>

            <div className="mt-4 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => setShowSendForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-gradient px-5 py-2">
                Confirmar Envio <i className="bi bi-tools ms-1"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
      ) : showReturnForm ? (
        /* FORMULARIO DE RETORNO */
        <div className="row justify-content-center">
          <div className="col-xl-9 col-lg-10">
            <div className="card card-premium p-4">
              <h3 className="fw-bold mb-4">Registrar Retorno de Manutenção</h3>
          <div className="alert alert-info">
            Veículo: <strong>{getVehicleModel(selectedManut?.placa_veiculo || '')}</strong> (Placa: <code>{selectedManut?.placa_veiculo}</code>)
          </div>
          <form onSubmit={handleReturnSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Data de Saída Real</label>
                <input
                  type="date"
                  className="form-control"
                  value={returnData.data_saida_real}
                  onChange={(e) => setReturnData((prev) => ({ ...prev, data_saida_real: e.target.value }))}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Custo de Manutenção (R$)</label>
                <div className="input-group">
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-end-0"
                    onClick={() => setReturnData((prev) => {
                      const currentVal = Number(prev.custo) || 0;
                      const newVal = Math.max(0, currentVal - 50);
                      return { ...prev, custo: String(newVal) };
                    })}
                  >
                    <i className="bi bi-dash-lg"></i>
                  </button>
                  <input
                    type="number"
                    className="form-control text-center"
                    min={0}
                    value={returnData.custo}
                    onChange={(e) => {
                      const val = cleanNumericString(e.target.value) || '0';
                      setReturnData((prev) => ({ ...prev, custo: val }));
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0"
                    onClick={() => setReturnData((prev) => {
                      const currentVal = Number(prev.custo) || 0;
                      const newVal = currentVal + 50;
                      return { ...prev, custo: String(newVal) };
                    })}
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => setShowReturnForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-success px-5 py-2">
                Concluir Manutenção <i className="bi bi-check-circle ms-1"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
      ) : (
        /* LISTAGEM DE MANUTENÇÕES */
        <>
          {/* Filters Bar */}
          <div className="card card-premium p-4 mb-4">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold fs-7 text-muted">Pesquisar</label>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Buscar por placa, motivo, código..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold fs-7 text-muted">Filtrar por Status</label>
                <select 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="todas">Todos os Status</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluída</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold fs-7 text-muted">Filtrar por Tipo</label>
                <select 
                  className="form-select"
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="preventiva">Preventiva</option>
                  <option value="corretiva">Corretiva</option>
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end justify-content-end">
                <button className="btn btn-outline-secondary px-3 py-2 w-100" onClick={loadData} disabled={loading}>
                  <i className="bi bi-arrow-clockwise me-1"></i> Atualizar
                </button>
              </div>
            </div>
          </div>

          <div className="card card-premium p-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : manutencoes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-tools fs-1"></i>
              <p className="mt-2">Nenhum registro de manutenção encontrado.</p>
            </div>
          ) : filteredManutencoes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-search fs-1"></i>
              <p className="mt-2">Nenhum registro de manutenção encontrado para a pesquisa "{search}".</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Código</th>
                    <th>Veículo</th>
                    <th>Responsável</th>
                    <th>Tipo</th>
                    <th>Motivo</th>
                    <th>Entrada / Prev. Saída</th>
                    <th>Data Saída</th>
                    <th>Custo</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManutencoes.slice().reverse().map((m) => (
                    <tr key={m.id_manut} className="align-middle cursor-pointer" onClick={() => setSelectedManutencaoDetails(m)}>
                      <td><code>#{m.id_manut}</code></td>
                      <td>
                        <span className="fw-semibold">{getVehicleModel(m.placa_veiculo)}</span>
                        <div className="fs-8 text-muted">Placa: <code>{m.placa_veiculo}</code></div>
                      </td>
                      <td>{getFuncName(m.id_func)}</td>
                      <td>
                        <span className={`badge ${m.tipo === 'preventiva' ? 'bg-info' : 'bg-danger'}`}>
                          {m.tipo.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold fs-7">{m.motivo}</div>
                        <div className="fs-8 text-muted">{m.descricao || '—'}</div>
                      </td>
                      <td>
                        <div className="fs-7">E: {formatDateSafe(m.data_entrada)}</div>
                        <div className="fs-8 text-muted">P: {formatDateSafe(m.previsao_saida)}</div>
                      </td>
                      <td>
                        {m.data_saida_real ? (
                          <span className="text-success fw-semibold">
                            {formatDateSafe(m.data_saida_real)}
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark">Em Oficina</span>
                        )}
                      </td>
                      <td>
                        {m.custo !== null && m.custo !== undefined ? (
                          <span className="fw-bold">
                            R$ {parseFloat(String(m.custo)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-end">
                        {!m.data_saida_real && (
                          <button className="btn btn-outline-success btn-sm" onClick={(e) => { e.stopPropagation(); handleOpenReturn(m); }}>
                            <i className="bi bi-check-circle-fill me-1"></i> Retorno
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

      {/* Modal de Detalhes Premium da Manutenção */}
      {selectedManutencaoDetails && (() => {
        const m = selectedManutencaoDetails;
        return (
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }} onClick={() => setSelectedManutencaoDetails(null)}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content card-premium border border-light">
                <div className="modal-header border-bottom border-light px-4 py-3">
                  <div>
                    <h5 className="modal-title fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-tools"></i> Detalhes da Manutenção
                    </h5>
                    <span className="text-muted fs-8">Código: #{m.id_manut}</span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedManutencaoDetails(null)}></button>
                </div>
                
                <div className="modal-body px-4 py-3">
                  <div className="row g-4">
                    {/* Coluna 1 (Identificação & Veículo) */}
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3 pb-1 border-bottom d-flex align-items-center">
                        <i className="bi bi-info-circle me-2"></i> Identificação & Veículo
                      </h6>
                      <div className="fs-7">
                        <div className="mb-2"><strong>Código:</strong> #{m.id_manut}</div>
                        <div className="mb-2"><strong>Veículo:</strong> {getVehicleModel(m.placa_veiculo)}</div>
                        <div className="mb-2"><strong>Placa:</strong> <code>{m.placa_veiculo}</code></div>
                        <div className="mb-2">
                          <strong>Tipo de Manutenção:</strong>{' '}
                          <span className={`badge ${m.tipo === 'preventiva' ? 'bg-info' : 'bg-danger'}`}>
                            {m.tipo.toUpperCase()}
                          </span>
                        </div>
                        <div className="mb-2"><strong>Operador Responsável:</strong> {getFuncName(m.id_func)}</div>
                      </div>
                    </div>
                    
                    {/* Coluna 2 (Fluxo & Faturamento) */}
                    <div className="col-md-6">
                      <h6 className="fw-bold text-primary mb-3 pb-1 border-bottom d-flex align-items-center">
                        <i className="bi bi-currency-dollar me-2"></i> Fluxo & Faturamento
                      </h6>
                      <div className="fs-7">
                        <div className="mb-2"><strong>Motivo:</strong> {m.motivo}</div>
                        <div className="mb-2"><strong>Descrição Detalhada:</strong> {m.descricao || '—'}</div>
                        <div className="mb-2"><strong>Data de Entrada:</strong> {formatDateSafe(m.data_entrada)}</div>
                        <div className="mb-2"><strong>Previsão de Saída:</strong> {formatDateSafe(m.previsao_saida)}</div>
                        <div className="mb-2">
                          <strong>Data de Conclusão:</strong>{' '}
                          {m.data_saida_real ? (
                            <span className="text-success fw-semibold">{formatDateSafe(m.data_saida_real)}</span>
                          ) : (
                            <span className="badge bg-warning text-dark">Em Oficina</span>
                          )}
                        </div>
                        <div className="mb-2">
                          <strong>Custo Total:</strong>{' '}
                          {m.custo !== null && m.custo !== undefined ? (
                            <span className="fw-bold text-success">
                              R$ {parseFloat(String(m.custo)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-top border-light px-4 py-3">
                  <button type="button" className="btn btn-primary px-4 py-2 rounded-3" onClick={() => setSelectedManutencaoDetails(null)}>
                    Fechar
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

export default Manutencoes;
