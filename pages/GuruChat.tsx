
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, UserCircle, Sparkles, AlertCircle, Trash2, BrainCircuit, X, ArrowLeft, MessageSquare, ChevronRight, Target, Zap, ShieldCheck, UserCheck, HelpCircle, Settings } from 'lucide-react';
import { User, Especialista, ChatMessage } from '../types';

interface GuruChatProps {
  user: User;
}

const especialistas: (Especialista & { expertise: string })[] = [
  {
    id: 'erico-rocha',
    name: 'Érico Rocha',
    role: 'Lançamentos',
    expertise: 'Estrategista de Lançamentos e Infoprodutos',
    description: 'Maior referência em Lançamentos de Infoprodutos no Brasil. Especialista em empilhamento de pressão e vendas massivas.',
    avatar: 'https://yunwwchigsruxahcljqf.supabase.co/storage/v1/object/public/especialista/erico_rocha.jpg',
    color: 'bg-orange-600'
  },
  {
    id: 'conrado-adolpho',
    name: 'Conrado Adolpho',
    role: 'Estratégia 8Ps',
    expertise: 'Metodologia de Vendas e Processos',
    description: 'Criador do método 8Ps do Marketing Digital. Foco em processos estruturados, jornada do cliente e ROI real.',
    avatar: 'https://yunwwchigsruxahcljqf.supabase.co/storage/v1/object/public/especialista/conrado_adolpho.jpg',
    color: 'bg-blue-700'
  },
  {
    id: 'neil-patel',
    name: 'Neil Patel',
    role: 'SEO & Tráfego',
    expertise: 'SEO e Marketing de Conteúdo Orgânico',
    description: 'Referência global em tráfego orgânico e SEO. Expert em como dominar o Google e atrair leads sem pagar anúncios.',
    avatar: 'https://yunwwchigsruxahcljqf.supabase.co/storage/v1/object/public/especialista/neil_patel.jpg',
    color: 'bg-orange-500'
  },
  {
    id: 'camila-porto',
    name: 'Camila Porto',
    role: 'Social Ads',
    expertise: 'Anúncios de Facebook e Instagram',
    description: 'Autoridade em anúncios para Redes Sociais. Especialista em converter seguidores em clientes fiéis através de Ads.',
    avatar: 'https://yunwwchigsruxahcljqf.supabase.co/storage/v1/object/public/especialista/camila_porto.jpg',
    color: 'bg-pink-600'
  },
  {
    id: 'pedro-sobral',
    name: 'Pedro Sobral',
    role: 'Performance',
    expertise: 'Gestão de Tráfego Pago e Performance',
    description: 'O "Subido" dos anúncios. Especialista em escala técnica, análise de métricas e otimização pesada de campanhas.',
    avatar: 'https://yunwwchigsruxahcljqf.supabase.co/storage/v1/object/public/especialista/pedro_sobral.jpg',
    color: 'bg-slate-800'
  },
  {
    id: 'rafael-albertoni',
    name: 'Rafael Albertoni',
    role: 'Copywriting',
    expertise: 'Copywriting e Escrita Persuasiva',
    description: 'Mestre da escrita persuasiva. Foco em criar textos que vendem qualquer produto usando gatilhos mentais poderosos.',
    avatar: 'https://yunwwchigsruxahcljqf.supabase.co/storage/v1/object/public/especialista/rafael_albertoni.jpg',
    color: 'bg-indigo-600'
  }
];

const GuruChat: React.FC<GuruChatProps> = ({ user }) => {
  const [selectedEspecialista, setSelectedEspecialista] = useState<typeof especialistas[0] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showN8nHelp, setShowN8nHelp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastGuruId = localStorage.getItem('creathub_last_guru_id');
    if (lastGuruId) {
      const guru = especialistas.find(e => e.id === lastGuruId);
      if (guru) setSelectedEspecialista(guru);
    }
  }, []);

  useEffect(() => {
    if (selectedEspecialista) {
      const savedHistory = localStorage.getItem(`creathub_chat_${selectedEspecialista.id}`);
      if (savedHistory) {
        try {
          setMessages(JSON.parse(savedHistory));
        } catch (e) {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
      localStorage.setItem('creathub_last_guru_id', selectedEspecialista.id);
    }
  }, [selectedEspecialista]);

  useEffect(() => {
    if (selectedEspecialista && messages.length > 0) {
      localStorage.setItem(`creathub_chat_${selectedEspecialista.id}`, JSON.stringify(messages));
    }
  }, [messages, selectedEspecialista]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedEspecialista) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalInput = input.trim();
    if (!finalInput || isTyping || !selectedEspecialista) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: finalInput,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);
    setShowN8nHelp(false);

    try {
      const payload = {
        pergunta: userMessage.text,
        usuario: user.name || 'Usuário',
        mentor: selectedEspecialista.name
      };

      const response = await fetch('https://n8n-n8n.6wqa93.easypanel.host/webhook/gurumkt', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      const rawData = await response.text();
      let responseText = "";

      if (!response.ok) {
        let errorDetail = "Verifique se todos os nós do fluxo n8n estão conectados e configurados corretamente.";
        try {
           const errJson = JSON.parse(rawData);
           if (errJson.message) errorDetail = errJson.message;
        } catch(e) {}

        setError(`Erro do Mentor (Status ${response.status}): ${errorDetail}`);
        setShowN8nHelp(true);
        setIsTyping(false);
        return;
      }

      if (rawData === "Workflow was started") {
        responseText = "O mentor recebeu sua mensagem, mas não houve resposta configurada. Verifique se o nó final de resposta está conectado no n8n.";
      } else {
        try {
          let jsonData = JSON.parse(rawData);
          
          if (Array.isArray(jsonData)) {
            jsonData = jsonData[0];
          }

          responseText = 
            jsonData.output || 
            jsonData.response || 
            jsonData.text || 
            jsonData.message || 
            jsonData.data || 
            (jsonData.body && (jsonData.body.output || jsonData.body.response || jsonData.body.text)) ||
            null;

          if (!responseText) {
            if (jsonData.webhookUrl || (jsonData.headers && jsonData.body)) {
               responseText = "O mentor processou a dúvida, mas retornou apenas metadados técnicos. Ative o nó 'Respond to Webhook' com o texto da IA.";
            } else {
               responseText = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
            }
          }
        } catch (parseError) {
          responseText = rawData;
        }
      }

      const msg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'guru',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, msg]);
    } catch (err: any) {
      console.error("GuruChat Error:", err);
      setError("Falha na conexão: " + (err.message || "O servidor do mentor não respondeu."));
      setShowN8nHelp(true);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChatHistory = () => {
    if (!selectedEspecialista) return;
    
    if (window.confirm(`Deseja limpar todo o histórico de conversas com ${selectedEspecialista.name}?`)) {
      setMessages([]);
      setError(null);
      setShowN8nHelp(false);
      localStorage.removeItem(`creathub_chat_${selectedEspecialista.id}`);
    }
  };

  const handleBackToSelection = () => {
    setSelectedEspecialista(null);
    localStorage.removeItem('creathub_last_guru_id');
    setError(null);
    setShowN8nHelp(false);
  };

  if (!selectedEspecialista) {
    return (
      <div className="max-w-6xl mx-auto animate-fade-in pb-12">
        <div className="text-center mb-12">
          <div className="bg-sky-500 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl mb-4 rotate-3">
            <BrainCircuit size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Mentoria Gratuita CreatHub</h1>
          <p className="text-slate-500 mt-2 max-w-lg mx-auto font-medium">
            Escolha seu mentor especializado e receba orientações estratégicas baseadas nas melhores metodologias do mercado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {especialistas.map((esp) => (
            <div 
              key={esp.id}
              onClick={() => setSelectedEspecialista(esp)}
              className="group bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-sky-400 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden relative"
            >
              <div className="p-7 flex-1">
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative">
                    <img 
                      src={esp.avatar} 
                      alt={esp.name} 
                      className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-50 shadow-md transition-transform group-hover:scale-105"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-white ${esp.color} flex items-center justify-center text-white shadow-sm`}>
                      <Zap size={14} fill="currentColor" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-sky-600 transition-colors leading-tight">{esp.name}</h3>
                    <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mt-2 border border-sky-100">
                      <UserCheck size={10} /> {esp.role}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 group-hover:bg-sky-50/50 group-hover:border-sky-100 transition-colors">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Especialidade Principal</p>
                    <p className="text-sm font-bold text-slate-700 leading-snug">
                      {esp.expertise}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                <span className="text-[10px] font-bold uppercase tracking-widest">Consultar Agora</span>
                <ChevronRight size={22} className="transition-transform group-hover:translate-x-1.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden animate-fade-in relative">
      <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between bg-white z-20 shadow-sm">
        <div className="flex items-center gap-3">
           <button onClick={handleBackToSelection} className="p-2.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all mr-1 group">
             <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
           </button>
           <div className="relative">
              <img src={selectedEspecialista.avatar} className="w-12 h-12 rounded-2xl border border-slate-100 object-cover shadow-sm" />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${selectedEspecialista.color} shadow-sm`}></div>
           </div>
           <div>
              <h2 className="font-bold text-slate-800 text-base leading-tight">{selectedEspecialista.name}</h2>
              <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mt-0.5">{selectedEspecialista.role}</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={clearChatHistory} 
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Apagar Histórico"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 bg-slate-50/20 custom-scrollbar">
        {messages.length === 0 && !isTyping && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-md mx-auto animate-fade-in">
             <div className={`w-24 h-24 rounded-[32px] ${selectedEspecialista.color} flex items-center justify-center text-white shadow-2xl mb-2 rotate-3`}>
               <MessageSquare size={48} />
             </div>
             <h3 className="text-2xl font-black text-slate-800 tracking-tight">Mentoria com {selectedEspecialista.name.split(' ')[0]}</h3>
             <p className="text-sm text-slate-500 leading-relaxed">Olá {user.name?.split(' ')[0] || 'Visitante'}! Qual o desafio do seu projeto hoje? Estou pronto para te ajudar com orientações práticas.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}>
            <div className={`max-w-[85%] md:max-w-[75%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
               <div className={`shrink-0 w-10 h-10 rounded-2xl overflow-hidden border-2 border-white shadow-md flex items-center justify-center ${msg.role === 'user' ? 'bg-sky-500' : selectedEspecialista.color}`}>
                  {msg.role === 'user' ? (
                    user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="text-white font-bold text-xs">{(user.name || 'U').substring(0,1)}</div>
                  ) : (
                    <img src={selectedEspecialista.avatar} className="w-full h-full object-cover" />
                  )}
               </div>
               <div className="space-y-1.5">
                  <div className={`p-5 rounded-[24px] text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user' ? 'bg-sky-500 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <p className={`text-[10px] text-slate-400 font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </p>
               </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex gap-4 items-center bg-white border border-slate-100 p-5 rounded-[24px] rounded-tl-none shadow-sm">
               <div className="flex gap-2">
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-100 text-red-600 p-5 rounded-[24px] flex flex-col gap-3 animate-shake shadow-sm">
             <div className="flex items-center gap-4">
                <AlertCircle size={24} className="shrink-0" />
                <div className="flex-1">
                   <p className="font-black uppercase tracking-wider text-xs">Aviso do Servidor</p>
                   <p className="text-xs font-medium leading-relaxed">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="p-2 bg-white rounded-xl shadow-sm text-red-500 hover:bg-red-50"><X size={18} /></button>
             </div>
             
             {showN8nHelp && (
               <div className="mt-2 bg-white/60 p-4 rounded-xl border border-red-200/50 space-y-3">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-[10px] uppercase">
                     <Settings size={14} /> Solução de Problemas:
                  </div>
                  <ul className="text-[10px] space-y-1.5 text-red-800/80 font-medium list-disc pl-4">
                     <li>Verifique se o Webhook está operando em modo de Produção.</li>
                     <li>Confirme se o agente de IA possui créditos disponíveis para resposta.</li>
                     <li>Certifique-se que o fluxo n8n termina com uma resposta direta da IA.</li>
                  </ul>
               </div>
             )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 md:p-8 border-t border-slate-100 bg-white">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-4 bg-slate-50 border-2 border-slate-200 rounded-[28px] p-2.5 focus-within:ring-4 focus-within:ring-sky-50 focus-within:border-sky-300 transition-all duration-300">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Digite sua pergunta para ${selectedEspecialista.name}...`}
            className="flex-1 bg-transparent px-5 py-2 text-sm outline-none text-slate-700 font-semibold"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`p-4 rounded-[20px] transition-all shadow-xl flex items-center justify-center shrink-0 disabled:bg-slate-200 ${selectedEspecialista.color + ' text-white hover:opacity-90'}`}
          >
            {isTyping ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuruChat;
