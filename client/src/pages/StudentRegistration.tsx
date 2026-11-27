import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.js';

interface StudentRegistrationProps {
  onNavigate: (path: string) => void;
}

interface FamilyRow {
  nome: string;
  parentesco: string;
  idade: number | '';
  escolaridade: string;
  profissao: string;
  renda: number | '';
}

export const StudentRegistration: React.FC<StudentRegistrationProps> = ({ onNavigate }) => {
  // Stepper state (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Etapa 1: Dados Pessoais
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [calculatedAge, setCalculatedAge] = useState<number>(0);
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [etnia, setEtnia] = useState('');

  // Etapa 2: Escolaridade & NIS
  const [nis, setNis] = useState('');
  const [escola, setEscola] = useState('');
  const [serie, setSerie] = useState('');
  const [turnoEscolar, setTurnoEscolar] = useState<'manha' | 'tarde' | 'integral' | ''>('');

  // Etapa 3: Ficha de Saúde & Cuidados
  const [hasPcd, setHasPcd] = useState(false);
  const [pcdDesc, setPcdDesc] = useState('');
  const [hasChronic, setHasChronic] = useState(false);
  const [chronicDesc, setChronicDesc] = useState('');
  const [hasMed, setHasMed] = useState(false);
  const [medDesc, setMedDesc] = useState('');
  const [healthNotes] = useState('');

  // Etapa 4: Modalidades Esportivas
  const [sports, setSports] = useState<Array<{ id: string; nome: string; descricao?: string; icone?: string }>>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  // Etapa 5: Responsável Legal
  const [isNewGuardian, setIsNewGuardian] = useState(true);
  const [guardianName, setGuardianName] = useState('');
  const [guardianKinship, setGuardianKinship] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianCpf, setGuardianCpf] = useState('');
  const [guardianAddress] = useState('');
  const guardianOccupation = '';
  const guardianSchooling = '';
  const [guardianIncomeRange, setGuardianIncomeRange] = useState<
    'ate_1_sm' | 'ate_2_sm' | 'ate_3_sm' | 'ate_4_sm' | 'acima_4_sm' | ''
  >('');
  const [socialProgram] = useState(false);
  const [socialProgramName] = useState('');

  // Composição Familiar Dinâmica
  const [familyMembers, setFamilyMembers] = useState<FamilyRow[]>([]);

  // Autorizações
  const [imageAuth, setImageAuth] = useState(false);
  const [declarationAuth, setDeclarationAuth] = useState(false);

  // UI Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcula idade automaticamente
  useEffect(() => {
    if (!dataNascimento) return;
    const birth = new Date(dataNascimento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    setCalculatedAge(Math.max(0, age));
  }, [dataNascimento]);

  // Carrega rascunho salvo se existir
  useEffect(() => {
    const savedDraft = localStorage.getItem('dagaz_student_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.nomeCompleto) setNomeCompleto(draft.nomeCompleto);
        if (draft.dataNascimento) setDataNascimento(draft.dataNascimento);
      } catch {
        // Ignora rascunho corrompido
      }
    }
  }, []);

  useEffect(() => {
    api
      .listSports()
      .then((res) => setSports(res.sports))
      .catch((err) => {
        console.error('Erro ao carregar modalidades:', err);
        setToastMessage('Não foi possível carregar as modalidades.');
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleSaveDraft = () => {
    const draft = {
      nomeCompleto,
      dataNascimento,
      cpf,
      rg,
      etnia,
      nis,
      escola,
      serie,
      turnoEscolar,
      hasPcd,
      pcdDesc,
      hasChronic,
      chronicDesc,
      hasMed,
      medDesc,
      selectedSports,
      guardianName,
      guardianPhone,
      guardianCpf,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem('dagaz_student_draft', JSON.stringify(draft));
    showToast('Rascunho salvo localmente com sucesso!');
  };

  const toggleSport = (sportName: string) => {
    if (selectedSports.includes(sportName)) {
      setSelectedSports(selectedSports.filter((s) => s !== sportName));
    } else {
      if (selectedSports.length >= 3) {
        showToast('Limite máximo de 3 modalidades atingido.');
        return;
      }
      setSelectedSports([...selectedSports, sportName]);
    }
  };

  const addFamilyMember = () => {
    setFamilyMembers([
      ...familyMembers,
      { nome: '', parentesco: '', idade: '', escolaridade: 'Fundamental', profissao: '', renda: 0 },
    ]);
  };

  const updateFamilyMember = (index: number, field: keyof FamilyRow, value: any) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  // Totais calculados
  const totalResidents = familyMembers.length;
  const totalFamilyIncome = familyMembers.reduce((acc, cur) => acc + (Number(cur.renda) || 0), 0);

  const handleSubmit = async () => {
    if (!nomeCompleto || !dataNascimento) {
      alert('Por favor, preencha os campos obrigatórios (Nome completo e Data de nascimento).');
      return;
    }

    if (selectedSports.length === 0) {
      alert('Selecione pelo menos uma modalidade esportiva.');
      return;
    }

    if (!guardianName || !guardianCpf || !guardianPhone) {
      alert('Preencha nome, CPF e telefone do responsável legal.');
      return;
    }

    if (!declarationAuth) {
      alert('Confirme a declaração de veracidade para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Busca as modalidades cadastradas
      const sportsRes = await api.listSports();
      const sportIds = sportsRes.sports
        .filter((sp) => selectedSports.includes(sp.nome))
        .map((sp) => sp.id);
      if (sportIds.length === 0) {
        alert('As modalidades selecionadas não estão disponíveis. Atualize a página e tente novamente.');
        return;
      }

      const payload = {
        nome_completo: nomeCompleto,
        data_nascimento: dataNascimento,
        cpf: cpf || null,
        rg: rg || null,
        orgao_emissor: null,
        nis: nis || null,
        etnia: etnia || null,
        escola: escola || null,
        serie: serie || null,
        turno_escolar: turnoEscolar || null,
        saude: {
          possui_deficiencia: hasPcd,
          descricao_deficiencia: hasPcd ? pcdDesc : null,
          possui_doenca_cronica: hasChronic,
          descricao_doenca: hasChronic ? chronicDesc : null,
          utiliza_medicamento: hasMed,
          descricao_medicamento: hasMed ? medDesc : null,
          observacoes: healthNotes,
          laudo_medico_apresentado: false,
        },
        modalidades_ids: sportIds,
        novo_responsavel: {
          nome_completo: guardianName,
          cpf: guardianCpf,
          telefone: guardianPhone,
          endereco: guardianAddress || null,
          parentesco: guardianKinship || null,
          ocupacao: guardianOccupation || null,
          escolaridade: guardianSchooling || null,
          renda_familiar_faixa: guardianIncomeRange || null,
          beneficiario_programa_social: socialProgram,
          programa_social: socialProgram ? socialProgramName : null,
        },
        residentes_domicilio: familyMembers.map((f) => ({
          nome: f.nome,
          parentesco: f.parentesco,
          idade: typeof f.idade === 'number' ? f.idade : null,
          escolaridade: f.escolaridade,
          profissao: f.profissao,
          renda: typeof f.renda === 'number' ? f.renda : 0,
        })),
        autorizacao_imagem: imageAuth,
        declaracao_responsabilidade: declarationAuth,
      };

      await api.createStudent(payload);
      localStorage.removeItem('dagaz_student_draft');

      // Celebração festiva institucional
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setShowSuccessModal(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao efetivar matrícula.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2.5 z-50 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-tertiary-fixed text-[18px]">
            check_circle
          </span>
          <span className="font-body-sm text-body-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Status Feedback Banner */}
      <div className="mt-2 mb-4 bg-surface-container-low p-4 rounded-xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                Etapa {currentStep} de 5
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-container text-tertiary-fixed-dim">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed mr-1"></span>
                {currentStep * 20}% Completo
              </span>
            </div>
            <p className="font-headline-sm text-headline-sm text-primary font-bold">
              Ficha Socioesportiva
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            alert(
              'Ajuda no Cadastro:\nPreencha as informações conforme a ficha impressa assinada pelo responsável. Todos os dados são protegidos por criptografia e conformidade LGPD.'
            )
          }
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
          title="Informações e Ajuda"
        >
          <span className="material-symbols-outlined text-[20px]">help_outline</span>
        </button>
      </div>

      {/* Stepper de Navegação Fluida */}
      <div className="w-full overflow-x-auto no-scrollbar py-1 mb-5">
        <div className="flex items-center min-w-[340px] justify-between px-1">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="flex flex-col items-center gap-1.5 group focus:outline-none"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-transform ${
                currentStep > 1
                  ? 'bg-tertiary-container text-tertiary-fixed'
                  : currentStep === 1
                  ? 'bg-secondary text-on-secondary animate-pulse'
                  : 'bg-surface-container-highest text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {currentStep > 1 ? 'check' : 'badge'}
              </span>
            </div>
            <span
              className={`font-label-sm text-label-sm ${
                currentStep === 1 ? 'text-secondary font-bold' : 'text-on-surface-variant'
              }`}
            >
              Pessoais
            </span>
          </button>
          <div
            className={`h-0.5 flex-1 mx-2 ${
              currentStep > 1 ? 'bg-tertiary-fixed' : 'bg-surface-container-highest'
            }`}
          ></div>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="flex flex-col items-center gap-1.5 group focus:outline-none"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-transform ${
                currentStep > 2
                  ? 'bg-tertiary-container text-tertiary-fixed'
                  : currentStep === 2
                  ? 'bg-secondary text-on-secondary animate-pulse'
                  : 'bg-surface-container-highest text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {currentStep > 2 ? 'check' : 'school'}
              </span>
            </div>
            <span
              className={`font-label-sm text-label-sm ${
                currentStep === 2 ? 'text-secondary font-bold' : 'text-on-surface-variant'
              }`}
            >
              Escolar/NIS
            </span>
          </button>
          <div
            className={`h-0.5 flex-1 mx-2 ${
              currentStep > 2 ? 'bg-tertiary-fixed' : 'bg-surface-container-highest'
            }`}
          ></div>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className="flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ${
                currentStep > 3
                  ? 'bg-tertiary-container text-tertiary-fixed'
                  : currentStep === 3
                  ? 'bg-secondary text-on-secondary animate-pulse'
                  : 'bg-surface-container-highest text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {currentStep > 3 ? 'check' : 'medical_services'}
              </span>
            </div>
            <span
              className={`font-label-sm text-label-sm ${
                currentStep === 3 ? 'text-secondary font-bold' : 'text-on-surface-variant'
              }`}
            >
              Saúde
            </span>
          </button>
          <div
            className={`h-0.5 flex-1 mx-2 ${
              currentStep > 3 ? 'bg-tertiary-fixed' : 'bg-surface-container-highest'
            }`}
          ></div>

          {/* Step 4 */}
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                currentStep > 4
                  ? 'bg-tertiary-container text-tertiary-fixed'
                  : currentStep === 4
                  ? 'bg-secondary text-on-secondary animate-pulse'
                  : 'bg-surface-container-highest text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {currentStep > 4 ? 'check' : 'sports_martial_arts'}
              </span>
            </div>
            <span
              className={`font-label-sm text-label-sm ${
                currentStep === 4 ? 'text-secondary font-bold' : 'text-outline'
              }`}
            >
              Esportes
            </span>
          </button>
          <div
            className={`h-0.5 flex-1 mx-2 ${
              currentStep > 4 ? 'bg-tertiary-fixed' : 'bg-surface-container-highest'
            }`}
          ></div>

          {/* Step 5 */}
          <button
            type="button"
            onClick={() => setCurrentStep(5)}
            className="flex flex-col items-center gap-1.5 focus:outline-none"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                currentStep === 5
                  ? 'bg-secondary text-on-secondary animate-pulse'
                  : 'bg-surface-container-highest text-outline'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">family_restroom</span>
            </div>
            <span
              className={`font-label-sm text-label-sm ${
                currentStep === 5 ? 'text-secondary font-bold' : 'text-outline'
              }`}
            >
              Família
            </span>
          </button>
        </div>
      </div>

      <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        {/* SEÇÃO 1: DADOS PESSOAIS (Colapsável) */}
        <details
          open={currentStep === 1}
          className="group bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all duration-300"
        >
          <summary
            onClick={() => setCurrentStep(1)}
            className="flex items-center justify-between p-4 cursor-pointer list-none select-none bg-surface-container-low hover:bg-surface-container"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-tertiary-container text-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">badge</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary">1. Dados Pessoais</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Revisar identificação básica do jovem
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-tertiary-container text-tertiary-fixed-dim">
                Validado
              </span>
              <span className="material-symbols-outlined text-outline transition-transform duration-300 group-open:rotate-180">
                expand_more
              </span>
            </div>
          </summary>
          <div className="p-4 space-y-3.5 bg-surface-container-lowest">
            <div>
              <label className="block font-label-lg text-label-lg text-primary mb-1">
                Nome Completo do Aluno *
              </label>
              <input
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Nome sem abreviações"
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-label-lg text-label-lg text-primary mb-1">
                  Nascimento *
                </label>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                />
              </div>
              <div>
                <label className="block font-label-lg text-label-lg text-primary mb-1">
                  Idade Apurada
                </label>
                <div className="flex items-center h-[44px] px-3.5 rounded-lg bg-surface-container text-primary font-headline-sm text-headline-sm">
                  <span>{calculatedAge}</span>&nbsp;
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    anos (Sub-{calculatedAge <= 11 ? '11' : calculatedAge <= 13 ? '13' : '17'})
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-label-lg text-label-lg text-primary mb-1">
                  CPF do Aluno
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
              <div>
                <label className="block font-label-lg text-label-lg text-primary mb-1">
                  RG / Órgão
                </label>
                <input
                  type="text"
                  value={rg}
                  onChange={(e) => setRg(e.target.value)}
                  placeholder="Número e órgão"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>
            <div>
              <label className="block font-label-lg text-label-lg text-primary mb-1">
                Etnia (Classificação IBGE)
              </label>
              <div className="relative">
                <select
                  value={etnia}
                  onChange={(e) => setEtnia(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary pr-10"
                >
                  <option value="">Selecione</option>
                  <option value="parda">Parda</option>
                  <option value="preta">Preta</option>
                  <option value="branca">Branca</option>
                  <option value="amarela">Amarela</option>
                  <option value="indigena">Indígena</option>
                  <option value="nao_declarado">Prefere não informar</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-outline">
                  unfold_more
                </span>
              </div>
            </div>
          </div>
        </details>

        {/* SEÇÃO 2: ESCOLARIDADE & NIS (Colapsável) */}
        <details
          open={currentStep === 2}
          className="group bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all duration-300"
        >
          <summary
            onClick={() => setCurrentStep(2)}
            className="flex items-center justify-between p-4 cursor-pointer list-none select-none bg-surface-container-low hover:bg-surface-container"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-tertiary-container text-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">school</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary">
                  2. Escolaridade & NIS
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Vínculo institucional e proteção social
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-tertiary-container text-tertiary-fixed-dim">
                Validado
              </span>
              <span className="material-symbols-outlined text-outline transition-transform duration-300 group-open:rotate-180">
                expand_more
              </span>
            </div>
          </summary>
          <div className="p-4 space-y-3.5 bg-surface-container-lowest">
            <div>
              <label className="block font-label-lg text-label-lg text-primary mb-1">
                NIS (Número de Identificação Social)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="000.0000.000-0"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary pl-10"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[20px]">
                  pin
                </span>
              </div>
            </div>
            <div>
              <label className="block font-label-lg text-label-lg text-primary mb-1">
                Escola Atual *
              </label>
              <input
                type="text"
                value={escola}
                onChange={(e) => setEscola(e.target.value)}
                placeholder="Nome da instituição de ensino"
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-label-lg text-label-lg text-primary mb-1">
                  Série / Ano
                </label>
                <div className="relative">
                  <select
                    value={serie}
                    onChange={(e) => setSerie(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary pr-8"
                  >
                    <option value="">Selecione</option>
                    <option value="4">4º Ano Fundamental</option>
                    <option value="5">5º Ano Fundamental</option>
                    <option value="6">6º Ano Fundamental</option>
                    <option value="7">7º Ano Fundamental</option>
                    <option value="8">8º Ano Fundamental</option>
                    <option value="9">9º Ano Fundamental</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 pointer-events-none text-outline text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>
              <div>
                <label className="block font-label-lg text-label-lg text-primary mb-1">
                  Turno Escolar
                </label>
                <div className="relative">
                  <select
                    value={turnoEscolar}
                    onChange={(e) =>
                      setTurnoEscolar(e.target.value as 'manha' | 'tarde' | 'integral' | '')
                    }
                    className="w-full appearance-none px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary pr-8"
                  >
                    <option value="">Selecione</option>
                    <option value="manha">Manhã</option>
                    <option value="tarde">Tarde</option>
                    <option value="integral">Integral</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 pointer-events-none text-outline text-[18px]">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          </div>
        </details>

        {/* SEÇÃO 3: SAÚDE E CUIDADOS ESPECIAIS (Em Foco Ativo) */}
        <div className="bg-surface-container-lowest rounded-xl shadow-md p-4 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-secondary text-on-secondary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[20px]">health_and_safety</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary">
                  3. Ficha de Saúde & Cuidados
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Acolhimento clínico preventivo para práticas esportivas
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed">
              {currentStep === 3 ? 'Em Edição' : 'Revisado'}
            </span>
          </div>

          {/* Aviso Acolhedor de Confidencialidade */}
          <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
              verified_user
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Os dados clínicos são estritamente sigilosos e asseguram adaptação das cargas físicas, socorro ágil e segurança integral ao educando.
            </p>
          </div>

          {/* Pergunta 1: Deficiência */}
          <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-label-lg text-label-lg text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  accessible_forward
                </span>
                Possui deficiência ou PCD?
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pcd_status"
                    checked={!hasPcd}
                    onChange={() => setHasPcd(false)}
                    className="w-4 h-4 text-secondary focus:ring-secondary"
                  />
                  <span className="font-body-md text-body-md text-on-surface">Não</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pcd_status"
                    checked={hasPcd}
                    onChange={() => setHasPcd(true)}
                    className="w-4 h-4 text-secondary focus:ring-secondary"
                  />
                  <span className="font-body-md text-body-md text-on-surface font-semibold">Sim</span>
                </label>
              </div>
            </div>
            {hasPcd && (
              <div className="pt-2">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Qual deficiência? (Física, auditiva, visual, cognitiva ou múltipla)
                </label>
                <input
                  type="text"
                  value={pcdDesc}
                  onChange={(e) => setPcdDesc(e.target.value)}
                  placeholder="Descreva as especificações e laudo se houver"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            )}
          </div>

          {/* Pergunta 2: Problema Crônico */}
          <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-label-lg text-label-lg text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  cardiology
                </span>
                Possui problema crônico de saúde?
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="chronic_status"
                    checked={!hasChronic}
                    onChange={() => setHasChronic(false)}
                    className="w-4 h-4 text-secondary focus:ring-secondary"
                  />
                  <span className="font-body-md text-body-md text-on-surface">Não</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="chronic_status"
                    checked={hasChronic}
                    onChange={() => setHasChronic(true)}
                    className="w-4 h-4 text-secondary focus:ring-secondary"
                  />
                  <span className="font-body-md text-body-md text-on-surface font-semibold">Sim</span>
                </label>
              </div>
            </div>
            {hasChronic && (
              <div className="pt-2">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Ex: Asma, bronquite, cardiopatia congênita, diabetes...
                </label>
                <input
                  type="text"
                  value={chronicDesc}
                  onChange={(e) => setChronicDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            )}
          </div>

          {/* Pergunta 3: Medicamento Controlado */}
          <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-label-lg text-label-lg text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">pill</span>
                Usa medicação contínua / controlada?
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="med_status"
                    checked={!hasMed}
                    onChange={() => setHasMed(false)}
                    className="w-4 h-4 text-secondary focus:ring-secondary"
                  />
                  <span className="font-body-md text-body-md text-on-surface">Não</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="med_status"
                    checked={hasMed}
                    onChange={() => setHasMed(true)}
                    className="w-4 h-4 text-secondary focus:ring-secondary"
                  />
                  <span className="font-body-md text-body-md text-on-surface font-semibold">Sim</span>
                </label>
              </div>
            </div>
            {hasMed && (
              <div className="pt-2">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Nome da medicação, dosagem prescrita e horários
                </label>
                <input
                  type="text"
                  value={medDesc}
                  onChange={(e) => setMedDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO 4: SELEÇÃO DE MODALIDADES ESPORTIVAS */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">sports</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary">
                  4. Modalidades Esportivas
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Selecione as turmas pretendidas (máx. 3)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-tertiary-container text-tertiary-fixed font-bold">
              {selectedSports.length} Selecionada{selectedSports.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {sports.length > 0 ? sports.map((sport) => {
              const isChecked = selectedSports.includes(sport.nome);
              return (
                <div
                  key={sport.nome}
                  onClick={() => toggleSport(sport.nome)}
                  className={`sport-card cursor-pointer flex items-center justify-between p-3 rounded-xl transition-all select-none ${
                    isChecked
                      ? 'bg-surface-container-low border border-secondary/20'
                      : 'bg-surface-container-lowest shadow-sm hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isChecked
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[19px]">
                        {sport.icone || 'sports'}
                      </span>
                    </div>
                    <div>
                      <p className="font-label-lg text-label-lg text-primary font-bold">
                        {sport.nome}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {sport.descricao || 'Modalidade disponível'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div
                      className={`check-box-indicator w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-secondary text-on-secondary'
                          : 'bg-surface-container-highest text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="col-span-full py-4 text-center text-on-surface-variant">
                Nenhuma modalidade disponível para seleção.
              </p>
            )}
          </div>
        </div>

        {/* SEÇÃO 5: VÍNCULO DO RESPONSÁVEL LEGAL & COMPOSIÇÃO FAMILIAR */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container text-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">family_restroom</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm text-primary">
                  5. Vínculo do Responsável & Família
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Representante legal e composição domiciliar
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsNewGuardian(!isNewGuardian)}
              className="text-secondary font-label-md text-label-md flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isNewGuardian ? 'search' : 'person_add'}
              </span>
              {isNewGuardian ? 'Buscar Existente' : '+ Novo'}
            </button>
          </div>

          {isNewGuardian ? (
            <div className="space-y-3 p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high">
              <h3 className="font-label-md text-label-md text-primary font-bold uppercase">
                Novo Responsável Legal
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-primary mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-primary mb-1">Parentesco</label>
                  <input
                    type="text"
                    value={guardianKinship}
                    onChange={(e) => setGuardianKinship(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-primary mb-1">Telefone/WhatsApp *</label>
                  <input
                    type="text"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-primary mb-1">CPF *</label>
                  <input
                    type="text"
                    value={guardianCpf}
                    onChange={(e) => setGuardianCpf(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-body-md"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-primary mb-1">Faixa de Renda</label>
                  <select
                    value={guardianIncomeRange}
                    onChange={(e) =>
                      setGuardianIncomeRange(
                        e.target.value as
                          | 'ate_1_sm'
                          | 'ate_2_sm'
                          | 'ate_3_sm'
                          | 'ate_4_sm'
                          | 'acima_4_sm'
                          | ''
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest text-on-surface text-body-md"
                  >
                    <option value="">Não informado</option>
                    <option value="ate_1_sm">Até 01 Salário Mínimo</option>
                    <option value="ate_2_sm">Até 02 Salários Mínimos</option>
                    <option value="ate_3_sm">Até 03 Salários Mínimos</option>
                    <option value="ate_4_sm">Até 04 Salários Mínimos</option>
                    <option value="acima_4_sm">Acima de 04 Salários</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div role="status" className="p-3 rounded-lg bg-surface-container-low text-on-surface-variant">
              A busca de responsáveis cadastrados ainda não está disponível. Cadastre um novo responsável para continuar.
            </div>
          )}

          {/* Tabela Dinâmica: Residentes no Domicílio */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                Composição Familiar (Residentes no Domicílio)
              </span>
              <button
                type="button"
                onClick={addFamilyMember}
                className="text-secondary font-label-sm text-label-sm flex items-center gap-1 hover:underline font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> Adicionar Membro
              </button>
            </div>

            <div className="space-y-2">
              {familyMembers.map((member, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-surface-container-low grid grid-cols-12 gap-2 items-center text-body-sm"
                >
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Nome"
                      value={member.nome}
                      onChange={(e) => updateFamilyMember(idx, 'nome', e.target.value)}
                      className="w-full px-2 py-1.5 rounded bg-surface-container-lowest text-on-surface text-[12px]"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Parentesco"
                      value={member.parentesco}
                      onChange={(e) => updateFamilyMember(idx, 'parentesco', e.target.value)}
                      className="w-full px-2 py-1.5 rounded bg-surface-container-lowest text-on-surface text-[12px]"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Idade"
                      value={member.idade}
                      onChange={(e) => updateFamilyMember(idx, 'idade', parseInt(e.target.value) || '')}
                      className="w-full px-2 py-1.5 rounded bg-surface-container-lowest text-on-surface text-[12px]"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Renda R$"
                      value={member.renda}
                      onChange={(e) => updateFamilyMember(idx, 'renda', parseFloat(e.target.value) || '')}
                      className="w-full px-2 py-1.5 rounded bg-surface-container-lowest text-on-surface text-[12px]"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeFamilyMember(idx)}
                      className="text-outline hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totalizadores Automáticos */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container text-primary font-label-md text-label-md">
              <span>
                Total de Residentes: <strong>{totalResidents} pessoas</strong>
              </span>
              <span>
                Renda Familiar Total: <strong>R$ {totalFamilyIncome.toFixed(2)}</strong>
              </span>
            </div>
          </div>

          {/* Autorizações e Termos */}
          <div className="p-3 bg-surface-container-low rounded-xl space-y-2 pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={imageAuth}
                onChange={(e) => setImageAuth(e.target.checked)}
                className="w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary mt-0.5"
              />
              <span className="font-body-sm text-[12px] text-on-surface leading-tight">
                Autorizo expressamente o direito de uso de imagem do participante para fins institucionais, educativos e pedagógicos do Projeto Esporte Dagaz.
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationAuth}
                onChange={(e) => setDeclarationAuth(e.target.checked)}
                className="w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary mt-0.5"
              />
              <span className="font-body-sm text-[12px] text-on-surface leading-tight">
                Declaro serem verdadeiras todas as informações aqui citadas, respondendo pela veracidade dos dados perante o programa.
              </span>
            </label>
          </div>
        </div>

        {/* BOTÕES DE NAVEGAÇÃO E AÇÃO FINAL */}
        <div className="pt-2 pb-6 space-y-3">
          {/* Botão Primário de Finalização */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full h-13 py-3.5 px-6 rounded-xl bg-primary text-on-primary hover:bg-primary-container shadow-md flex items-center justify-between group transition-all active:scale-[0.99] disabled:opacity-75"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-tertiary-fixed text-[24px]">
                task_alt
              </span>
              <span className="font-label-lg text-label-lg font-bold tracking-wide">
                {isSubmitting ? 'Registrando no Sistema...' : 'Finalizar Cadastro do Aluno'}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-highest/20 px-2 py-1 rounded-lg">
              <span className="font-label-sm text-label-sm text-tertiary-fixed">Pronto</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary-fixed group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3">
            {/* Voltar Etapa */}
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              className="h-11 px-4 rounded-xl bg-surface-container text-primary font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Voltar Etapa
            </button>
            {/* Salvar Rascunho */}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="h-11 px-4 rounded-xl bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">
                bookmark_border
              </span>
              Salvar Rascunho
            </button>
          </div>
        </div>
      </form>

      {/* Diálogo / Modal de Confirmação e Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-tertiary-container text-tertiary-fixed flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[36px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                celebration
              </span>
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-primary font-bold">
                Matrícula Concluída!
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1.5">
                {nomeCompleto} foi cadastrado com sucesso nas turmas de {selectedSports.join(', ')}.
              </p>
            </div>
            <div className="w-full bg-surface-container-low p-3 rounded-xl text-left space-y-1">
              <p className="font-label-sm text-label-sm text-on-surface-variant">Próximo Passo:</p>
              <p className="font-body-sm text-body-sm text-primary font-semibold">
                Declaração de frequência socioesportiva emitida pronta para assinatura da responsável.
              </p>
            </div>
            <div className="w-full flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  onNavigate('matriculas');
                }}
                className="w-full py-3 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-bold"
              >
                Ver Ficha do Aluno
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setNomeCompleto('');
                  setCpf('');
                  setCurrentStep(1);
                }}
                className="w-full py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md"
              >
                Novo Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
