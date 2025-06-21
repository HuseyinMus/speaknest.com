'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, Home, MessageCircle, Users, FileText, User, BarChart, Clock, Settings, LogOut, BookOpen, Bell } from 'lucide-react';
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

export default function StudentPanel() {
  const router = useRouter();
  const pathname = usePathname() || '';
  
  // Temel state'ler
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Bildirim state'leri
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setUserProfile(user.toJSON());
            // Kullanıcı giriş yaptığında bildirimleri yükle
            await fetchNotifications(user.uid);
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
        rating: rating
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
      {/* Header */}
      <div className="w-full max-w-6xl mb-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {userProfile?.firstName?.charAt(0) || userProfile?.displayName?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">
                  {userProfile?.firstName && userProfile?.lastName 
                    ? `${userProfile.firstName} ${userProfile.lastName}`
                    : userProfile?.displayName || 'Kullanıcı'
                  }
                </h2>
                <p className="text-sm text-slate-600">{userProfile?.email}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Bildirim Butonu */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Bell size={20} className="text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Bildirim Modal */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-hidden">
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
              )}
            </div>
            
            {/* Çıkış Butonu */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Çıkış Yap"
            >
              <LogOut size={20} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

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
      
      {/* Modal dışına tıklandığında kapatma */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}