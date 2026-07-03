
// Fix: Added missing React import to resolve "Cannot find namespace 'React'" and "Cannot find name 'React'" errors.
import React from 'react';
import { LayoutDashboard, FileText, CreditCard, User, LogOut, Menu, X, Image as ImageIcon, History, MessageSquareText, Sparkles, BrainCircuit } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/calendar', label: 'Notícias', icon: FileText },
    { path: '/gallery', label: 'Galeria', icon: ImageIcon },
    { path: '/history', label: 'Histórico', icon: History },
    { path: '/credits', label: 'Planos', icon: CreditCard },
    { path: '/profile', label: 'Perfil', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isChatPage = location.pathname === '/especialista-chat';

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Top Header Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 h-16 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          
          <div className="flex items-center gap-8 h-full">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Logo size="sm" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center h-full gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative h-full flex items-center gap-2 px-4 text-sm font-medium transition-colors border-b-2 ${
                    isActive(item.path)
                      ? 'border-sky-500 text-sky-600 bg-sky-50/30'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Logout */}
            <button 
              onClick={onLogout}
              className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              Sair
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-40 p-4 animate-fade-in">
           <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 rounded-lg border ${
                  isActive(item.path)
                    ? 'bg-sky-50 border-sky-200 text-sky-600'
                    : 'border-slate-100 text-slate-600'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-4 py-4 rounded-lg text-red-600 w-full mt-4 border border-red-100 bg-red-50"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* FLOATING CHAT BUTTON - ABOVE ALL CONTENT AND ACCOMPANIES SCROLL */}
      {!isChatPage && (
        <div className="fixed bottom-6 right-6 z-[60] animate-bounce-subtle">
           <button 
            onClick={() => navigate('/especialista-chat')}
            className="group relative flex items-center gap-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-sky-200 hover:scale-105 active:scale-95 transition-all"
           >
              <div className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500 border-2 border-white"></span>
              </div>
              
              <div className="bg-white/20 p-2 rounded-xl">
                <BrainCircuit size={24} className="group-hover:rotate-12 transition-transform" />
              </div>
              
              <div className="flex flex-col items-start pr-2">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Consultoria IA</span>
                <span className="text-sm font-bold whitespace-nowrap">Falar com Especialistas</span>
              </div>

              {/* Tooltip on hover for desktop */}
              <div className="absolute right-0 bottom-full mb-4 px-3 py-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                Dúvidas de marketing? Pergunte aos especialistas!
                <div className="absolute top-full right-6 w-2 h-2 bg-slate-800 rotate-45 -mt-1"></div>
              </div>
           </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default Layout;
