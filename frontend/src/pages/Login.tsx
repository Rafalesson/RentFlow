import React, { useState } from 'react';
import { login } from '../services/authService';
import type { Funcionario } from '../types';

interface LoginProps {
  onLoginSuccess: (user: Funcionario) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(identifier, password);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Falha na autenticação. Verifique suas credenciais e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="d-flex align-items-center justify-content-center w-100" 
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative blurred backgrounds for visual interest */}
      <div 
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)',
          top: '-100px',
          left: '-100px',
          zIndex: 1
        }}
      />
      <div 
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(0,0,0,0) 70%)',
          bottom: '-150px',
          right: '-100px',
          zIndex: 1
        }}
      />

      <div 
        className="card p-4 p-md-5 text-white" 
        style={{ 
          width: '100%', 
          maxWidth: '450px',
          background: 'rgba(30, 41, 59, 0.45)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 2,
          transition: 'transform 0.3s ease'
        }}
      >
        <div className="text-center mb-4">
          <div 
            className="d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px'
            }}
          >
            <i className="bi bi-water text-primary fs-2 bg-gradient text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', WebkitBackgroundClip: 'text' }}></i>
          </div>
          <h2 className="fw-bold tracking-tight mb-1">Bem-vindo ao RentFlow</h2>
          <p className="text-white-50 fs-7">Insira suas credenciais para acessar a plataforma</p>
        </div>

        {error && (
          <div 
            className="alert alert-danger border-0 d-flex align-items-start mb-4" 
            style={{ 
              background: 'rgba(239, 68, 68, 0.15)', 
              color: '#fca5a5',
              borderRadius: '12px',
              borderLeft: '4px solid #ef4444'
            }} 
            role="alert"
          >
            <i className="bi bi-exclamation-triangle-fill me-2 mt-0.5 fs-5"></i>
            <span className="fs-7">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label fs-7 fw-semibold text-white-50">Email, CPF ou Username</label>
            <div className="input-group">
              <span 
                className="input-group-text border-0" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  color: 'rgba(255, 255, 255, 0.4)',
                  borderTopLeftRadius: '12px',
                  borderBottomLeftRadius: '12px'
                }}
              >
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                className="form-control text-white border-0 py-2.5"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderTopRightRadius: '12px',
                  borderBottomRightRadius: '12px'
                }}
                placeholder="nome.sobrenome, email ou CPF"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fs-7 fw-semibold text-white-50 mb-0">Senha</label>
            </div>
            <div className="input-group">
              <span 
                className="input-group-text border-0" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  color: 'rgba(255, 255, 255, 0.4)',
                  borderTopLeftRadius: '12px',
                  borderBottomLeftRadius: '12px'
                }}
              >
                <i className="bi bi-lock"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control text-white border-0 py-2.5"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="btn border-0 text-white-50"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderTopRightRadius: '12px',
                  borderBottomRightRadius: '12px'
                }}
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-gradient py-2.5 mt-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
            style={{ 
              borderRadius: '12px',
              fontSize: '0.95rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              transition: 'transform 0.1s ease, filter 0.2s ease',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Autenticando...
              </>
            ) : (
              <>
                Entrar no Sistema
                <i className="bi bi-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-top border-white border-opacity-10 text-center">
          <p className="text-white-50 fs-8 mb-0">
            RentFlow Gestão de Frotas & Locação
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
