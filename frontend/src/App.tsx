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
    <div className="d-flex w-100" style={{ minHeight: '100vh' }}>
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />
      
      {/* Main Content Pane */}
      <main 
        className="flex-grow-1" 
        style={{ 
          overflowY: 'auto', 
          height: '100vh'
        }}
      >
        <div className="h-100">
          {renderActivePage()}
        </div>
      </main>
    </div>
  );
};

export default App;
