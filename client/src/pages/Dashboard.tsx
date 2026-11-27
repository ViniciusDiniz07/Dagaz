import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { DashboardData } from '../types/index.js';
import { useAuth } from '../contexts/AuthContext.js';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'hoje' | 'semana' | 'mes'>('hoje');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    api
      .getDashboardStats(period)
      .then((res) => setData(res))
      .catch((err) => {
        console.error('Erro ao carregar dados do dashboard:', err);
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar os indicadores.');
      })
      .finally(() => setLoading(false));
  }, [period]);

  const handleDownloadReport = async () => {
    setDownloadingPdf(true);
    try {
      const res = await api.exportReport('pdf');
      // Simula geração de arquivo para download
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_dagaz_mensal_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const kpis = data?.kpis || {
    totalAlunos: 0,
    alunosNovos: 0,
    alunosAtivos: 0,
    percentualAlunosAtivos: 0,
    matriculasTotais: 0,
    matriculasAtivas: 0,
    matriculasAguardandoVaga: 0,
    matriculasTrancadas: 0,
    matriculasCanceladas: 0,
    totalResponsaveis: 0,
    fichasPendentes: 0,
  };
  const studentActiveWidth = `${kpis.percentualAlunosAtivos}%`;
  const modalityCount = data?.modalidades.length || 0;
  const averageModalities =
    kpis.totalAlunos > 0 ? (kpis.matriculasTotais / kpis.totalAlunos).toFixed(2) : '—';

  return (
    <div className="flex flex-col w-full space-y-space-md">
      {/* Saudação e Filtro de Período */}
      <section className="flex flex-col gap-space-sm pt-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight truncate">
                Olá, {user?.nome?.split(' ')[0] || 'equipe'}
              </h2>
              <span className="text-[20px] select-none">👋</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container inline-block"></span>
              <span>{user?.role === 'admin' ? 'Administradora Geral' : 'Oficial Administrativo'}</span>
              <span className="text-outline-variant">•</span>
              <span>{data?.periodLabel || (loading ? 'Carregando período...' : '')}</span>
            </p>
          </div>

          {/* Notificação de Auditoria / Status Rápido */}
          <div
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-sm shrink-0"
            title={loading ? "Carregando indicadores..." : "Sistema Operando em Tempo Real"}
          >
            <span className={`material-symbols-outlined text-[20px] text-secondary ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'sync' : 'verified_user'}
            </span>
          </div>
        </div>

        {/* Filtro Segmentado de Período */}
        <div className="flex p-1 bg-surface-container rounded-xl w-full">
          <button
            type="button"
            className={`period-btn flex-1 py-1.5 px-2 rounded-lg font-label-md text-label-md text-center transition-all ${
              period === 'hoje'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setPeriod('hoje')}
          >
            Hoje
          </button>
          <button
            type="button"
            className={`period-btn flex-1 py-1.5 px-2 rounded-lg font-label-md text-label-md text-center transition-all ${
              period === 'semana'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setPeriod('semana')}
          >
            Esta Semana
          </button>
          <button
            type="button"
            className={`period-btn flex-1 py-1.5 px-2 rounded-lg font-label-md text-label-md text-center transition-all ${
              period === 'mes'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            onClick={() => setPeriod('mes')}
          >
            Este Mês
          </button>
        </div>
      </section>

      {loadError && (
        <div role="alert" className="p-3 rounded-lg bg-error-container text-on-error-container">
          Não foi possível carregar os indicadores: {loadError}
        </div>
      )}

      {/* Ações Rápidas em Destaque (Alta Frequência Operacional) */}
      <section className="flex flex-col gap-space-xs">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary-container p-space-md text-on-primary shadow-md">
          <div className="relative z-10 flex flex-col justify-between h-full space-y-space-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm uppercase tracking-wide">
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                Cadastro digital
              </span>
              <span className="font-label-sm text-label-sm text-primary-fixed-dim">
                Envio de fichas
              </span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-primary">
                Digitalização de Fichas com IA
              </h3>
              <p className="font-body-sm text-body-sm text-primary-fixed-dim mt-0.5">
                Capture fichas físicas pelo celular e importe cadastros instantaneamente.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('digitalizacao-de-fichas-ia')}
                className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg shadow-sm active:scale-[0.98] transition-transform"
              >
                <span className="material-symbols-outlined text-[20px]">document_scanner</span>
                <span>Escanear Agora</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('alunos')}
                className="h-11 w-11 flex items-center justify-center rounded-lg bg-surface-container-lowest/15 text-on-primary hover:bg-surface-container-lowest/25 transition-colors"
                title="Novo Aluno Manual"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
              </button>
            </div>
          </div>
          {/* Elemento Decorativo Sutil de Fundo */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-secondary/15 blur-xl pointer-events-none"></div>
        </div>
      </section>

      {/* Grid de Cards de Indicadores (KPIs) */}
      <section className="space-y-space-xs">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">
            Panorama Socioesportivo
          </h3>
          <span className="font-label-sm text-label-sm text-secondary font-semibold">Visão geral</span>
        </div>

        {/* Mosaico Mobile (2 Colunas com Alinhamento Harmonioso) */}
        <div className="grid grid-cols-2 gap-space-xs">
          {/* KPI 1: Total de Alunos */}
          <div className="p-space-sm rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">groups</span>
              </div>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-tertiary-fixed-variant font-label-sm text-label-sm font-semibold">
                +{kpis.alunosNovos} novos
              </span>
            </div>
            <div className="mt-3">
              <span className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tight">
                {kpis.totalAlunos}
              </span>
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium mt-0.5">
                Total de Alunos
              </p>
            </div>
          </div>

          {/* KPI 2: Alunos Ativos */}
          <div className="p-space-sm rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-tertiary-container">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
              </div>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                {kpis.percentualAlunosAtivos}% do total
              </span>
            </div>
            <div className="mt-3">
              <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface tracking-tight">
                {kpis.alunosAtivos}
              </span>
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium mt-0.5">
                Alunos Ativos
              </p>
            </div>
            <div className="mt-2 h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-on-tertiary-container rounded-full"
                style={{ width: studentActiveWidth }}
              ></div>
            </div>
          </div>

          {/* KPI 3: Total de Matrículas */}
          <div className="p-space-sm rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Multimodal</span>
            </div>
            <div className="mt-3">
              <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface tracking-tight">
                {kpis.matriculasTotais}
              </span>
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium mt-0.5">
                Matrículas Totais
              </p>
            </div>
            <p className="font-body-sm text-[11px] text-outline mt-1 truncate">
              Média: {averageModalities} matrículas por aluno
            </p>
          </div>

          {/* KPI 4: Responsáveis Cadastrados */}
          <div className="p-space-sm rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[18px]">family_restroom</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Famílias</span>
            </div>
            <div className="mt-3">
              <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface tracking-tight">
                {kpis.totalResponsaveis}
              </span>
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium mt-0.5">
                Responsáveis
              </p>
            </div>
            <p className="font-body-sm text-[11px] text-outline mt-1 truncate">
              Cadastros no sistema
            </p>
          </div>

          {/* KPI 5: Fichas Pendentes (IA) - Destaque Atenção (Largura Dupla) */}
          <div className="col-span-2 p-space-sm rounded-xl bg-surface-container-low shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-tertiary-fixed-variant">
                <span className="material-symbols-outlined text-[22px]">pending_actions</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                  {kpis.fichasPendentes} fichas para revisão
                  </span>
                  {kpis.fichasPendentes > 0 && (
                  <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
                  )}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Aguardando conferência humana do OCR
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('digitalizacao-de-fichas-ia')}
              className="h-9 px-3 rounded-lg bg-surface-container-lowest text-secondary font-label-md text-label-md flex items-center justify-center shadow-sm font-semibold active:bg-surface-container transition-colors"
            >
              Revisar
            </button>
          </div>
        </div>
      </section>

      {/* Gráficos de Gestão Esportiva */}
      <section className="space-y-space-xs">
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm space-y-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h4 className="font-headline-sm text-headline-sm text-on-surface">
                Alunos por Modalidade
              </h4>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Distribuição de vagas preenchidas
              </span>
            </div>
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded-full font-semibold">
              {modalityCount} ativas
            </span>
          </div>

          {/* Gráfico de Barras Horizontais */}
          <div className="space-y-2.5 pt-1">
            {data ? (
              data.modalidades.length > 0 ? data.modalidades.map((m) => (
                <div key={m.nome} className="space-y-1">
                  <div className="flex justify-between items-center font-label-md text-label-md">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: m.color }}
                      ></span>
                      {m.nome}
                    </span>
                    <span className="text-on-surface-variant font-medium">
                      {m.count} alunos{' '}
                      <span className="text-outline font-normal">({m.percent}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${m.percent}%`, backgroundColor: m.color }}
                    ></div>
                  </div>
                </div>
              )) : (
                <div className="py-4 text-center text-outline">Nenhuma modalidade cadastrada.</div>
              )
            ) : (
              <div className="py-4 text-center text-outline">Carregando modalidades...</div>
            )}
          </div>
        </div>

        {/* Card de Distribuição por Faixa Etária */}
        <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm space-y-space-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-headline-sm text-headline-sm text-on-surface">
              Faixa Etária do Projeto
            </h4>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Público Atendido
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col items-center text-center">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                06 - 09 anos
              </span>
              <span className="font-headline-sm text-headline-sm text-primary mt-1">
                {data?.faixaEtaria.grupo1.percent || 0}%
              </span>
              <span className="font-body-sm text-[11px] text-outline mt-0.5">
                {data?.faixaEtaria.grupo1.count || 0} alunos
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-variant/40 flex flex-col items-center text-center">
              <span className="font-label-sm text-label-sm text-secondary font-semibold">
                10 - 13 anos
              </span>
              <span className="font-headline-sm text-headline-sm text-secondary mt-1">
                {data?.faixaEtaria.grupo2.percent || 0}%
              </span>
              <span className="font-body-sm text-[11px] text-secondary font-medium mt-0.5">
                {data?.faixaEtaria.grupo2.count || 0} alunos
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container-low flex flex-col items-center text-center">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                14 - 17 anos
              </span>
              <span className="font-headline-sm text-headline-sm text-primary mt-1">
                {data?.faixaEtaria.grupo3.percent || 0}%
              </span>
              <span className="font-body-sm text-[11px] text-outline mt-0.5">
                {data?.faixaEtaria.grupo3.count || 0} alunos
              </span>
            </div>
          </div>

          {/* Barra Composta Segmentada */}
          <div className="h-2 w-full rounded-full flex overflow-hidden gap-0.5 bg-surface-container">
            <div
              className="h-full bg-secondary-fixed-dim"
              style={{ width: `${data?.faixaEtaria.grupo1.percent || 0}%` }}
              title="06 a 09 anos"
            ></div>
            <div
              className="h-full bg-secondary"
              style={{ width: `${data?.faixaEtaria.grupo2.percent || 0}%` }}
              title="10 a 13 anos"
            ></div>
            <div
              className="h-full bg-primary-container"
              style={{ width: `${data?.faixaEtaria.grupo3.percent || 0}%` }}
              title="14 a 17 anos"
            ></div>
          </div>
        </div>
      </section>

      {/* Feed de Atividades Recentes do Sistema */}
      <section className="space-y-space-xs">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Atividades Recentes
            </h3>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('historico-de-alteracoes')}
            className="font-label-md text-label-md text-secondary font-semibold"
          >
            Ver todas
          </button>
        </div>

        <div className="rounded-xl bg-surface-container-lowest shadow-sm p-space-sm space-y-3">
          {data ? (
            data.atividadesRecentes.length > 0 ? data.atividadesRecentes.map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-tertiary-container shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">{act.icone}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-label-lg text-label-lg text-on-surface truncate">
                      {act.titulo}
                    </p>
                    <span className="inline-flex px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-tertiary-container font-label-sm text-[10px] font-semibold shrink-0">
                      {act.status}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {act.descricao}
                  </p>
                  <span className="font-body-sm text-[11px] text-outline">{act.tempo}</span>
                </div>
              </div>
            )) : (
              <div className="py-4 text-center text-outline">Nenhuma atividade registrada.</div>
            )
          ) : (
            <div className="py-4 text-center text-outline">Carregando atividades...</div>
          )}
        </div>
      </section>

      {/* Seção de Ações de Governança / Atalho para Exportação */}
      <section className="pb-2">
        <div className="p-space-md rounded-xl bg-surface-container-low shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-label-lg text-label-lg text-on-surface font-semibold">
                Resumo Mensal do Projeto
              </h4>
              <span className="font-body-sm text-[12px] text-on-surface-variant">
                Consolidado esportivo e socioeconômico
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={downloadingPdf}
            onClick={handleDownloadReport}
            aria-label="Exportar relatório em formato PDF"
            className="h-10 px-3.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1.5 active:bg-primary/90 transition-colors shadow-sm disabled:opacity-75"
          >
            {downloadingPdf ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">
                  progress_activity
                </span>
                <span>Gerando...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">
                  check
                </span>
                <span>Baixado</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>PDF</span>
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
};
