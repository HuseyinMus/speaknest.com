'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { Calendar, Users, Clock, Star, TrendingUp, Award, Bell, MessageCircle, CheckCircle, BookOpen } from 'lucide-react';
import { User } from 'firebase/auth';

// Kurs interface'i
interface Course {
  id: string;
  title?: string;
  description?: string;
  instructorName?: string;
  level?: string;
  topic?: string;
}

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

// Toplantı interface'i
interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  level: string;
  topic: string;
  participantCount: number;
  status: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  hostName: string;
  hostPhotoURL: string;
  meetUrl?: string;
  maxParticipants: number;
}

// İstatistik interface'i
interface Statistics {
  totalMeetings: number;
  monthlyMeetings: number;
  levelProgress: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  topicDistribution: {
    [key: string]: number;
  };
}

export default function Dashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [favoriteMeetings, setFavoriteMeetings] = useState<Meeting[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalMeetings: 0,
    monthlyMeetings: 0,
    levelProgress: {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    },
    topicDistribution: {}
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [totalDueWords, setTotalDueWords] = useState(0);
  const [totalLearnedWords, setTotalLearnedWords] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [todayReviews, setTodayReviews] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const DAILY_GOAL = 10;

  // Kullanıcı bilgilerini ve verileri yükle
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setUserProfile(user.toJSON());
            setUser(user);
            await Promise.all([
              fetchActiveCourses(),
              fetchUpcomingMeetings(),
              fetchFavoriteMeetings(),
              fetchStatistics(),
              fetchVocabularyStats(user.uid)
            ]);
          } else {
            router.push('/login');
          }
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Kullanıcı verisi yüklenirken hata:', err);
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [router]);
  
  // Aktif kursları getir
  const fetchActiveCourses = async () => {
    try {
      const coursesRef = collection(db, 'courses');
      const q = query(
        coursesRef,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const courses: Course[] = [];
      
      querySnapshot.forEach((doc) => {
        courses.push({ 
          id: doc.id, 
          ...doc.data() 
        } as Course);
      });
      
      setActiveCourses(courses.slice(0, 2)); // Sadece 2 kurs göster
    } catch (error) {
      console.error('Kurslar yüklenirken hata:', error);
    }
  };
  
  // Yaklaşan toplantıları getir
  const fetchUpcomingMeetings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const meetingsQuery = query(
        collection(db, 'meetings'),
        where('status', '==', 'active'),
        where('participants', 'array-contains', {
          id: user.uid,
          name: user.displayName || 'Anonim',
          email: user.email
        }),
        orderBy('startTime', 'asc')
      );
      
      const meetingsSnapshot = await getDocs(meetingsQuery);
      const meetingsData: Meeting[] = [];
      const now = new Date();
      
      meetingsSnapshot.forEach((doc) => {
        const data = doc.data();
        const meetingStartTime = data.startTime.toDate();
        
        if (meetingStartTime > now) {
          meetingsData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            startTime: meetingStartTime,
            level: data.level,
            topic: data.topic,
            participantCount: data.participantCount,
            status: data.status,
            participants: data.participants || [],
            hostName: data.hostName,
            hostPhotoURL: data.hostPhotoURL,
            meetUrl: data.meetUrl,
            maxParticipants: data.maxParticipants
          });
        }
      });
      
      setUpcomingMeetings(meetingsData);
    } catch (error) {
      console.error('Yaklaşan toplantılar yüklenirken hata:', error);
    }
  };

  // Favori toplantıları getir
  const fetchFavoriteMeetings = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const favoriteMeetingIds = userData?.favoriteMeetings || [];

      if (favoriteMeetingIds.length === 0) {
        setFavoriteMeetings([]);
        return;
      }

      const meetingsQuery = query(
        collection(db, 'meetings'),
        where('status', '==', 'active'),
        where('__name__', 'in', favoriteMeetingIds)
      );
      
      const meetingsSnapshot = await getDocs(meetingsQuery);
      const meetingsData: Meeting[] = [];
      
      meetingsSnapshot.forEach((doc) => {
        const data = doc.data();
        meetingsData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          startTime: data.startTime.toDate(),
          level: data.level,
          topic: data.topic,
          participantCount: data.participantCount,
          status: data.status,
          participants: data.participants || [],
          hostName: data.hostName,
          hostPhotoURL: data.hostPhotoURL,
          meetUrl: data.meetUrl,
          maxParticipants: data.maxParticipants
        });
      });
      
      setFavoriteMeetings(meetingsData);
    } catch (error) {
      console.error('Favori toplantılar yüklenirken hata:', error);
    }
  };

  // İstatistikleri getir
  const fetchStatistics = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      setStatistics({
        totalMeetings: userData?.totalMeetings || 0,
        monthlyMeetings: userData?.monthlyMeetings || 0,
        levelProgress: userData?.levelProgress || {
          beginner: 0,
          intermediate: 0,
          advanced: 0
        },
        topicDistribution: userData?.topicDistribution || {}
      });
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    }
  };

  // Kelime istatistiklerini Firestore'dan çek
  const fetchVocabularyStats = async (userId: string) => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const statusRef = collection(db, 'wordLearningStatus');
      const q = query(statusRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      let total = 0, learned = 0, reviews = 0, today = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.nextReview && data.nextReview.toDate() <= now) total++;
        if ((data.consecutiveCorrectReviews || 0) >= 2) learned++;
        if (typeof data.lastReviewed === 'object' && data.lastReviewed.toDate) {
          reviews++;
          const reviewedDate = data.lastReviewed.toDate();
          const reviewedStr = reviewedDate.toISOString().slice(0, 10);
          if (reviewedStr === todayStr) today++;
        }
      }
      setTotalDueWords(total);
      setTotalLearnedWords(learned);
      setTotalReviews(reviews);
      setTodayReviews(today);
      // Streak ve rozetler
      const streakData = JSON.parse(localStorage.getItem(`streak_${userId}`) || '{"count":0,"lastDate":null}');
      if (today > 0) {
        if (streakData.lastDate === todayStr) {
          setStreak(streakData.count);
        } else if (
          streakData.lastDate &&
          new Date(todayStr).getTime() - new Date(streakData.lastDate).getTime() === 86400000
        ) {
          setStreak(streakData.count + 1);
          localStorage.setItem(`streak_${userId}`, JSON.stringify({ count: streakData.count + 1, lastDate: todayStr }));
        } else {
          setStreak(1);
          localStorage.setItem(`streak_${userId}`, JSON.stringify({ count: 1, lastDate: todayStr }));
        }
      } else {
        setStreak(streakData.lastDate === todayStr ? streakData.count : 0);
      }
      // Rozetler
      const newBadges: string[] = [];
      if (learned >= 10) newBadges.push('10 Kelime Öğrendi');
      if (learned >= 50) newBadges.push('50 Kelime Öğrendi');
      if (reviews >= 100) newBadges.push('100 Tekrar Yaptı');
      if (streak >= 3) newBadges.push('3 Gün Seri');
      if (streak >= 7) newBadges.push('7 Gün Seri');
      setBadges(newBadges);
      if (today >= DAILY_GOAL) setShowCongratsModal(true);
    } catch (error) {
      console.error('Kelime istatistikleri çekilemedi:', error);
    }
  };

  // Toplantıya kalan süreyi hesapla
  const getTimeRemaining = (startTime: Date) => {
    const now = new Date();
    const diff = startTime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} gün`;
    if (hours > 0) return `${hours} saat`;
    return `${minutes} dakika`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-4 md:p-8">
      {/* Hoş geldin kartı */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 gap-8">
        <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            {userProfile?.photoURL && (
              <img src={userProfile.photoURL} alt="Profil" className="w-16 h-16 rounded-full border-4 border-emerald-200 shadow" />
            )}
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-1 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100">
                  <Calendar size={28} className="text-emerald-500" />
                </span>
                Merhaba, {userProfile?.displayName || userProfile?.firstName || t('student')}!
              </h2>
              <div className="flex items-center gap-2 text-slate-600 text-base md:text-lg">
                <span className="font-semibold">{userProfile?.englishLevel ? `Seviye: ${userProfile.englishLevel}` : ''}</span>
                {streak > 0 && (
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1 animate-pulse">🔥 {streak} gün seri</span>
                )}
              </div>
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {badges.map((badge, i) => (
                    <span key={i} className="bg-gradient-to-r from-emerald-400 to-blue-400 text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow animate-fade-in">🏅 {badge}</span>
                  ))}
                </div>
              )}
              {/* Dinamik motivasyonel mesajlar */}
              <div className="mt-2 text-emerald-700 font-semibold text-base flex items-center gap-2">
                {todayReviews >= DAILY_GOAL ? (
                  <>
                    <span>Hedefini tamamladın, harikasın! 🚀</span>
                  </>
                ) : streak >= 7 ? (
                  <>
                    <span>7 gün üst üste çalıştın, mükemmel bir alışkanlık!</span>
                  </>
                ) : streak >= 3 ? (
                  <>
                    <span>Serini bozma, başarıya çok yakınsın!</span>
                  </>
                ) : todayReviews > 0 ? (
                  <>
                    <span>Bugün {todayReviews} tekrar yaptın, devam et!</span>
                  </>
                ) : (
                  <>
                    <span>Hadi bugün de bir adım at, başarı seni bekliyor!</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-2 flex-wrap">
              <button 
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
                onClick={() => router.push('/student-panel/vocabulary')}
              >
                Kelime Paneli
              </button>
              <button 
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
                onClick={() => router.push('/student-panel/vocabulary/groups')}
              >
                Kelime Grupları
              </button>
              <button 
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium shadow-md"
                onClick={() => router.push('/student-panel/vocabulary?filter=due')}
              >
                Tekrar Zamanı Gelenler
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Bell size={20} className="text-amber-500 animate-bounce" />
              <span className="text-sm text-slate-700 font-medium">{totalDueWords > 0 ? `${totalDueWords} kelimenin tekrarı geldi!` : 'Tüm kelimeler güncel 🎉'}</span>
            </div>
          </div>
          {/* Hedef tamamlandıysa animasyonlu emoji ve tebrik */}
          {todayReviews >= DAILY_GOAL && (
            <div className="absolute right-4 bottom-4 animate-bounce text-4xl select-none pointer-events-none">🎉</div>
          )}
          <div className="absolute left-0 bottom-0 w-full h-2 bg-gradient-to-r from-emerald-200 via-purple-200 to-blue-200 rounded-b-2xl" />
          {/* Bilimsel bilgi kutusu */}
          <div className="absolute top-4 right-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 shadow text-emerald-800 text-xs font-medium max-w-xs animate-fade-in">
            <span className="font-bold">Bilimsel Bilgi:</span> Düzenli aralıklı tekrar (SRS) yöntemi, uzun süreli hafızayı güçlendirir ve kelime öğrenimini hızlandırır. Bugün küçük bir tekrar bile büyük fark yaratır!
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="bg-emerald-100 text-emerald-700 rounded-full p-3 mb-2">
              <CheckCircle size={28} className="text-emerald-600" />
            </span>
            <div className="text-lg font-bold text-emerald-800">Toplam Katıldığın Toplantı</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{statistics.totalMeetings}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="bg-blue-100 text-blue-700 rounded-full p-3 mb-2">
              <MessageCircle size={28} className="text-blue-600" />
            </span>
            <div className="text-lg font-bold text-blue-800">Bu Ayki Toplantı</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">{statistics.monthlyMeetings}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="bg-yellow-100 text-yellow-700 rounded-full p-3 mb-2">
              <Star size={28} className="text-yellow-600" />
            </span>
            <div className="text-lg font-bold text-yellow-800">Favori Toplantılar</div>
            <div className="text-2xl font-extrabold text-yellow-600 mt-1">{favoriteMeetings.length}</div>
          </div>
        </div>

        {/* Kelime İstatistikleri ve Motivasyonel Alanlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow p-6 flex flex-col items-center text-white relative">
            <span className="absolute top-2 right-2 bg-white/20 rounded-full px-2 text-xs">Günlük Hedef: {DAILY_GOAL}</span>
            <BookOpen size={32} className="mb-2" />
            <div className="text-lg font-bold">Bugünkü Tekrar</div>
            <div className="text-3xl font-extrabold mt-1">{todayReviews}</div>
            <div className="mt-2 text-sm">{todayReviews >= DAILY_GOAL ? 'Hedef Tamamlandı 🎉' : `${DAILY_GOAL - todayReviews} tekrar kaldı`}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <CheckCircle size={32} className="text-emerald-500 mb-2" />
            <div className="text-lg font-bold text-emerald-800">Öğrenilen Kelime</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">{totalLearnedWords}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <Clock size={32} className="text-blue-500 mb-2" />
            <div className="text-lg font-bold text-blue-800">Tekrar Edilecek</div>
            <div className="text-3xl font-extrabold text-blue-600 mt-1">{totalDueWords}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <TrendingUp size={32} className="text-yellow-500 mb-2" />
            <div className="text-lg font-bold text-yellow-800">Streak (Seri)</div>
            <div className="text-3xl font-extrabold text-yellow-600 mt-1">{streak} gün</div>
          </div>
        </div>
        {/* Rozetler ve kutlama animasyonu */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {badges.map((badge, i) => (
              <span key={i} className="bg-gradient-to-r from-emerald-400 to-blue-400 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">🏅 {badge}</span>
            ))}
          </div>
        )}
        {showCongratsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-2 text-emerald-600">Tebrikler! 🎉</h2>
              <p className="text-slate-700 mb-4">Bugünkü kelime tekrar hedefini tamamladın!</p>
              <button onClick={() => setShowCongratsModal(false)} className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium">Kapat</button>
            </div>
          </div>
        )}

        {/* Kelime Kartları */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-500 px-6 py-3">
            <h2 className="text-base font-medium text-white flex items-center gap-2">
              <BookOpen size={18} /> {t('vocabularyCards')}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-purple-100 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-700">Günlük Kelimeler</span>
                  <span className="text-xs text-purple-500">5/10</span>
                </div>
                <div className="h-2 bg-purple-100 rounded-full">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div className="border border-purple-100 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-700">Öğrenilen Kelimeler</span>
                  <span className="text-xs text-purple-500">150</span>
                </div>
                <div className="h-2 bg-purple-100 rounded-full">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="border border-purple-100 rounded-lg p-4 hover:bg-purple-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-700">Tekrar Edilecek</span>
                  <span className="text-xs text-purple-500">25</span>
                </div>
                <div className="h-2 bg-purple-100 rounded-full">
                  <div className="h-2 bg-purple-500 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-right">
              <button 
                className="text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                onClick={() => router.push('/student-panel/vocabulary')}
              >
                {t('viewAllVocabulary')} →
              </button>
            </div>
          </div>
        </div>

        {/* Yaklaşan Toplantılar */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-3">
            <h2 className="text-base font-medium text-white flex items-center gap-2">
              <Clock size={18} /> {t('upcomingMeetings')}
            </h2>
          </div>
          <div className="p-6">
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.slice(0, 3).map((meeting) => (
                  <div 
                    key={meeting.id}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <h3 className="text-lg font-medium text-slate-800">{meeting.title}</h3>
                      <p className="text-slate-600 text-sm mt-1">{meeting.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {getTimeRemaining(meeting.startTime)} sonra
                      </span>
                      <button 
                        className="text-sm px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        onClick={() => router.push(`/meetings/${meeting.id}`)}
                      >
                        {t('joinMeeting')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 rounded-md bg-blue-50">
                <p className="text-blue-700">{t('noUpcomingMeetings')}</p>
                <button 
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-md hover:from-indigo-700 hover:to-blue-600 transition-colors text-sm shadow-sm"
                  onClick={() => router.push('/student-panel/sessions')}
                >
                  {t('findConversationMeeting')}
                </button>
              </div>
            )}
            <div className="mt-4 text-right">
              <button 
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                onClick={() => router.push('/student-panel/upcoming')}
              >
                {t('viewAllUpcomingPractices')} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 