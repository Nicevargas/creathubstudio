
import React, { useState, useEffect } from 'react';
import { History, Loader2, ArrowDownCircle, Image, Video, Clock } from 'lucide-react';
import { User, CreditUsage } from '../types';
import { getUsageHistory } from '../services/creditsService';

interface HistoryPageProps {
  user: User;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ user }) => {
  const [history, setHistory] = useState<CreditUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await getUsageHistory(user.id);
        setHistory(data);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="text-sky-500" /> Histórico de Movimentações
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Registro detalhado de uso de créditos (Tabela: credit_history)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          </div>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 w-48">Data e Hora</th>
                  <th className="px-6 py-4 w-32 text-center">Tipo</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4 w-32 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <div>
                          <div className="font-medium">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.type === 'video' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100">
                          <Video size={12} /> Vídeo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-600 border border-sky-100">
                          <Image size={12} /> Imagem
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {item.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="font-mono font-bold text-red-500 flex items-center justify-end gap-1">
                         <ArrowDownCircle size={14} /> -{item.amount}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="bg-slate-50 p-4 rounded-full mb-3">
              <History size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">Nenhum registro encontrado</p>
            <p className="text-xs max-w-xs text-center mt-1">
              As movimentações aparecerão aqui assim que você utilizar seus créditos para gerar conteúdo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
