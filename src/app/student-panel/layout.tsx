'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Home, MessageCircle, Users, FileText, User, BarChart, Clock, Settings, LogOut, BookOpen, AlertTriangle, Bell } from 'lucide-react';
import { RoleBasedAccess, UserRole, PagePermissions } from '@/lib/auth/rbac';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';

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

// Bildirim interface'i
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  sentAt: any;
  status: string;
  read: boolean;
  requiresResponse?: boolean;
  response?: string;
  responseAt?: any;
  rating?: number;
}

// Yorum yapma formu bileşeni
function NotificationResponseForm({ 
  notificationId, 
  onSubmit 
}: { 
  notificationId: string; 
  onSubmit: (id: string, response: string, rating: number) => Promise<boolean>; 
}) {
  const [response, setResponse] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) return;

    setSubmitting(true);
    const success = await onSubmit(notificationId, response.trim(), rating);
    if (success) {
      setResponse('');
      setRating(5);
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Deneyiminizi paylaşın:
        </label>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="SpeakNest deneyiminizi kısaca yazın..."
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          rows={3}
          maxLength={500}
        />
        <div className="text-xs text-slate-400 mt-1">
          {response.length}/500 karakter
        </div>
      </div>
      
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-2">
          Puanınız:
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-2xl transition-colors hover:scale-110"
            >
              {star <= rating ? (
                <span className="text-yellow-400">★</span>
              ) : (
                <span className="text-gray-300">☆</span>
              )}
            </button>
          ))}
          <span className="ml-2 text-xs text-slate-600">
            {rating} yıldız
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !response.trim()}
          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Gönderiliyor...' : 'Gönder'}
        </button>
        <button
          type="button"
          onClick={() => {
            setResponse('');
            setRating(5);
          }}
          className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-300 transition-colors"
        >
          Temizle
        </button>
      </div>
    </form>
  );
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
  
  // Bildirim state'leri
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
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
            
            // Kullanıcı giriş yaptığında bildirimleri yükle
            await fetchNotifications(user.uid);
            
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

  const fetchNotifications = async (userId: string) => {
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('sentAt', 'desc')
      );
      const querySnapshot = await getDocs(notificationsQuery);
      const notificationsData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Notification[];
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
    } catch (err) {
      console.error('Bildirimler yüklenemedi:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      
      // Local state'i güncelle
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Bildirim okundu olarak işaretlenemedi:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );
      
      await Promise.all(updatePromises);
      
      // Local state'i güncelle
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Bildirimler okundu olarak işaretlenemedi:', err);
    }
  };

  const submitResponse = async (notificationId: string, response: string, rating: number) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { 
        response,
        responseAt: serverTimestamp(),
        read: true,
        rating
      });
      
      // Yorum yapıldığında testimonials koleksiyonuna da ekle
      if (userProfile) {
        await addDoc(collection(db, 'testimonials'), {
          name: userProfile.firstName && userProfile.lastName 
            ? `${userProfile.firstName} ${userProfile.lastName}`
            : userProfile.displayName || 'Anonim Kullanıcı',
          role: userProfile.role || 'Öğrenci',
          content: response,
          rating: rating,
          date: new Date().toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          createdAt: serverTimestamp(),
          source: 'notification_response',
          userId: userProfile.email,
          notificationId: notificationId
        });
      }
      
      // Local state'i güncelle
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { 
          ...n, 
          response,
          responseAt: new Date(),
          read: true 
        } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      console.error('Yanıt gönderilemedi:', err);
      return false;
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
        <h1 className="text-lg font-semibold text-slate-800">SpeakNest</h1>
        <div className="flex items-center gap-2">
          {/* Mobil Bildirim Butonu */}
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
          </div>
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
          
          {/* Desktop Bildirim Butonu */}
          <div className="relative w-full">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-white/80 hover:bg-emerald-50 transition-colors border border-slate-200"
            >
              <Bell size={18} className="text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Bildirimler</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
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
      
      {/* Bildirim Modal - Tüm sayfalar için ortak */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm" 
            onClick={() => setShowNotifications(false)}
          />
          <div className="relative w-80 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Bildirimler</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Tümünü okundu işaretle
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-slate-500 text-sm">Henüz bildiriminiz yok</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-slate-100 transition-colors ${
                      !notification.read ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        !notification.read ? 'bg-blue-500' : 'bg-slate-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 text-sm mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-slate-600 text-xs mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {notification.sentAt?.toDate ? 
                              notification.sentAt.toDate().toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 
                              'Yeni'
                            }
                          </span>
                          {notification.type === 'important' && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                              Önemli
                            </span>
                          )}
                        </div>
                        
                        {/* Yorum Yapma Alanı */}
                        {notification.type === 'testimonial' && !notification.response && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <NotificationResponseForm 
                              notificationId={notification.id}
                              onSubmit={submitResponse}
                            />
                          </div>
                        )}
                        
                        {/* Yanıt Gösterimi */}
                        {notification.response && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="bg-emerald-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-emerald-700">Yanıtınız:</span>
                                <span className="text-xs text-emerald-600">
                                  {notification.responseAt?.toDate ? 
                                    notification.responseAt.toDate().toLocaleDateString('tr-TR', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : 
                                    'Az önce'
                                  }
                                </span>
                              </div>
                              <p className="text-sm text-emerald-800 mb-2">{notification.response}</p>
                              {notification.rating && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-emerald-700">Puanınız:</span>
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} className={`text-sm ${i < (notification.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  <span className="text-xs text-emerald-600 ml-1">
                                    ({(notification.rating || 0)}/5)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 bg-slate-50">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-full text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 