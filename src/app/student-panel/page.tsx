'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Home, MessageCircle, Users, FileText, User, BarChart, Clock, Settings, LogOut, BookOpen } from 'lucide-react';

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

export default function StudentPanel() {
  const router = useRouter();
  const pathname = usePathname() || '';
  
  // Temel state'ler
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setUserProfile(user.toJSON());
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
      window.speechSynthesis.cancel(); // Varsa ses çalmayı durdur
      
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
    { id: 'dashboard', label: 'Anasayfa', icon: <Home size={18} />, url: '/student-panel/dashboard' },
    { id: 'sessions', label: 'Toplantılar', icon: <MessageCircle size={18} />, url: '/student-panel/sessions' },
    { id: 'practice-rooms', label: 'Pratik Odaları', icon: <Users size={18} />, url: '/student-panel/practice-rooms' },
    { id: 'upcoming', label: 'Yaklaşan Pratikler', icon: <Clock size={18} />, url: '/student-panel/upcoming' },
    { id: 'assignments', label: 'Atamalar', icon: <FileText size={18} />, url: '/student-panel/assignments' },
    { id: 'vocabulary', label: 'Kelime Öğren', icon: <BookOpen size={18} />, url: '/student-panel/vocabulary' },
    { id: 'profile', label: 'Profil', icon: <User size={18} />, url: '/student-panel/profile' },
    { id: 'statistics', label: 'İstatistikler', icon: <BarChart size={18} />, url: '/student-panel/statistics' },
    { id: 'settings', label: 'Ayarlar', icon: <Settings size={18} />, url: '/student-panel/settings' },
  ];
  
  // Aktif sekmeyi pathname'e göre daha doğru belirle
  let activeTab = menuItems.find(item => pathname === item.url)?.id;
  if (!activeTab) {
    activeTab = menuItems
      .filter(item => pathname.startsWith(item.url))
      .sort((a, b) => b.url.length - a.url.length)[0]?.id;
  }
  if (!activeTab && pathname === '/student-panel') {
    activeTab = 'dashboard';
  }

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
  
  // Sadece ana içerik (dashboard) alanı kalsın, sidebar tamamen kaldırıldı
  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full mx-auto bg-white/90 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 shadow-lg mb-2">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-1-7V7h2v6h-2Zm0 4v-2h2v2h-2Z" fill="#10b981"/></svg>
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-1">Hoşgeldiniz!</h1>
          <p className="text-slate-600 text-lg text-center">SpeakNest öğrenci paneline giriş yaptınız. Sol menüden dilediğiniz bölüme geçiş yapabilirsiniz.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
          <div className="flex flex-col items-center bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-xl shadow p-6">
            <span className="bg-emerald-200 text-emerald-700 rounded-full p-3 mb-2">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M17 20H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7l5 5v9a2 2 0 0 1-2 2ZM7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.41l-5.83-5.83A2 2 0 0 0 14.17 2H7Zm5 8v4m0 0h-2m2 0h2" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="text-xl font-bold text-emerald-800">Toplam Katıldığın Toplantı</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">0</div>
          </div>
          <div className="flex flex-col items-center bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl shadow p-6">
            <span className="bg-blue-200 text-blue-700 rounded-full p-3 mb-2">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M8 17l4-4 4 4m0 0V7m0 10H8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="text-xl font-bold text-blue-800">Yaklaşan Pratikler</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">0</div>
          </div>
        </div>
      </div>
    </div>
  );
}