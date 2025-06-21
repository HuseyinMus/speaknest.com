'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, query, getDocs, doc, getDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface WordGroup {
  id: string;
  title: string;
  description: string;
  wordCount: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  lastStudied?: Date;
  progress?: number;
}

export default function VocabularyPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
  const [dueWordsByGroup, setDueWordsByGroup] = useState<{ [groupId: string]: number }>({});
  const [totalDueWords, setTotalDueWords] = useState(0);
  const [totalLearnedWords, setTotalLearnedWords] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalCorrectReviews, setTotalCorrectReviews] = useState(0);
  const [todayReviews, setTodayReviews] = useState(0);
  const DAILY_GOAL = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyDue, setShowOnlyDue] = useState(false);
  const [sortBy, setSortBy] = useState<'due' | 'wordCount' | 'az'>('due');
  const [streak, setStreak] = useState(0);
  const [lastReviewDate, setLastReviewDate] = useState<string | null>(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchWordGroups();
      fetchDueWords();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const streakData = JSON.parse(localStorage.getItem(`streak_${user.uid}`) || '{"count":0,"lastDate":null}');
    if (todayReviews > 0) {
      if (streakData.lastDate === todayStr) {
        setStreak(streakData.count);
      } else if (
        streakData.lastDate &&
        new Date(todayStr).getTime() - new Date(streakData.lastDate).getTime() === 86400000
      ) {
        setStreak(streakData.count + 1);
        localStorage.setItem(`streak_${user.uid}`, JSON.stringify({ count: streakData.count + 1, lastDate: todayStr }));
      } else {
        setStreak(1);
        localStorage.setItem(`streak_${user.uid}`, JSON.stringify({ count: 1, lastDate: todayStr }));
      }
      setLastReviewDate(todayStr);
    } else {
      setStreak(streakData.lastDate === todayStr ? streakData.count : 0);
    }
  }, [todayReviews, user]);

  useEffect(() => {
    const newBadges: string[] = [];
    if (totalLearnedWords >= 10) newBadges.push('10 Kelime Öğrendi');
    if (totalLearnedWords >= 50) newBadges.push('50 Kelime Öğrendi');
    if (totalReviews >= 100) newBadges.push('100 Tekrar Yaptı');
    if (streak >= 3) newBadges.push('3 Gün Seri');
    if (streak >= 7) newBadges.push('7 Gün Seri');
    setBadges(newBadges);
    if (todayReviews >= DAILY_GOAL) setShowCongratsModal(true);
  }, [totalLearnedWords, totalReviews, streak, todayReviews]);

  const fetchWordGroups = async () => {
    try {
      const wordGroupsRef = collection(db, 'wordGroups');
      const querySnapshot = await getDocs(wordGroupsRef);
      const groups: WordGroup[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        groups.push({ 
          id: doc.id, 
          title: data.title,
          description: data.description,
          wordCount: data.wordCount || 0,
          level: data.level || 'beginner',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastStudied: data.lastStudied?.toDate(),
          progress: data.progress || 0
        });
      });
      
      setWordGroups(groups);
      setLoading(false);
    } catch (error) {
      console.error('Kelime grupları yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const fetchDueWords = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const statusRef = collection(db, 'wordLearningStatus');
      const q = query(
        statusRef,
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const groupCount: { [groupId: string]: number } = {};
      let total = 0;
      let learned = 0;
      let reviews = 0;
      let correctReviews = 0;
      let today = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        // --- Tekrar zamanı gelen kelime ---
        if (data.nextReview && data.nextReview.toDate() <= now) {
          // groupId bulma
          let groupId = null;
          const wordGroupsRef = collection(db, 'wordGroups');
          const wordGroupsSnap = await getDocs(wordGroupsRef);
          for (const groupDoc of wordGroupsSnap.docs) {
            const wordsRef = collection(db, 'wordGroups', groupDoc.id, 'words');
            const wordSnap = await getDoc(doc(wordsRef, data.wordId));
            if (wordSnap.exists()) {
              groupId = groupDoc.id;
              break;
            }
          }
          if (groupId) {
            groupCount[groupId] = (groupCount[groupId] || 0) + 1;
            total++;
          }
        }
        // --- Öğrenilen kelime ---
        if ((data.consecutiveCorrectReviews || 0) >= 2) {
          learned++;
        }
        // --- Toplam tekrar ---
        if (typeof data.lastReviewed === 'object' && data.lastReviewed.toDate) {
          reviews += 1;
          // --- Bugün yapılan tekrar ---
          const reviewedDate = data.lastReviewed.toDate();
          const reviewedStr = reviewedDate.toISOString().slice(0, 10);
          if (reviewedStr === todayStr) {
            today++;
          }
        }
        // --- Başarı oranı için ---
        // Kolay veya iyi yapılanlar (interval >= 1 gün ve consecutiveCorrectReviews > 0)
        if ((data.interval || 0) >= 1 && (data.consecutiveCorrectReviews || 0) > 0) {
          correctReviews++;
        }
      }
      setDueWordsByGroup(groupCount);
      setTotalDueWords(total);
      setTotalLearnedWords(learned);
      setTotalReviews(reviews);
      setTotalCorrectReviews(correctReviews);
      setTodayReviews(today);
    } catch (error) {
      console.error('Tekrar zamanı gelen kelimeler çekilemedi:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200';
      case 'intermediate': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-200';
      case 'advanced': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return 'Başlangıç';
      case 'intermediate': return 'Orta';
      case 'advanced': return 'İleri';
      default: return level;
    }
  };

  // Filtrelenmiş ve sıralanmış gruplar
  const filteredGroups = wordGroups
    .filter(group => group.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(group => !showOnlyDue || (dueWordsByGroup[group.id] > 0))
    .sort((a, b) => {
      if (sortBy === 'due') {
        return (dueWordsByGroup[b.id] || 0) - (dueWordsByGroup[a.id] || 0);
      } else if (sortBy === 'wordCount') {
        return (b.wordCount || 0) - (a.wordCount || 0);
      } else if (sortBy === 'az') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="relative mb-8">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200 to-transparent rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-gradient-to-tl from-blue-200 to-transparent rounded-full opacity-20 animate-pulse delay-500"></div>
          </div>
          
          <div className="relative text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Kelime Yönetimi
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-4">
              Kelime Grupları
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Kelime gruplarını keşfet, öğren ve tekrar et. İngilizce kelime hazneni geliştir
            </p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="group relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-slate-100/50 hover:shadow-3xl transition-all duration-500 ease-out">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex items-center w-full lg:w-auto gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">🔍</span>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Kelime grubu ara..."
                  className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent w-full lg:w-80 transition-all duration-300"
                />
              </div>
              
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyDue}
                    onChange={e => setShowOnlyDue(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 rounded focus:ring-2 focus:ring-emerald-400 border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">Sadece tekrar zamanı gelen</span>
                </label>
              </div>
              
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">📊</span>
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                >
                  <option value="due">En çok tekrar zamanı gelen</option>
                  <option value="wordCount">En çok kelime</option>
                  <option value="az">A-Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-emerald-100/50 hover:shadow-3xl transition-all duration-500 ease-out transform group-hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📚</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-600 text-sm">
                    <span>↗</span>
                    <span>+15%</span>
                  </div>
                  <span className="text-slate-500 text-xs">Bu hafta</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-emerald-700 mb-2">
                {totalLearnedWords}
              </h3>
              <p className="text-emerald-600 font-medium">Öğrenilen Kelime</p>
              <div className="mt-4 w-full bg-emerald-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((totalLearnedWords / 100) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-yellow-100/50 hover:shadow-3xl transition-all duration-500 ease-out transform group-hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">⏰</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-600 text-sm">
                    <span>↗</span>
                    <span>+8%</span>
                  </div>
                  <span className="text-slate-500 text-xs">Bu hafta</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-yellow-700 mb-2">
                {totalDueWords}
              </h3>
              <p className="text-yellow-600 font-medium">Tekrar Zamanı Gelen</p>
              <div className="mt-4 w-full bg-yellow-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((totalDueWords / 50) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-blue-100/50 hover:shadow-3xl transition-all duration-500 ease-out transform group-hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🔄</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-blue-600 text-sm">
                    <span>↗</span>
                    <span>+12%</span>
                  </div>
                  <span className="text-slate-500 text-xs">Bu hafta</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-blue-700 mb-2">
                {totalReviews}
              </h3>
              <p className="text-blue-600 font-medium">Toplam Tekrar</p>
              <div className="mt-4 w-full bg-blue-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((totalReviews / 500) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-purple-100/50 hover:shadow-3xl transition-all duration-500 ease-out transform group-hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎯</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-purple-600 text-sm">
                    <span>↗</span>
                    <span>+5%</span>
                  </div>
                  <span className="text-slate-500 text-xs">Bu hafta</span>
                </div>
              </div>
              <h3 className="text-3xl font-bold text-purple-700 mb-2">
                {totalReviews > 0 ? Math.round((totalCorrectReviews / totalReviews) * 100) : 0}%
              </h3>
              <p className="text-purple-600 font-medium">Başarı Oranı</p>
              <div className="mt-4 w-full bg-purple-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${totalReviews > 0 ? Math.round((totalCorrectReviews / totalReviews) * 100) : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Streak and Badges Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-orange-100/50 hover:shadow-3xl transition-all duration-500 ease-out">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🔥</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-700">Günlük Seri</h3>
                  <p className="text-orange-600 text-sm">Kesintisiz öğrenme</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-700 mb-2">{streak}</div>
                <p className="text-orange-600 font-medium">gün</p>
                {lastReviewDate && (
                  <p className="text-xs text-orange-500 mt-2">Son tekrar: {lastReviewDate}</p>
                )}
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-emerald-100/50 hover:shadow-3xl transition-all duration-500 ease-out">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🏆</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-700">Rozetler</h3>
                  <p className="text-emerald-600 text-sm">Başarılarını kutla</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {badges.length === 0 ? (
                  <div className="text-center w-full py-4">
                    <span className="text-emerald-600 text-sm">Henüz rozet yok</span>
                    <p className="text-emerald-500 text-xs mt-1">Daha fazla çalışarak rozetler kazan</p>
                  </div>
                ) : (
                  badges.map((badge, i) => (
                    <span key={i} className="bg-gradient-to-r from-emerald-200 to-teal-200 text-emerald-800 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-300">
                      {badge}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Goal Section */}
        <div className="group relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-blue-100/50 hover:shadow-3xl transition-all duration-500 ease-out">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎯</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-700">Günlük Hedef</h3>
                  <p className="text-blue-600 text-sm">{DAILY_GOAL} tekrar tamamla</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-700">{todayReviews} / {DAILY_GOAL}</div>
                <div className="w-32 h-3 bg-blue-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, Math.round((todayReviews / DAILY_GOAL) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>
            {todayReviews >= DAILY_GOAL && (
              <div className="mt-4 p-4 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="text-emerald-700 font-bold">Tebrikler!</p>
                    <p className="text-emerald-600 text-sm">Günlük hedefini tamamladın</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Word Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div 
              key={group.id}
              className="group relative cursor-pointer"
              onClick={() => router.push(`/student-panel/vocabulary/groups/${group.id}`)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-slate-100/50 hover:shadow-3xl transition-all duration-500 ease-out transform group-hover:-translate-y-2">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{group.title}</h3>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-3">{group.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-semibold border ${getLevelColor(group.level)}`}>
                    {getLevelText(group.level)}
                  </span>
                </div>
                
                {dueWordsByGroup[group.id] > 0 && (
                  <div className="mb-4">
                    <span className="inline-block bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 text-xs font-semibold px-3 py-2 rounded-xl border border-yellow-300">
                      ⏰ {dueWordsByGroup[group.id]} tekrar zamanı gelen kelime
                    </span>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 flex items-center gap-2">
                      <span className="w-6 h-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 text-xs">📚</span>
                      </span>
                      {group.wordCount} Kelime
                    </span>
                    {group.lastStudied && (
                      <span className="text-slate-500 flex items-center gap-2">
                        <span className="w-6 h-6 bg-gradient-to-br from-slate-100 to-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-slate-600 text-xs">🕒</span>
                        </span>
                        {new Date(group.lastStudied).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">İlerleme</span>
                      <span className="text-slate-700 font-bold">{group.progress || 0}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${group.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-emerald-600 font-medium text-sm">Grubu aç</span>
                    <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-sm">→</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {wordGroups.length === 0 && (
          <div className="text-center py-16">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-slate-100/50 hover:shadow-3xl transition-all duration-500 ease-out">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">📚</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Henüz kelime grubu yok</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Yeni kelime grupları eklendiğinde burada görünecek. Şimdilik diğer özellikleri keşfetmeye devam et.
                </p>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-2xl">✨</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Congratulations Modal */}
        {showCongratsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-emerald-100/50 hover:shadow-3xl transition-all duration-500 ease-out max-w-md mx-auto animate-bounce">
                <div className="text-center">
                  <div className="text-6xl mb-6">🎉</div>
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 mb-4">
                    Tebrikler!
                  </h2>
                  <p className="text-slate-600 mb-8 text-lg">
                    Günlük hedefini tamamladın veya yeni bir rozet kazandın!
                  </p>
                  <button
                    onClick={() => setShowCongratsModal(false)}
                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                  >
                    Harika! 🚀
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 