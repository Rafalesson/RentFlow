import React, { useState, useEffect } from 'react';
import {
  getCategorias, createCategoria, deleteCategoria,
  getSeguros, createSeguro, deleteSeguro,
  getFuncionarios, createFuncionario, deleteFuncionario
} from '../services/auxService';
import { getCurrentUser, getLoginSuggestion } from '../services/authService';
import type { Categoria, Seguro, Funcionario, CargoFuncionario } from '../types';

const TabelasAuxiliares: React.FC = () => {
  const currentUser = getCurrentUser();
  const isGerente = currentUser?.cargo === 'gerente';

  const [activeSubTab, setActiveSubTab] = useState<'categorias' | 'seguros' | 'funcionarios'>('categorias');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Lists
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [selectedFuncDetails, setSelectedFuncDetails] = useState<Funcionario | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'categoria' | 'seguro' | 'funcionario';
    id: number;
    name: string;
  } | null>(null);

  // Esc key closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFuncDetails(null);
        setDeleteConfirmTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFuncDetails, deleteConfirmTarget]);

  const getInitials = (fullName: string) => {
    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Form states
  const [catForm, setCatForm] = useState({ nome: '', valor_diaria: '' });
  const [segForm, setSegForm] = useState({ nome: '', descricao_cobertura: '', valor_diario: '' });
  const [funcForm, setFuncForm] = useState({ 
    nome: '', 
    cpf: '', 
    cargo: 'atendente' as CargoFuncionario,
    email: '',
    login: '',
    senha: ''
  });

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cData, sData, fData] = await Promise.all([
        getCategorias(),
        getSeguros(),
        isGerente ? getFuncionarios() : Promise.resolve([]),
      ]);
      setCategorias(cData);
      setSeguros(sData);
      if (isGerente) {
        setFuncionarios(fData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao carregar tabelas auxiliares.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await createCategoria({
        nome: catForm.nome,
        valor_diaria: Number(catForm.valor_diaria),
      });
      setSuccess('Categoria criada com sucesso!');
      setCatForm({ nome: '', valor_diaria: '' });
      loadAll();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao criar categoria.');
    }
  };

  const handleSegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await createSeguro({
        nome: segForm.nome,
        descricao_cobertura: segForm.descricao_cobertura,
        valor_diario: Number(segForm.valor_diario),
      });
      setSuccess('Seguro criado com sucesso!');
      setSegForm({ nome: '', descricao_cobertura: '', valor_diario: '' });
      loadAll();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao criar seguro.');
    }
  };

  const handleSuggestLogin = async () => {
    if (!funcForm.nome.trim()) {
      setError('Por favor, preencha o Nome Completo primeiro para gerar uma sugestão.');
      return;
    }
    setError(null);
    try {
      const suggestion = await getLoginSuggestion(funcForm.nome);
      setFuncForm(prev => ({ ...prev, login: suggestion }));
    } catch (err: any) {
      console.error(err);
      setError('Erro ao obter sugestão de login.');
    }
  };

  const handleFuncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await createFuncionario({
        nome: funcForm.nome,
        cpf: funcForm.cpf,
        cargo: funcForm.cargo,
        email: funcForm.email,
        login: funcForm.login,
        senha: funcForm.senha || undefined,
      });
      setSuccess('Funcionário cadastrado com sucesso!');
      setFuncForm({ nome: '', cpf: '', cargo: 'atendente', email: '', login: '', senha: '' });
      loadAll();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao cadastrar funcionário.');
    }
  };

  const handleDeleteCat = (id: number) => {
    const cat = categorias.find(c => c.id_cat === id);
    setDeleteConfirmTarget({
      type: 'categoria',
      id,
      name: cat ? cat.nome : String(id)
    });
  };

  const handleDeleteSeg = (id: number) => {
    const seg = seguros.find(s => s.id_seguro === id);
    setDeleteConfirmTarget({
      type: 'seguro',
      id,
      name: seg ? seg.nome : String(id)
    });
  };

  const handleDeleteFunc = (id: number) => {
    const func = funcionarios.find(f => f.id_func === id);
    setDeleteConfirmTarget({
      type: 'funcionario',
      id,
      name: func ? func.nome : String(id)
    });
  };

  const executeDeleteConfirm = async () => {
    if (!deleteConfirmTarget) return;
    const { type, id } = deleteConfirmTarget;
    setDeleteConfirmTarget(null);
    setError(null);
    try {
      if (type === 'categoria') {
        await deleteCategoria(id);
        setSuccess('Categoria excluída!');
      } else if (type === 'seguro') {
        await deleteSeguro(id);
        setSuccess('Seguro excluído!');
      } else if (type === 'funcionario') {
        await deleteFuncionario(id);
        setSuccess('Funcionário excluído!');
      }
      loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao excluir.');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h1 className="fw-bold text-dark mb-1 page-title">Tabelas Auxiliares</h1>
        <p className="text-muted page-subtitle mb-0">Cadastros complementares para o funcionamento do sistema</p>
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

      {/* Sub tabs as Pills */}
      <ul className="nav nav-pills gap-2 mb-4">
        <li className="nav-item">
          <button
            className={`nav-link px-4 py-2 fw-semibold rounded-3 border-0 ${
              activeSubTab === 'categorias' 
                ? 'active text-white' 
                : 'text-secondary hover-bg-light'
            }`}
            style={{
              background: activeSubTab === 'categorias' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : undefined,
              transition: 'all 0.2s'
            }}
            onClick={() => {
              setActiveSubTab('categorias');
              setError(null);
              setSuccess(null);
            }}
          >
            Categorias
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link px-4 py-2 fw-semibold rounded-3 border-0 ${
              activeSubTab === 'seguros' 
                ? 'active text-white' 
                : 'text-secondary hover-bg-light'
            }`}
            style={{
              background: activeSubTab === 'seguros' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : undefined,
              transition: 'all 0.2s'
            }}
            onClick={() => {
              setActiveSubTab('seguros');
              setError(null);
              setSuccess(null);
            }}
          >
            Seguros
          </button>
        </li>
        {isGerente && (
          <li className="nav-item">
            <button
              className={`nav-link px-4 py-2 fw-semibold rounded-3 border-0 ${
                activeSubTab === 'funcionarios' 
                  ? 'active text-white' 
                  : 'text-secondary hover-bg-light'
              }`}
              style={{
                background: activeSubTab === 'funcionarios' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : undefined,
                transition: 'all 0.2s'
              }}
              onClick={() => {
                setActiveSubTab('funcionarios');
                setError(null);
                setSuccess(null);
              }}
            >
              Funcionários
            </button>
          </li>
        )}
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {/* Form col */}
          <div className="col-lg-4">
            <div className="card card-premium p-4">
              {activeSubTab === 'categorias' && (
                <>
                  <h5 className="fw-bold text-dark mb-3">Nova Categoria</h5>
                  <form onSubmit={handleCatSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Nome da Categoria</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: SUV, Sedan, Luxo"
                        value={catForm.nome}
                        onChange={(e) => setCatForm({ ...catForm, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Valor da Diária (R$)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        min={0.01}
                        step="0.01"
                        value={catForm.valor_diaria}
                        onChange={(e) => setCatForm({ ...catForm, valor_diaria: e.target.value })}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-gradient w-100 py-2">
                      Criar Categoria
                    </button>
                  </form>
                </>
              )}

              {activeSubTab === 'seguros' && (
                <>
                  <h5 className="fw-bold text-dark mb-3">Novo Seguro</h5>
                  <form onSubmit={handleSegSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Nome do Seguro</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Cobertura Total"
                        value={segForm.nome}
                        onChange={(e) => setSegForm({ ...segForm, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Valor Diário (R$)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0.00"
                        min={0.01}
                        step="0.01"
                        value={segForm.valor_diario}
                        onChange={(e) => setSegForm({ ...segForm, valor_diario: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Cobertura (Descrição)</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Descreva o que o seguro cobre..."
                        value={segForm.descricao_cobertura}
                        onChange={(e) => setSegForm({ ...segForm, descricao_cobertura: e.target.value })}
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-gradient w-100 py-2">
                      Criar Seguro
                    </button>
                  </form>
                </>
              )}

              {activeSubTab === 'funcionarios' && isGerente && (
                <>
                  <h5 className="fw-bold text-dark mb-3">Novo Funcionário</h5>
                  <form onSubmit={handleFuncSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Nome Completo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={funcForm.nome}
                        onChange={(e) => setFuncForm({ ...funcForm, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">CPF</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="000.000.000-00"
                        value={funcForm.cpf}
                        onChange={(e) => setFuncForm({ ...funcForm, cpf: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Cargo</label>
                      <select
                        className="form-select"
                        value={funcForm.cargo}
                        onChange={(e) => setFuncForm({ ...funcForm, cargo: e.target.value as CargoFuncionario })}
                        required
                      >
                        <option value="atendente">Atendente</option>
                        <option value="gerente">Gerente</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="email@rentflow.com"
                        value={funcForm.email}
                        onChange={(e) => setFuncForm({ ...funcForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Login (Username)</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ex: joao.silva"
                          value={funcForm.login}
                          onChange={(e) => setFuncForm({ ...funcForm, login: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={handleSuggestLogin}
                          title="Sugerir login com base no nome"
                        >
                          <i className="bi bi-lightbulb"></i> Sugerir
                        </button>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Senha (Opcional)</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Em branco para 'senha123'"
                        value={funcForm.senha}
                        onChange={(e) => setFuncForm({ ...funcForm, senha: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="btn btn-gradient w-100 py-2">
                      Cadastrar Funcionário
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* List col */}
          <div className="col-lg-8">
            <div className="card card-premium p-4">
              {activeSubTab === 'categorias' && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Valor Diária</th>
                        <th className="text-end">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categorias.map((c) => (
                        <tr key={c.id_cat}>
                          <td><code>#{c.id_cat}</code></td>
                          <td className="fw-bold">{c.nome}</td>
                          <td>R$ {parseFloat(String(c.valor_diaria)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="text-end">
                            {isGerente ? (
                              <button 
                                className="btn btn-outline-danger btn-sm" 
                                onClick={() => handleDeleteCat(c.id_cat)}
                                title="Excluir categoria"
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

              {activeSubTab === 'seguros' && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Nome / Cobertura</th>
                        <th>Valor Diário</th>
                        <th className="text-end">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seguros.map((s) => (
                        <tr key={s.id_seguro}>
                          <td><code>#{s.id_seguro}</code></td>
                          <td>
                            <span className="fw-bold">{s.nome}</span>
                            <div className="fs-8 text-muted">{s.descricao_cobertura}</div>
                          </td>
                          <td>R$ {parseFloat(String(s.valor_diario)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="text-end">
                            {isGerente ? (
                              <button 
                                className="btn btn-outline-danger btn-sm" 
                                onClick={() => handleDeleteSeg(s.id_seguro)}
                                title="Excluir seguro"
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

              {activeSubTab === 'funcionarios' && isGerente && (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Nome / CPF / Contato</th>
                        <th>Cargo</th>
                        <th className="text-end">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {funcionarios.map((f) => (
                        <tr key={f.id_func} className="align-middle cursor-pointer" onClick={() => setSelectedFuncDetails(f)}>
                          <td><code>#{f.id_func}</code></td>
                          <td>
                            <span className="fw-bold">{f.nome}</span>
                            <div className="fs-8 text-muted">CPF: {f.cpf}</div>
                            <div className="fs-8 text-muted">Email: {f.email} | Login: @{f.login}</div>
                          </td>
                          <td>
                            <span className={`badge ${f.cargo === 'gerente' ? 'bg-primary-subtle text-primary border border-primary border-opacity-25' : 'bg-secondary-subtle text-secondary border border-secondary border-opacity-25'} px-3 py-1.5 rounded-pill`}>
                              {f.cargo.toUpperCase()}
                            </span>
                          </td>
                          <td className="text-end">
                            {isGerente ? (
                              <button 
                                className="btn btn-outline-danger btn-sm" 
                                onClick={(e) => { e.stopPropagation(); handleDeleteFunc(f.id_func); }}
                                title="Excluir funcionário"
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
          </div>
        </div>
      )}

      {/* Modal de Detalhes Premium do Funcionário */}
      {selectedFuncDetails && (() => {
        const f = selectedFuncDetails;
        return (
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }} onClick={() => setSelectedFuncDetails(null)}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content card-premium border border-light">
                <div className="modal-header border-bottom border-light px-4 py-3">
                  <div>
                    <h5 className="modal-title fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-person-badge"></i> Detalhes do Funcionário
                    </h5>
                    <span className="text-muted fs-8">ID: #{f.id_func}</span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedFuncDetails(null)}></button>
                </div>
                
                <div className="modal-body bg-light-subtle px-4 py-4">
                  <div className="row g-4">
                    {/* Perfil */}
                    <div className="col-md-4">
                      <div className="detail-card h-100 d-flex flex-column align-items-center justify-content-center text-center p-4">
                        <div 
                          className="position-relative overflow-hidden mb-3 d-flex align-items-center justify-content-center border"
                          style={{
                            width: '130px',
                            height: '130px',
                            borderRadius: '50%',
                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
                            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                            borderWidth: '3px'
                          }}
                        >
                          {f.foto_perfil ? (
                            <img 
                              src={f.foto_perfil} 
                              alt="Foto de perfil" 
                              className="w-100 h-100 object-fit-cover"
                            />
                          ) : (
                            <div 
                              className="d-flex align-items-center justify-content-center w-100 h-100 text-white fw-bold"
                              style={{ 
                                fontSize: '3rem',
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                              }}
                            >
                              {getInitials(f.nome)}
                            </div>
                          )}
                        </div>
                        <span className={`badge ${f.cargo === 'gerente' ? 'bg-primary-subtle text-primary border border-primary border-opacity-25' : 'bg-secondary-subtle text-secondary border border-secondary border-opacity-25'} px-3 py-1.5 rounded-pill`}>
                          {f.cargo.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Ficha de Cadastro */}
                    <div className="col-md-8">
                      <div className="detail-card h-100">
                        <h6 className="detail-section-title">
                          <i className="bi bi-file-earmark-person"></i> Ficha Cadastral
                        </h6>
                        <div className="row g-3">
                          <div className="col-12">
                            <span className="detail-label">Nome Completo</span>
                            <div className="detail-value fw-semibold fs-5">{f.nome}</div>
                          </div>
                          <div className="col-6">
                            <span className="detail-label">CPF</span>
                            <div className="detail-value"><code>{f.cpf}</code></div>
                          </div>
                          <div className="col-6">
                            <span className="detail-label">ID de Registro</span>
                            <div className="detail-value text-muted">#{f.id_func}</div>
                          </div>
                          <div className="col-12">
                            <span className="detail-label">E-mail</span>
                            <div className="detail-value text-break">{f.email}</div>
                          </div>
                          <div className="col-12 mt-4 pt-3 border-top">
                            <span className="detail-label">Login (Usuário)</span>
                            <div className="detail-value fw-medium mt-1">
                              <span className="badge bg-light text-dark border px-3 py-2 fs-6 text-lowercase">
                                <i className="bi bi-person me-2 text-muted"></i>@{f.login}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-top border-light px-4 py-3">
                  <button type="button" className="btn btn-primary px-4 py-2 rounded-3" onClick={() => setSelectedFuncDetails(null)}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmTarget && (() => {
        const { type, name } = deleteConfirmTarget;
        const typeLabels: Record<string, string> = {
          categoria: 'Categoria',
          seguro: 'Plano de Seguro',
          funcionario: 'Funcionário',
        };
        const typeLabel = typeLabels[type] || type;

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
                  <p className="mb-2">Tem certeza de que deseja excluir o item abaixo?</p>
                  <div className="p-3 bg-light rounded-3 mb-3 border">
                    <div className="mb-1"><strong>Tipo:</strong> {typeLabel}</div>
                    <div><strong>Nome/Descrição:</strong> <code>{name}</code></div>
                  </div>
                  <div className="text-muted fs-8">Esta ação removerá permanentemente o registro do sistema. Dados dependentes podem ser afetados.</div>
                </div>
                <div className="modal-footer border-top border-light gap-2">
                  <button type="button" className="btn btn-outline-secondary px-4 py-2 rounded-3" onClick={() => setDeleteConfirmTarget(null)}>
                    Voltar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger px-4 py-2 rounded-3" 
                    onClick={executeDeleteConfirm}
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

export default TabelasAuxiliares;
