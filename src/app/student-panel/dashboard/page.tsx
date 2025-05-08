'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
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

// Bilimsel bilgiler dizisi
const scientificTips = [
  "Düzenli aralıklı tekrar (SRS) yöntemi, uzun süreli hafızayı güçlendirir ve kelime öğrenimini hızlandırır.",
  "Kısa ve sık tekrarlar, uzun süreli öğrenmede tek seferde çalışmaktan daha etkilidir.",
  "Kelimeyi yüksek sesle tekrar etmek, hem telaffuz hem de hafıza için faydalıdır.",
  "Görsel ve işitsel materyallerle çalışmak, kelime öğrenimini %60'a kadar hızlandırabilir.",
  "Her gün az da olsa tekrar yapmak, öğrenme motivasyonunu ve kalıcılığını artırır.",
  "Yanlış yapmak öğrenmenin doğal bir parçasıdır; hatalardan korkma, onları fırsata çevir!",
  "Kendi cümlelerinle kelimeyi kullanmak, pasif bilgiyi aktif hale getirir.",
  "Uyumadan önce yapılan tekrarlar, bilgilerin uzun süreli hafızaya geçmesini kolaylaştırır."
];

export default function Dashboard() {
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
  const [randomTip, setRandomTip] = useState(scientificTips[0]);

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

  // Bilimsel bilgiler dizisi
  useEffect(() => {
    setRandomTip(scientificTips[Math.floor(Math.random() * scientificTips.length)]);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-4 md:p-8">
      {/* --- Modern Özet Panel (istatistikler + yaklaşan toplantılar) alanını tamamen kaldırıyorum --- */}
      {/* <div className="w-full max-w-3xl mx-auto my-6"> ... </div> */}

      {/* --- Dikkat çekici Yaklaşan Toplantılar alanı --- */}
      <div className="w-full max-w-4xl mx-auto mt-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={28} className="text-indigo-500" />
          <h2 className="text-2xl font-extrabold text-indigo-700 tracking-tight">Yaklaşan Toplantılar</h2>
        </div>
        {upcomingMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 bg-indigo-50 rounded-2xl shadow-inner">
            <svg width="80" height="80" fill="none" viewBox="0 0 80 80"><circle cx="40" cy="40" r="40" fill="#e0e7ff"/><path d="M40 24v20l14 8" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div className="text-indigo-700 font-bold text-lg mt-4">Yaklaşan toplantın yok</div>
            <div className="text-indigo-600 text-sm mb-3">Yeni bir pratik bulmak için hemen keşfet!</div>
            <button className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-base font-semibold shadow transition-colors" onClick={() => router.push('/student-panel/sessions')}>Yeni Pratik Bul</button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4 min-w-[320px]">
              {upcomingMeetings.slice(0, 5).map((meeting) => (
                <div
                  key={meeting.id}
                  className="min-w-[260px] max-w-xs bg-white border border-indigo-100 rounded-2xl p-4 shadow-md hover:scale-105 hover:shadow-xl transition-transform duration-200 cursor-pointer flex flex-col group"
                  onClick={() => router.push(`/meetings/${meeting.id}`)}
                >
                  <div className="font-bold text-indigo-900 text-lg truncate mb-1">{meeting.title}</div>
                  <div className="text-sm text-indigo-700 truncate mb-2">{meeting.description}</div>
                  <div className="flex items-center gap-1 text-xs text-indigo-600 mb-3">
                    <Clock size={14} />
                    <span>{getTimeRemaining(meeting.startTime)} sonra</span>
                  </div>
                  <button
                    className="mt-auto px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium shadow transition-colors group-hover:scale-105"
                    onClick={e => { e.stopPropagation(); router.push(`/meetings/${meeting.id}`); }}
                  >Katıl</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- Bilimsel Bilgi kutusunu küçük ve köşede gösterecek şekilde taşıyorum --- */}
      <div className="relative">
        {/* Hoş geldin kartı */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 gap-8">
          <div className="bg-white/90 rounded-2xl shadow-xl p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              {userProfile?.photoURL && (
                <img src={userProfile.photoURL} alt="Profil" className="w-16 h-16 rounded-full border-4 border-emerald-200 shadow" />
              )}
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-emerald-700 mb-0 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                    <span className="text-lg">👋</span>
                  </span>
                  Merhaba, <span className="text-indigo-700">{userProfile?.displayName || userProfile?.firstName || 'Öğrenci'}</span>!
                </h2>
                <div className="mt-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-100 via-emerald-50 to-purple-100 shadow text-sm md:text-base font-semibold text-indigo-700 animate-fade-in">
                    <span className="text-base">🚀</span>
                    {todayReviews >= DAILY_GOAL ? (
                      <span>Hedefini tamamladın, harikasın!</span>
                    ) : streak >= 7 ? (
                      <span>7 gün üst üste çalıştın, mükemmel bir alışkanlık!</span>
                    ) : streak >= 3 ? (
                      <span>Serini bozma, başarıya çok yakınsın!</span>
                    ) : todayReviews > 0 ? (
                      <span>Bugün {todayReviews} tekrar yaptın, devam et!</span>
                    ) : (
                      <span>Hadi bugün de bir adım at, başarı seni bekliyor!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end w-full">
              {/* Mobilde Bilimsel Bilgi kutusu - butonun üstünde */}
              <div className="block md:hidden max-w-xs mx-auto mb-2 bg-emerald-50/90 border border-emerald-200 rounded-lg px-3 py-1.5 shadow text-emerald-800 text-xs font-medium">
                <span className="font-bold">Bilimsel Bilgi:</span> {randomTip}
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
            {/* Bilimsel Bilgi kutusu - sağ üst köşe */}
            <div className="hidden md:block absolute top-4 right-4 bg-emerald-50/90 border border-emerald-200 rounded-lg px-3 py-1.5 shadow text-emerald-800 text-xs font-medium max-w-xs z-10">
              <span className="font-bold">Bilimsel Bilgi:</span> {randomTip}
            </div>
          </div>
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
    </div>
  );
} 