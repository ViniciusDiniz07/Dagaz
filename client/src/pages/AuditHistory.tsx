import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export const AuditHistory: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .listAuditLogs()
      .then((res) => setLogs(res.logs))
      .catch((err) => console.error('Erro ao buscar auditoria:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col w-full pb-8 space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[22px]">history</span>
          <h1 className="font-headline-md text-headline-md text-primary font-bold">
            Histórico de Alterações & Auditoria
          </h1>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Registro imutável de acessos, cadastros e validações conforme princípios de governança da LGPD.
        </p>
      </div>

      {/* Logs Table / Card List */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[32px] animate-spin text-secondary">
              progress_activity
            </span>
            <span className="font-body-md text-body-md">Carregando trilha de auditoria...</span>
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-surface-container-high/40">
            {logs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-surface-container-low transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        log.resultado === 'SUCESSO'
                          ? 'bg-on-tertiary-container'
                          : log.resultado === 'NEGADO'
                          ? 'bg-error'
                          : 'bg-outline'
                      }`}
                    ></span>
                    <span className="font-label-md text-label-md font-bold text-primary">
                      {log.acao}
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] bg-surface-container text-on-surface-variant uppercase">
                      {log.entidade}
                    </span>
                  </div>
                  <span className="text-[11px] text-outline font-medium">
                    {new Date(log.data_hora).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm text-on-surface-variant mt-1">
                  <span>Operador: {log.user_email || 'Sistema / Anônimo'}</span>
                  <span className="text-[11px] text-outline">IP: {log.ip || 'Local'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-8 text-center text-outline">Nenhum registro de auditoria encontrado.</p>
        )}
      </div>
    </div>
  );
};
