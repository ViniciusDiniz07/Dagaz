import React from 'react';
import { useAuth } from '../contexts/AuthContext.js';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
}) => {
  const { user, logout } = useAuth();

  const handleItemClick = (path: string) => {
    onNavigate(path);
    onClose();
  };

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
    <>
      {/* Backdrop */}
      <div
        id="drawer-backdrop"
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-primary-container/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'block' : 'hidden'
        }`}
      />

      {/* Drawer */}
      <aside
        id="mobile-drawer"
        className={`fixed top-0 left-0 z-50 h-full w-[290px] bg-surface-container-lowest shadow-[0_8px_24px_rgba(15,41,66,0.08)] transform transition-transform duration-300 ease-in-out flex flex-col pt-safe pb-safe ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-space-md flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-space-sm">
            <img
              alt="Projeto Esporte Dagaz Logo"
              className="h-7 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnHMFEUdUVmRjfMIKsVPxX2mcIKs7eupASgcyMuWpVXYlRkR312TSvOswdJOxpNLvpdm_DXu44TGafWdpcpAHgCUA1XXsHnezYSABrVd9DpRK-7cLiLYgHTJ9gEKHIYTbRbTQ1wJG23Onielm2rEbGOVoxMWqEh5Hgl9pzbaFCw1boVlqKj9gpMbll5G42MKztHU6-bmDGcQmF9piGGi7O4u6jc-dApF1BoYKE9Zs"
            />
            <span className="font-headline-sm text-headline-sm text-primary">Esporte Dagaz</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="px-space-md py-space-sm bg-surface-container-low flex items-center gap-3">
          <img
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
            src={
              user?.avatarUrl ||
              'https://lh3.googleusercontent.com/aida-public/AB6AXuBChBO9tG8PRhqI1ug191m9AREUAfREBjJoA_WvoDxQWji50XhMASMaLzu0MnMN5bBEPZnuY6XwqKxutBmFQu8B1LSq51YgtE_3XgeaF4fHrpximG3jvVJOZwbSuKMOgA1k2E79uvN3_4Cg3zn1GxaODsA8rx63Xw8GkCApwYaf8OIblvv_i6EB0MFCfdxUPMIT2kRyqUBcjpMkDt5BnD8VVLrahJ1rMoJNV0gw9BE'
            }
          />
          <div className="flex flex-col min-w-0">
            <span className="font-label-lg text-label-lg text-on-surface truncate">
              {user?.nome || 'Administradora Dagaz'}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
              {user?.email || 'admin@esportedagaz.org.br'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-space-sm px-space-xs no-scrollbar">
          <div className="px-space-sm py-1">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Operacional</span>
          </div>
          <nav className="space-y-0.5">
            <button
              type="button"
              className={`w-full text-left ${navItemClass('dashboard')}`}
              onClick={() => handleItemClick('dashboard')}
            >
              <span className={iconClass('dashboard')}>dashboard</span>
              <span className="font-body-md text-body-md font-medium">Dashboard (Início)</span>
            </button>
            <button
              type="button"
              className={`w-full text-left ${navItemClass('alunos')}`}
              onClick={() => handleItemClick('alunos')}
            >
              <span className={iconClass('alunos')}>groups</span>
              <span className="font-body-md text-body-md">Alunos</span>
            </button>
            <button
              type="button"
              className={`w-full text-left ${navItemClass('responsaveis')}`}
              onClick={() => handleItemClick('responsaveis')}
            >
              <span className={iconClass('responsaveis')}>escalator_warning</span>
              <span className="font-body-md text-body-md">Responsáveis</span>
            </button>
            <button
              type="button"
              className={`w-full text-left ${navItemClass('matriculas')}`}
              onClick={() => handleItemClick('matriculas')}
            >
              <span className={iconClass('matriculas')}>how_to_reg</span>
              <span className="font-body-md text-body-md">Matrículas</span>
            </button>
            <button
              type="button"
              className={`w-full text-left ${navItemClass('modalidades-esportivas')}`}
              onClick={() => handleItemClick('modalidades-esportivas')}
            >
              <span className={iconClass('modalidades-esportivas')}>sports_soccer</span>
              <span className="font-body-md text-body-md">Modalidades esportivas</span>
            </button>
            <button
              type="button"
              className={`w-full text-left ${navItemClass('digitalizacao-de-fichas-ia')}`}
              onClick={() => handleItemClick('digitalizacao-de-fichas-ia')}
            >
              <span className={iconClass('digitalizacao-de-fichas-ia')}>document_scanner</span>
              <span className="font-body-md text-body-md">Digitalização de fichas (IA)</span>
            </button>
            <button
              type="button"
              className={`w-full text-left ${navItemClass('relatorios')}`}
              onClick={() => handleItemClick('relatorios')}
            >
              <span className={iconClass('relatorios')}>insights</span>
              <span className="font-body-md text-body-md">Relatórios</span>
            </button>
          </nav>

          <div className="px-space-sm py-1 mt-3">
            <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Governança</span>
          </div>
          <nav className="space-y-0.5">
            <button
              type="button"
              className={`w-full text-left ${navItemClass('administradores')}`}
              onClick={() => handleItemClick('administradores')}
            >
              <span className={iconClass('administradores')}>admin_panel_settings</span>
              <span className="font-body-md text-body-md">Administradores</span>
            </button>
            <button
              type="button"
              className={`w-full text-left ${navItemClass('historico-de-alteracoes')}`}
              onClick={() => handleItemClick('historico-de-alteracoes')}
            >
              <span className={iconClass('historico-de-alteracoes')}>history</span>
              <span className="font-body-md text-body-md">Histórico de alterações</span>
            </button>
            <button
              type="button"
              className={`w-full text-left ${navItemClass('configuracoes')}`}
              onClick={() => handleItemClick('configuracoes')}
            >
              <span className={iconClass('configuracoes')}>settings</span>
              <span className="font-body-md text-body-md">Configurações</span>
            </button>
          </nav>
        </div>

        <div className="p-space-sm bg-surface-container-low">
          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center gap-3 px-space-sm h-11 rounded-lg text-error hover:bg-error-container/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-label-lg text-label-lg font-semibold">Sair do sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
};
