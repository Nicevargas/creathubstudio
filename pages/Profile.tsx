
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { Upload, Loader2, Camera, Save, Lock, Facebook, Instagram, Link as LinkIcon, AlertTriangle, CheckCircle, Youtube } from 'lucide-react';
import { uploadAvatar, updateProfile, updatePassword } from '../services/authService';

interface ProfileProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'social' | 'security'>('profile');
  const [formData, setFormData] = useState(user);
  
  // Password State
  const [passwordData, setPasswordData] = useState({ new: '', confirm: '' });
  
  // UI States
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync formData when user prop updates
  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNestedChange = (section: 'socialMedia' | 'integrations', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [section]: {
          ...prev.preferences?.[section],
          [field]: value
        }
      }
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await updateProfile(user.id, formData);
      onUpdateUser(formData);
      setFeedback({ type: 'success', message: 'Alterações salvas com sucesso!' });
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('column "preferences" of relation "profiles" does not exist')) {
         setFeedback({ type: 'error', message: 'Erro de configuração interna. Contate o suporte.' });
      } else {
         setFeedback({ type: 'error', message: 'Erro ao salvar alterações.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      setFeedback({ type: 'error', message: 'As senhas não coincidem.' });
      return;
    }
    if (passwordData.new.length < 6) {
      setFeedback({ type: 'error', message: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      await updatePassword(passwordData.new);
      setFeedback({ type: 'success', message: 'Senha atualizada com sucesso!' });
      setPasswordData({ new: '', confirm: '' });
    } catch (error: any) {
      setFeedback({ type: 'error', message: error.message || 'Erro ao atualizar senha.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    setFeedback(null);

    try {
      const newAvatarUrl = await uploadAvatar(user.id, file);
      const updatedUser = { ...formData, avatar: newAvatarUrl };
      setFormData(updatedUser);
      onUpdateUser(updatedUser);
    } catch (error: any) {
      console.error("Erro ao atualizar avatar:", error);
      setFeedback({ type: 'error', message: "Erro ao enviar imagem. Verifique sua conexão." });
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to display avatar safely
  const AvatarDisplay = () => {
    const [imgError, setImgError] = useState(false);
    
    if (isUploading) return <Loader2 className="animate-spin text-sky-500" size={32} />;
    
    if (formData.avatar && !imgError) {
      return (
        <img 
          src={formData.avatar} 
          alt="Avatar" 
          className="w-full h-full object-cover" 
          onError={() => setImgError(true)}
        />
      );
    }
    
    return <span className="text-2xl font-bold text-sky-600">{formData.name.substring(0, 2).toUpperCase()}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: Simplified Profile Card */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center">
            <div className="relative group mb-4">
              <div className="w-32 h-32 rounded-full border-4 border-sky-50 flex items-center justify-center bg-sky-50 overflow-hidden relative">
                 <AvatarDisplay />
                 <div 
                    className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center cursor-pointer transition-all" 
                    onClick={() => fileInputRef.current?.click()}
                 >
                    <Camera className="text-white" size={24} />
                 </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-sky-500 text-white p-2 rounded-full shadow-md cursor-pointer hover:bg-sky-600 transition-colors" onClick={() => fileInputRef.current?.click()}>
                 <Upload size={14} />
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />
            
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">{formData.name}</h2>
              <p className="text-slate-400 text-sm">{formData.email}</p>
            </div>
          </div>

          {/* Feedback Message Box */}
          {feedback && (
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
              {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <p className="text-sm font-medium">{feedback.message}</p>
            </div>
          )}
        </div>

        {/* Right Column: Settings Tabs */}
        <div className="md:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             
             {/* Tabs Header */}
             <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => { setActiveTab('profile'); setFeedback(null); }}
                  className={`px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'border-b-2 border-sky-500 text-sky-600 bg-sky-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Perfil
                </button>
                <button 
                  onClick={() => { setActiveTab('social'); setFeedback(null); }}
                  className={`px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'social' ? 'border-b-2 border-sky-500 text-sky-600 bg-sky-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Redes Sociais
                </button>
                <button 
                  onClick={() => { setActiveTab('security'); setFeedback(null); }}
                  className={`px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'security' ? 'border-b-2 border-sky-500 text-sky-600 bg-sky-50/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Lock size={14} /> Segurança
                </button>
             </div>

             <div className="p-8">
                
                {/* TAB: PROFILE */}
                {activeTab === 'profile' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">Informações Pessoais</h3>
                      <p className="text-slate-500 text-sm">Gerencie suas informações básicas</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria de Interesse</label>
                        <select 
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all appearance-none text-sm"
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

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input 
                          type="email" 
                          value={formData.email}
                          readOnly
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 cursor-not-allowed text-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-2 rounded-lg shadow-md shadow-sky-100 transition-all flex items-center gap-2 text-sm"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB: SOCIAL MEDIA */}
                {activeTab === 'social' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">Conexões Sociais</h3>
                      <p className="text-slate-500 text-sm">Adicione seus perfis para integração rápida</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                           <Facebook size={16} className="text-blue-600" /> Facebook Profile URL
                        </label>
                        <input 
                          type="text" 
                          placeholder="https://facebook.com/voce"
                          value={formData.preferences?.socialMedia?.facebook || ''}
                          onChange={(e) => handleNestedChange('socialMedia', 'facebook', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                           <Instagram size={16} className="text-pink-600" /> Instagram Profile URL
                        </label>
                        <input 
                          type="text" 
                          placeholder="https://instagram.com/voce"
                          value={formData.preferences?.socialMedia?.instagram || ''}
                          onChange={(e) => handleNestedChange('socialMedia', 'instagram', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                           <Youtube size={16} className="text-red-600" /> YouTube Channel URL
                        </label>
                        <input 
                          type="text" 
                          placeholder="https://youtube.com/@voce"
                          value={formData.preferences?.socialMedia?.youtube || ''}
                          onChange={(e) => handleNestedChange('socialMedia', 'youtube', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                           <LinkIcon size={16} className="text-purple-600" /> Cameo da Sora2 URL
                        </label>
                        <input 
                          type="text" 
                          placeholder="https://cameo.sora2.com/..."
                          value={formData.preferences?.socialMedia?.cameoSora2 || ''}
                          onChange={(e) => handleNestedChange('socialMedia', 'cameoSora2', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-2 rounded-lg shadow-md shadow-sky-100 transition-all flex items-center gap-2 text-sm"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar Redes
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB: SECURITY */}
                {activeTab === 'security' && (
                  <div className="space-y-8 animate-fade-in">
                    
                    {/* Password Change */}
                    <div className="space-y-4">
                      <div>
                         <h3 className="text-lg font-bold text-slate-800 mb-1">Alterar Senha</h3>
                         <p className="text-slate-500 text-sm">Mantenha sua conta segura</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                            <input 
                              type="password"
                              value={passwordData.new}
                              onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm"
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
                            <input 
                              type="password"
                              value={passwordData.confirm}
                              onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 text-sm"
                            />
                         </div>
                      </div>
                      <div className="flex justify-end">
                         <button 
                            onClick={handleUpdatePassword}
                            disabled={isSaving}
                            className="text-sm bg-slate-800 text-white hover:bg-slate-900 px-4 py-2 rounded-lg transition-colors"
                         >
                            Atualizar Senha
                         </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6 space-y-4">
                      <div>
                         <h3 className="text-lg font-bold text-slate-800 mb-1">Integrações e APIs</h3>
                         <p className="text-slate-500 text-sm">Gerencie chaves de acesso externas</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Facebook App ID</label>
                        <input 
                          type="text" 
                          value={formData.preferences?.integrations?.facebookAppId || ''}
                          onChange={(e) => handleNestedChange('integrations', 'facebookAppId', e.target.value)}
                          placeholder="Ex: 123456789012345"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </div>

                       <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Outra API Key</label>
                        <input 
                          type="password" 
                          value={formData.preferences?.integrations?.otherApiKey || ''}
                          onChange={(e) => handleNestedChange('integrations', 'otherApiKey', e.target.value)}
                          placeholder="••••••••••••••••"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button 
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-6 py-2 rounded-lg shadow-md shadow-sky-100 transition-all flex items-center gap-2 text-sm"
                        >
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          Salvar Integrações
                        </button>
                      </div>
                    </div>
                  </div>
                )}

             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
