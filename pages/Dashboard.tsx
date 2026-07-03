
import React, { useState } from 'react';
import { Clock, CheckCircle, Calendar as CalendarIcon, TrendingUp, Image as ImageIcon, FileText, Sparkles, Plus, Timer, UserCircle, ChevronRight, Camera, BrainCircuit, ArrowRight } from 'lucide-react';
import { NewsFeed } from '../components/NewsFeed';
import { RecentGallery } from '../components/RecentGallery';
import { User, PlanType } from '../types';
import { CreateAvatarVideoModal } from '../components/Modals';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User | null;
  onCreatePost: (type: 'image' | 'ugc' | 'video-long' | 'video-from-image' | 'restore', prompt?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onCreatePost }) => {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const navigate = useNavigate();
  
  const currentDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Olá, {user?.name ? user.name.split(' ')[0] : 'Visitante'} 👋
          </h1>
          <p className="text-slate-500 mt-1 capitalize">{currentDate}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm text-slate-600 font-medium shadow-sm flex items-center gap-2">
           <Sparkles size={14} className="text-sky-500" />
           <span className="text-slate-500">Seu Plano:</span>
           <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase border ${
               user?.plan === 'Business' 
                 ? 'bg-amber-50 text-amber-600 border-amber-200' 
                 : 'bg-slate-100 text-slate-500 border-slate-200'
             }`}>
               {user?.plan || 'Free'}
           </span>
        </div>
      </div>

      {/* ESPECIALISTA CHAT HERO CTA */}
      <div 
        onClick={() => navigate('/especialista-chat')}
        className="group cursor-pointer relative overflow-hidden bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl transition-all hover:shadow-sky-200/50"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-sky-500/20 transition-colors"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-gradient-to-br from-sky-400 to-blue-600 p-5 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-500">
             <BrainCircuit size={40} />
          </div>
          <div className="flex-1 text-center md:text-left">
             <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border border-sky-500/30">
               <Sparkles size={12} /> Mentor IA Ativo
             </div>
             <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Mentoria Gratuita Estratégica</h2>
             <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
               Potencialize seu marketing agora. Receba orientações personalizadas baseadas no conhecimento de <strong>Érico Rocha</strong>, <strong>Conrado Adolpho</strong> e grandes mestres para escalar seu negócio.
             </p>
          </div>
          <div className="shrink-0">
             <div className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 group-hover:bg-sky-500 group-hover:text-white transition-all shadow-lg">
                Iniciar Mentoria <ArrowRight size={18} />
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Agendamentos" value="3" icon={Clock} color="text-sky-600" bg="bg-sky-100" />
        <StatCard title="Conteúdos Criados" value="12" icon={CheckCircle} color="text-sky-600" bg="bg-sky-100" />
        <StatCard title="Ideias Geradas" value="5" icon={CalendarIcon} color="text-sky-600" bg="bg-sky-100" />
        <StatCard title="Engajamento" value="+12%" icon={TrendingUp} color="text-sky-600" bg="bg-sky-100" isPercentage />
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => window.location.hash = '#/calendar'}
            className="group relative overflow-hidden bg-gradient-to-r from-sky-400 to-blue-500 rounded-2xl p-5 text-left shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-between h-[100px]"
          >
              <div className="absolute -right-6 -bottom-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                <FileText size={100} className="text-white" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm text-white shrink-0">
                    <Plus size={24} />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Importar Notícias</h3>
                    <p className="text-sky-50 text-xs mt-0.5 opacity-90">Transforme links em conteúdo</p>
                </div>
              </div>
              <div className="relative z-10 bg-white/10 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                 <ChevronRight size={20} />
              </div>
          </button>

          <button 
            onClick={() => onCreatePost('image')}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-left shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-between h-[100px]"
          >
              <div className="absolute -right-6 -bottom-6 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                <ImageIcon size={100} className="text-white" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm text-white shrink-0">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Criador com IA</h3>
                    <p className="text-blue-50 text-xs mt-0.5 opacity-90">Gerar imagem ou vídeo comercial</p>
                </div>
              </div>
              <div className="relative z-10 bg-white/10 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                 <ChevronRight size={20} />
              </div>
          </button>
      </div>

      {/* Premium Options */}
      {(user?.plan === PlanType.PREMIUM || user?.plan === PlanType.BUSINESS || user?.email === 'eunicelvargas@gmail.com') && (
        <div className="grid grid-cols-2 gap-4">
           <button 
             onClick={() => onCreatePost('video-from-image')}
             className="bg-white border border-sky-100 hover:border-sky-300 text-sky-600 p-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 group hover:shadow-md"
           >
             <div className="bg-sky-50 p-2 rounded-full group-hover:scale-110 transition-transform">
                <Camera size={20} />
             </div>
             <span className="font-bold text-sm">Animar Foto</span>
           </button>
           <button 
             onClick={() => setIsAvatarModalOpen(true)}
             className="bg-white border border-sky-100 hover:border-sky-300 text-sky-600 p-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 group hover:shadow-md"
           >
             <div className="bg-sky-50 p-2 rounded-full group-hover:scale-110 transition-transform">
                <UserCircle size={20} />
             </div>
             <span className="font-bold text-sm">Avatar Porta-Voz</span>
           </button>
        </div>
      )}

      {/* News Feed - Updated to pass onCreatePost */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-[240px]">
          {user ? (
              <NewsFeed user={user} onCreatePost={onCreatePost} />
          ) : (
              <div className="p-8 animate-pulse flex flex-col gap-4">
                <div className="h-8 bg-slate-100 rounded w-1/3"></div>
                <div className="h-32 bg-slate-100 rounded w-full"></div>
              </div>
          )}
      </div>

      <RecentGallery user={user} />

      <CreateAvatarVideoModal 
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        user={user}
      />
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  isPercentage?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, bg }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-sky-100 transition-colors">
    <div className={`p-3 rounded-xl ${bg} ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{title}</p>
      <div className="text-2xl font-bold text-slate-800 mt-0.5">
        {value}
      </div>
    </div>
  </div>
);

export default Dashboard;
