import React, { useState, useEffect } from 'react';
import { getVeiculos } from '../services/veiculoService';
import { getClientes } from '../services/clienteService';
import { getLocacoes } from '../services/locacaoService';
import { getManutencoes } from '../services/manutencaoService';
import { getSeguros, getFuncionarios, getCategorias, getVistorias, getPagamentos } from '../services/auxService';
import type { 
  Veiculo, 
  Cliente, 
  Locacao, 
  Manutencao, 
  Seguro, 
  Funcionario, 
  Categoria, 
  Vistoria, 
  Pagamento 
} from '../types';

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

const parseAvariaFromObs = (obs: string | null | undefined) => {
  if (!obs) return null;
  const match = obs.match(/\[Avaria:\s*R\$\s*([\d.,]+)(?:\s*-\s*([^\]]+))?\]/);
  if (match) {
    return {
      valor: match[1],
      descricao: match[2] || '',
      cleanedObs: obs.replace(/\[Avaria:[^\]]+\]/, '').trim()
    };
  }
  return null;
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [selectedLocacaoDetails, setSelectedLocacaoDetails] = useState<Locacao | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        vData, 
        cData, 
        lData, 
        mData, 
        segData, 
        funcData, 
        catData, 
        vistData, 
        pagData
      ] = await Promise.all([
        getVeiculos(),
        getClientes(),
        getLocacoes(),
        getManutencoes(),
        getSeguros(),
        getFuncionarios(),
        getCategorias(),
        getVistorias(),
        getPagamentos(),
      ]);
      setVeiculos(vData);
      setClientes(cData);
      setLocacoes(lData);
      setManutencoes(mData);
      setSeguros(segData);
      setFuncionarios(funcData);
      setCategorias(catData);
      setVistorias(vistData);
      setPagamentos(pagData);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao carregar dados do Dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLocacaoDetails(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const stats = {
    totalVeiculos: veiculos.length,
    disponiveis: veiculos.filter((v) => v.status === 'disponivel').length,
    locados: veiculos.filter((v) => v.status === 'locado').length,
    manutencao: veiculos.filter((v) => v.status === 'em_manutencao').length,
    inadimplentes: clientes.filter((c) => c.inadimplente).length,
    locacoesAtivas: locacoes.filter((l) => l.status === 'ativa').length,
  };

  // Manutenções em atraso (onde previsao_saida < hoje e data_saida_real é null)
  const hojeStr = new Date().toISOString().split('T')[0];
  const manutencoesAtrasadas = manutencoes.filter(
    (m) => !m.data_saida_real && m.previsao_saida < hojeStr
  );

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="fw-bold text-dark mb-1 page-title">Painel Operacional</h1>
          <p className="text-muted page-subtitle mb-0">Acompanhe as métricas do RentFlow em tempo real</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm d-flex align-items-center" onClick={fetchData} disabled={loading} title="Atualizar Dados">
          <i className="bi bi-arrow-clockwise"></i>
          <span className="d-none d-md-inline ms-2">Atualizar Dados</span>
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show card-premium border-danger border-opacity-25" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
          <strong>Erro:</strong> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2 text-muted fs-7">Carregando métricas operacionais...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-4 col-lg-2">
              <div className="card card-premium p-3 h-100 border-start border-primary border-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted fs-8 fw-bold text-uppercase">Frota Total</span>
                  <i className="bi bi-car-front text-primary fs-5"></i>
                </div>
                <h3 className="fw-bold mb-0 text-dark">{stats.totalVeiculos}</h3>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <div className="card card-premium p-3 h-100 border-start border-success border-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted fs-8 fw-bold text-uppercase">Disponíveis</span>
                  <i className="bi bi-check-circle text-success fs-5"></i>
                </div>
                <h3 className="fw-bold mb-0 text-success">{stats.disponiveis}</h3>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <div className="card card-premium p-3 h-100 border-start border-info border-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted fs-8 fw-bold text-uppercase">Locados</span>
                  <i className="bi bi-key text-info fs-5"></i>
                </div>
                <h3 className="fw-bold mb-0 text-info">{stats.locados}</h3>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <div className="card card-premium p-3 h-100 border-start border-warning border-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted fs-8 fw-bold text-uppercase">Oficina</span>
                  <i className="bi bi-tools text-warning fs-5"></i>
                </div>
                <h3 className="fw-bold mb-0 text-warning">{stats.manutencao}</h3>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <div className="card card-premium p-3 h-100 border-start border-danger border-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted fs-8 fw-bold text-uppercase">Inadimplentes</span>
                  <i className="bi bi-person-x text-danger fs-5"></i>
                </div>
                <h3 className="fw-bold mb-0 text-danger">{stats.inadimplentes}</h3>
              </div>
            </div>
            <div className="col-6 col-md-4 col-lg-2">
              <div className="card card-premium p-3 h-100 border-start border-primary border-3" style={{ borderLeftColor: '#8b5cf6 !important' }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted fs-8 fw-bold text-uppercase">Ativos</span>
                  <i className="bi bi-journal-text text-primary fs-5" style={{ color: '#8b5cf6' }}></i>
                </div>
                <h3 className="fw-bold mb-0 text-primary">{stats.locacoesAtivas}</h3>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Manutenções em Atraso */}
            {manutencoesAtrasadas.length > 0 && (
              <div className="col-12">
                <div className="card card-premium border-danger border-opacity-25 p-4">
                  <h5 className="text-danger fw-bold mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    Atenção: Veículos em Oficina com Saída Atrasada ({manutencoesAtrasadas.length})
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Veículo / Placa</th>
                          <th>Tipo de Manutenção</th>
                          <th>Motivo do Registro</th>
                          <th>Data Entrada</th>
                          <th>Previsão Saída</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manutencoesAtrasadas.map((m) => (
                          <tr key={m.id_manut}>
                            <td>
                              <span className="fw-semibold">Placa: </span><code>{m.placa_veiculo}</code>
                            </td>
                            <td>
                              <span className={`badge ${m.tipo === 'corretiva' ? 'bg-danger-subtle text-danger border border-danger border-opacity-25' : 'bg-warning-subtle text-warning border border-warning border-opacity-25'} px-3 py-1.5 rounded-pill`}>
                                {m.tipo.toUpperCase()}
                              </span>
                            </td>
                            <td className="text-dark fs-7">{m.motivo}</td>
                            <td className="fs-7">{formatDateSafe(m.data_entrada)}</td>
                            <td className="text-danger fw-bold fs-7">{formatDateSafe(m.previsao_saida)}</td>
                            <td>
                              <span className="badge bg-danger-subtle text-danger border border-danger border-opacity-25 px-3 py-1.5 rounded-pill">ATRASADO</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Locações Recentes */}
            <div className="col-md-12">
              <div className="card card-premium p-4">
                <h5 className="fw-bold text-dark mb-3"><i className="bi bi-calendar-check me-2 text-primary"></i>Últimas Locações Registradas</h5>
                {locacoes.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-folder-x fs-1"></i>
                    <p className="mt-2">Nenhuma locação registrada no momento.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Código</th>
                          <th>Cliente (CPF)</th>
                          <th>Veículo (Placa)</th>
                          <th>Data Reserva</th>
                          <th>Devolução Prevista</th>
                          <th>Status</th>
                          <th className="text-end">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locacoes.slice(-5).reverse().map((l) => (
                          <tr key={l.id_loc} className="align-middle cursor-pointer" onClick={() => setSelectedLocacaoDetails(l)}>
                            <td><code>#{l.id_loc}</code></td>
                            <td><span className="fw-semibold text-dark">{l.cpf_cliente}</span></td>
                            <td><code>{l.placa_veiculo}</code></td>
                            <td className="fs-7">{formatDateSafe(l.data_reserva)}</td>
                            <td className="fs-7">{formatDateSafe(l.data_devol_prevista)}</td>
                            <td>
                              <span className={`badge ${
                                l.status === 'ativa' ? 'bg-success-subtle text-success border border-success border-opacity-25' :
                                l.status === 'reservada' ? 'bg-warning-subtle text-warning border border-warning border-opacity-25' :
                                l.status === 'encerrada' ? 'bg-secondary-subtle text-secondary border border-secondary border-opacity-25' :
                                'bg-danger-subtle text-danger border border-danger border-opacity-25'
                              } px-3 py-1.5 rounded-pill`}>
                                {l.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="text-end">
                              {l.valor_total ? (
                                <span className="fw-bold text-success">
                                  R$ {parseFloat(String(l.valor_total)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Detalhes Premium da Locação */}
      {selectedLocacaoDetails && (() => {
        const l = selectedLocacaoDetails;
        const client = clientes.find(c => c.cpf === l.cpf_cliente);
        const vehicle = veiculos.find(v => v.placa === l.placa_veiculo);
        const category = vehicle ? categorias.find(c => c.id_cat === vehicle.id_cat) : null;
        const insurance = seguros.find(s => s.id_seguro === l.id_seguro);
        
        // Operadores
        const opRegistro = funcionarios.find(f => f.id_func === l.id_func_registro);
        const opAutoriza = funcionarios.find(f => f.id_func === l.id_func_autoriza);
        
        // Vistorias
        const vistRetirada = vistorias.find(v => v.id_loc === l.id_loc && v.tipo === 'retirada');
        const vistDevolucao = vistorias.find(v => v.id_loc === l.id_loc && v.tipo === 'devolucao');
        const opDevolucao = vistDevolucao ? funcionarios.find(f => f.id_func === vistDevolucao.id_func) : null;
        
        // Cobrança Extra decodificada do checkin
        const avariaParsed = parseAvariaFromObs(vistDevolucao?.observacoes);
        const observacoesExibicao = avariaParsed ? avariaParsed.cleanedObs : vistDevolucao?.observacoes;

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

        const diariaVeiculo = category ? Number(category.valor_diaria) : 0;
        const diariaSeguro = insurance ? Number(insurance.valor_diario) : 0;

        return (
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }} onClick={() => setSelectedLocacaoDetails(null)}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content card-premium border border-light">
                <div className="modal-header border-bottom border-light px-4 py-3">
                  <div>
                    <h5 className="modal-title fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark-text"></i> Detalhes da Locação #{l.id_loc}
                    </h5>
                    <span className="text-muted fs-8">Registrado em {formatDateSafe(l.data_reserva)}</span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedLocacaoDetails(null)}></button>
                </div>
                
                <div className="modal-body bg-light-subtle px-4 py-4">
                  <div className="row g-4">
                    {/* Cliente, Veículo e Seguro */}
                    <div className="col-md-6 d-flex flex-column gap-4">
                      {/* Cliente */}
                      <div className="detail-card">
                        <h6 className="detail-section-title">
                          <i className="bi bi-person"></i> Dados do Cliente
                        </h6>
                        {client ? (
                          <div className="row g-3">
                            <div className="col-12">
                              <span className="detail-label">Nome Completo</span>
                              <div className="detail-value fw-semibold">{client.nome}</div>
                            </div>
                            <div className="col-6">
                              <span className="detail-label">CPF</span>
                              <div className="detail-value">{client.cpf}</div>
                            </div>
                            <div className="col-6">
                              <span className="detail-label">E-mail</span>
                              <div className="detail-value text-break">{client.email}</div>
                            </div>
                            <div className="col-6">
                              <span className="detail-label">CNH (Categoria)</span>
                              <div className="detail-value">{client.cnh_numero} (Cat. {client.cnh_categoria})</div>
                            </div>
                            <div className="col-6">
                              <span className="detail-label">Validade CNH</span>
                              <div className="detail-value">{formatDateSafe(client.cnh_validade)}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted">—</div>
                        )}
                      </div>

                      {/* Veículo */}
                      <div className="detail-card">
                        <h6 className="detail-section-title">
                          <i className="bi bi-car-front"></i> Veículo e Categoria
                        </h6>
                        {vehicle ? (
                          <div className="row g-3">
                            <div className="col-12">
                              <span className="detail-label">Marca / Modelo</span>
                              <div className="detail-value fw-semibold">{vehicle.marca} {vehicle.modelo}</div>
                            </div>
                            <div className="col-6">
                              <span className="detail-label">Placa</span>
                              <div className="detail-value"><code>{vehicle.placa}</code></div>
                            </div>
                            <div className="col-6">
                              <span className="detail-label">Cor / Ano</span>
                              <div className="detail-value">{vehicle.cor} / {vehicle.ano_fabricacao}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted">—</div>
                        )}
                      </div>

                      {/* Seguro */}
                      <div className="detail-card">
                        <h6 className="detail-section-title">
                          <i className="bi bi-shield-check"></i> Seguro Contratado
                        </h6>
                        {insurance ? (
                          <div className="row g-3">
                            <div className="col-12 d-flex justify-content-between align-items-center">
                              <div>
                                <span className="detail-label">Nome do Seguro</span>
                                <div className="detail-value fw-semibold">{insurance.nome}</div>
                              </div>
                              <span className="badge bg-primary-subtle text-primary py-2 px-3 fs-6">R$ {diariaSeguro.toFixed(2)} / dia</span>
                            </div>
                            <div className="col-12">
                              <span className="detail-label">Cobertura</span>
                              <div className="detail-value text-muted fs-7">{insurance.descricao_cobertura}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-muted">—</div>
                        )}
                      </div>
                    </div>

                    {/* Fluxo Operacional e Financeiro */}
                    <div className="col-md-6 d-flex flex-column gap-4">
                      {/* Fluxo Operacional */}
                      <div className="detail-card">
                        <h6 className="detail-section-title">
                          <i className="bi bi-bezier2"></i> Fluxo de Operação
                        </h6>
                        <div className="timeline-flow mt-3">
                          {/* Abertura */}
                          <div className="mb-3 border-start border-primary border-2 ps-3 position-relative">
                            <div className="fw-semibold text-primary mb-1">1. Reserva Inicial</div>
                            <div className="fs-7">
                              Realizada em <strong>{formatDateSafe(l.data_reserva)}</strong>
                            </div>
                            <div className="fs-8 text-muted mt-1 d-flex align-items-center gap-1">
                              <i className="bi bi-person-badge"></i> {opRegistro ? opRegistro.nome : `Func. #${l.id_func_registro}`}
                            </div>
                          </div>

                          {/* Retirada */}
                          <div className={`mb-3 border-start ${l.data_retirada ? 'border-primary' : 'border-light'} border-2 ps-3`}>
                            <div className={`fw-semibold mb-1 ${l.data_retirada ? 'text-primary' : 'text-muted'}`}>2. Retirada do Veículo</div>
                            {l.data_retirada ? (
                              <>
                                <div className="fs-7">
                                  Realizada em <strong>{formatDateSafe(l.data_retirada)}</strong>
                                </div>
                                <div className="fs-8 text-muted mt-1 d-flex align-items-center gap-1 mb-2">
                                  <i className="bi bi-person-badge"></i> {opAutoriza ? opAutoriza.nome : `Func. #${l.id_func_autoriza}`}
                                </div>
                                {vistRetirada && (
                                  <div className="bg-light-subtle p-2 rounded border fs-8 text-dark">
                                    <div className="d-flex justify-content-between mb-1">
                                      <span><strong>KM:</strong> {vistRetirada.km} KM</span>
                                      <span><strong>Combustível:</strong> {vistRetirada.nivel_combustivel}%</span>
                                    </div>
                                    {vistRetirada.observacoes && <div className="text-muted mt-1 pt-1 border-top border-light">Notas: {vistRetirada.observacoes}</div>}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="fs-7 text-muted fst-italic">Pendente de retirada</div>
                            )}
                          </div>

                          {/* Devolução */}
                          <div className={`border-start ${l.data_devol_real ? 'border-primary' : 'border-light'} border-2 ps-3`}>
                            <div className={`fw-semibold mb-1 ${l.data_devol_real ? 'text-primary' : l.status === 'cancelada' ? 'text-danger' : 'text-muted'}`}>3. Devolução & Fechamento</div>
                            {l.data_devol_real ? (
                              <>
                                <div className="fs-7">
                                  Concluída em <strong>{formatDateSafe(l.data_devol_real)}</strong>
                                </div>
                                <div className="fs-8 text-muted mt-1 d-flex align-items-center gap-1 mb-2">
                                  <i className="bi bi-person-badge"></i> {opDevolucao ? opDevolucao.nome : `Func. #${vistDevolucao?.id_func}`}
                                </div>
                                {vistDevolucao && (
                                  <div className="bg-light-subtle p-2 rounded border fs-8 text-dark">
                                    <div className="d-flex justify-content-between mb-1">
                                      <span><strong>KM:</strong> {vistDevolucao.km} KM</span>
                                      <span><strong>Combustível:</strong> {vistDevolucao.nivel_combustivel}%</span>
                                    </div>
                                    {observacoesExibicao && <div className="text-muted mt-1 pt-1 border-top border-light">Notas: {observacoesExibicao}</div>}
                                  </div>
                                )}
                              </>
                            ) : l.status === 'cancelada' ? (
                              <div className="fs-7 text-danger fw-semibold">Locação Cancelada</div>
                            ) : (
                              <div className="fs-7 text-muted fst-italic">Pendente de devolução</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Financeiro */}
                      <div className="detail-card">
                        <h6 className="detail-section-title">
                          <i className="bi bi-cash-coin"></i> Faturamento e Pagamento
                        </h6>
                        <div>
                          {l.status === 'cancelada' ? (
                            <div className="text-center py-3 bg-danger-subtle text-danger rounded-3 fw-semibold">
                              Reserva Cancelada — Sem cobranças
                            </div>
                          ) : (
                            <>
                              <div className="fs-7 mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                  <span className="text-muted">Diárias Totais:</span>
                                  <span className="fw-semibold">{diasLocados || '—'} dias</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                  <span className="text-muted">Diárias do Carro (padrão):</span>
                                  <span className="fw-medium">R$ {((diasLocados || 1) * diariaVeiculo).toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                  <span className="text-muted">Diárias do Seguro:</span>
                                  <span className="fw-medium">R$ {((diasLocados || 1) * diariaSeguro).toFixed(2)}</span>
                                </div>
                                {avariaParsed && (
                                  <div className="d-flex justify-content-between mb-1 text-danger">
                                    <span>Avaria ({avariaParsed.descricao || 'Taxa Extra'}):</span>
                                    <span>+ R$ {parseFloat(avariaParsed.valor).toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="d-flex justify-content-between align-items-center pt-3 border-top mb-3">
                                <span className="fw-bold text-dark fs-6">Valor Total:</span>
                                <span className="fw-bold text-primary fs-4">R$ {l.valor_total ? parseFloat(String(l.valor_total)).toFixed(2) : '—'}</span>
                              </div>
                              {payment ? (
                                <div className="d-flex align-items-center justify-content-center gap-2 p-3 bg-success-subtle text-success rounded-3 fw-medium">
                                  <i className="bi bi-check-circle-fill"></i>
                                  Pago via {payment.forma_pagamento.toUpperCase()} em {formatDateSafe(payment.data)}
                                </div>
                              ) : (
                                <div className="text-center p-2 bg-warning-subtle text-warning-emphasis rounded-3 fw-medium">
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
                  <button type="button" className="btn btn-primary px-4 py-2 rounded-3" onClick={() => setSelectedLocacaoDetails(null)}>
                    Fechar Detalhes
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

export default Dashboard;
