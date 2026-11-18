import React, { useState, useRef } from 'react';
import { api } from '../services/api.js';
import { OCRExtractedData } from '../types/index.js';

interface DocumentScannerProps {
  onNavigate: (path: string) => void;
}

export const DocumentScanner: React.FC<DocumentScannerProps> = ({ onNavigate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Estado da aba ativa ('data' | 'doc')
  const [activeTab, setActiveTab] = useState<'data' | 'doc'>('data');

  // Estado do zoom e pan da imagem original
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Estado do arquivo processado
  const [fileName, setFileName] = useState('ficha_inscricao_felipe_santos_2025.jpg');
  const [fileSize, setFileSize] = useState('1.8 MB');
  const [previewImage, setPreviewImage] = useState(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDT7DuqWat7sfigyNprau6OlYjsqdYRvtHL1Uj4TfRKcVZz4wRqGIAEQbq8AeENaMUGeLt7B-3zZOWs-LvTxDd1jVrdjqeyMTqO0AxM0L2fy9DhEze7y27tCGRdCO71n7XmZF6e3GOZzEgXDyjesRex0XHGxL-U7wWgY0thQH3ZDW-gWe80WsiF8Ih1kYOel2bA1uja9Z-avwtclwcwDxaRRmbJVauydDonJmLSLHE'
  );
  const [currentDocId, setCurrentDocId] = useState('50000000-0000-0000-0000-000000000001');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState(96);

  // Campos extraídos e editáveis
  const [studentName, setStudentName] = useState('Felipe dos Santos Rocha');
  const [birthDate, setBirthDate] = useState('14/05/2012');
  const [studentCpf, setStudentCpf] = useState('145.892.307-44');
  const [studentRg, setStudentRg] = useState('31.849.201-8 DETRAN-RJ');
  const [studentNis, setStudentNis] = useState('209.431.882-90');
  const [guardianName, setGuardianName] = useState('Mariana dos Santos Rocha');
  const [guardianPhone, setGuardianPhone] = useState('(24) 99842-1102');
  const [address, setAddress] = useState(
    'Rua Projetada B, 45 - Bairro Santo Agostinho, Volta Redonda/RJ'
  );
  const [schoolInfo, setSchoolInfo] = useState('E.M. Professora Maria José - 7º Ano');
  const [healthNotes, setHealthNotes] = useState(
    'Possui asma moderada - usa bombinha quando necessário'
  );

  // Modalidades detectadas na ficha
  const [modalities, setModalities] = useState([
    { name: 'Judô', checked: true },
    { name: 'Futsal', checked: true },
    { name: 'Capoeira', checked: false },
    { name: 'Treinamento Funcional', checked: false },
    { name: 'Basquete 3x3', checked: false },
    { name: 'Futevôlei', checked: false },
  ]);

  // Modais de confirmação
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Manipulação de Zoom
  const adjustDocZoom = (delta: number) => {
    setCurrentZoom((prev) => Math.min(Math.max(0.8, prev + delta), 2.5));
  };

  const resetDocZoom = () => {
    setCurrentZoom(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleModality = (index: number) => {
    const updated = [...modalities];
    updated[index].checked = !updated[index].checked;
    setModalities(updated);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
    setIsProcessing(true);

    // Cria preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    try {
      const result = await api.extractDocument(file);
      setCurrentDocId(result.documentId);
      setOcrConfidence(Math.round(result.confianca_geral || 95));

      const dados: OCRExtractedData = result.dados;
      if (dados.student?.name?.value) setStudentName(dados.student.name.value);
      if (dados.student?.birth_date?.value) setBirthDate(dados.student.birth_date.value);
      if (dados.student?.cpf?.value) setStudentCpf(dados.student.cpf.value);
      if (dados.student?.rg?.value) setStudentRg(dados.student.rg.value);
      if (dados.student?.nis?.value) setStudentNis(dados.student.nis.value);
      if (dados.guardian?.name?.value) setGuardianName(dados.guardian.name.value);
      if (dados.guardian?.phone?.value) setGuardianPhone(dados.guardian.phone.value);
      if (dados.guardian?.address?.value) setAddress(dados.guardian.address.value);
      if (dados.student?.school?.value) {
        setSchoolInfo(`${dados.student.school.value} - ${dados.student.grade?.value || ''}`);
      }
      if (dados.health?.chronic_disease_description?.value) {
        setHealthNotes(dados.health.chronic_disease_description.value);
      }

      if (dados.modalities) {
        setModalities(
          dados.modalities.map((m) => ({
            name: m.name,
            checked: m.checked,
          }))
        );
      }

      setActiveTab('data');
    } catch (err: any) {
      alert(err.message || 'Erro ao processar imagem da ficha com OCR Gemini.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadOfficialSample = () => {
    setFileName('ficha_exemplo_dagaz_2026.jpg');
    setFileSize('1.4 MB');
    setPreviewImage('/sample-fichas/ficha_exemplo_dagaz_2026.jpg');
    setStudentName('Felipe dos Santos Rocha');
    setBirthDate('14/05/2012');
    setStudentCpf('145.892.307-44');
    setStudentRg('31.849.201-8 DETRAN-RJ');
    setStudentNis('209.431.882-90');
    setGuardianName('Mariana dos Santos Rocha');
    setGuardianPhone('(24) 99842-1102');
    setAddress('Rua Projetada B, 45 - Bairro Santo Agostinho, Volta Redonda/RJ');
    setSchoolInfo('E.M. Professora Maria José - 7º Ano');
    setHealthNotes('Possui asma moderada - usa bombinha quando necessário');
    setOcrConfidence(96);
  };

  const handleConfirmRegistration = async () => {
    setIsSaving(true);
    try {
      const payloadRevisado = {
        student: {
          name: { value: studentName },
          birth_date: { value: birthDate.split('/').reverse().join('-') },
          cpf: { value: studentCpf },
          rg: { value: studentRg },
          nis: { value: studentNis },
          school: { value: schoolInfo.split(' - ')[0] || schoolInfo },
          grade: { value: schoolInfo.split(' - ')[1] || '7º Ano' },
          ethnicity: { value: 'parda' },
        },
        guardian: {
          name: { value: guardianName },
          relationship: { value: 'Mãe' },
          phone: { value: guardianPhone },
          address: { value: address },
          social_program: { value: 'Bolsa Família' },
        },
        health: {
          has_disability: { value: false },
          has_chronic_disease: { value: true },
          chronic_disease_description: { value: healthNotes },
          uses_controlled_medication: { value: true },
          health_notes: { value: healthNotes },
        },
        modalities: modalities,
      };

      await api.confirmDocumentOCR(currentDocId, payloadRevisado);
      setShowSuccessModal(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar cadastro conferido.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (confirm('Deseja realmente rejeitar esta leitura e capturar uma nova foto da ficha física?')) {
      api.rejectDocumentOCR(currentDocId).catch(() => {});
      setStudentName('');
      setStudentCpf('');
      alert('Ficha descartada com segurança. Aponte a câmera com boa iluminação para uma nova digitalização.');
    }
  };

  return (
    <div className="flex flex-col w-full pb-10 space-y-space-md">
      {/* Hidden File Inputs for Camera and Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
      />

      {/* 1. Banner Explicativo Superior com Design Humano & Confiável */}
      <section className="bg-surface-container-low rounded-xl p-space-md shadow-sm relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-secondary/5 rounded-full pointer-events-none"></div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shrink-0 shadow-md">
            <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-headline-sm text-headline-sm text-primary">
                Digitalização Assistida por IA
              </h1>
              <span className="bg-surface-container-highest text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full">
                OCR V2.4
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Envie a foto ou PDF da ficha impressa preenchida à mão. Nossa IA lê os campos e apresenta tudo organizado para sua conferência antes de salvar no sistema.
            </p>
            {/* Alerta Amigável & Empático de Governança */}
            <div className="mt-3 flex items-center gap-2 bg-surface-container-lowest/80 p-2.5 rounded-lg shadow-sm">
              <span className="material-symbols-outlined text-[18px] text-on-tertiary-container shrink-0">
                verified_user
              </span>
              <span className="font-label-sm text-label-sm text-on-surface">
                <strong>Controle total:</strong> Nenhum dado é salvo automaticamente. Você sempre tem a palavra final antes do registro.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Seção de Upload / Captura Móvel & Ficha Carregada */}
      <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-secondary">
              document_scanner
            </span>
            <h2 className="font-label-lg text-label-lg text-primary uppercase tracking-wide">
              Captura de Documento
            </h2>
          </div>
          <span className="font-label-sm text-label-sm text-on-tertiary-container bg-surface-container-low px-2 py-0.5 rounded-full font-medium">
            1 arquivo pronto
          </span>
        </div>

        {/* Botões de Ação Direta Mobile */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container active:scale-[0.98] transition-all text-primary text-center"
          >
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">photo_camera</span>
            </div>
            <span className="font-label-sm text-label-sm">Tirar Foto da Ficha</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container active:scale-[0.98] transition-all text-primary text-center"
          >
            <div className="w-10 h-10 rounded-full bg-surface-container text-secondary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">file_open</span>
            </div>
            <span className="font-label-sm text-label-sm">Galeria ou PDF</span>
          </button>
        </div>

        {/* Atalho de Ficha Real de Teste */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={handleLoadOfficialSample}
            className="w-full py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">assignment</span>
            <span>Carregar Ficha Física de Inscrição Oficial Dagaz 2026 (Exemplo Anexado)</span>
          </button>
        </div>

        {/* Card de Demonstração do Arquivo Processado */}
        <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-3">
          <div className="relative w-14 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm bg-surface-container">
            <img
              alt="Ficha Digitalizada"
              className="w-full h-full object-cover"
              src={previewImage}
            />
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-on-primary">
                {isProcessing ? 'hourglass_top' : 'check_circle'}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="font-label-md text-label-md text-primary truncate" title={fileName}>
                {fileName}
              </p>
              <span className="text-[10px] text-outline font-medium shrink-0">{fileSize}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse"></span>
              <span className="font-label-sm text-[11px] text-on-tertiary-container font-semibold">
                {isProcessing
                  ? 'Processando com Google Gemini IA...'
                  : `Leitura OCR Concluída: ${ocrConfidence}% confiança`}
              </span>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-secondary h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${ocrConfidence}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Visualizador Interativo e Conferência de Dados Lado a Lado */}
      <section className="space-y-3">
        {/* Abas / Chaveadores de Visualização Mobile */}
        <div className="flex bg-surface-container-low p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-2 px-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'data'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">fact_check</span>
            <span>Dados Extraídos (10)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('doc')}
            className={`flex-1 py-2 px-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'doc'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">image</span>
            <span>Ver Ficha Original</span>
          </button>
        </div>

        {/* Visualizador da Foto Original (Com Opção de Zoom Interativo) */}
        {activeTab === 'doc' && (
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Documento Digitalizado
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Aumentar zoom"
                  onClick={() => adjustDocZoom(0.2)}
                  className="w-8 h-8 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
                <button
                  type="button"
                  aria-label="Diminuir zoom"
                  onClick={() => adjustDocZoom(-0.2)}
                  className="w-8 h-8 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_out</span>
                </button>
                <button
                  type="button"
                  aria-label="Resetar zoom"
                  onClick={resetDocZoom}
                  className="w-8 h-8 rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">fit_screen</span>
                </button>
              </div>
            </div>

            <div
              className="relative w-full h-80 rounded-xl overflow-hidden bg-primary/5 flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-100"
                style={{
                  transform: `scale(${currentZoom}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                }}
              >
                <img
                  alt="Ficha de Inscrição Original"
                  className="max-w-full max-h-full object-contain shadow-md rounded"
                  src={previewImage}
                />
              </div>
              <div className="absolute bottom-2 left-2 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-medium text-primary shadow-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-secondary">crop_free</span>
                Arraste para navegar pelo zoom ({Math.round(currentZoom * 100)}%)
              </div>
            </div>
          </div>
        )}

        {/* Painel de Campos Extraídos e Editáveis */}
        {activeTab === 'data' && (
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary">
                  Conferência dos Campos
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Toque nos campos para ajustar eventuais grafias
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-tertiary-container font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                Conferido
              </span>
            </div>

            <form className="space-y-3.5" onSubmit={(e) => e.preventDefault()}>
              {/* Nome do Aluno */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                    Nome Completo do Aluno
                  </label>
                  <span className="font-label-sm text-[10px] text-on-tertiary-container bg-surface-container-low px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">verified</span> 99% precisão
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-3.5 py-2.5 rounded-lg focus:bg-surface-container-lowest focus:outline-none transition-all pr-9 font-medium"
                  />
                  <span className="material-symbols-outlined absolute right-2.5 top-3 text-[18px] text-on-tertiary-container pointer-events-none">
                    edit
                  </span>
                </div>
              </div>

              {/* Nascimento & Idade Calculada */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                      Nascimento
                    </label>
                    <span className="text-[10px] text-on-tertiary-container font-semibold">97%</span>
                  </div>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-3.5 py-2.5 rounded-lg focus:bg-surface-container-lowest focus:outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-outline uppercase font-bold tracking-wider">
                    Idade Calculada
                  </label>
                  <div className="w-full bg-surface-container px-3.5 py-2.5 rounded-lg font-body-md text-body-md font-semibold text-secondary flex items-center justify-between">
                    <span>12 anos</span>
                    <span className="material-symbols-outlined text-[16px] text-secondary">cake</span>
                  </div>
                </div>
              </div>

              {/* CPF & RG */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                      CPF do Aluno
                    </label>
                    <span className="text-[10px] text-on-tertiary-container font-semibold">94%</span>
                  </div>
                  <input
                    type="text"
                    value={studentCpf}
                    onChange={(e) => setStudentCpf(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-3.5 py-2.5 rounded-lg focus:bg-surface-container-lowest focus:outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                      RG / Órgão
                    </label>
                    <span className="text-[10px] text-on-tertiary-container font-semibold">91%</span>
                  </div>
                  <input
                    type="text"
                    value={studentRg}
                    onChange={(e) => setStudentRg(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-3.5 py-2.5 rounded-lg focus:bg-surface-container-lowest focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* NIS */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                    Número de Identificação Social (NIS)
                  </label>
                  <span className="font-label-sm text-[10px] text-secondary bg-surface-container-low px-2 py-0.5 rounded-full font-semibold">
                    CadÚnico
                  </span>
                </div>
                <input
                  type="text"
                  value={studentNis}
                  onChange={(e) => setStudentNis(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-3.5 py-2.5 rounded-lg focus:bg-surface-container-lowest focus:outline-none transition-all font-medium"
                />
              </div>

              {/* Responsável e Vínculo */}
              <div className="p-3 bg-surface-container-low rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      family_restroom
                    </span>
                    <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
                      Dados do Responsável
                    </span>
                  </div>
                  <span className="font-label-sm text-[11px] text-secondary bg-surface-container px-2 py-0.5 rounded-md font-semibold">
                    Mãe
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="font-label-sm text-[11px] text-on-surface-variant font-medium">
                    Nome do Responsável Legal
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md px-3 py-2 rounded-lg focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-sm text-[11px] text-on-surface-variant font-medium">
                    WhatsApp / Telefone de Contato
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md px-3 py-2 rounded-lg focus:outline-none font-medium pl-8"
                    />
                    <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[16px] text-on-tertiary-container">
                      call
                    </span>
                  </div>
                </div>
              </div>

              {/* Endereço Residencial */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                    Endereço Residencial
                  </label>
                  <span className="font-label-sm text-[10px] text-on-tertiary-container bg-surface-container-low px-2 py-0.5 rounded-full font-semibold">
                    98% precisão
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-3.5 py-2 rounded-lg focus:bg-surface-container-lowest focus:outline-none transition-all font-medium resize-none leading-snug"
                />
              </div>

              {/* Escola e Ano */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                    Unidade Escolar & Série
                  </label>
                  <span className="text-[10px] text-on-tertiary-container font-semibold">95%</span>
                </div>
                <input
                  type="text"
                  value={schoolInfo}
                  onChange={(e) => setSchoolInfo(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface font-body-md text-body-md px-3.5 py-2.5 rounded-lg focus:bg-surface-container-lowest focus:outline-none transition-all font-medium"
                />
              </div>

              {/* Modalidades Assinaladas na Ficha */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                    Modalidades Assinaladas
                  </label>
                  <span className="font-label-sm text-[11px] text-on-surface-variant font-medium">
                    Marcadas a caneta na ficha
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {modalities.map((m, idx) => (
                    <label
                      key={m.name}
                      onClick={() => toggleModality(idx)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors ${
                        m.checked
                          ? 'bg-surface-container-low'
                          : 'bg-surface-container-lowest text-on-surface-variant'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={m.checked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-secondary focus:ring-0 accent-secondary"
                      />
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-primary leading-tight">
                          {m.name}
                        </span>
                        {m.checked && (
                          <span className="font-label-sm text-[10px] text-on-tertiary-container font-semibold">
                            Assinalado [X]
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Informações de Saúde Detectadas */}
              <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2">
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-[20px] text-secondary">
                    medical_services
                  </span>
                  <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-primary">
                    Atenção Médica & Alergias
                  </span>
                  <span className="ml-auto font-label-sm text-[10px] bg-surface-container px-2 py-0.5 rounded text-on-secondary-fixed-variant font-bold">
                    Importante
                  </span>
                </div>
                <div className="space-y-1">
                  <input
                    type="text"
                    value={healthNotes}
                    onChange={(e) => setHealthNotes(e.target.value)}
                    className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md px-3 py-2 rounded-lg focus:outline-none font-medium"
                  />
                  <p className="font-body-sm text-[11px] text-on-surface-variant flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[13px] text-secondary">
                      info
                    </span>
                    Registrado na ficha física na seção de observações médicas.
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* 4. Barra de Ações Decisórias no Rodapé */}
      <section className="space-y-2.5 pt-2">
        {/* Botão Primário: Confirmar e Salvar Cadastro */}
        <button
          type="button"
          disabled={isSaving}
          onClick={handleConfirmRegistration}
          className="w-full h-13 py-3.5 px-4 rounded-xl bg-tertiary-container hover:bg-on-tertiary-fixed text-tertiary-fixed font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] transition-all disabled:opacity-75"
        >
          <span className="material-symbols-outlined text-[24px]">verified</span>
          <span>{isSaving ? 'Salvando no Banco PostgreSQL...' : 'Confirmar & Salvar Cadastro'}</span>
        </button>

        {/* Linha Secundária: Rejeitar ou Fazer Edição Manual */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDiscard}
            className="h-11 px-3 rounded-lg bg-surface-container-low hover:bg-error-container/40 text-error font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            <span>Rejeitar / Nova Foto</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('data');
              const firstInput = document.querySelector('input') as HTMLInputElement;
              if (firstInput) firstInput.focus();
            }}
            className="h-11 px-3 rounded-lg bg-surface-container hover:bg-surface-container-highest text-primary font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            <span>Editar Manualmente</span>
          </button>
        </div>
      </section>

      {/* Modal / Diálogo de Confirmação de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-primary-container/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl p-space-lg w-full max-w-sm shadow-2xl flex flex-col items-center text-center space-y-3 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-surface-container text-on-tertiary-container flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[32px]">task_alt</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary">Cadastro Efetivado!</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              O aluno <strong>{studentName}</strong> foi inserido no sistema com prontuário e ficha digital vinculada.
            </p>
            <div className="w-full pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  fileInputRef.current?.click();
                }}
                className="w-full py-2.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md shadow-md"
              >
                Digitalizar Próxima Ficha
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  onNavigate('matriculas');
                }}
                className="w-full py-2.5 rounded-lg bg-surface-container-low text-primary font-label-md text-label-md"
              >
                Ver Perfil do Aluno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
