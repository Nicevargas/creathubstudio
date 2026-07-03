import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Credits from './pages/Credits';
import Profile from './pages/Profile';
import CalendarPage from './pages/CalendarPage';
import GalleryPage from './pages/GalleryPage';
import HistoryPage from './pages/HistoryPage';
import GuruChat from './pages/GuruChat';
import { AuthPage } from './pages/Auth';
import { CreatePostModal, AddNewsModal } from './components/Modals';
import { User } from './types';
import { supabase } from './lib/supabase';
import { getCurrentProfile, signOut } from './services/authService';
import { Loader2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isAddNewsOpen, setIsAddNewsOpen] = useState(false);
  
  const [createPostTab, setCreatePostTab] = useState<'image' | 'ugc' | 'video-long' | 'video-from-image' | 'restore'>('image');
  const [initialPrompt, setInitialPrompt] = useState('');

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Trata especificamente o erro de Refresh Token inválido limpando a persistência
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
            console.warn("Sessão expirada ou inválida. Limpando dados locais...");
            await supabase.auth.signOut();
            setSession(null);
          } else {
            console.error("Erro ao recuperar sessão:", error.message);
          }
        } else {
          setSession(currentSession);
          if (currentSession) {
            await fetchProfile();
          }
        }
      } catch (e) {
        console.error("Falha crítica na inicialização do Auth:", e);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        if (event === 'SIGNED_IN') {
           window.location.hash = '/';
        }
        setLoading(true);
        await fetchProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async () => {
    try {
      const profile = await getCurrentProfile();
      if (profile) {
        setUser(profile);
        setAuthError(false);
      } else {
        setAuthError(true);
      }
    } catch (error) {
      console.error("Error loading profile", error);
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setSession(null);
    setUser(null);
    setAuthError(false);
    // Força limpeza do localStorage em caso de resquícios de tokens inválidos
    localStorage.removeItem('creathub-auth-token');
  };

  const handleCreatePost = (tab: any = 'image', prompt: string = '') => {
    setCreatePostTab(tab);
    setInitialPrompt(prompt);
    setIsCreatePostOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  if (authError && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md text-center">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-500 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Erro de Acesso</h2>
          <p className="text-slate-500 mb-6 text-sm">
            Não foi possível carregar seu perfil. Tente fazer login novamente ou entre em contato com o suporte.
          </p>
          <button 
            onClick={handleLogout}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Sair e tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} onCreatePost={handleCreatePost} />} />
          <Route path="/especialista-chat" element={<GuruChat user={user} />} />
          <Route path="/calendar" element={<CalendarPage onAddNews={() => setIsAddNewsOpen(true)} onCreatePost={handleCreatePost} user={user} />} />
          <Route path="/gallery" element={<GalleryPage user={user} />} />
          <Route path="/history" element={<HistoryPage user={user} />} />
          <Route path="/credits" element={<Credits user={user} onUpdateUser={setUser} />} />
          <Route path="/profile" element={<Profile user={user} onUpdateUser={setUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <CreatePostModal 
          isOpen={isCreatePostOpen} 
          onClose={() => setIsCreatePostOpen(false)}
          user={user} 
          initialTab={createPostTab}
          initialPrompt={initialPrompt}
        />
        
        <AddNewsModal 
          isOpen={isAddNewsOpen} 
          onClose={() => setIsAddNewsOpen(false)} 
          user={user}
        />
      </Layout>
    </HashRouter>
  );
};

export default App;