import React, { useState, useEffect } from 'react';
import { getClientes, createCliente, updateCliente, deleteCliente } from '../services/clienteService';
import { getCurrentUser } from '../services/authService';
import type { Cliente } from '../types';

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

const Clientes: React.FC = () => {
  const currentUser = getCurrentUser();
  const isGerente = currentUser?.cargo === 'gerente';
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedClienteDetails, setSelectedClienteDetails] = useState<Cliente | null>(null);

  // Search filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<string | null>(null);

  // Esc key closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedClienteDetails(null);
        setDeleteConfirmTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClienteDetails, deleteConfirmTarget]);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<Cliente>({
    cpf: '',
    nome: '',
    data_nascimento: '',
    email: '',
    inadimplente: false,
    cnh_numero: '',
    cnh_categoria: 'B',
    cnh_validade: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_estado: '',
    endereco_cep: '',
  });

  const loadClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleOpenCreate = () => {
    setIsEdit(false);
    setFormData({
      cpf: '',
      nome: '',
      data_nascimento: '',
      email: '',
      inadimplente: false,
      cnh_numero: '',
      cnh_categoria: 'B',
      cnh_validade: '',
      endereco_rua: '',
      endereco_numero: '',
      endereco_bairro: '',
      endereco_cidade: '',
      endereco_estado: '',
      endereco_cep: '',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (cliente: Cliente) => {
    setIsEdit(true);
    // Format dates to YYYY-MM-DD for input fields
    const formattedNasc = cliente.data_nascimento ? cliente.data_nascimento.split('T')[0] : '';
    const formattedVal = cliente.cnh_validade ? cliente.cnh_validade.split('T')[0] : '';

    setFormData({
      ...cliente,
      data_nascimento: formattedNasc,
      cnh_validade: formattedVal,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (isEdit) {
        const { cpf, ...payload } = formData;
        await updateCliente(cpf, payload);
        setSuccess('Cliente atualizado com sucesso!');
      } else {
        await createCliente(formData);
        setSuccess('Cliente cadastrado com sucesso!');
      }
      setShowForm(false);
      loadClientes();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao salvar cliente.');
    }
  };

  const handleDelete = (cpf: string) => {
    setDeleteConfirmTarget(cpf);
  };

  const handleDeleteConfirm = async (cpf: string) => {
    setDeleteConfirmTarget(null);
    setError(null);
    setSuccess(null);
    try {
      await deleteCliente(cpf);
      setSuccess('Cliente removido com sucesso!');
      loadClientes();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao excluir cliente.');
    }
  };

  const filteredClientes = clientes.filter(
    (c) => {
      const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
                            c.cpf.includes(search);
      const matchesStatus = statusFilter === 'todos' || 
                            (statusFilter === 'inadimplente' && c.inadimplente) || 
                            (statusFilter === 'adimplente' && !c.inadimplente);
      return matchesSearch && matchesStatus;
    }
  );

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="fw-bold text-dark mb-1 page-title">Clientes</h1>
          <p className="text-muted page-subtitle mb-0">Gerencie o cadastro de clientes da locadora</p>
        </div>
        {!showForm && (
          <button className="btn btn-gradient py-2 px-3 px-md-4 rounded-3 d-flex align-items-center" onClick={handleOpenCreate} title="Novo Cliente">
            <i className="bi bi-person-plus-fill fs-5"></i>
            <span className="d-none d-md-inline ms-2">Novo Cliente</span>
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

      {showForm ? (
        <div className="row justify-content-center">
          <div className="col-xl-9 col-lg-10">
            <div className="card card-premium p-4">
          <h3 className="fw-bold mb-4">{isEdit ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              {/* Seção Dados Pessoais */}
              <div className="col-12">
                <h5 className="border-bottom pb-2 mb-3 text-primary">Dados Pessoais</h5>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">CPF</label>
                <input
                  type="text"
                  name="cpf"
                  className="form-control"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  disabled={isEdit}
                  style={{ cursor: isEdit ? 'not-allowed' : 'default' }}
                  required
                />
              </div>
              <div className="col-md-5">
                <label className="form-label fw-bold">Nome Completo</label>
                <input
                  type="text"
                  name="nome"
                  className="form-control"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Data de Nascimento</label>
                <input
                  type="date"
                  name="data_nascimento"
                  className="form-control"
                  value={formData.data_nascimento}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">E-mail</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="exemplo@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-6 d-flex align-items-end mb-3">
                <div className="form-check form-switch p-2 bg-light rounded w-100 ps-5 border">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="inadimplente"
                    id="inadimplente"
                    checked={formData.inadimplente}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label fw-bold text-danger" htmlFor="inadimplente">
                    <i className="bi bi-person-x-fill me-1"></i> Inadimplente (Bloquear Locações)
                  </label>
                </div>
              </div>

              {/* Seção CNH */}
              <div className="col-12 mt-4">
                <h5 className="border-bottom pb-2 mb-3 text-primary">Habilitação (CNH)</h5>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Número da CNH</label>
                <input
                  type="text"
                  name="cnh_numero"
                  className="form-control"
                  value={formData.cnh_numero}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Categoria</label>
                <select
                  name="cnh_categoria"
                  className="form-select"
                  value={formData.cnh_categoria}
                  onChange={handleInputChange}
                  required
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="AB">AB</option>
                  <option value="AC">AC</option>
                  <option value="AD">AD</option>
                  <option value="AE">AE</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Validade</label>
                <input
                  type="date"
                  name="cnh_validade"
                  className="form-control"
                  value={formData.cnh_validade}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Seção Endereço */}
              <div className="col-12 mt-4">
                <h5 className="border-bottom pb-2 mb-3 text-primary">Endereço</h5>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Rua</label>
                <input
                  type="text"
                  name="endereco_rua"
                  className="form-control"
                  value={formData.endereco_rua}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-bold">Número</label>
                <input
                  type="text"
                  name="endereco_numero"
                  className="form-control"
                  value={formData.endereco_numero}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Bairro</label>
                <input
                  type="text"
                  name="endereco_bairro"
                  className="form-control"
                  value={formData.endereco_bairro}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-5">
                <label className="form-label fw-bold">Cidade</label>
                <input
                  type="text"
                  name="endereco_cidade"
                  className="form-control"
                  value={formData.endereco_cidade}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Estado (UF)</label>
                <input
                  type="text"
                  name="endereco_estado"
                  className="form-control"
                  maxLength={2}
                  placeholder="PE"
                  value={formData.endereco_estado}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">CEP</label>
                <input
                  type="text"
                  name="endereco_cep"
                  className="form-control"
                  placeholder="00000-000"
                  value={formData.endereco_cep}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="mt-4 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-gradient px-5 py-2">
                {isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : (
        /* LISTAGEM DE CLIENTES */
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
                    placeholder="Buscar por nome ou CPF..."
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
                  <option value="todos">Todos os Clientes</option>
                  <option value="adimplente">Adimplentes</option>
                  <option value="inadimplente">Inadimplentes</option>
                </select>
              </div>
              <div className="col-md-3 d-flex align-items-end justify-content-end">
                <button className="btn btn-outline-secondary px-3 py-2 w-100" onClick={loadClientes} disabled={loading}>
                  <i className="bi bi-arrow-clockwise me-1"></i> Atualizar Tabela
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
          ) : filteredClientes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-people fs-1"></i>
              <p className="mt-2">Nenhum cliente cadastrado ou encontrado.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>CPF</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>CNH (Cat.)</th>
                    <th>Endereço</th>
                    <th>Inadimplente</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map((c) => (
                    <tr key={c.cpf} className="align-middle cursor-pointer" onClick={() => setSelectedClienteDetails(c)}>
                      <td><code>{c.cpf}</code></td>
                      <td>
                        <span className="fw-bold">{c.nome}</span>
                        <div className="fs-8 text-muted">Nascimento: {formatDateSafe(c.data_nascimento)}</div>
                      </td>
                      <td>{c.email}</td>
                      <td>
                        <code>{c.cnh_numero}</code>
                        <span className="badge bg-secondary ms-1">{c.cnh_categoria}</span>
                      </td>
                      <td className="fs-7 text-muted">
                        {c.endereco_cidade} - {c.endereco_estado}
                      </td>
                      <td>
                        {c.inadimplente ? (
                          <span className="badge bg-danger">INADIMPLENTE</span>
                        ) : (
                          <span className="badge bg-success">Regular</span>
                        )}
                      </td>
                      <td className="text-end">
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={(e) => { e.stopPropagation(); handleOpenEdit(c); }}>
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        {isGerente ? (
                          <button 
                            className="btn btn-outline-danger btn-sm" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(c.cpf); }}
                            title="Excluir cliente"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        ) : (
                          <button 
                            className="btn btn-outline-secondary btn-sm opacity-50" 
                            disabled={true}
                            title="Apenas gerentes podem excluir"
                            style={{ cursor: 'not-allowed', pointerEvents: 'auto' }}
                          >
                            <span className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: '16px', height: '16px' }}>
                              <i className="bi bi-trash-fill text-secondary"></i>
                              <i 
                                className="bi bi-x-lg text-danger position-absolute fw-bold" 
                                style={{
                                  fontSize: '11px',
                                  textShadow: '0 0 2px var(--bs-body-bg, #fff)'
                                }}
                              ></i>
                            </span>
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

      {/* Modal de Detalhes Premium do Cliente */}
      {selectedClienteDetails && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }} onClick={() => setSelectedClienteDetails(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content card-premium border border-light">
              <div className="modal-header border-bottom border-light px-4 py-3">
                <div>
                  <h5 className="modal-title fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-person-badge"></i> Detalhes do Cliente
                  </h5>
                  <span className="text-muted fs-8">CPF: {selectedClienteDetails.cpf}</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedClienteDetails(null)}></button>
              </div>
              
              <div className="modal-body px-4 py-3">
                <div className="row g-4">
                  {/* Coluna 1 (Identificação & Contato) */}
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3 pb-1 border-bottom d-flex align-items-center">
                      <i className="bi bi-person-vcard me-2"></i> Identificação & Contato
                    </h6>
                    <div className="fs-7">
                      <div className="mb-2"><strong>Nome Completo:</strong> {selectedClienteDetails.nome}</div>
                      <div className="mb-2"><strong>CPF:</strong> <code>{selectedClienteDetails.cpf}</code></div>
                      <div className="mb-2"><strong>E-mail:</strong> {selectedClienteDetails.email}</div>
                      <div className="mb-2">
                        <strong>Data de Nascimento:</strong> {formatDateSafe(selectedClienteDetails.data_nascimento)}
                      </div>
                      <div className="mb-2 d-flex align-items-center gap-2">
                        <strong>Status Financeiro:</strong>
                        {selectedClienteDetails.inadimplente ? (
                          <span className="badge bg-danger d-inline-flex align-items-center gap-1">
                            <i className="bi bi-exclamation-triangle-fill fs-9"></i> INADIMPLENTE
                          </span>
                        ) : (
                          <span className="badge bg-success d-inline-flex align-items-center gap-1">
                            <i className="bi bi-check-circle-fill fs-9"></i> REGULAR
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Coluna 2 (CNH & Endereço) */}
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-3 pb-1 border-bottom d-flex align-items-center">
                      <i className="bi bi-card-text me-2"></i> Habilitação & Endereço
                    </h6>
                    <div className="fs-7">
                      <div className="mb-2"><strong>Número da CNH:</strong> <code>{selectedClienteDetails.cnh_numero}</code></div>
                      <div className="mb-2"><strong>Categoria:</strong> <span className="badge bg-secondary">{selectedClienteDetails.cnh_categoria}</span></div>
                      <div className="mb-2">
                        <strong>Validade da CNH:</strong> {formatDateSafe(selectedClienteDetails.cnh_validade)}
                      </div>
                      <div className="mt-3 pt-2 border-top">
                        <div className="mb-1"><strong>Rua:</strong> {selectedClienteDetails.endereco_rua}, N° {selectedClienteDetails.endereco_numero}</div>
                        <div className="mb-1"><strong>Bairro:</strong> {selectedClienteDetails.endereco_bairro}</div>
                        <div className="mb-1"><strong>Cidade/Estado:</strong> {selectedClienteDetails.endereco_cidade} - {selectedClienteDetails.endereco_estado}</div>
                        <div className="mb-1"><strong>CEP:</strong> {selectedClienteDetails.endereco_cep}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer border-top border-light px-4 py-3">
                <button type="button" className="btn btn-primary px-4 py-2 rounded-3" onClick={() => setSelectedClienteDetails(null)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmTarget && (() => {
        const targetCliente = clientes.find(c => c.cpf === deleteConfirmTarget);
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
                  <p className="mb-2">Tem certeza de que deseja excluir o cliente abaixo?</p>
                  {targetCliente && (
                    <div className="p-3 bg-light rounded-3 mb-3 border">
                      <div className="mb-1"><strong>Nome:</strong> {targetCliente.nome}</div>
                      <div><strong>CPF:</strong> <code>{targetCliente.cpf}</code></div>
                    </div>
                  )}
                  <div className="text-muted fs-8">Esta ação removerá permanentemente o registro do sistema e todas as suas locações vinculadas.</div>
                </div>
                <div className="modal-footer border-top border-light gap-2">
                  <button type="button" className="btn btn-outline-secondary px-4 py-2 rounded-3" onClick={() => setDeleteConfirmTarget(null)}>
                    Voltar
                  </button>
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

export default Clientes;
