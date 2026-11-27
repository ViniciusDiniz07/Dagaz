export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'coordenador' | 'atendente' | 'consulta';
  avatarUrl?: string | null;
}

export interface Student {
  id: string;
  matricula_numero: string;
  nome_completo: string;
  data_nascimento: string;
  idade: number;
  cpf_mascarado?: string;
  cpf?: string;
  rg?: string;
  orgao_emissor?: string;
  nis?: string;
  etnia?: string;
  escola?: string;
  serie?: string;
  turno_escolar?: string;
  status: 'ativa' | 'aguardando_vaga' | 'trancada' | 'cancelada' | 'ativo' | 'trancado' | 'cancelado';
  foto_url?: string | null;
  modalidade: string;
  turma: string;
  horario: string;
  dias: string;
  local: string;
  todas_matriculas?: Array<{
    id: string;
    status: string;
    data_matricula: string;
    modalidade: string;
    turma: string;
    horario: string;
    dias: string;
    local: string;
  }>;
  responsavel?: {
    id: string;
    nome: string;
    parentesco: string;
    telefone: string;
    telefone_mascarado?: string;
  } | null;
  saude?: {
    laudo_ok: boolean;
    possui_alerta: boolean;
    observacoes?: string | null;
  };
}

export interface Sport {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  icone: string;
  totalAlunos?: number;
}

export interface SportClass {
  id: string;
  sports_id: string;
  sportNome?: string;
  nome: string;
  faixa_etaria: string;
  dias_semana: string;
  horario: string;
  turno: string;
  local: string;
  capacidade: number;
  vagasOcupadas?: number;
  vagasRestantes?: number;
}

export interface Guardian {
  id: string;
  nome_completo: string;
  cpf: string;
  cpfMascara?: string;
  rg?: string;
  nis?: string;
  telefone: string;
  email?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade: string;
  cep?: string;
  parentesco?: string;
  ocupacao?: string;
  escolaridade?: string;
  renda_familiar_faixa?: string;
  beneficiario_programa_social?: boolean;
  programa_social?: string;
}

export interface FamilyMember {
  nome: string;
  parentesco: string;
  idade: number | null;
  escolaridade: string | null;
  profissao: string | null;
  renda: number;
}

export interface DashboardData {
  period: string;
  periodLabel: string;
  kpis: {
    totalAlunos: number;
    alunosNovos: number;
    alunosAtivos: number;
    percentualAlunosAtivos: number;
    matriculasTotais: number;
    matriculasAtivas: number;
    matriculasAguardandoVaga: number;
    matriculasTrancadas: number;
    matriculasCanceladas: number;
    totalResponsaveis: number;
    fichasPendentes: number;
  };
  modalidades: Array<{
    id?: string;
    nome: string;
    count: number;
    percent: number;
    color: string;
  }>;
  faixaEtaria: {
    grupo1: { faixa: string; percent: number; count: number };
    grupo2: { faixa: string; percent: number; count: number };
    grupo3: { faixa: string; percent: number; count: number };
  };
  atividadesRecentes: Array<{
    id: string;
    titulo: string;
    descricao: string;
    tempo: string;
    status: string;
    tipo: string;
    icone: string;
  }>;
}

export interface OCRExtractedData {
  student: {
    name: { value: string | null; confidence: number; status: string };
    birth_date: { value: string | null; confidence: number; status: string };
    calculated_age: { value: number | null; confidence: number; status: string };
    cpf: { value: string | null; confidence: number; status: string };
    rg: { value: string | null; confidence: number; status: string };
    orgao_emissor: { value: string | null; confidence: number; status: string };
    nis: { value: string | null; confidence: number; status: string };
    ethnicity: { value: string | null; confidence: number; status: string };
    school: { value: string | null; confidence: number; status: string };
    grade: { value: string | null; confidence: number; status: string };
  };
  guardian: {
    name: { value: string | null; confidence: number; status: string };
    cpf: { value: string | null; confidence: number; status: string };
    relationship: { value: string | null; confidence: number; status: string };
    phone: { value: string | null; confidence: number; status: string };
    address: { value: string | null; confidence: number; status: string };
    social_program: { value: string | null; confidence: number; status: string };
  };
  health: {
    has_disability: { value: boolean; confidence: number; status: string };
    has_chronic_disease: { value: boolean; confidence: number; status: string };
    chronic_disease_description: { value: string | null; confidence: number; status: string };
    uses_controlled_medication: { value: boolean; confidence: number; status: string };
    health_notes: { value: string | null; confidence: number; status: string };
  };
  family_members?: FamilyMember[];
  modalities: Array<{
    name: string;
    checked: boolean;
    confidence: number;
  }>;
  authorizations: {
    image_use: { value: boolean; confidence: number; status: string };
    responsibility_declaration: { value: boolean; confidence: number; status: string };
  };
  general_confidence?: number;
  review_required?: boolean;
}
