import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Film, Info, Loader2, Wand2, Save, ExternalLink, Trash2, FileImage, CheckCircle2, UserCircle, Layers, MonitorPlay, Clapperboard, Play, Copy, ArrowDown, FileText, Link as LinkIcon, AlertTriangle, Video, CreditCard, Phone, PlaySquare, History, Youtube as YoutubeIcon, Send, Sparkles, Timer, Music, Clapperboard as Movie } from 'lucide-react';
import { generateNewsSummary, generatePostCaption } from '../services/geminiService';
import { User, NewsItem, CreditPackage } from '../types';
import { updateNews, createNews } from '../services/newsService';
import { deductCredits } from '../services/creditsService';
import { updateProfile } from '../services/authService';
import { Link } from 'react-router-dom';

// Estilos predefinidos para Avatar
const avatarStyles = [
  { 
    id: 'office', 
    name: 'Escritório Executivo', 
    prompt: 'Cenário de escritório corporativo moderno, com pessoas trabalhando focadas ao fundo, ambiente movimentado e profissional, iluminação de estúdio.', 
    img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80' 
  },
  { 
    id: 'studio', 
    name: 'Telejornal Profissional', 
    prompt: 'Cenário de estúdio de telejornal, bancada moderna, fundo azulado profissional.', 
    img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80' 
  },
  { 
    id: 'home', 
    name: 'Ambiente Aconchegante', 
    prompt: 'Ambiente de casa aconchegante, fundo desfocado, luz natural, estilo casual e amigável.', 
    img: 'https://images.unsplash.com/photo-1593642532400-2682810df593?auto=format&fit=crop&w=300&q=80' 
  },
  { 
    id: 'tech', 
    name: 'Inovação / Tech', 
    prompt: 'Fundo tecnológico abstrato com luzes neon suaves, estilo inovador e digital.', 
    img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=80' 
  },
];

// Generic Modal Wrapper
const ModalWrapper: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, description, children, footer, maxWidth = "max-w-2xl" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} flex flex-col max-h-[90vh]`}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {children}
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          {footer}
        </div>
      </div>
    </div>
  );
};

// Helper to check for network/CORS errors
const isCorsOrNetworkError = (error: any) => {
  const msg = (error?.message || '').toLowerCase();
  return (
    error instanceof TypeError ||
    error.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed') ||
    msg.includes('cors') ||
    msg.includes('load failed') || 
    msg.includes('fetch')
  );
};

// Payment Modal (Checkout Asaas)
export const PaymentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  selectedPackage: CreditPackage | null;
  onUpdateUser?: (user: User) => void;
}> = ({ isOpen, onClose, user, selectedPackage, onUpdateUser }) => {
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      if (user.cnpj_cpf) setCpfCnpj(String(user.cnpj_cpf));
      if (user.phone) setPhone(String(user.phone));
    }
  }, [isOpen, user]);

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      value = value.substring(0, 14);
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    setCpfCnpj(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    }
    setPhone(value);
  };

  const handlePayment = async () => {
    if (!user || !selectedPackage) return;
    const cleanDoc = String(cpfCnpj).replace(/\D/g, '');
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      alert("Por favor, insira um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
      return;
    }
    if (cleanPhone.length < 10) {
      alert("Por favor, insira um telefone válido com DDD.");
      return;
    }
    setIsLoading(true);
    setSuccess(false);
    try {
      try {
        await updateProfile(user.id, { phone: phone, cnpj_cpf: cpfCnpj });
        if (onUpdateUser) {
           onUpdateUser({ ...user, phone: phone, cnpj_cpf: cpfCnpj });
        }
      } catch (profileError) {
        console.warn("Could not save profile details:", profileError);
      }
      const payload = {
        name: user.name,
        email: user.email,
        id_usuario: user.id,
        cpf_cnpj: cleanDoc,
        telefone: cleanPhone,
        plano_nome: selectedPackage.name,
        valor: selectedPackage.price
      };
      await fetch('https://n8n-n8n.6wqa93.easypanel.host/webhook/PagtoAsaas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        alert("Solicitação enviada! Consulte seu email e whatsapp para finalizar a transação.");
      }, 2000);
    } catch (error: any) {
      console.error("Erro no pagamento:", error);
      if (isCorsOrNetworkError(error)) {
         setSuccess(true);
         setTimeout(() => {
            setSuccess(false);
            onClose();
            alert("Solicitação enviada! Consulte seu email e whatsapp para finalizar a transação.");
         }, 2000);
      } else {
         alert(`Erro ao processar: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Ativar Seu Plano"
      description="Informe seus dados para receber o link de pagamento seguro."
      maxWidth="max-w-md"
      footer={
        <div className="flex flex-col gap-3 w-full">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 mb-2">
            <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-amber-800 font-medium">
               Após confirmar, verifique seu <strong>E-mail</strong> e <strong>WhatsApp</strong> para acessar o Checkout do Asaas e liberar seus créditos.
            </p>
          </div>
          <button 
            onClick={handlePayment}
            disabled={isLoading || success || !cpfCnpj || !phone}
            className={`w-full py-2.5 rounded-lg text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${
              success ? 'bg-sky-500 shadow-sky-100' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-100'
            }`}
          >
            {isLoading ? <><Loader2 size={18} className="animate-spin" /> Gerando Link...</> : success ? <><CheckCircle2 size={18} /> Quase lá!</> : <><CreditCard size={18} /> Confirmar Assinatura</>}
          </button>
          <button onClick={onClose} className="w-full py-2 text-sm text-slate-500 hover:text-slate-700">Voltar</button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-500">Upgrade para</span>
            <span className="text-sm font-bold text-sky-600 uppercase">{selectedPackage?.name}</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-2">
            <span className="text-slate-700 font-bold">Investimento</span>
            <span className="text-xl font-bold text-slate-800">R$ {selectedPackage?.price}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">CPF ou CNPJ para emissão <span className="text-red-500">*</span></label>
            <input type="text" value={cpfCnpj} onChange={handleDocChange} placeholder="000.000.000-00" required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-mono" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">WhatsApp de Contato <span className="text-red-500">*</span></label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={phone} onChange={handlePhoneChange} placeholder="(11) 99999-9999" required className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 font-mono" />
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

// Create Post Modal (Criar Imagens/Posts)
export const CreatePostModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  user: User | null;
  initialTab?: 'image' | 'ugc' | 'video-long' | 'video-from-image' | 'restore';
  initialPrompt?: string;
}> = ({ isOpen, onClose, user, initialTab = 'image', initialPrompt = '' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [author, setAuthor] = useState('');
  const [postType, setPostType] = useState<'image' | 'ugc' | 'video-long' | 'video-from-image' | 'restore'>(initialTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setPostType(initialTab);
      if (initialPrompt) setPrompt(initialPrompt);
      setErrorMessage(null);
    }
  }, [isOpen, initialTab, initialPrompt]);

  const webhooks = {
    image: 'https://n8n-n8n.6wqa93.easypanel.host/webhook/loopdowloandimage',
    ugc: 'https://n8n-n8n.6wqa93.easypanel.host/webhook/videoUgc',
    'video-long': 'https://n8n-n8n.6wqa93.easypanel.host/webhook/videoInsttucional',
    'video-from-image': 'https://n8n-n8n.6wqa93.easypanel.host/webhook/criarImagempvideo',
    restore: 'https://n8n-n8n.6wqa93.easypanel.host/webhook/restaurar'
  };

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       setFile(e.target.files[0]);
       setUploadSuccess(false);
       setErrorMessage(null);
       e.target.value = '';
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setErrorMessage(null);
  };

  const handleSuccess = () => {
    setUploadSuccess(true);
    setErrorMessage(null);
    setTimeout(() => {
      setFile(null); setPreview(null); setPrompt(''); setAuthor(''); setUploadSuccess(false); onClose();
    }, 1500);
  };

  const handleCreate = async () => {
    if (!user) return;
    setErrorMessage(null);
    
    if (postType !== 'video-long' && !file) {
      setErrorMessage("É necessário anexar uma imagem base.");
      return;
    }

    if ((postType === 'ugc' || postType === 'video-long') && !prompt.trim()) {
      setErrorMessage("O roteiro ou citação é obrigatório para este formato.");
      return;
    }

    if (postType === 'video-long' && !author.trim()) {
      setErrorMessage("Identifique o autor ou o nome do seu canal.");
      return;
    }
    
    const isImageTask = postType === 'image' || postType === 'restore';
    if (isImageTask) {
       if (user.imageCredits <= 0) { setErrorMessage(`Saldo insuficiente. Você possui ${user.imageCredits} créditos de imagem.`); return; }
    } else {
       if (user.videoCredits <= 0) { setErrorMessage(`Saldo insuficiente. Você possui ${user.videoCredits} créditos de vídeo.`); return; }
    }

    setIsUploading(true);
    const webhookUrl = webhooks[postType];

    try {
      let response;
      if (postType === 'video-long') {
         response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_usuario: user.id, email: user.email, prompt: prompt, author: author, type: 'storyboard' }),
          mode: 'cors' 
        });
      } else {
        const formData = new FormData();
        if (file) {
          formData.append('file', file);
        }
        formData.append('id_usuario', user.id);
        formData.append('email', user.email);
        
        const internal_type = postType === 'video-from-image' ? 'video' : postType === 'restore' ? 'restore' : postType;
        formData.append('type', internal_type);
        
        if (prompt.trim()) {
          formData.append('prompt', prompt);
        }
        
        response = await fetch(webhookUrl, { 
          method: 'POST', 
          body: formData,
          mode: 'cors' 
        });
      }
      
      if (!response.ok) {
        throw new Error(`O servidor retornou um erro (Status ${response.status})`);
      }

      // IMPORTANTE: Só descontamos o crédito APÓS o webhook confirmar a operação (inclusão na tabela via n8n)
      const creditType = isImageTask ? 'image' : 'video';
      await deductCredits(user.id, creditType, 1, `Geração de IA: ${postType}`);
      
      if (creditType === 'image') user.imageCredits -= 1; 
      else user.videoCredits -= 1;
      
      handleSuccess();
    } catch (error: any) {
      console.error("[CreatHub] Falha no processamento:", error);
      
      if (isCorsOrNetworkError(error)) {
        // Se houve erro de rede/CORS, não podemos garantir que a inclusão ocorreu.
        // Portanto, NÃO descontamos créditos aqui para seguir a regra de "só após inclusão".
        setErrorMessage("Erro de conexão com o servidor de IA. Sua solicitação pode não ter sido processada e nenhum crédito foi descontado.");
        setIsUploading(false);
      } else {
        setErrorMessage(`Ocorreu um erro técnico: ${error.message || 'Tente novamente em instantes.'}`);
        setIsUploading(false);
      }
    }
  };

  const isButtonDisabled = isUploading || uploadSuccess || !user;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Criação Inteligente de Conteúdo" maxWidth="max-w-5xl"
      footer={
        <div className="flex flex-col gap-4 w-full">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2 animate-shake">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          <div className="flex justify-end gap-3 items-center">
            <button onClick={onClose} className="px-6 py-2.5 rounded-lg border text-sm hover:bg-slate-50 transition-colors">Fechar</button>
            <button 
              onClick={handleCreate} 
              disabled={isButtonDisabled} 
              className="px-10 py-2.5 rounded-lg font-bold bg-sky-500 hover:bg-sky-600 transition-colors text-white text-sm shadow-md shadow-sky-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : uploadSuccess ? "Concluído!" : "Gerar Conteúdo com IA"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className={`${postType === 'video-long' ? 'md:col-span-12' : 'md:col-span-5'} space-y-6`}>
            {/* Tabs Selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl text-[10px] font-bold">
              <button 
                onClick={() => { setPostType('image'); setFile(null); setPrompt(initialPrompt || ''); setErrorMessage(null); }} 
                className={`py-2.5 rounded-lg transition-all ${postType === 'image' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                CATÁLOGO PROFISSIONAL
              </button>
              <button 
                onClick={() => { setPostType('video-long'); setFile(null); setPrompt(initialPrompt || ''); setErrorMessage(null); }} 
                className={`py-2.5 rounded-lg transition-all ${postType === 'video-long' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                VÍDEO YOUTUBE/REELS
              </button>
              <button 
                onClick={() => { setPostType('ugc'); setFile(null); setPrompt(initialPrompt || ''); setErrorMessage(null); }} 
                className={`py-2.5 rounded-lg transition-all ${postType === 'ugc' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                ESTILO TIKTOKSHOP
              </button>
              <button 
                onClick={() => { setPostType('video-from-image'); setFile(null); setPrompt(initialPrompt || ''); setErrorMessage(null); }} 
                className={`py-2.5 rounded-lg transition-all ${postType === 'video-from-image' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
              >
                FOTO ANIMADA
              </button>
            </div>
            
            {postType === 'video-long' && (
              <div className="space-y-4 animate-fade-in bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-100 mb-4">
                  <div className="bg-red-50 p-2 rounded-lg text-red-500 shrink-0">
                    <Movie size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Vídeo Institucional / Motivação</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                      Criamos um vídeo cinematográfico com <strong>narração premium</strong> e trilha sonora imersiva. Ideal para canais Dark e Reels.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Texto do Vídeo ou Citação *</label>
                  <textarea 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="Ex: Transforme seu esforço em resultados extraordinários..." 
                    className="w-full border p-3 text-sm h-24 rounded-xl focus:ring-2 focus:ring-sky-100 outline-none resize-none shadow-inner bg-white" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Autor ou Nome da Sua Marca *</label>
                  <input 
                    value={author} 
                    onChange={e => setAuthor(e.target.value)} 
                    placeholder="Ex: Sua Marca ou Nome do Canal" 
                    className="w-full border p-2.5 text-sm rounded-xl focus:ring-2 focus:ring-sky-100 outline-none bg-white shadow-inner" 
                  />
                </div>
                <div className="flex items-center gap-2 p-3 bg-sky-50 rounded-lg text-sky-600">
                  <Music size={14} className="shrink-0" />
                  <span className="text-[10px] font-medium italic">A trilha sonora e as imagens de fundo serão selecionadas pela IA para harmonia total.</span>
                </div>
              </div>
            )}
            
            {postType === 'ugc' && (
               <div className="animate-fade-in space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-100 mb-4">
                    <div className="bg-amber-50 p-2 rounded-lg text-amber-500 shrink-0">
                      <Clapperboard size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">Vídeo Estilo Criador (UGC)</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        Gere uma simulação realista de um influenciador recomendando seu produto para o TikTok ou Shorts.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Roteiro para a IA (Descreva o Produto) *</label>
                    <textarea 
                      value={prompt} 
                      onChange={e => setPrompt(e.target.value)} 
                      placeholder="Descreva as vantagens do produto para o roteiro..." 
                      className="w-full border p-3 text-sm h-56 rounded-xl focus:ring-2 focus:ring-sky-100 outline-none resize-none shadow-inner bg-white" 
                    />
                  </div>
               </div>
            )}
            
            {postType === 'image' && (
              <div className="bg-sky-50 text-sky-700 p-5 rounded-2xl text-xs border border-sky-100 leading-relaxed shadow-sm animate-fade-in space-y-4">
                <div className="flex items-center gap-2">
                   <Sparkles size={16} /> <strong>Ambientação de Produto</strong>
                </div>
                <p>Nossa IA remove o fundo original e coloca seu produto em um cenário de estúdio ou ambiente real para aumentar o desejo de compra.</p>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Descreva o Cenário Ideal (Opcional)</label>
                  <textarea 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="Ex: Sobre uma mesa de mármore, fundo desfocado, iluminação solar..." 
                    className="w-full border p-2.5 text-sm h-20 rounded-xl focus:ring-2 focus:ring-sky-100 outline-none resize-none bg-white" 
                  />
                </div>
              </div>
            )}
            
            {postType === 'video-from-image' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-purple-50 text-purple-700 p-5 rounded-2xl text-xs border border-purple-100 leading-relaxed shadow-sm">
                  <Video size={16} className="mb-2" />
                  <strong>Movimento Dinâmico:</strong> Dê vida à sua foto estática. Transformaremos sua imagem em um vídeo curto com zoom, pan e efeitos fluidos.
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Instruções de Movimento (Opcional)</label>
                  <textarea 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="Descreva se deseja zoom, câmera lenta ou movimento lateral..." 
                    className="w-full border p-3 text-sm h-32 rounded-lg focus:ring-2 focus:ring-sky-100 outline-none" 
                  />
                </div>
              </div>
            )}
        </div>
        
        {postType !== 'video-long' && (
          <div className="md:col-span-7 flex flex-col">
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-widest text-center">Foto do Produto ou Base *</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              multiple={false} 
              className="hidden" 
              accept="image/*" 
            />
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className={`border-2 border-dashed rounded-3xl h-[400px] flex flex-col items-center justify-center cursor-pointer transition-all relative group overflow-hidden ${file ? 'border-sky-400 bg-sky-50/20' : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'}`}
            >
              {file && preview ? (
                <div className="w-full h-full relative group p-1">
                  <img src={preview} className="w-full h-full object-contain rounded-[22px] transition-transform group-hover:scale-[1.02]" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[22px]">
                    <div className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-4 py-2 rounded-full shadow-lg">Substituir Imagem</div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="absolute top-4 right-4 bg-red-500 text-white p-2.5 rounded-full hover:bg-red-600 transition-all shadow-xl z-20"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center px-10">
                  <div className="bg-white p-6 rounded-full text-sky-400 shadow-sm border border-slate-50 transition-transform group-hover:scale-110">
                    <Upload size={48} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-700">Selecione o arquivo</p>
                    <p className="text-xs text-slate-400 mt-2 uppercase font-bold tracking-widest">Formatos aceitos: PNG, JPG ou WEBP</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};

// Edit News Modal
export const EditNewsModal: React.FC<{
  isOpen: boolean;
  newsItem: NewsItem | null;
  onClose: () => void;
  onUpdate: (item: NewsItem) => void;
  onDelete: (id: string) => void;
  onCreatePost?: (tab: any, prompt: string) => void;
  user: User;
}> = ({ isOpen, newsItem, onClose, onUpdate, onDelete, onCreatePost, user }) => {
  const [formData, setFormData] = useState<Partial<NewsItem>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [createPostSuccess, setCreatePostSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (newsItem) {
      setFormData(newsItem);
      setErrorMessage(null);
      setCreatePostSuccess(false);
    }
  }, [newsItem, isOpen]);

  const handleSave = async () => {
    if (!newsItem) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await updateNews(newsItem.id, formData);
      onUpdate({ ...newsItem, ...formData } as NewsItem);
      onClose();
    } catch (error) {
      console.error(error);
      setErrorMessage("Erro ao atualizar dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePostIA = async () => {
    if (!newsItem || !user) return;
    
    // Check credits first
    if (user.imageCredits <= 0) {
      setErrorMessage("Saldo insuficiente de créditos de imagem.");
      return;
    }

    setIsCreatingPost(true);
    setErrorMessage(null);

    const webhookUrl = 'https://n8n-n8n.6wqa93.easypanel.host/webhook/criarnoticias_imagem';
    const payload = {
      titulo: newsItem.title,
      resumo: newsItem.summary,
      usuario: user.name,
      email: user.email,
      id_noticia: newsItem.id,
      id_usuario: user.id
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Erro no servidor (Status ${response.status})`);
      }

      // Desconta crédito apenas após sucesso na inclusão (resposta OK do n8n)
      await deductCredits(user.id, 'image', 1, `Post via Notícia: ${newsItem.title}`);
      user.imageCredits -= 1;
      
      setCreatePostSuccess(true);
      setTimeout(() => {
        setCreatePostSuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("[CreatHub] Erro post IA:", error);
      
      if (isCorsOrNetworkError(error)) {
        // Em erro de CORS, não descontamos crédito preventivamente.
        setErrorMessage("Erro de rede. Não foi possível confirmar a criação do post.");
        setIsCreatingPost(false);
      } else {
        setErrorMessage(`Falha na geração: ${error.message || 'Erro inesperado'}`);
        setIsCreatingPost(false);
      }
    }
  };

  if (!newsItem) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciar Notícia"
      footer={
        <div className="flex flex-col gap-4 w-full">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2 animate-shake">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {createPostSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>Solicitação enviada! A IA está gerando sua imagem profissional.</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row justify-between w-full gap-4 pt-2">
            <button onClick={() => onDelete(newsItem.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium">
              <Trash2 size={16} /> Excluir Registro
            </button>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleCreatePostIA}
                disabled={isCreatingPost || createPostSuccess}
                className="px-4 py-2 bg-purple-50 text-purple-600 border border-purple-100 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-purple-100 transition-all disabled:opacity-50"
              >
                {isCreatingPost ? <Loader2 size={16} className="animate-spin" /> : createPostSuccess ? <CheckCircle2 size={16} /> : <Sparkles size={16} />} 
                {isCreatingPost ? 'Gerando...' : createPostSuccess ? 'Pronto!' : 'Gerar Post com IA'}
              </button>
              <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-sky-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-sky-100">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Título do Artigo</label>
          <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Link de Origem</label>
          <input type="text" value={formData.url || ''} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full border rounded-lg p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Resumo ou Legenda Sugerida</label>
          <textarea value={formData.summary || ''} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full border rounded-lg p-2 text-sm h-32" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Categoria de Conteúdo</label>
            <select value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border rounded-lg p-2 text-sm">
              <option>Tecnologia</option>
              <option>Negócios</option>
              <option>Saúde</option>
              <option>Educação</option>
              <option>Entretenimento</option>
              <option>Esportes</option>
              <option>Política</option>
              <option>Ciência</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Etapa do Fluxo</label>
            <select value={formData.status || 'draft'} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full border rounded-lg p-2 text-sm">
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

// Add News Modal (Simplified version + Webhook Integration)
export const AddNewsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: User;
}> = ({ isOpen, onClose, user }) => {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Tecnologia');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!url) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Configuração do Webhook solicitado
      const webhookUrl = 'https://n8n-n8n.6wqa93.easypanel.host/webhook/criarNoticia';
      const payload = {
        url: url,
        id_usuario: user.id,
        email: user.email,
        category: category
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (!response.ok && !isCorsOrNetworkError(new Error())) {
        throw new Error(`Erro no servidor (Status ${response.status})`);
      }

      // Também criamos um registro local em rascunho para feedback imediato na UI
      const initialTitle = url.length > 50 ? url.substring(0, 47) + "..." : url;
      await createNews(user.id, { 
        title: initialTitle, 
        url, 
        category, 
        summary: 'A IA está processando o conteúdo deste link...', 
        status: 'draft' 
      });

      onClose();
      setUrl(''); 
      setCategory('Tecnologia');
    } catch (e: any) {
      console.error("Erro processamento notícia:", e);
      if (isCorsOrNetworkError(e)) {
        // Fallback Success em caso de CORS bloqueando resposta, mas assumindo que o n8n recebeu
        const initialTitle = url.length > 50 ? url.substring(0, 47) + "..." : url;
        await createNews(user.id, { title: initialTitle, url, category, summary: 'Processando conteúdo...', status: 'draft' });
        onClose();
      } else {
        setErrorMessage("Não foi possível processar este link. Verifique e tente novamente.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastrar Fonte de Notícia"
      description="Cole o link da matéria. Nossa IA irá resumir e gerar insights para você."
      maxWidth="max-w-md"
      footer={
        <div className="flex flex-col gap-3 w-full">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-lg text-[10px] font-bold flex items-center gap-2">
              <AlertTriangle size={14} /> {errorMessage}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClose={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || !url} 
              className="px-6 py-2 bg-sky-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 shadow-md shadow-sky-100"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Importar Link
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">URL do Artigo ou Notícia *</label>
          <div className="relative">
            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={url} 
              onChange={e => {
                setUrl(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }} 
              placeholder="https://exemplo.com/noticia-de-marketing" 
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-100 outline-none transition-all" 
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Categorizar como</label>
          <div className="relative">
            <Layers size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-sky-100 outline-none transition-all appearance-none bg-white"
            >
              <option>Tecnologia</option>
              <option>Negócios</option>
              <option>Saúde</option>
              <option>Educação</option>
              <option>Entretenimento</option>
              <option>Esportes</option>
              <option>Política</option>
              <option>Ciência</option>
            </select>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};

// Create Avatar Video Modal
export const CreateAvatarVideoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}> = ({ isOpen, onClose, user }) => {
  const [selectedStyle, setSelectedStyle] = useState(avatarStyles[0]);
  const [prompt, setPrompt] = useState('');
  const [cameoUrl, setCameoUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCameoUrl(user?.preferences?.socialMedia?.cameoSora2 || '');
      setPrompt('');
      setErrorMessage(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    setErrorMessage(null);
    setSuccess(false);

    if (!user) {
      setErrorMessage("Erro de autenticação.");
      return;
    }
    
    if (!prompt.trim()) {
      setErrorMessage("Digite o roteiro que o avatar deve narrar.");
      return;
    }

    if (user.videoCredits <= 0) {
      setErrorMessage("Créditos insuficientes para geração de vídeo.");
      return;
    }

    setIsCreating(true);
    
    const payload = {
      id_usuario: user.id,
      email: user.email,
      prompt: prompt.trim(),
      style_prompt: selectedStyle.prompt,
      style_name: selectedStyle.name,
      cameo: cameoUrl.trim()
    };

    try {
      const webhookUrl = 'https://n8n-n8n.6wqa93.easypanel.host/webhook/criarAvatar';
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors'
      });

      if (response.ok) {
        // Descontamos crédito APÓS inclusão bem-sucedida confirmada pelo webhook
        await deductCredits(user.id, 'video', 1, `Criação Porta-Voz: ${selectedStyle.name}`);
        if (user) user.videoCredits -= 1;
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setPrompt('');
          onClose();
        }, 2000);
      } else {
        throw new Error(`Erro de resposta (Status ${response.status})`);
      }
    } catch (error: any) {
      if (isCorsOrNetworkError(error)) {
        // Em erro de CORS, mantemos a cautela e não descontamos o token 
        // a menos que tivéssemos certeza da inclusão.
        setErrorMessage("Não foi possível confirmar o início da criação. Seus créditos permanecem intactos.");
        setIsCreating(false);
      } else {
        setErrorMessage(`Falha na criação: ${error.message || 'Tente novamente.'}`);
        setIsCreating(false);
      }
    } finally {
      setTimeout(() => {
        if (!success) setIsCreating(false);
      }, 500);
    }
  };

  const isButtonDisabled = isCreating || success || !user;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Gerar Vídeo com Porta-Voz IA"
      description="Transforme texto em vídeo profissional com narração humana e cenários realistas."
      maxWidth="max-w-4xl"
      footer={
        <div className="flex flex-col gap-4 w-full">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2 animate-shake">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition-colors">Voltar</button>
            <button 
              onClick={handleCreate} 
              disabled={isButtonDisabled} 
              className="px-8 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md shadow-sky-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isCreating ? <Loader2 size={16} className="animate-spin" /> : success ? <CheckCircle2 size={16} /> : <Play size={16} />} 
              {isCreating ? "Renderizando..." : success ? "Sucesso!" : "Gerar Vídeo (1 Crédito)"}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">1. Selecione o Ambiente</label>
            <div className="grid grid-cols-2 gap-3">
              {avatarStyles.map(style => (
                <div 
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all relative ${selectedStyle.id === style.id ? 'border-sky-500' : 'border-slate-100 opacity-70 hover:opacity-100'}`}
                >
                  <img src={style.img} alt={style.name} className="w-full h-24 object-cover" />
                  <div className="p-2 bg-white text-[10px] font-bold text-center uppercase text-slate-600">
                    {style.name}
                  </div>
                  {selectedStyle.id === style.id && (
                    <div className="absolute top-1 right-1 bg-sky-500 text-white rounded-full p-0.5">
                      <CheckCircle2 size={12} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon size={14} className="text-sky-500" /> Vínculo Cameo Sora2
            </label>
            <input 
              type="text" 
              value={cameoUrl}
              onChange={e => setCameoUrl(e.target.value)}
              placeholder="Cole seu link Cameo Sora2 personalizado..."
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-100 outline-none transition-all placeholder:text-slate-300"
            />
            <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
              Opcional: Use seu link para clonar sua própria voz e aparência profissional.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">2. Roteiro de Narração</label>
          <textarea 
            value={prompt}
            onChange={e => {
              setPrompt(e.target.value);
              if (errorMessage && e.target.value.trim()) setErrorMessage(null);
            }}
            placeholder="Digite o texto que o avatar irá pronunciar no vídeo..."
            className="w-full h-48 border rounded-xl p-4 text-sm focus:ring-2 focus:ring-sky-100 outline-none resize-none bg-slate-50/50"
          />
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
            <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 leading-relaxed">
              Para melhores resultados, utilize pontuação correta. Isso ajuda a IA a dar as entonações certas.
            </p>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
