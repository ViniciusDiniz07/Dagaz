import React from 'react';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenDrawer: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPath,
  onNavigate,
  onOpenDrawer,
}) => {
  const getTabClass = (path: string) => {
    const isActive = currentPath === path;
    return `flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 transition-colors ${
      isActive ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface'
    }`;
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 w-full z-40 pb-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(15,41,66,0.06)]"
      data-active-classes="text-secondary"
    >
      <div className="flex justify-around items-center h-16 px-space-xs max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className={getTabClass('dashboard')}
        >
          <span className="material-symbols-outlined text-[22px]">dashboard</span>
          <span className="font-label-sm text-[10px] leading-tight">Início</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('alunos')}
          className={getTabClass('alunos')}
        >
          <span className="material-symbols-outlined text-[22px]">groups</span>
          <span className="font-label-sm text-[10px] leading-tight">Alunos</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('matriculas')}
          className={getTabClass('matriculas')}
        >
          <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
          <span className="font-label-sm text-[10px] leading-tight">Matrículas</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('digitalizacao-de-fichas-ia')}
          className={getTabClass('digitalizacao-de-fichas-ia')}
        >
          <span className="material-symbols-outlined text-[22px]">document_scanner</span>
          <span className="font-label-sm text-[10px] leading-tight">Digitalizar</span>
        </button>

        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
          <span className="font-label-sm text-[10px] leading-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
