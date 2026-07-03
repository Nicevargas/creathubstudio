
import React, { useState, useEffect } from 'react';
import { Image, Video, Plus, Loader2, MessageCircle, AlertCircle, CreditCard, CheckCircle2, RefreshCw } from 'lucide-react';
import { User, CreditPackage } from '../types';
import { getCreditPackages } from '../services/creditsService';
import { PaymentModal } from '../components/Modals';
import { getCurrentProfile } from '../services/authService';

interface CreditsProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Credits: React.FC<CreditsProps> = ({ user, onUpdateUser }) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // States for Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  
  // Load packages from DB
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const data = await getCreditPackages();
        setPackages(data || []);
        setError(null);
      } catch (err: any) {
        console.error("Erro ao carregar pacotes:", err);
        setError("Não foi possível conectar ao servidor de planos.");
      } finally {
        setLoadingPackages(false);
      }
    };
    loadPackages();
  }, []);

  const handleBuyCredits = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setIsPaymentModalOpen(true);
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      const updatedProfile = await getCurrentProfile();
      if (updatedProfile) {
        onUpdateUser(updatedProfile);
      }
    } catch (error) {
      console.error("Erro ao atualizar saldo:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Central de Créditos</h1>
          <p className="text-slate-500">Acompanhe seu consumo e selecione novos pacotes para continuar criando.</p>
        </div>
        <button 
            onClick={handleRefreshBalance}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-sky-600 bg-white border border-slate-200 hover:border-sky-300 px-4 py-2 rounded-lg transition-all"
            title="Atualizar Saldo"
        >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> 
            {isRefreshing ? 'Sincronizando...' : 'Atualizar Saldo'}
        </button>
      </div>

      {/* Credit Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-sky-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="bg-sky-50 p-3 rounded-full text-sky-500 relative z-10">
            <Image size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-slate-500 font-medium">Créditos de Imagem</p>
            <p className="text-3xl font-bold text-slate-800">{user.imageCredits}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="bg-purple-50 p-3 rounded-full text-purple-500 relative z-10">
            <Video size={24} />
          </div>
          <div className="relative z-10">
            <p className="text-sm text-slate-500 font-medium">Créditos de Vídeo</p>
            <p className="text-3xl font-bold text-slate-800">{user.videoCredits}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-6 rounded-xl shadow-md text-white flex flex-col items-center justify-center text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
           <p className="text-sky-100 text-sm mb-1 font-medium">Ficou sem créditos?</p>
           <button 
             onClick={() => {
               const element = document.getElementById('plans-section');
               element?.scrollIntoView({ behavior: 'smooth' });
             }}
             className="bg-white text-sky-600 px-6 py-2.5 rounded-lg font-bold hover:bg-sky-50 transition-all flex items-center gap-2 shadow-sm"
           >
             <Plus size={18} />
             Escolher Plano
           </button>
        </div>
      </div>

      {error && (
         <div className="bg-amber-50 text-amber-600 p-4 rounded-lg flex items-center gap-2 text-sm border border-amber-100">
            <AlertCircle size={16} /> {error}
         </div>
      )}

      {/* Pricing Plans */}
      <div id="plans-section" className="pt-8 border-t border-slate-100">
         <div className="text-center mb-10">
           <h2 className="text-3xl font-bold text-slate-800 mb-2">Planos de Assinatura</h2>
           <p className="text-slate-500">Escolha o pacote que melhor se adapta à sua demanda mensal.</p>
         </div>

         {loadingPackages ? (
            <div className="flex justify-center py-12">
               <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            </div>
         ) : packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                {packages.map((pkg) => (
                  <PricingCard 
                    key={pkg.id}
                    name={pkg.name} 
                    price={pkg.price.toString()} 
                    imageCredits={pkg.image_credits} 
                    videoCredits={pkg.video_credits} 
                    popular={pkg.popular}
                    bestValue={pkg.best_value}
                    onBuy={() => handleBuyCredits(pkg)}
                  />
                ))}
            </div>
         ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
               <p className="text-slate-500 font-medium">Nenhum plano disponível no momento.</p>
            </div>
         )}
         
         {user.email === 'eunicelvargas@gmail.com' && (
           <div className="mt-12 max-w-4xl mx-auto bg-slate-900 rounded-2xl p-8 relative overflow-hidden text-white shadow-xl">
              <div className="absolute top-0 right-0 p-32 bg-sky-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                     <div className="inline-block bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                        Enterprise
                     </div>
                     <h3 className="text-2xl font-bold mb-2">Soluções Corporativas</h3>
                     <p className="text-slate-300 mb-4 max-w-md">
                        Alta volumetria, suporte prioritário e integrações personalizadas para sua agência ou empresa.
                     </p>
                  </div>
                  <div className="shrink-0">
                    <button 
                      onClick={() => window.open('https://wa.me/5551985413413', '_blank')}
                      className="bg-sky-500 text-white px-8 py-4 rounded-xl text-sm font-bold hover:bg-sky-400 transition-colors flex items-center gap-2 shadow-lg shadow-sky-900/50"
                    >
                      <MessageCircle size={18} /> Consultar Vendas
                    </button>
                  </div>
              </div>
           </div>
         )}
      </div>

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        user={user}
        selectedPackage={selectedPackage}
        onUpdateUser={onUpdateUser}
      />
    </div>
  );
};

const PricingCard: React.FC<{
  name: string;
  price: string;
  imageCredits: number;
  videoCredits: number;
  popular?: boolean;
  bestValue?: boolean;
  onBuy: () => void;
}> = ({ name, price, imageCredits, videoCredits, popular, bestValue, onBuy }) => (
  <div className={`bg-white rounded-xl p-6 relative border transition-all duration-300 flex flex-col h-full group ${
    bestValue 
      ? 'border-sky-500 shadow-xl shadow-sky-100 ring-1 ring-sky-500 scale-105 z-10' 
      : 'border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1'
  }`}>
    {popular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-sky-400 to-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
        Recomendado
      </div>
    )}
    <h3 className="text-lg font-bold text-center text-slate-800 mb-2 capitalize mt-2">{name}</h3>
    <div className="text-center mb-6">
      <span className="text-sm text-slate-400 align-top mr-1">R$</span>
      <span className="text-4xl font-bold text-slate-800 tracking-tight">{price}</span>
      <span className="text-slate-400 text-xs">/mês</span>
    </div>

    <div className="space-y-4 text-sm text-slate-600 mb-8 flex-1 border-t border-slate-50 pt-6">
      <div className="flex items-center gap-3">
        <div className="bg-sky-50 p-2 rounded-lg text-sky-500"><Image size={16} /></div>
        <span><strong>{imageCredits}</strong> Créditos de Imagem</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="bg-purple-50 p-2 rounded-lg text-purple-500"><Video size={16} /></div>
        <span><strong>{videoCredits}</strong> Créditos de Vídeo</span>
      </div>
    </div>

    <button 
      onClick={onBuy}
      className={`w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
         bestValue 
            ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-200' 
            : 'bg-slate-800 text-white hover:bg-slate-900 shadow-md hover:shadow-lg'
      }`}
    >
      <CreditCard size={18} /> Assinar Plano
    </button>
  </div>
);

export default Credits;
