
import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { supabase } from '../lib/supabase';
import { createProfile } from '../services/authService';
import { Loader2, AlertTriangle, CheckCircle, ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'recovery';

export const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    category: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    const cleanEmail = formData.email.trim();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin + '/#/profile?reset=true',
      });

      if (error) throw error;

      setSuccessMessage("Um link de recuperação foi enviado para seu email. Verifique sua caixa de entrada.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao enviar email de recuperação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    const cleanEmail = formData.email.trim();

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: formData.password,
        });
        if (error) throw error;
      } else if (authMode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              category: formData.category
            }
          }
        });
        
        if (signUpError) throw signUpError;

        if (data.user) {
          try {
             await createProfile({
              id: data.user.id,
              name: formData.name,
              email: cleanEmail,
              category: formData.category
            });
          } catch (profileErr: any) {
             console.warn("Profile creation note:", profileErr);
          }
          
          if (!data.session) {
             setSuccessMessage("Cadastro realizado! Verifique seu email para confirmar sua conta.");
             setAuthMode('login'); 
             return;
          }
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err?.message || 'Ocorreu um erro inesperado. Verifique sua conexão.';
      
      if (msg.includes('Invalid login credentials')) {
        msg = 'Login falhou. Verifique se seu email e senha estão corretos.';
      } else if (msg.includes('User already registered')) {
        msg = 'Este email já está cadastrado. Tente fazer login.';
      }
      
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (authMode === 'login') return 'Bem-vindo de volta!';
    if (authMode === 'signup') return 'Crie sua conta';
    return 'Recuperar Senha';
  };

  const getDescription = () => {
    if (authMode === 'login') return 'Entre na sua conta para continuar';
    if (authMode === 'signup') return 'Comece a planejar seu conteúdo hoje';
    return 'Enviaremos um link para redefinir sua senha';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative">
      <div className="w-full max-w-[480px] flex flex-col items-center">
         <div className="mb-8">
            <Logo size="lg" />
         </div>

         <h1 className="text-3xl md:text-4xl font-bold text-sky-600 mb-2 text-center">
           {getTitle()}
         </h1>
         <p className="text-slate-500 mb-8 text-center">
           {getDescription()}
         </p>

         <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 w-full">
            {error && (
              <div className="mb-4 p-4 rounded-lg border border-red-100 bg-red-50 text-red-600 flex gap-3 items-start">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium break-words leading-relaxed">{error}</div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 rounded-lg border border-green-200 bg-green-50 text-green-700 flex gap-3">
                <CheckCircle size={20} className="shrink-0 mt-0.5" />
                <div className="text-sm font-medium">{successMessage}</div>
              </div>
            )}

            {authMode === 'recovery' ? (
              <form onSubmit={handlePasswordReset} className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">Email cadastrado</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  disabled={isLoading}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 rounded-lg shadow-lg shadow-sky-100 transition-all flex justify-center items-center gap-2 disabled:opacity-70 text-sm mt-2"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  Enviar Link de Recuperação
                </button>

                <div className="text-center mt-4">
                  <button 
                    type="button"
                    onClick={() => { setAuthMode('login'); setError(null); setSuccessMessage(null); }} 
                    className="text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
                  >
                    <ArrowLeft size={16} /> Voltar ao Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4 animate-fade-in">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-2">Nome completo</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-2">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-200 outline-none transition-all"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-800">Senha</label>
                    {authMode === 'login' && (
                      <button 
                        type="button"
                        onClick={() => { setAuthMode('recovery'); setError(null); }}
                        className="text-xs text-sky-500 hover:text-sky-700 font-medium"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-200 outline-none transition-all placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-800 mb-2">Categoria de Interesse</label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all appearance-none"
                    >
                      <option value="">Selecione sua área</option>
                      <option value="Tecnologia">Tecnologia</option>
                      <option value="Negócios">Negócios</option>
                      <option value="Saúde">Saúde</option>
                      <option value="Educação">Educação</option>
                      <option value="Entretenimento">Entretenimento</option>
                      <option value="Esportes">Esportes</option>
                    </select>
                  </div>
                )}

                <button 
                  disabled={isLoading}
                  className="w-full bg-sky-400 hover:bg-sky-500 text-white font-bold py-2 text-sm rounded-lg shadow-lg shadow-sky-100 transition-all mt-4 flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {authMode === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              </form>
            )}

            {authMode !== 'recovery' && (
              <div className="mt-6 text-center text-sm text-slate-500">
                 {authMode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                 <button 
                   onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(null); setSuccessMessage(null); }} 
                   className="text-sky-500 font-medium ml-1 hover:underline"
                 >
                   {authMode === 'login' ? 'Cadastre-se' : 'Faça login'}
                 </button>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};
