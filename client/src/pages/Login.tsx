import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@esportedagaz.org.br');
  const [password, setPassword] = useState('Admin@Dagaz2026!');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successAuth, setSuccessAuth] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      await login(email, password, rememberMe);
      setSuccessAuth(true);
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface font-sans text-on-surface antialiased pt-safe pb-safe min-h-screen flex flex-col justify-center">
      <main className="flex flex-col relative w-full px-margin-mobile bg-surface">
        <div className="flex flex-col w-full max-w-md mx-auto py-space-sm pb-space-lg select-none">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-space-md">
            {/* Emblem Container with soft halo */}
            <div className="relative mb-space-sm flex items-center justify-center">
              <div className="absolute w-28 h-28 rounded-full bg-secondary-fixed/40 blur-xl"></div>
              <div className="relative bg-surface-container-lowest p-3 rounded-full shadow-md flex items-center justify-center">
                <img
                  alt="Logotipo Oficial Projeto Esporte Dagaz"
                  className="w-20 h-20 object-contain drop-shadow-sm"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnHMFEUdUVmRjfMIKsVPxX2mcIKs7eupASgcyMuWpVXYlRkR312TSvOswdJOxpNLvpdm_DXu44TGafWdpcpAHgCUA1XXsHnezYSABrVd9DpRK-7cLiLYgHTJ9gEKHIYTbRbTQ1wJG23Onielm2rEbGOVoxMWqEh5Hgl9pzbaFCw1boVlqKj9gpMbll5G42MKztHU6-bmDGcQmF9piGGi7O4u6jc-dApF1BoYKE9Zs"
                />
              </div>
            </div>

            {/* Restrict Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm mb-space-xs shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-variant animate-pulse"></span>
              <span>Acesso Restrito • Equipe Dagaz</span>
            </div>
            <h1 className="font-headline-sm text-headline-sm text-primary tracking-tight">
              Projeto Esporte Dagaz
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Sistema de Gestão Administrativa
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-md relative overflow-hidden">
            {/* Subtle Top Ambient Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary-container via-tertiary-fixed to-secondary"></div>

            {errorMessage && (
              <div className="mb-3 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="flex flex-col gap-space-sm mt-1" onSubmit={handleSubmit}>
              {/* E-mail Field */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="font-label-md text-label-md text-primary flex items-center justify-between"
                  htmlFor="admin-email"
                >
                  <span>E-mail institucional</span>
                  <span className="text-on-surface-variant font-body-sm text-label-sm font-normal">
                    Domínio @dagaz.org.br
                  </span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-lg pointer-events-none transition-colors duration-200">
                    mail
                  </span>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@dagaz.org.br"
                    className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-primary" htmlFor="admin-pass">
                    Chave de acesso
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="font-label-sm text-label-sm text-secondary hover:underline transition-all focus:outline-none"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-lg pointer-events-none transition-colors duration-200">
                    lock
                  </span>
                  <input
                    id="admin-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-11 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Alternar visibilidade da senha"
                    className="absolute right-2.5 p-1 rounded text-outline hover:text-on-surface focus:outline-none transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember device checkbox */}
              <div className="flex items-center gap-2 mt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-on-surface-variant font-body-sm text-body-sm select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary cursor-pointer"
                  />
                  <span>Lembrar meu acesso neste dispositivo</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full h-11 mt-2 rounded-lg font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all ${
                  successAuth
                    ? 'bg-tertiary-container text-tertiary-fixed'
                    : 'bg-primary hover:bg-primary-container text-on-primary'
                }`}
              >
                <span>
                  {loading
                    ? 'Autenticando...'
                    : successAuth
                    ? 'Acesso Autorizado!'
                    : 'Entrar no sistema'}
                </span>
                <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-0.5">
                  {successAuth ? 'check_circle' : 'login'}
                </span>
              </button>
            </form>

            {/* Operational Guardrail Notice */}
            <div className="mt-space-sm pt-space-xs flex items-center justify-center gap-1.5 text-center">
              <span className="material-symbols-outlined text-sm text-outline">verified_user</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Sessões monitoradas para segurança dos dados infanto-juvenis
              </span>
            </div>
          </div>

          {/* Security & LGPD Accreditation Footer */}
          <div className="flex flex-col items-center text-center mt-space-md gap-space-xs px-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low text-tertiary-container shadow-sm">
              <span className="material-symbols-outlined text-tertiary-fixed-variant text-base">
                shield_lock
              </span>
              <span className="font-label-sm text-label-sm text-on-surface">
                Criptografia de ponta a ponta • LGPD Compliant
              </span>
            </div>
            <div className="flex flex-col items-center text-outline text-label-sm font-label-sm mt-1">
              <p>v1.0.4 • Projeto Social Esporte Dagaz</p>
              <p className="text-on-surface-variant/70 mt-0.5">
                Módulo de Governança e Controle Operacional
              </p>
            </div>
          </div>

          {/* Forgot Password Guidance Modal Dialog */}
          {showForgotModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setShowForgotModal(false)}
            >
              <div
                className="w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-xl p-space-md flex flex-col gap-space-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">help_center</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex flex-col gap-1">
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Recuperação de Acesso
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Por motivos de segurança e integridade das fichas dos alunos, as credenciais administrativas são gerenciadas internamente.
                  </p>
                </div>

                {/* Action Card Inside Modal */}
                <div className="p-3 bg-surface-container-low rounded-lg flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-secondary text-base mt-0.5">
                      contact_support
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      Entre em contato com o <strong>Administrador do Polo</strong> ou solicite um link temporário com sua coordenação geral.
                    </p>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex flex-col gap-2 mt-1">
                  <a
                    className="w-full h-10 bg-secondary hover:bg-secondary-container text-on-secondary rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    href="mailto:suporte@dagaz.org.br?subject=Solicitação de Redefinição de Senha Administrativa"
                  >
                    <span className="material-symbols-outlined text-base">forward_to_inbox</span>
                    <span>Enviar e-mail para Suporte</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full h-10 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-md text-label-md transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
