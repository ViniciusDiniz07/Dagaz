import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { MobileDrawer } from './components/MobileDrawer.js';
import { BottomNav } from './components/BottomNav.js';

// Páginas Oficiais Reconstruídas com Base no Figma
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { Enrollments } from './pages/Enrollments.js';
import { StudentRegistration } from './pages/StudentRegistration.js';
import { DocumentScanner } from './pages/DocumentScanner.js';
import { AuditHistory } from './pages/AuditHistory.js';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Se o usuário não estiver autenticado, exibe a tela de login (p1.HTML)
  if (!isAuthenticated) {
    return <Login onSuccess={() => setCurrentPath('dashboard')} />;
  }

  const getPageTitle = () => {
    switch (currentPath) {
      case 'alunos':
        return 'Cadastro De Aluno';
      case 'matriculas':
        return 'Gestão de Matrículas';
      case 'digitalizacao-de-fichas-ia':
        return 'Digitalização de Fichas (IA)';
      case 'historico-de-alteracoes':
        return 'Histórico de Alterações';
      case 'responsaveis':
        return 'Responsáveis Legais';
      case 'modalidades-esportivas':
        return 'Modalidades Esportivas';
      case 'relatorios':
        return 'Relatórios e Indicadores';
      case 'administradores':
        return 'Equipe Administrativa';
      case 'configuracoes':
        return 'Configurações do Polo';
      default:
        return 'Condomínio Cultural e Esportivo';
    }
  };

  const isFormPage = currentPath === 'alunos';

  return (
    <div className="bg-surface font-sans text-on-surface antialiased min-h-screen flex flex-row">
      {/* Sidebar Lateral para Desktop */}
      <Sidebar currentPath={currentPath} onNavigate={(path) => setCurrentPath(path)} />

      {/* Drawer Retrátil para Dispositivos Móveis */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentPath={currentPath}
        onNavigate={(path) => setCurrentPath(path)}
      />

      {/* Container Principal */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header Superior Fixo */}
        <Header
          onOpenDrawer={() => setIsDrawerOpen(true)}
          title={getPageTitle()}
          showBack={isFormPage}
          onBack={() => setCurrentPath('dashboard')}
        />

        {/* Área Central de Conteúdo */}
        <main className="flex-1 flex flex-col relative w-full px-margin-mobile pt-20 pb-28 lg:pb-12 max-w-5xl mx-auto">
          {currentPath === 'dashboard' && (
            <Dashboard onNavigate={(path) => setCurrentPath(path)} />
          )}

          {currentPath === 'matriculas' && (
            <Enrollments onNavigate={(path) => setCurrentPath(path)} />
          )}

          {currentPath === 'alunos' && (
            <StudentRegistration onNavigate={(path) => setCurrentPath(path)} />
          )}

          {currentPath === 'digitalizacao-de-fichas-ia' && (
            <DocumentScanner onNavigate={(path) => setCurrentPath(path)} />
          )}

          {currentPath === 'historico-de-alteracoes' && <AuditHistory />}

          {currentPath === 'responsaveis' && (
            <Enrollments onNavigate={(path) => setCurrentPath(path)} />
          )}

          {currentPath === 'modalidades-esportivas' && (
            <Enrollments onNavigate={(path) => setCurrentPath(path)} />
          )}

          {currentPath === 'relatorios' && (
            <Dashboard onNavigate={(path) => setCurrentPath(path)} />
          )}

          {currentPath === 'administradores' && <AuditHistory />}

          {currentPath === 'configuracoes' && (
            <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm space-y-3">
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                Configurações do Polo Socioesportivo
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Unidade de Volta Redonda/RJ • Gestão socioesportiva do Condomínio Cultural e Esportivo.
              </p>
              <div className="pt-2 text-label-sm text-outline">
                Versão do Sistema: v1.0.4
              </div>
            </div>
          )}
        </main>

        {/* Barra de Navegação Inferior (Mobile) */}
        <BottomNav
          currentPath={currentPath}
          onNavigate={(path) => setCurrentPath(path)}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />
      </div>
    </div>
  );
};
