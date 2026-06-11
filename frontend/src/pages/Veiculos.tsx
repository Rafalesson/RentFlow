import React, { useState, useEffect } from 'react';
import { getVeiculos, createVeiculo, updateVeiculo, deleteVeiculo } from '../services/veiculoService';
import { getCategorias } from '../services/auxService';
import { getCurrentUser } from '../services/authService';
import type { Veiculo, Categoria } from '../types';

const cleanNumericString = (val: string): string => {
  if (/^0\d/.test(val)) {
    return val.replace(/^0+/, '');
  }
  return val;
};

const Veiculos: React.FC = () => {
  const currentUser = getCurrentUser();
  const isGerente = currentUser?.cargo === 'gerente';
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedVeiculoDetails, setSelectedVeiculoDetails] = useState<Veiculo | null>(null);

  // Search and filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('todas');
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<string | null>(null);

  // Esc key closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedVeiculoDetails(null);
        setDeleteConfirmTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVeiculoDetails, deleteConfirmTarget]);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState<any>({
    placa: '',
    id_cat: 0,
    renavam: '',
    marca: '',
    modelo: '',
    cor: '',
    ano_fabricacao: String(new Date().getFullYear()),
    tipo_combustivel: 'flex',
    km_atual: '0',
    nivel_combustivel: '100',
    status: 'disponivel',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vData, cData] = await Promise.all([getVeiculos(), getCategorias()]);
      setVeiculos(vData);
      setCategorias(cData);

      // Set default category ID in form data if options exist
      if (cData.length > 0) {
        setFormData((prev: any) => ({
          ...prev,
          id_cat: cData[0].id_cat,
        }));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao carregar dados dos veículos.');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalVal = value;
    if (name === 'km_atual' || name === 'nivel_combustivel' || name === 'ano_fabricacao') {
      finalVal = cleanNumericString(value);
    }
    setFormData((prev: any) => ({
      ...prev,
      [name]: name === 'id_cat' ? Number(finalVal) : finalVal,
    }));
  };

  const handleOpenCreate = () => {
    setIsEdit(false);
    setFormData({
      placa: '',
      id_cat: categorias.length > 0 ? categorias[0].id_cat : 0,
      renavam: '',
      marca: '',
      modelo: '',
      cor: '',
      ano_fabricacao: String(new Date().getFullYear()),
      tipo_combustivel: 'flex',
      km_atual: '0',
      nivel_combustivel: '100',
      status: 'disponivel',
    });
    setShowForm(true);
  };

  const handleOpenEdit = (veiculo: Veiculo) => {
    setIsEdit(true);
    setFormData({
      ...veiculo,
      ano_fabricacao: String(veiculo.ano_fabricacao),
      km_atual: String(veiculo.km_atual),
      nivel_combustivel: String(veiculo.nivel_combustivel),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...formData,
        id_cat: Number(formData.id_cat),
        ano_fabricacao: Number(formData.ano_fabricacao),
        km_atual: Number(formData.km_atual),
        nivel_combustivel: Number(formData.nivel_combustivel),
      };
      if (isEdit) {
        const { placa, ...updatePayload } = payload;
        await updateVeiculo(placa, updatePayload);
        setSuccess('Veículo atualizado com sucesso!');
      } else {
        await createVeiculo(payload);
        setSuccess('Veículo cadastrado com sucesso!');
      }
      setShowForm(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao salvar veículo.');
    }
  };

  const handleDelete = (placa: string) => {
    setDeleteConfirmTarget(placa);
  };

  const handleDeleteConfirm = async (placa: string) => {
    setDeleteConfirmTarget(null);
    setError(null);
    setSuccess(null);
    try {
      await deleteVeiculo(placa);
      setSuccess('Veículo removido com sucesso!');
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao excluir veículo.');
    }
  };

  const getCategoryName = (id_cat: number) => {
    const cat = categorias.find((c) => c.id_cat === id_cat);
    return cat ? cat.nome : 'Desconhecida';
  };

  const filteredVeiculos = veiculos.filter(
    (v) => {
      const matchesSearch = v.modelo.toLowerCase().includes(search.toLowerCase()) ||
                            v.marca.toLowerCase().includes(search.toLowerCase()) ||
                            v.placa.includes(search);
      const matchesStatus = statusFilter === 'todos' || v.status === statusFilter;
      const matchesCategoria = categoriaFilter === 'todas' || String(v.id_cat) === categoriaFilter;
      return matchesSearch && matchesStatus && matchesCategoria;
    }
  );

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="fw-bold text-dark mb-1 page-title">Veículos</h1>
          <p className="text-muted page-subtitle mb-0">Gerencie a frota de automóveis da locadora</p>
        </div>
        {!showForm && (
          <button className="btn btn-gradient py-2 px-3 px-md-4 rounded-3 d-flex align-items-center" onClick={handleOpenCreate} title="Novo Veículo">
            <i className="bi bi-car-front-fill fs-5"></i>
            <span className="d-none d-md-inline ms-2">Novo Veículo</span>
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
          <h3 className="fw-bold mb-4">{isEdit ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-bold">Placa</label>
                <input
                  type="text"
                  name="placa"
                  className="form-control text-uppercase"
                  placeholder="AAA-0000"
                  maxLength={8}
                  value={formData.placa}
                  onChange={handleInputChange}
                  disabled={isEdit}
                  style={{ cursor: isEdit ? 'not-allowed' : 'default' }}
                  required
                />
              </div>
              <div className="col-md-5">
                <label className="form-label fw-bold">Categoria</label>
                <select
                  name="id_cat"
                  className="form-select"
                  value={formData.id_cat}
                  onChange={handleInputChange}
                  required
                >
                  {categorias.length === 0 ? (
                    <option value="">Nenhuma categoria cadastrada</option>
                  ) : (
                    categorias.map((c) => (
                      <option key={c.id_cat} value={c.id_cat}>
                        {c.nome} (Diária: R$ {parseFloat(String(c.valor_diaria)).toFixed(2)})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Renavam</label>
                <input
                  type="text"
                  name="renavam"
                  className="form-control"
                  maxLength={11}
                  value={formData.renavam}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Marca</label>
                <input
                  type="text"
                  name="marca"
                  className="form-control"
                  placeholder="Ex: Fiat"
                  value={formData.marca}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Modelo</label>
                <input
                  type="text"
                  name="modelo"
                  className="form-control"
                  placeholder="Ex: Uno"
                  value={formData.modelo}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Cor</label>
                <input
                  type="text"
                  name="cor"
                  className="form-control"
                  placeholder="Ex: Preto"
                  value={formData.cor}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Ano de Fabricação</label>
                <input
                  type="number"
                  name="ano_fabricacao"
                  className="form-control"
                  value={formData.ano_fabricacao}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Combustível</label>
                <select
                  name="tipo_combustivel"
                  className="form-select"
                  value={formData.tipo_combustivel}
                  onChange={handleInputChange}
                  required
                >
                  <option value="gasolina">Gasolina</option>
                  <option value="etanol">Etanol</option>
                  <option value="flex">Flex</option>
                  <option value="diesel">Diesel</option>
                  <option value="eletrico">Elétrico</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">KM Atual</label>
                <div className="input-group">
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-end-0"
                    onClick={() => setFormData((prev: any) => {
                      const currentVal = Number(prev.km_atual) || 0;
                      const newVal = Math.max(0, currentVal - 10);
                      return { ...prev, km_atual: String(newVal) };
                    })}
                  >
                    <i className="bi bi-dash-lg"></i>
                  </button>
                  <input
                    type="number"
                    name="km_atual"
                    className="form-control text-center"
                    min={0}
                    value={formData.km_atual}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0"
                    onClick={() => setFormData((prev: any) => {
                      const currentVal = Number(prev.km_atual) || 0;
                      const newVal = currentVal + 10;
                      return { ...prev, km_atual: String(newVal) };
                    })}
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-bold">Nível de Combustível (%)</label>
                <div className="input-group">
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-end-0"
                    onClick={() => setFormData((prev: any) => {
                      const currentVal = Number(prev.nivel_combustivel) || 0;
                      const newVal = Math.max(0, currentVal - 5);
                      return { ...prev, nivel_combustivel: String(newVal) };
                    })}
                  >
                    <i className="bi bi-dash-lg"></i>
                  </button>
                  <input
                    type="number"
                    name="nivel_combustivel"
                    className="form-control text-center"
                    min={0}
                    max={100}
                    value={formData.nivel_combustivel}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0"
                    onClick={() => setFormData((prev: any) => {
                      const currentVal = Number(prev.nivel_combustivel) || 0;
                      const newVal = Math.min(100, currentVal + 5);
                      return { ...prev, nivel_combustivel: String(newVal) };
                    })}
                  >
                    <i className="bi bi-plus-lg"></i>
                  </button>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Status do Veículo</label>
                <select
                  name="status"
                  className="form-select"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="disponivel">Disponível</option>
                  <option value="locado">Locado</option>
                  <option value="em_manutencao">Em Manutenção</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="mt-4 d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-gradient px-5 py-2">
                {isEdit ? 'Salvar Alterações' : 'Cadastrar Veículo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  ) : (
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
                    placeholder="Buscar por placa, marca ou modelo..."
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
                  <option value="todos">Todos os Status</option>
                  <option value="disponivel">Disponível</option>
                  <option value="locado">Locado</option>
                  <option value="em_manutencao">Em Manutenção</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold fs-7 text-muted">Filtrar por Categoria</label>
                <select 
                  className="form-select"
                  value={categoriaFilter}
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                >
                  <option value="todas">Todas as Categorias</option>
                  {categorias.map(c => (
                    <option key={c.id_cat} value={String(c.id_cat)}>{c.nome}</option>
                  ))}
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
          ) : filteredVeiculos.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-car-front fs-1"></i>
              <p className="mt-2">Nenhum veículo cadastrado ou encontrado.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Placa</th>
                    <th>Veículo</th>
                    <th>Categoria</th>
                    <th>Combustível</th>
                    <th>KM / Comb.</th>
                    <th>Status</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVeiculos.map((v) => (
                    <tr key={v.placa} className="align-middle cursor-pointer" onClick={() => setSelectedVeiculoDetails(v)}>
                      <td><code>{v.placa}</code></td>
                      <td>
                        <span className="fw-bold">{v.marca} {v.modelo}</span>
                        <div className="fs-8 text-muted">Cor: {v.cor} | Ano: {v.ano_fabricacao}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{getCategoryName(v.id_cat)}</span>
                      </td>
                      <td>
                        <span className="badge bg-secondary">{v.tipo_combustivel.toUpperCase()}</span>
                      </td>
                      <td>
                        <div className="fw-semibold fs-7">{Number(v.km_atual).toLocaleString('pt-BR')} KM</div>
                        <div className="progress mt-1" style={{ height: '6px', width: '100px' }}>
                          <div
                            className={`progress-bar ${Number(v.nivel_combustivel) < 20 ? 'bg-danger' : 'bg-success'}`}
                            role="progressbar"
                            style={{ width: `${v.nivel_combustivel}%` }}
                          ></div>
                        </div>
                        <span className="fs-8 text-muted">{v.nivel_combustivel}% Comb.</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          v.status === 'disponivel' ? 'bg-success' :
                          v.status === 'locado' ? 'bg-info' :
                          v.status === 'em_manutencao' ? 'bg-warning text-dark' : 'bg-danger'
                        }`}>
                          {v.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-outline-primary btn-sm me-1" onClick={(e) => { e.stopPropagation(); handleOpenEdit(v); }}>
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        {isGerente ? (
                          <button 
                            className="btn btn-outline-danger btn-sm" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(v.placa); }}
                            title="Excluir veículo"
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

      {/* Modal de Detalhes Premium do Veículo */}
      {selectedVeiculoDetails && (() => {
        const v = selectedVeiculoDetails;
        const cat = categorias.find((c) => c.id_cat === v.id_cat);
        return (
          <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }} onClick={() => setSelectedVeiculoDetails(null)}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content card-premium border border-light">
                <div className="modal-header border-bottom border-light px-4 py-3">
                  <div>
                    <h5 className="modal-title fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-car-front"></i> Detalhes do Veículo
                    </h5>
                    <span className="text-muted fs-8">Placa: {v.placa}</span>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedVeiculoDetails(null)}></button>
                </div>
                
                <div className="modal-body bg-light-subtle px-4 py-4">
                  <div className="row g-4">
                    {/* Dados do Carro */}
                    <div className="col-md-6">
                      <div className="detail-card h-100">
                        <h6 className="detail-section-title">
                          <i className="bi bi-info-circle"></i> Informações do Veículo
                        </h6>
                        <div className="row g-3">
                          <div className="col-6">
                            <span className="detail-label">Marca</span>
                            <div className="detail-value">{v.marca}</div>
                          </div>
                          <div className="col-6">
                            <span className="detail-label">Modelo</span>
                            <div className="detail-value">{v.modelo}</div>
                          </div>
                          <div className="col-6">
                            <span className="detail-label">Placa</span>
                            <div className="detail-value"><code>{v.placa}</code></div>
                          </div>
                          <div className="col-6">
                            <span className="detail-label">Renavam</span>
                            <div className="detail-value"><code>{v.renavam}</code></div>
                          </div>
                          <div className="col-6">
                            <span className="detail-label">Cor</span>
                            <div className="detail-value">{v.cor}</div>
                          </div>
                          <div className="col-6">
                            <span className="detail-label">Ano Fab.</span>
                            <div className="detail-value">{v.ano_fabricacao}</div>
                          </div>
                          <div className="col-12 mt-4 pt-3 border-top">
                            <span className="detail-label mb-2">Categoria e Diária</span>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-medium text-primary fs-5">{cat ? cat.nome : '—'}</span>
                              {cat && <span className="badge bg-primary-subtle text-primary py-2 px-3">R$ {parseFloat(String(cat.valor_diaria)).toFixed(2)} / dia</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Métricas & Estado */}
                    <div className="col-md-6">
                      <div className="detail-card h-100">
                        <h6 className="detail-section-title">
                          <i className="bi bi-speedometer2"></i> Métricas & Estado
                        </h6>
                        <div className="row g-3">
                          <div className="col-12">
                            <span className="detail-label">Combustível</span>
                            <div className="detail-value"><span className="badge bg-secondary">{v.tipo_combustivel.toUpperCase()}</span></div>
                          </div>
                          <div className="col-12">
                            <span className="detail-label">Quilometragem Atual</span>
                            <div className="detail-value fs-4 fw-bold">{Number(v.km_atual).toLocaleString('pt-BR')} <span className="fs-6 text-muted fw-normal">KM</span></div>
                          </div>
                          <div className="col-12 mt-3">
                            <span className="detail-label mb-2">Nível de Combustível ({v.nivel_combustivel}%)</span>
                            <div className="progress" style={{ height: '8px' }}>
                              <div
                                className={`progress-bar ${Number(v.nivel_combustivel) < 20 ? 'bg-danger' : 'bg-success'}`}
                                role="progressbar"
                                style={{ width: `${v.nivel_combustivel}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="col-12 mt-4 pt-3 border-top">
                            <span className="detail-label mb-2">Status do Veículo</span>
                            <div>
                              <span className={`badge py-2 px-3 ${
                                v.status === 'disponivel' ? 'bg-success' :
                                v.status === 'locado' ? 'bg-info' :
                                v.status === 'em_manutencao' ? 'bg-warning text-dark' : 'bg-danger'
                              }`}>
                                <i className={`bi me-1 ${
                                  v.status === 'disponivel' ? 'bi-check-circle' :
                                  v.status === 'locado' ? 'bi-car-front' :
                                  v.status === 'em_manutencao' ? 'bi-tools' : 'bi-exclamation-triangle'
                                }`}></i> {v.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer border-top border-light px-4 py-3">
                  <button type="button" className="btn btn-primary px-4 py-2 rounded-3" onClick={() => setSelectedVeiculoDetails(null)}>
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
        const targetVeiculo = veiculos.find(v => v.placa === deleteConfirmTarget);
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
                  <p className="mb-2">Tem certeza de que deseja excluir o veículo abaixo?</p>
                  {targetVeiculo && (
                    <div className="p-3 bg-light rounded-3 mb-3 border">
                      <div className="mb-1"><strong>Modelo:</strong> {targetVeiculo.marca} {targetVeiculo.modelo}</div>
                      <div><strong>Placa:</strong> <code>{targetVeiculo.placa}</code></div>
                    </div>
                  )}
                  <div className="text-muted fs-8">Esta ação removerá permanentemente o veículo e todos os seus registros operacionais associados.</div>
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

export default Veiculos;
