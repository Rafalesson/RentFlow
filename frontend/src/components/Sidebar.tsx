import React, { useState, useEffect } from 'react';
import type { Funcionario } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Funcionario;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('rentflow_theme') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rentflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const menuItems = [
    { id: 'dashboard', label: 'Painel Operacional', icon: 'bi-grid-1x2-fill' },
    { id: 'clientes', label: 'Clientes', icon: 'bi-people-fill' },
    { id: 'veiculos', label: 'Veículos', icon: 'bi-car-front-fill' },
    { id: 'locacoes', label: 'Locações', icon: 'bi-key-fill' },
    { id: 'manutencoes', label: 'Manutenções', icon: 'bi-tools' },
    { id: 'tabelasAuxiliares', label: 'Tabelas Auxiliares', icon: 'bi-table' },
    { id: 'configuracoes', label: 'Configurações', icon: 'bi-gear-fill' },
  ];

  return (
    <div 
      className="d-flex flex-column flex-shrink-0 sidebar-container" 
    >
      {/* Brand Header */}
      <div className="p-4 d-flex align-items-center gap-3 border-bottom sidebar-border">
        <div 
          className="d-flex align-items-center justify-content-center sidebar-brand-icon"
        >
          <i className="bi bi-water text-primary fs-4" style={{ color: '#818cf8' }}></i>
        </div>
        <div>
          <h5 className="fw-bold m-0 sidebar-brand-text" style={{ letterSpacing: '0.5px' }}>RentFlow</h5>
          <span className="fs-8 sidebar-brand-sub">Gestão de Frotas</span>
        </div>
      </div>

      {/* User Info Card */}
      <div className="p-3 mx-3 mt-3 rounded-3 sidebar-user-card d-flex align-items-center gap-3">
        <div 
          className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center bg-primary flex-shrink-0"
          style={{ 
            width: '44px', 
            height: '44px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          {currentUser.foto_perfil ? (
            <img src={currentUser.foto_perfil} alt="Foto de perfil" className="w-100 h-100 object-fit-cover" />
          ) : (
            currentUser.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
          )}
        </div>
        <div className="overflow-hidden">
          <div className="fw-semibold text-truncate fs-7">{currentUser.nome}</div>
          <div className="d-flex align-items-center gap-1.5 mt-0.5">
            <span className={`badge ${currentUser.cargo === 'gerente' ? 'bg-primary' : 'bg-secondary'} fs-9 py-0.5 px-2 rounded-pill`}>
              {currentUser.cargo.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <ul className="nav nav-pills flex-column mb-auto px-3 mt-4 gap-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`nav-link w-100 text-start d-flex align-items-center gap-3 py-2.5 px-3 border-0 transition-all sidebar-nav-link ${
                  isActive ? 'active fw-medium' : ''
                }`}
                style={{
                  borderRadius: '10px',
                  transition: 'all 0.25s ease'
                }}
              >
                <i className={`bi ${item.icon} fs-5`}></i>
                <span className="fs-7">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer Controls */}
      <div className="p-3 border-top sidebar-border d-flex flex-column gap-2">
        {/* Theme Switcher */}
        <button 
          onClick={toggleTheme}
          className="btn btn-sm text-start d-flex align-items-center gap-3 border-0 py-2 px-3 sidebar-footer-btn shadow-none"
          style={{ borderRadius: '10px' }}
        >
          <i className={`bi ${theme === 'light' ? 'bi-moon-stars-fill' : 'bi-sun-fill'} fs-5`}></i>
          <span className="fs-7">{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
        </button>

        {/* Logout */}
        <button 
          onClick={onLogout}
          className="btn btn-sm text-start d-flex align-items-center gap-3 border-0 py-2 px-3 sidebar-footer-btn shadow-none"
          style={{ borderRadius: '10px' }}
        >
          <i className="bi bi-box-arrow-right fs-5 text-danger"></i>
          <span className="fs-7 text-danger">Sair do Sistema</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
