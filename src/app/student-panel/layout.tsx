'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Home, MessageCircle, Users, FileText, User, BarChart, Clock, Settings, LogOut, BookOpen, AlertTriangle } from 'lucide-react';
import { RoleBasedAccess, UserRole, PagePermissions } from '@/lib/auth/rbac';

// Kullanıcı profili interface'i
interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  createdAt?: { seconds: number };
  englishLevel?: string;
  firstName?: string;
  lastName?: string;
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Temel state'ler
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState<UserRole>(UserRole.STUDENT);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            // @ts-ignore: user.toJSON() metodu TypeScript'te tanımlı değil ama çalışıyor
            setUserProfile(user.toJSON ? user.toJSON() : user);
            
            // Kullanıcının rolünü al
            const role = await RoleBasedAccess.getUserRole(user);
            setUserRole(role);
            
            // Mevcut sayfaya erişim izni var mı kontrol et
            const path = window.location.pathname;
            const hasAccess = RoleBasedAccess.hasPageAccess(path, role);
            
            if (!hasAccess) {
              setAccessDenied(true);
            }
          } else {
            // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
            router.push('/login');
          }
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Auth kontrolü sırasında hata:', err);
        setError('Oturum kontrolü sırasında bir hata oluştu.');
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  const handleLogout = async () => {
    try {
      // Önce tüm Firebase işlemlerini temizle
      window.speechSynthesis?.cancel(); // Varsa ses çalmayı durdur
      
      // Çıkış işlemini gerçekleştir
      await auth.signOut();
      
      // Sayfayı yönlendir
      window.location.href = '/login';
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
  };

  // Menü öğeleri - burada hem başlık hem de yönlendirme URL'lerini tanımlıyoruz
  const menuItems = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: <Home size={18} />, url: '/student-panel/dashboard' },
    { id: 'sessions', label: 'Konuşma ve Toplantılar', icon: <MessageCircle size={18} />, url: '/student-panel/sessions' },
    { id: 'practice-rooms', label: 'Uygulama Odaları', icon: <Users size={18} />, url: '/student-panel/practice-rooms' },
    { id: 'vocabulary', label: 'Kelime Öğren', icon: <BookOpen size={18} />, url: '/student-panel/vocabulary' },
    { id: 'profile', label: 'Profil', icon: <User size={18} />, url: '/student-panel/profile' },
    { id: 'statistics', label: 'İstatistikler', icon: <BarChart size={18} />, url: '/student-panel/statistics' },
    { id: 'settings', label: 'Ayarlar', icon: <Settings size={18} />, url: '/student-panel/settings' },
  ];
  
  // Geçerli aktif sekmeyi yönlendirmeden belirleyin
  useEffect(() => {
    const match = pathname.match(/^\/student-panel\/(\w+)/);
    setActiveTab(match ? match[1] : 'dashboard');
  }, [pathname]);

  // Sadece kullanıcının erişim yetkisi olan menü öğelerini filtrele
  const filteredMenuItems = menuItems.filter(item => 
    RoleBasedAccess.hasPageAccess(item.url, userRole)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center p-8 rounded-lg bg-white shadow-sm">
          <div className="w-10 h-10 rounded-full border-2 border-t-slate-500 border-b-slate-300 border-l-transparent border-r-transparent animate-spin mb-4"></div>
          <div className="text-lg font-medium text-slate-700">Yükleniyor...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 text-slate-700 px-6 py-5 rounded-lg max-w-md shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-red-600">Hata</h2>
          <p className="text-slate-600">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-5 w-full py-2 px-4 rounded-md bg-slate-700 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }
  
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 text-slate-700 px-6 py-5 rounded-lg max-w-md shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="text-red-500" size={24} />
            <h2 className="text-lg font-semibold text-red-600">Erişim Reddedildi</h2>
          </div>
          <p className="text-slate-600 mb-3">Bu sayfaya erişim yetkiniz bulunmuyor. Lütfen uygun yetkilere sahip bir hesapla giriş yapın veya ana sayfaya dönün.</p>
          <div className="flex space-x-3">
            <button 
              onClick={() => router.push('/')}
              className="mt-2 flex-1 py-2 px-4 rounded-md bg-slate-600 text-white font-medium hover:bg-slate-700 transition-colors"
            >
              Ana Sayfaya Dön
            </button>
            <button 
              onClick={handleLogout}
              className="mt-2 flex-1 py-2 px-4 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobil menü butonu */}
      <div className="bg-white p-4 flex justify-between items-center md:hidden border-b shadow-sm sticky top-0 z-50">
        <h1 className="text-lg font-semibold text-slate-800">Uygulama Adı</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      
      {/* Sol yan çubuğu - mobil için modal, desktop için sabit */}
      <div className={`
        fixed inset-0 z-40 md:relative md:inset-auto
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 transition-transform duration-300 ease-in-out
        flex flex-col w-72 bg-gradient-to-b from-emerald-100/80 via-white/80 to-slate-100/80 backdrop-blur-xl border-r border-slate-200 shadow-2xl
        min-h-screen
      `}>
        {/* Kullanıcı kartı */}
        <div className="p-7 border-b border-slate-200 flex flex-col items-center gap-4 bg-white/70 rounded-b-2xl shadow-lg mx-4 mt-4">
          {userProfile?.photoURL ? (
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-emerald-300 shadow-xl">
              <Image 
                src={userProfile.photoURL} 
                alt={userProfile.displayName || 'Profil'} 
                className="object-cover"
                fill
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border-4 border-emerald-300 shadow-xl text-3xl">
              {(userProfile?.displayName?.charAt(0) || userProfile?.firstName?.charAt(0) || 'S').toUpperCase()}
            </div>
          )}
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold text-slate-800 truncate max-w-[180px]">{userProfile?.displayName || userProfile?.firstName || 'Öğrenci'}</span>
            <span className="text-xs text-slate-500">{userProfile?.role || 'Öğrenci'}</span>
          </div>
        </div>
        {/* Menü öğeleri */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between mt-6">
          <nav className="space-y-3 px-5">
            {filteredMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(item.url);
                    setSidebarOpen(false);
                  }}
                  className={`
                    group w-full flex items-center gap-4 px-6 py-3 rounded-2xl text-[17px] font-semibold transition-all duration-200
                    relative
                    ${isActive ? 'bg-white/90 shadow-lg text-emerald-700 border-l-8 border-emerald-500 animate-pulse' : 'text-slate-600 hover:bg-emerald-50/80 hover:text-emerald-700'}
                    focus:outline-none focus:ring-2 focus:ring-emerald-200
                  `}
                >
                  <span className={`text-2xl ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'}`}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-10 bg-emerald-500 rounded-r-xl shadow-md"></span>
                  )}
                </button>
              );
            })}
          </nav>
          {/* Çıkış butonunu en alta sabitle */}
          <div className="mt-10 px-5 pb-8">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              className="w-full flex items-center gap-4 px-6 py-3 rounded-2xl text-[17px] font-bold text-red-600 bg-white/80 hover:bg-red-50 transition-all duration-200 shadow-md border border-red-100"
            >
              <LogOut size={24} />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Ana içerik alanı - sayfalar buraya dynamik olarak yüklenecek */}
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {children}
      </div>
    </div>
  );
} 