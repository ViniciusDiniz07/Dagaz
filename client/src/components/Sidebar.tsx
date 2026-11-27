import React from 'react';
import { useAuth } from '../contexts/AuthContext.js';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const { user, logout } = useAuth();

  const navItemClass = (path: string) => {
    const isActive = currentPath === path;
    return `flex items-center gap-3 px-space-sm h-11 rounded-lg transition-colors ${
      isActive
        ? 'bg-surface-container text-secondary font-medium'
        : 'text-on-surface hover:bg-surface-container'
    }`;
  };

  const iconClass = (path: string) => {
    const isActive = currentPath === path;
    return `material-symbols-outlined text-[20px] ${
      isActive ? 'text-secondary' : 'text-on-surface-variant'
    }`;
  };

  return (
    <aside className="hidden lg:flex flex-col w-[280px] bg-surface-container-lowest border-r border-surface-container-high h-screen sticky top-0 shrink-0 z-30">
      {/* Brand Header */}
      <div className="p-space-md flex items-center gap-space-sm bg-surface-container-low border-b border-surface-container-high/50">
        <img
          alt="Projeto Esporte Dagaz Logo"
          className="h-7 w-auto object-contain"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnHMFEUdUVmRjfMIKsVPxX2mcIKs7eupASgcyMuWpVXYlRkR312TSvOswdJOxpNLvpdm_DXu44TGafWdpcpAHgCUA1XXsHnezYSABrVd9DpRK-7cLiLYgHTJ9gEKHIYTbRbTQ1wJG23Onielm2rEbGOVoxMWqEh5Hgl9pzbaFCw1boVlqKj9gpMbll5G42MKztHU6-bmDGcQmF9piGGi7O4u6jc-dApF1BoYKE9Zs"
        />
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm text-primary leading-tight">Esporte Dagaz</span>
          <span className="font-label-sm text-[10px] text-on-surface-variant font-medium">Gestão Socioesportiva</span>
        </div>
      </div>

      {/* User Info Card */}
      <div className="px-space-md py-space-sm bg-surface-container-low flex items-center gap-3 border-b border-surface-container-high/40">
        {user?.avatarUrl ? (
          <img alt="" className="w-10 h-10 rounded-full object-cover" src={user.avatarUrl} />
        ) : (
          <span className="material-symbols-outlined text-[40px] text-outline">account_circle</span>
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-label-lg text-label-lg text-on-surface truncate">
            {user?.nome || 'Usuário'}
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {user?.email || '—'}
          </span>
          <span className="inline-block mt-0.5 px-1.5 py-0.2 w-fit rounded-full bg-surface-container-highest text-secondary text-[10px] font-bold uppercase">
            {user?.role || 'conta'}
          </span>
        </div>
      </div>

      {/* Menu Groups */}
      <div className="flex-1 overflow-y-auto py-space-sm px-space-xs no-scrollbar">
        <div className="px-space-sm py-1">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Operacional</span>
        </div>
        <nav className="space-y-0.5">
          <button
            type="button"
            className={`w-full text-left ${navItemClass('dashboard')}`}
            onClick={() => onNavigate('dashboard')}
          >
            <span className={iconClass('dashboard')}>dashboard</span>
            <span className="font-body-md text-body-md font-medium">Dashboard (Início)</span>
          </button>
          <button
            type="button"
            className={`w-full text-left ${navItemClass('alunos')}`}
            onClick={() => onNavigate('alunos')}
          >
            <span className={iconClass('alunos')}>groups</span>
            <span className="font-body-md text-body-md">Alunos</span>
          </button>
          <button
            type="button"
            className={`w-full text-left ${navItemClass('responsaveis')}`}
            onClick={() => onNavigate('responsaveis')}
          >
            <span className={iconClass('responsaveis')}>escalator_warning</span>
            <span className="font-body-md text-body-md">Responsáveis</span>
          </button>
          <button
            type="button"
            className={`w-full text-left ${navItemClass('matriculas')}`}
            onClick={() => onNavigate('matriculas')}
          >
            <span className={iconClass('matriculas')}>how_to_reg</span>
            <span className="font-body-md text-body-md">Matrículas</span>
          </button>
          <button
            type="button"
            className={`w-full text-left ${navItemClass('modalidades-esportivas')}`}
            onClick={() => onNavigate('modalidades-esportivas')}
          >
            <span className={iconClass('modalidades-esportivas')}>sports_soccer</span>
            <span className="font-body-md text-body-md">Modalidades esportivas</span>
          </button>
          <button
            type="button"
            className={`w-full text-left ${navItemClass('digitalizacao-de-fichas-ia')}`}
            onClick={() => onNavigate('digitalizacao-de-fichas-ia')}
          >
            <span className={iconClass('digitalizacao-de-fichas-ia')}>document_scanner</span>
            <span className="font-body-md text-body-md font-medium">Digitalização de fichas (IA)</span>
          </button>
          <button
            type="button"
            className={`w-full text-left ${navItemClass('relatorios')}`}
            onClick={() => onNavigate('relatorios')}
          >
            <span className={iconClass('relatorios')}>insights</span>
            <span className="font-body-md text-body-md">Relatórios</span>
          </button>
        </nav>

        <div className="px-space-sm py-1 mt-4">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Governança</span>
        </div>
        <nav className="space-y-0.5">
          <button
            type="button"
            className={`w-full text-left ${navItemClass('administradores')}`}
            onClick={() => onNavigate('administradores')}
          >
            <span className={iconClass('administradores')}>admin_panel_settings</span>
            <span className="font-body-md text-body-md">Administradores</span>
          </button>
          <button
            type="button"
            className={`w-full text-left ${navItemClass('historico-de-alteracoes')}`}
            onClick={() => onNavigate('historico-de-alteracoes')}
          >
            <span className={iconClass('historico-de-alteracoes')}>history</span>
            <span className="font-body-md text-body-md">Histórico de alterações</span>
          </button>
          <button
            type="button"
            className={`w-full text-left ${navItemClass('configuracoes')}`}
            onClick={() => onNavigate('configuracoes')}
          >
            <span className={iconClass('configuracoes')}>settings</span>
            <span className="font-body-md text-body-md">Configurações</span>
          </button>
        </nav>
      </div>

      {/* Logout button */}
      <div className="p-space-sm bg-surface-container-low border-t border-surface-container-high/50">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-space-sm h-11 rounded-lg text-error hover:bg-error-container/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="font-label-lg text-label-lg font-semibold">Sair do sistema</span>
        </button>
      </div>
    </aside>
  );
};
