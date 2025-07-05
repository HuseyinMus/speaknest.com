'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter, usePathname } from 'next/navigation';
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Menu, X, Home, MessageCircle, Users, User, BarChart, Clock, Settings, LogOut, Calendar, Plus, DollarSign, Bell } from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';

enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PRO_USER = 'proUser'
}

interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface UserProfile {
  uid: string;
  displayName: string;
  firstName: string;
  lastName: string;
  photoURL: string;
  role: UserRole;
  createdAt?: Date;
  lastLogin?: Date;
}

const translations = {
  en: {
    appName: "SpeakNest",
    dashboard: "Dashboard",
    myMeetings: "My Meetings",
    createMeeting: "Create Meeting",
    participants: "Participants",
    evaluations: "Evaluations",
    profile: "Profile",
    statistics: "Statistics",
    earnings: "Earnings",
    settings: "Settings",
    logout: "Logout",
    language: "Language",
    conversationHost: "Conversation Host",
  },
  tr: {
    appName: "SpeakNest",
    dashboard: "Ana Sayfa",
    myMeetings: "Toplantılarım",
    createMeeting: "Toplantı Oluştur",
    participants: "Katılımcılar",
    evaluations: "Değerlendirmeler",
    profile: "Profil",
    statistics: "İstatistikler",
    earnings: "Kazançlar",
    settings: "Ayarlar",
    logout: "Çıkış",
    language: "Dil",
    conversationHost: "Konuşma Sunucusu",
  }
};

export default function ProUserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Temel state'ler
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'tr'>('en');
  const t = translations[lang];
  
  const toast = useToast();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/dashboard';
      case 'teacher':
        return '/teacher-panel';
      case 'student':
        return '/student-panel/dashboard';
      case 'proUser':
        return '/prouser-panel';
      default:
        return '/';
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setLoading(true);
          
          try {
            // Kullanıcı profilini getir
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserProfile({
                uid: user.uid,
                displayName: userData.displayName || user.displayName || '',
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                photoURL: userData.photoURL || user.photoURL || '',
                role: userData.role || UserRole.STUDENT,
                createdAt: userData.createdAt?.toDate(),
                lastLogin: userData.lastLogin?.toDate()
              });
              
              // Rol kontrolü
              if (userData.role !== UserRole.PRO_USER) {
                const redirectPath = getRedirectPath(userData.role);
                router.push(redirectPath);
                return;
              }
            } else {
              setError('Kullanıcı profili bulunamadı.');
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Kullanıcı verileri alınırken bir hata oluştu.');
          } finally {
            setLoading(false);
          }
        } else {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          router.push('/login');
        }
      });
      
      return () => unsubscribe();
    };
    
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!userProfile?.role || !userProfile?.uid) return;
    // Bildirimleri dinle
    const q = query(collection(db, 'notifications'), where('userId', '==', userProfile.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(docu => ({ id: docu.id, ...docu.data() }));
      setNotifications(notifs.sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.()));
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    return () => unsubscribe();
  }, [userProfile]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
  };

  const markAsRead = async (notifId: string) => {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Yükleniyor...</p>
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

  // Menü öğeleri
  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: <Home size={18} />, href: '/prouser-panel/dashboard' },
    { id: 'my-meetings', label: t.myMeetings, icon: <Calendar size={18} />, href: '/prouser-panel/my-meetings' },
    { id: 'create-meeting', label: t.createMeeting, icon: <Plus size={18} />, href: '/prouser-panel/create-meeting' },
    { id: 'statistics', label: t.statistics, icon: <BarChart size={18} />, href: '/prouser-panel/statistics' },
    { id: 'earnings', label: t.earnings, icon: <DollarSign size={18} />, href: '/prouser-panel/earnings' },
    { id: 'profile', label: t.profile, icon: <User size={18} />, href: '/prouser-panel/profile' },
    { id: 'settings', label: t.settings, icon: <Settings size={18} />, href: '/prouser-panel/settings' },
  ];

  // Aktif tab'ı pathname'e göre belirle
  const getActiveTab = () => {
    const path = pathname.split('/').pop() || 'dashboard';
    return path === 'prouser-panel' ? 'dashboard' : path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Üst bar (mobil + masaüstü) */}
      <div className="bg-white p-4 flex justify-between items-center border-b shadow-sm sticky top-0 z-50">
        <h1 className="text-lg font-semibold text-slate-800">{t.appName}</h1>
        <div className="flex items-center gap-2">
          {/* Bildirim Butonu */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {/* Açılır Bildirim Listesi */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b font-semibold text-slate-700">Bildirimler</div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-slate-500">Hiç bildiriminiz yok.</div>
                ) : notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b last:border-b-0 cursor-pointer ${!notif.read ? 'bg-blue-50 font-semibold' : 'bg-white'}`}
                    onClick={async () => { await markAsRead(notif.id); setShowNotifications(false); }}
                  >
                    <div className="text-sm text-slate-800">{notif.message}</div>
                    <div className="text-xs text-slate-500 mt-1">{notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString('tr-TR') : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Yan menü */}
        <div className={`bg-white border-r shadow-sm fixed md:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="flex items-center gap-3 pb-2">
              {userProfile?.photoURL ? (
                <Image 
                  src={userProfile.photoURL} 
                  alt={userProfile.displayName || 'Profil'}
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-white/30"
                />
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-medium border-2 border-white/30">
                  {userProfile?.displayName?.charAt(0) || userProfile?.firstName?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <div className="font-medium">
                  {userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}` || t.conversationHost}
                </div>
                <div className="text-xs text-white/80">
                  {t.conversationHost}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button 
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full py-2.5 px-3 rounded-md text-sm transition-all duration-200 ${
                      getActiveTab() === item.id 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-medium shadow-sm border border-blue-100' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full py-2.5 px-3 rounded-md text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut size={18} />
                  {t.logout}
                </button>
              </li>
            </ul>
            
            <div className="mt-6 px-3 py-4 border-t pt-4">
              <p className="text-xs text-slate-500 mb-2">{t.language}</p>
              <select
                value={lang}
                onChange={e => setLang(e.target.value as 'en' | 'tr')}
                className="w-full px-2 py-1 rounded border"
              >
                <option value="en">English</option>
                <option value="tr">Türkçe</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Ana içerik alanı */}
        <div className="flex-1 p-4 md:p-6 md:pt-6 overflow-auto">
          <div className="hidden md:flex md:justify-between md:items-center mb-6">
            <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
              {menuItems.find(item => item.id === getActiveTab())?.icon}
              {menuItems.find(item => item.id === getActiveTab())?.label || t.appName}
            </h1>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
} 