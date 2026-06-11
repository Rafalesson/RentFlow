import React, { useState, useRef, useEffect } from 'react';
import { updateProfile } from '../services/authService';
import type { Funcionario } from '../types';

interface ConfiguracoesProps {
  user: Funcionario;
  onProfileUpdated: (updatedUser: Funcionario) => void;
}

const Configuracoes: React.FC<ConfiguracoesProps> = ({ user, onProfileUpdated }) => {
  const [nome, setNome] = useState(user.nome);
  const [cpf, setCpf] = useState(user.cpf);
  const [email, setEmail] = useState(user.email);
  const [login] = useState(user.login); // Readonly
  
  const [senhaAntiga, setSenhaAntiga] = useState('');
  const [showSenhaAntiga, setShowSenhaAntiga] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmSenha, setShowConfirmSenha] = useState(false);
  
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(user.foto_perfil || null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local states if user prop changes
  useEffect(() => {
    setNome(user.nome);
    setCpf(user.cpf);
    setEmail(user.email);
    setFotoPerfil(user.foto_perfil || null);
  }, [user]);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for base64 storage
      setError('A foto selecionada é muito grande. O limite máximo é 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoPerfil(reader.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    setFotoPerfil(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (senha) {
      if (!senhaAntiga) {
        setError('A senha antiga é obrigatória para alterar a senha.');
        return;
      }
      if (senha !== confirmSenha) {
        setError('As senhas informadas não coincidem.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload: Partial<Funcionario> & { senha_antiga?: string } = {
        nome,
        cpf,
        email,
        foto_perfil: fotoPerfil
      };

      if (senha) {
        payload.senha = senha;
        payload.senha_antiga = senhaAntiga;
      }

      const updatedUser = await updateProfile(payload);
      onProfileUpdated(updatedUser);
      setSuccess('Perfil atualizado com sucesso!');
      setSenhaAntiga('');
      setSenha('');
      setConfirmSenha('');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Erro ao atualizar as configurações do perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h1 className="fw-bold text-dark mb-1 page-title">Configurações de Perfil</h1>
        <p className="text-muted page-subtitle mb-0">Gerencie suas informações e credenciais de acesso</p>
      </div>

      {success && (
        <div className="alert alert-success alert-dismissible fade show card-premium border-success border-opacity-25" role="alert">
          <i className="bi bi-check-circle-fill me-2 text-success"></i>
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show card-premium border-danger border-opacity-25" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-xl-9 col-lg-10">
          <div className="card card-premium p-4">
            
            {/* Cabeçalho do Perfil (Avatar + Info rápida) */}
            <div className="d-flex flex-column flex-sm-row align-items-center gap-4 pb-4 mb-4 border-bottom">
              <div 
                className="position-relative overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                  background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  border: '4px solid white'
                }}
              >
                {fotoPerfil ? (
                  <img 
                    src={fotoPerfil} 
                    alt="Foto de perfil" 
                    className="w-100 h-100 object-fit-cover"
                  />
                ) : (
                  <div 
                    className="d-flex align-items-center justify-content-center w-100 h-100 text-primary fw-bold"
                    style={{ 
                      fontSize: '3rem',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white'
                    }}
                  >
                    {getInitials(nome)}
                  </div>
                )}
              </div>
              
              <div className="text-center text-sm-start flex-grow-1">
                <h4 className="fw-bold text-dark mb-1">{nome || 'Usuário'}</h4>
                <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-sm-start align-items-center mb-3">
                  <span className={`badge ${user.cargo === 'gerente' ? 'bg-primary' : 'bg-secondary'} px-3 py-1.5 rounded-pill`}>
                    {user.cargo.toUpperCase()}
                  </span>
                  <span className="text-muted fs-8">@{login}</span>
                </div>
                
                <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-sm-start">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*"
                    className="d-none"
                  />
                  <button 
                    type="button" 
                    className="btn btn-outline-primary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1"
                    onClick={triggerFileInput}
                    disabled={loading}
                  >
                    <i className="bi bi-upload"></i> Alterar Foto
                  </button>
                  {fotoPerfil && (
                    <button 
                      type="button" 
                      className="btn btn-outline-danger btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1"
                      onClick={handleRemovePhoto}
                      disabled={loading}
                    >
                      <i className="bi bi-trash"></i> Remover Foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Formulário de Configurações */}
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12">
                  <h5 className="fw-bold text-primary mb-3"><i className="bi bi-person-vcard me-2"></i>Informações Pessoais</h5>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-bold">Nome Completo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label fw-bold">CPF</label>
                  <input
                    type="text"
                    className="form-control"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">E-mail</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Login (Não Editável)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-lock-fill text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0 ps-0 text-muted"
                      value={login}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="col-12 mt-4 pt-3 border-top">
                  <h5 className="fw-bold text-primary mb-3"><i className="bi bi-shield-lock me-2"></i>Segurança e Senha</h5>
                  <p className="text-muted fs-7 mb-4">Para alterar sua senha, é obrigatório informar a senha atual.</p>
                </div>

                <div className="col-md-12 mb-2">
                  <label className="form-label fw-bold">Senha Antiga</label>
                  <div className="input-group">
                    <input
                      type={showSenhaAntiga ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Informe sua senha atual"
                      value={senhaAntiga}
                      onChange={(e) => setSenhaAntiga(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowSenhaAntiga(!showSenhaAntiga)}
                      disabled={loading}
                    >
                      <i className={`bi ${showSenhaAntiga ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Nova Senha</label>
                  <div className="input-group">
                    <input
                      type={showSenha ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Deixe em branco para manter a atual"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowSenha(!showSenha)}
                      disabled={loading}
                    >
                      <i className={`bi ${showSenha ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Confirmar Nova Senha</label>
                  <div className="input-group">
                    <input
                      type={showConfirmSenha ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Confirme sua nova senha"
                      value={confirmSenha}
                      onChange={(e) => setConfirmSenha(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowConfirmSenha(!showConfirmSenha)}
                      disabled={loading}
                    >
                      <i className={`bi ${showConfirmSenha ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top border-light d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-gradient px-5 py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-save2"></i>
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
