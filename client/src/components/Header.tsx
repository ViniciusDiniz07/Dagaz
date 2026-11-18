import React from 'react';
import { useAuth } from '../contexts/AuthContext.js';

interface HeaderProps {
  onOpenDrawer: () => void;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDrawer,
  title = 'Esporte Dagaz',
  showBack = false,
  onBack,
}) => {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-margin-mobile flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          {showBack ? (
            <button
              type="button"
              onClick={onBack || (() => window.history.back())}
              aria-label="Voltar para a tela anterior"
              className="w-11 h-11 flex items-center justify-center rounded-lg text-primary hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back_ios_new</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenDrawer}
              aria-label="Abrir menu lateral de navegação"
              className="w-11 h-11 flex items-center justify-center rounded-lg text-primary hover:bg-surface-container transition-colors lg:hidden"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <img
              alt="Projeto Esporte Dagaz Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnHMFEUdUVmRjfMIKsVPxX2mcIKs7eupASgcyMuWpVXYlRkR312TSvOswdJOxpNLvpdm_DXu44TGafWdpcpAHgCUA1XXsHnezYSABrVd9DpRK-7cLiLYgHTJ9gEKHIYTbRbTQ1wJG23Onielm2rEbGOVoxMWqEh5Hgl9pzbaFCw1boVlqKj9gpMbll5G42MKztHU6-bmDGcQmF9piGGi7O4u6jc-dApF1BoYKE9Zs"
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary leading-tight tracking-tight">
                {title}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium leading-none">
                Gestão Socioesportiva
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          <button
            type="button"
            aria-label="Notificações do sistema"
            className="relative w-11 h-11 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface"></span>
          </button>

          <div className="relative ml-1">
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
              src={
                user?.avatarUrl ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBChBO9tG8PRhqI1ug191m9AREUAfREBjJoA_WvoDxQWji50XhMASMaLzu0MnMN5bBEPZnuY6XwqKxutBmFQu8B1LSq51YgtE_3XgeaF4fHrpximG3jvVJOZwbSuKMOgA1k2E79uvN3_4Cg3zn1GxaODsA8rx63Xw8GkCApwYaf8OIblvv_i6EB0MFCfdxUPMIT2kRyqUBcjpMkDt5BnD8VVLrahJ1rMoJNV0gw9BE'
              }
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-on-tertiary-container rounded-full ring-2 ring-surface"></span>
          </div>
        </div>
      </div>
    </header>
  );
};
