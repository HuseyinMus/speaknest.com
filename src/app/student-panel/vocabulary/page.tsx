'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useAuth } from '@/lib/context/AuthContext';
import { collection, query, getDocs, doc, getDoc, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { BookOpen, Users, Clock, ChevronRight, Search, Filter } from 'lucide-react';

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
  const { t } = useLanguage();
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
      case 'beginner': return 'bg-emerald-100 text-emerald-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Filtre ve arama alanı */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow flex flex-col md:flex-row items-center gap-4 px-6 py-4">
            <div className="flex items-center w-full md:w-auto gap-2">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Kelime grubu ara..."
                className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full md:w-64"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="checkbox"
                checked={showOnlyDue}
                onChange={e => setShowOnlyDue(e.target.checked)}
                id="showOnlyDue"
                className="accent-purple-600 w-5 h-5 rounded focus:ring-2 focus:ring-purple-400 border-slate-300"
              />
              <label htmlFor="showOnlyDue" className="text-sm select-none cursor-pointer">
                Sadece tekrar zamanı gelen gruplar
              </label>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="due">En çok tekrar zamanı gelen</option>
                <option value="wordCount">En çok kelime</option>
                <option value="az">A-Z</option>
              </select>
            </div>
          </div>
        </div>
        {/* İstatistik kutuları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-bold text-purple-700 mb-1">{totalLearnedWords}</span>
            <span className="text-slate-600 text-sm">Öğrenilen Kelime</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-bold text-yellow-700 mb-1">{totalDueWords}</span>
            <span className="text-slate-600 text-sm">Tekrar Zamanı Gelen</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-bold text-emerald-700 mb-1">{totalReviews}</span>
            <span className="text-slate-600 text-sm">Toplam Tekrar</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-bold text-blue-700 mb-1">{totalReviews > 0 ? Math.round((totalCorrectReviews / totalReviews) * 100) : 0}%</span>
            <span className="text-slate-600 text-sm">Başarı Oranı</span>
          </div>
        </div>
        {/* Streak ve rozet kutuları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-orange-100 border border-orange-300 text-orange-800 rounded-lg px-6 py-4 flex flex-col items-center">
            <span className="font-semibold text-lg">Seri</span>
            <span className="text-2xl font-bold">{streak} gün</span>
            {lastReviewDate && <span className="text-xs text-orange-600">Son tekrar: {lastReviewDate}</span>}
          </div>
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg px-6 py-4 flex flex-col items-center">
            <span className="font-semibold text-lg">Rozetler</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {badges.length === 0 && <span className="text-xs text-emerald-600">Henüz rozet yok</span>}
              {badges.map((badge, i) => (
                <span key={i} className="bg-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">{badge}</span>
              ))}
            </div>
          </div>
        </div>
        {/* Günlük hedef kutusu */}
        <div className="mb-6">
          <div className="bg-blue-100 border border-blue-300 text-blue-800 rounded-lg px-6 py-4 flex flex-col md:flex-row items-center gap-3">
            <span className="font-semibold">Günlük Hedef:</span>
            <span className="text-lg font-bold">{DAILY_GOAL} tekrar</span>
            <div className="flex-1 w-full md:w-auto">
              <div className="h-3 bg-blue-200 rounded-full overflow-hidden mt-2 md:mt-0">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((todayReviews / DAILY_GOAL) * 100))}%` }}
                ></div>
              </div>
            </div>
            <span className="ml-2">{todayReviews} / {DAILY_GOAL}</span>
            {todayReviews >= DAILY_GOAL && (
              <span className="ml-4 text-emerald-700 font-bold">Tebrikler! Hedefini tamamladın 🎉</span>
            )}
          </div>
        </div>
        {/* Günlük hedef tamamlandığında tebrik kutusu/animasyonu */}
        {showCongratsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md mx-auto animate-bounce">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Tebrikler!</h2>
              <p className="text-slate-600 mb-6">Günlük hedefini tamamladın veya yeni bir rozet kazandın!</p>
              <button
                onClick={() => setShowCongratsModal(false)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="bg-purple-100 p-2 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </span>
            <h1 className="text-2xl font-bold text-slate-800">Kelime Grupları</h1>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div 
              key={group.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => router.push(`/student-panel/vocabulary/groups/${group.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">{group.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{group.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(group.level)}`}>
                    {getLevelText(group.level)}
                  </span>
                </div>
                {dueWordsByGroup[group.id] > 0 && (
                  <div className="mb-2">
                    <span className="inline-block bg-yellow-200 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">
                      {dueWordsByGroup[group.id]} tekrar zamanı gelen kelime
                    </span>
                  </div>
                )}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {group.wordCount} Kelime
                    </span>
                    {group.lastStudied && (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(group.lastStudied).toLocaleDateString()}
                    </span>
                  )}
                  </div>
                  
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${group.progress || 0}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      İlerleme: {group.progress || 0}%
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
          </div>
          ))}
        </div>
        
        {wordGroups.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">Henüz kelime grubu yok</h3>
              <p className="text-slate-600 mb-4">Yeni kelime grupları eklendiğinde burada görünecek.</p>
            </div>
        </div>
        )}
      </div>
    </div>
  );
} 