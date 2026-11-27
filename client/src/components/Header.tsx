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
  title = 'Condomínio Cultural e Esportivo',
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
              alt="Logotipo do Condomínio Cultural e Esportivo"
              className="h-8 w-auto object-contain"
              src="/logo-condominio-cultural-esportivo-transparente.png"
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-primary leading-tight tracking-tight max-w-[150px] text-[12px] sm:max-w-none sm:text-[16px]">
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
            {user?.avatarUrl ? (
              <img alt="" className="w-8 h-8 rounded-full object-cover" src={user.avatarUrl} />
            ) : (
              <span className="material-symbols-outlined text-[32px] text-outline">account_circle</span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-on-tertiary-container rounded-full ring-2 ring-surface"></span>
          </div>
        </div>
      </div>
    </header>
  );
};
