import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Sport, Student } from '../types/index.js';
import { StudentDossierModal } from '../components/StudentDossierModal.js';

interface EnrollmentsProps {
  onNavigate: (path: string) => void;
}

export const Enrollments: React.FC<EnrollmentsProps> = ({ onNavigate }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [sports, setSports] = useState<Sport[]>([]);
  const [search, setSearch] = useState('');
  const [selectedModality, setSelectedModality] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Ativas');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const activeCycle = new Date().getFullYear();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const statusParam =
        selectedStatus === 'Ativas'
          ? 'ativa'
          : selectedStatus === 'Aguardando Vaga'
          ? 'aguardando_vaga'
          : selectedStatus === 'Trancadas'
          ? 'trancada'
          : selectedStatus === 'Canceladas'
          ? 'cancelada'
          : 'todos';

      const res = await api.listStudents({
        q: search,
        modality: selectedModality === 'Todos' ? '' : selectedModality,
        status: statusParam,
        page,
        limit: 10,
      });

      setStudents(res.students);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
        setTotalStudentsCount(res.pagination.total);
      }
    } catch (err) {
      console.error('Erro ao buscar estudantes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, selectedModality, selectedStatus, page]);

  useEffect(() => {
    api
      .listSports()
      .then((res) => setSports(res.sports))
      .catch((err) => console.error('Erro ao carregar modalidades:', err));
  }, []);

  const handleReactivate = async (student: Student) => {
    try {
      const enrollment = student.todas_matriculas?.[0];
      if (enrollment) {
        await api.reactivateEnrollment(enrollment.id);
        setActionSuccessMessage(`Matrícula de ${student.nome_completo} reativada com sucesso!`);
        setTimeout(() => setActionSuccessMessage(null), 3500);
        fetchStudents();
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao reativar matrícula');
    }
  };

  const handleExportExcel = () => {
    api
      .exportReport('xlsx')
      .then((data) => {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute(
          'download',
          `matriculas_condominio_cultura_esportivo_${new Date().getFullYear()}.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        alert('Planilha gerada com sucesso! O download do arquivo foi iniciado.');
      })
      .catch((err) => alert('Erro ao exportar planilha: ' + err.message));
  };

  const handleExportPdf = () => {
    api
      .exportReport('pdf')
      .then(() => {
        alert('Relatório sintético em PDF gerado com sucesso para prestação de contas.');
      })
      .catch((err) => alert('Erro ao gerar PDF: ' + err.message));
  };

  return (
    <div className="flex flex-col w-full pb-6 space-y-4">
      {/* Toast Feedback */}
      {actionSuccessMessage && (
        <div className="fixed top-20 right-4 z-50 bg-tertiary-container text-tertiary-fixed px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="font-label-md text-label-md">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Top Stats & Header Banner */}
      <section className="flex flex-col bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                Ano Letivo {activeCycle}
              </span>
            </div>
            <h1 className="font-headline-md text-headline-md text-primary font-bold">
              Gestão de Matrículas
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Controle socioesportivo, frequência e acompanhamento familiar
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold shrink-0">
            {totalStudentsCount} ativas
          </span>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onNavigate('alunos')}
            className="h-11 px-3 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-label-lg text-label-lg font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>+ Nova Matrícula</span>
          </button>
          <div className="h-11 flex items-center justify-center rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-medium">
            Ano {activeCycle}
          </div>
        </div>
      </section>

      {/* Search & Filters Block */}
      <section className="flex flex-col space-y-2.5">
        {/* Live Search Input */}
        <div className="relative w-full">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant absolute left-3.5 top-3">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por aluno, responsável ou turma..."
            className="w-full h-11 pl-10 pr-10 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-xl placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest shadow-sm"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-2 w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          ) : (
            <button
              type="button"
              aria-label="Limpar ou escanear"
              className="absolute right-2 top-2 w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
            </button>
          )}
        </div>

        {/* Horizontal Category Chips (Modalidades) */}
        <div
          className="flex items-center gap-2 overflow-x-auto py-1 -mx-margin-mobile px-margin-mobile no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          {[{ label: 'Todos' }, ...sports.map((sport) => ({ label: sport.nome }))].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setSelectedModality(item.label)}
              className={`px-3.5 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap font-medium shrink-0 flex items-center gap-1 shadow-sm transition-all ${
                selectedModality === item.label
                  ? 'bg-secondary text-on-secondary'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Status Selector Chips */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto py-0.5 -mx-margin-mobile px-margin-mobile no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          <span className="font-label-sm text-label-sm text-outline px-1 shrink-0">Status:</span>
          {['Ativas', 'Aguardando Vaga', 'Trancadas', 'Canceladas'].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedStatus(label)}
              className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm shrink-0 transition-colors ${
                selectedStatus === label
                  ? 'bg-surface-container-high text-on-primary-fixed font-semibold'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Informative Quick Summary Alert */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low text-on-surface">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-secondary">verified_user</span>
          <div className="flex flex-col">
            <span className="font-label-md text-label-md font-semibold text-primary">
              Prontuários e Saúde em Dia
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              92% com laudo médico atualizado
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
          chevron_right
        </span>
      </div>

      {/* Cards List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px] animate-spin text-secondary">
              progress_activity
            </span>
            <span className="font-body-md text-body-md">Carregando matrículas oficiais...</span>
          </div>
        ) : students.length > 0 ? (
          students.map((student) => {
            const isTrancada = student.status === 'trancada' || student.status === 'trancado';
            const isPendenteOcr = student.status === 'aguardando_vaga';

            return (
              <article
                key={student.id}
                className={`bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3 transition-all ${
                  isTrancada ? 'opacity-90' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {student.foto_url ? (
                        <img
                          alt=""
                          className={`w-12 h-12 rounded-full object-cover shadow-sm ${
                            isTrancada ? 'grayscale-[30%]' : ''
                          }`}
                          src={student.foto_url}
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full bg-surface-container flex items-center justify-center ${
                            isTrancada ? 'grayscale-[30%]' : ''
                          }`}
                        >
                          <span className="material-symbols-outlined text-[28px] text-outline">person</span>
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-surface-container-lowest ${
                          isTrancada
                            ? 'bg-outline'
                            : isPendenteOcr
                            ? 'bg-secondary-container'
                            : 'bg-on-tertiary-container'
                        }`}
                      ></span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-headline-sm text-headline-sm text-primary font-bold truncate">
                        {student.nome_completo}
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {student.idade} anos
                        </span>
                        <span className="text-outline-variant">•</span>
                        <span className="font-label-sm text-label-sm text-secondary font-medium">
                          Matrícula #{student.matricula_numero}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold shrink-0 ${
                      isTrancada
                        ? 'bg-surface-container text-on-surface-variant'
                        : isPendenteOcr
                        ? 'bg-surface-container-highest text-on-surface'
                        : 'bg-tertiary-fixed text-on-tertiary-fixed'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isTrancada
                          ? 'bg-outline'
                          : isPendenteOcr
                          ? 'bg-secondary'
                          : 'bg-on-tertiary-container'
                      }`}
                    ></span>
                    {isTrancada
                      ? 'Trancada'
                      : isPendenteOcr
                      ? 'Pendente OCR'
                      : 'Ativa / Regular'}
                  </span>
                </div>

                {/* Aviso especial de IA no card caso esteja em análise */}
                {isPendenteOcr && (
                  <div className="p-2.5 rounded-lg bg-surface-container space-y-1 text-on-surface">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        document_scanner
                      </span>
                      <span className="font-label-md text-label-md font-semibold text-primary">
                        Ficha Digitalizada via IA
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Campos de comprovante de residência e atestado médico aguardando validação humana do coordenador.
                    </p>
                  </div>
                )}

                {/* Class / Schedule Grid */}
                <div className="p-2.5 rounded-lg bg-surface-container-low space-y-1.5">
                  <div className="flex items-center justify-between text-on-surface">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-outlined text-[18px] text-secondary">
                        sports_kabaddi
                      </span>
                      <span className="font-label-lg text-label-lg font-bold truncate">
                        {student.modalidade}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      {student.turma}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">
                        schedule
                      </span>
                      {student.horario} ({student.dias})
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      {student.local}
                    </span>
                  </div>
                </div>

                {/* Guardian & Registration Meta */}
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-center justify-between text-body-sm font-body-sm">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-outline">
                        escalator_warning
                      </span>
                      Resp.:{' '}
                      <strong className="text-on-surface font-semibold">
                        {student.responsavel
                          ? `${student.responsavel.nome} (${student.responsavel.parentesco})`
                          : 'Sem responsável informado'}
                      </strong>
                    </span>
                    {student.responsavel?.telefone && (
                      <a
                        className="text-secondary font-label-sm text-label-sm font-semibold flex items-center gap-0.5"
                        href={`tel:${student.responsavel.telefone.replace(/\D/g, '')}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">call</span>
                        {student.responsavel.telefone}
                      </a>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-body-sm font-body-sm text-on-surface-variant">
                    <span>
                      Início em:{' '}
                      <strong>
                        {student.todas_matriculas?.[0]?.data_matricula
                          ? new Date(
                              `${student.todas_matriculas[0].data_matricula}T00:00:00`
                            ).toLocaleDateString('pt-BR')
                          : '-'}
                      </strong>
                    </span>
                    <span
                      className={`font-medium flex items-center gap-0.5 ${
                        student.saude?.laudo_ok
                          ? 'text-on-tertiary-container'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {student.saude?.laudo_ok ? 'check_circle' : 'info'}
                      </span>
                      {student.saude?.laudo_ok ? 'Ficha médica ok' : 'Ficha médica não confirmada'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons for Card */}
                {isTrancada ? (
                  <div className="grid grid-cols-12 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleReactivate(student)}
                      className="col-span-8 h-10 px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 hover:bg-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">replay</span>
                      <span>Reativar Matrícula</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForModal(student.id)}
                      className="col-span-4 h-10 px-2 rounded-lg bg-surface-container-high text-primary font-label-md text-label-md font-medium flex items-center justify-center gap-1 hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">history</span>
                      <span>Histórico</span>
                    </button>
                  </div>
                ) : isPendenteOcr ? (
                  <div className="grid grid-cols-12 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onNavigate('digitalizacao-de-fichas-ia')}
                      className="col-span-9 h-11 px-3 rounded-lg bg-secondary text-on-secondary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
                    >
                      <span className="material-symbols-outlined text-[20px]">fact_check</span>
                      <span>Conferir Dados OCR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForModal(student.id)}
                      className="col-span-3 h-11 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-medium flex items-center justify-center gap-1 hover:bg-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForModal(student.id)}
                      className="col-span-6 h-10 px-2 rounded-lg bg-surface-container-high text-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1 hover:bg-surface-container-highest transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">badge</span>
                      <span>Ver Prontuário</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('alunos')}
                      className="col-span-4 h-10 px-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-medium flex items-center justify-center gap-1 hover:bg-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStudentForModal(student.id)}
                      aria-label="Mais opções"
                      className="col-span-2 h-10 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center hover:bg-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="p-8 text-center bg-surface-container-lowest rounded-xl shadow-sm text-on-surface-variant">
            Nenhuma matrícula localizada para os filtros selecionados.
          </div>
        )}
      </div>

      {/* Pagination, Counter & Exporting Drawer Footer */}
      <section className="flex flex-col bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
            Exibindo <strong>1-{students.length}</strong> de <strong>{totalStudentsCount}</strong> matrículas
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              aria-label="Página anterior"
              className="w-8 h-8 rounded-lg bg-surface-container text-outline flex items-center justify-center disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-2 font-label-sm text-label-sm font-semibold text-primary">{page}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              aria-label="Próxima página"
              className="w-8 h-8 rounded-lg bg-surface-container text-on-surface flex items-center justify-center hover:bg-surface-variant disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Export Action Bar */}
        <div className="pt-2 border-t border-surface-container-high/40 flex flex-col space-y-2">
          <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
            Exportar Relatórios Oficiais
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="h-10 px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
                table_view
              </span>
              <span>Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="h-10 px-3 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-error">
                picture_as_pdf
              </span>
              <span>Lista em PDF</span>
            </button>
          </div>
        </div>
      </section>

      {/* Modal de Prontuário Completo */}
      {selectedStudentForModal && (
        <StudentDossierModal
          studentId={selectedStudentForModal}
          onClose={() => setSelectedStudentForModal(null)}
          onEdit={() => onNavigate('alunos')}
        />
      )}
    </div>
  );
};
