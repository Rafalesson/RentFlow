import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Veiculos from './pages/Veiculos';
import Locacoes from './pages/Locacoes';
import Manutencoes from './pages/Manutencoes';
import TabelasAuxiliares from './pages/TabelasAuxiliares';
import Configuracoes from './pages/Configuracoes';
import Login from './pages/Login';
import { getCurrentUser, logout } from './services/authService';
import type { Funcionario } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Funcionario | null>(getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false); // Fecha a sidebar no mobile ao clicar num link
  };

  const handleLoginSuccess = (user: Funcionario) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
  };

  const handleProfileUpdated = (updatedUser: Funcionario) => {
    setCurrentUser(updatedUser);
  };

  // If not logged in, show Login page
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render active page component
  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'clientes':
        return <Clientes />;
      case 'veiculos':
        return <Veiculos />;
      case 'locacoes':
        return <Locacoes />;
      case 'manutencoes':
        return <Manutencoes />;
      case 'tabelasAuxiliares':
        return <TabelasAuxiliares />;
      case 'configuracoes':
        return (
          <Configuracoes 
            user={currentUser} 
            onProfileUpdated={handleProfileUpdated} 
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="d-flex w-100" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Sidebar Overlay for Mobile */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        currentUser={currentUser} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      {/* Main Content Pane */}
      <main 
        className="flex-grow-1 d-flex flex-column" 
        style={{ 
          overflowY: 'auto', 
          height: '100vh',
          width: '100%',
          maxWidth: '100vw'
        }}
      >
        {/* Mobile Header (Visible only on small screens) */}
        <div className="mobile-header align-items-center justify-content-between p-3">
          <div className="d-flex align-items-center gap-2">
            <div className="d-flex align-items-center justify-content-center sidebar-brand-icon" style={{width: 32, height: 32}}>
              <i className="bi bi-water text-primary fs-5" style={{ color: '#818cf8' }}></i>
            </div>
            <h5 className="fw-bold m-0" style={{ letterSpacing: '0.5px' }}>RentFlow</h5>
          </div>
          <button 
            className="btn btn-light shadow-none border-0 px-2 py-1" 
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'transparent' }}
          >
            <i className="bi bi-list fs-2 text-primary"></i>
          </button>
        </div>

        <div className="flex-grow-1">
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
};

export default App;
