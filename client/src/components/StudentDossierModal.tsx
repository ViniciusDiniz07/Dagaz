import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';

interface StudentDossierModalProps {
  studentId: string | null;
  onClose: () => void;
  onEdit?: (studentId: string) => void;
}

export const StudentDossierModal: React.FC<StudentDossierModalProps> = ({
  studentId,
  onClose,
  onEdit,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    api
      .getStudentById(studentId)
      .then((res) => setData(res))
      .catch((err) => console.error('Erro ao carregar prontuário:', err))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="p-4 bg-surface-container-low flex items-center justify-between border-b border-surface-container-high/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">badge</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                Prontuário Socioesportivo
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Identificação, laudos clínicos e autorizações da ficha física
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-surface-container flex items-center justify-center text-outline transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[32px] animate-spin text-secondary">
                progress_activity
              </span>
              <span className="font-body-md text-body-md">Carregando prontuário oficial...</span>
            </div>
          ) : data ? (
            <>
              {/* Aluno Resumo */}
              <div className="flex items-start gap-4 p-3.5 rounded-xl bg-surface-container-low">
                <img
                  alt="Aluno"
                  className="w-16 h-16 rounded-xl object-cover shadow-sm bg-surface-container"
                  src={
                    data.student?.foto_url ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuAVvDTAxLxeODW44EobujUHpS15WRLFYjc12zgEPvoaJnQdWJ03c9YLWJNvLHDu_BdzOXLPdVRhX-hTNg5x6ZNzUG5MhQgtPWVF9ZSUe5UBNbvYE8W4tMFwT1Nr8qwsErSdu7l0OZwTOD8TPwUMUdjWyTvlcWlapfAtohl0SMp73oCebdqsWN-l2fmXwjpULbpIB8YQ0D8Eyz7f6zEi5EuOupHTpabkP7fRAYYs_V0'
                  }
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold truncate">
                      {data.student?.nome_completo}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-tertiary-fixed text-on-tertiary-fixed shrink-0">
                      #{data.student?.matricula_numero}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-on-surface-variant text-body-sm font-body-sm">
                    <span>{data.student?.idade} anos (Nasc: {data.student?.data_nascimento})</span>
                    <span>•</span>
                    <span>CPF: {data.student?.cpf_mascarado || 'Não informado'}</span>
                    <span>•</span>
                    <span>RG: {data.student?.rg || 'Não informado'}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-outline">
                    Escola: <strong>{data.student?.escola || 'Não informada'}</strong> ({data.student?.serie || '-'})
                  </div>
                </div>
              </div>

              {/* Saúde e Cuidados Clínicos */}
              <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-[20px] text-secondary">medical_services</span>
                  <span className="font-label-md text-label-md font-bold uppercase tracking-wider">
                    Ficha de Saúde & Cuidados
                  </span>
                  <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container text-on-secondary-fixed-variant">
                    {data.health?.laudo_medico_apresentado ? 'Laudo Regular' : 'Laudo Pendente'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-body-sm font-body-sm pt-1">
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest">
                    <span className="text-outline text-[11px] block">Pessoa com Deficiência (PCD):</span>
                    <strong className="text-on-surface">
                      {data.health?.possui_deficiencia ? data.health?.descricao_deficiencia || 'Sim' : 'Não'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest">
                    <span className="text-outline text-[11px] block">Problema Crônico:</span>
                    <strong className="text-on-surface">
                      {data.health?.possui_doenca_cronica ? data.health?.descricao_doenca || 'Sim' : 'Nenhum'}
                    </strong>
                  </div>
                </div>

                {data.health?.utiliza_medicamento && (
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest text-body-sm font-body-sm">
                    <span className="text-outline text-[11px] block">Medicação em Uso / Tratamento:</span>
                    <strong className="text-secondary">{data.health?.descricao_medicamento}</strong>
                  </div>
                )}

                {data.health?.observacoes && (
                  <p className="text-[12px] text-on-surface-variant italic pt-0.5">
                    "{data.health?.observacoes}"
                  </p>
                )}
              </div>

              {/* Responsável Legal */}
              {data.guardian && (
                <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-[20px] text-secondary">family_restroom</span>
                    <span className="font-label-md text-label-md font-bold uppercase tracking-wider">
                      Responsável Legal
                    </span>
                    <span className="ml-auto px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-container text-primary">
                      {data.guardian?.parentesco}
                    </span>
                  </div>

                  <div className="space-y-1 text-body-sm font-body-sm">
                    <p className="font-semibold text-on-surface">{data.guardian?.nome_completo}</p>
                    <p className="text-on-surface-variant flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      {data.guardian?.telefone} • CPF: {data.guardian?.cpf_mascarado}
                    </p>
                    <p className="text-on-surface-variant text-[12px]">
                      Endereço: {data.guardian?.endereco}, {data.guardian?.numero} - {data.guardian?.bairro}, {data.guardian?.cidade}
                    </p>
                    {data.guardian?.beneficiario_programa_social && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed">
                        Beneficiário CadÚnico: {data.guardian?.programa_social || 'Bolsa Família'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Modalidades Inscritas */}
              <div className="space-y-1.5">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Turmas e Modalidades
                </span>
                <div className="space-y-2">
                  {data.enrollments?.map((en: any) => (
                    <div
                      key={en.id}
                      className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between"
                    >
                      <div>
                        <p className="font-label-lg text-label-lg text-primary font-bold">{en.modalidade}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {en.turma} • {en.horario} ({en.dias})
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-label-sm font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                        {en.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-outline py-8">Não foi possível carregar o prontuário.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-surface-container-low flex items-center justify-end gap-2 border-t border-surface-container-high/60">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors"
          >
            Fechar
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(studentId);
              }}
              className="h-10 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar Cadastro
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
