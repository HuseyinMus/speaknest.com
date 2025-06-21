"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query as fsQuery, where, getDocs, orderBy } from 'firebase/firestore';

function getLast7Days() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function StatisticsPage() {
  const [stats, setStats] = useState({ learned: 0, reviews: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [topWords, setTopWords] = useState([]);
  const [meetingStats, setMeetingStats] = useState({ total: 0, last5: [], daily: [] });
  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    async function fetchStats() {
      setLoading(true);
      try {
        const q = await import("firebase/firestore").then(m => m.query(m.collection(db, "wordLearningStatus"), m.where("userId", "==", user.uid)));
        const snap = await import("firebase/firestore").then(m => m.getDocs(q));
        let learned = 0, reviews = 0;
        // Grafik için günlük veriler
        const last7 = getLast7Days();
        const daily = last7.map(date => ({ date, learned: 0, reviews: 0 }));
        // Haftanın günlerine göre tekrar/öğrenme
        const weekDays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
        const weekStats = Array(7).fill(0).map((_, i) => ({ day: weekDays[i], reviews: 0, learned: 0 }));
        // En çok tekrar edilen kelimeler
        const wordCounts = {};
        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          // Öğrenilen kelime
          if ((data.consecutiveCorrectReviews || 0) >= 2) learned++;
          // Günlük tekrar ve öğrenilen kelime
          if (typeof data.lastReviewed === "object" && data.lastReviewed.toDate) {
            reviews++;
            const reviewedDate = data.lastReviewed.toDate();
            const reviewedStr = reviewedDate.toISOString().slice(0, 10);
            const idx = daily.findIndex(d => d.date === reviewedStr);
            if (idx !== -1) {
              daily[idx].reviews++;
              if ((data.consecutiveCorrectReviews || 0) >= 2) daily[idx].learned++;
            }
            const dayIdx = reviewedDate.getDay(); // 0: Pazar, 1: Pazartesi ...
            const weekIdx = dayIdx === 0 ? 6 : dayIdx - 1; // Haftanın başı Pazartesi olsun
            weekStats[weekIdx].reviews++;
            if ((data.consecutiveCorrectReviews || 0) >= 2) weekStats[weekIdx].learned++;
            // En çok tekrar edilen kelime
            if (data.word) {
              wordCounts[data.word] = (wordCounts[data.word] || 0) + 1;
            }
          }
        }
        // Streak localStorage'dan
        let streakVal = 0;
        try {
          const streakData = JSON.parse(localStorage.getItem(`streak_${user.uid}`) || '{"count":0}');
          streakVal = streakData.count || 0;
        } catch {}
        setStats({ learned, reviews, streak: streakVal });
        setChartData(daily);
        // Haftanın günlerine göre tekrar/öğrenme
        setWeeklyData(weekStats);
        // En çok tekrar edilen 5 kelime
        const top5 = Object.entries(wordCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([word, count]) => ({ word, count }));
        setTopWords(top5);
        // Toplantı istatistikleri
        const userMeetingsRef = collection(db, 'user_meetings');
        const meetingQ = fsQuery(
          userMeetingsRef,
          where('userId', '==', user.uid),
          where('status', '==', 'registered'),
          orderBy('startTime', 'desc')
        );
        const querySnapshot = await getDocs(meetingQ);
        const meetingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime.toDate(),
          registeredAt: doc.data().registeredAt.toDate()
        }));
        // Toplam katılım
        const total = meetingsData.length;
        // Son 5 toplantı
        const last5 = meetingsData.slice(0, 5);
        // Son 30 gün için günlük katılım
        const now = new Date();
        const last30 = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          last30.push({ date: dateStr, count: 0 });
        }
        meetingsData.forEach(m => {
          const dateStr = m.startTime.toISOString().slice(0, 10);
          const idx = last30.findIndex(d => d.date === dateStr);
          if (idx !== -1) last30[idx].count++;
        });
        setMeetingStats({ total, last5, daily: last30 });
      } catch {}
      setLoading(false);
    }
    fetchStats();
  }, []);

  // Grafik renkleri
  const colors = {
    primary: '#10b981',
    secondary: '#06b6d4',
    accent: '#8b5cf6',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  // Tarih formatı
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  // İlerleme hesaplama
  const calculateProgress = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Basit grafik componenti
  const SimpleLineChart = ({ data, height = 300 }) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.reviews, d.learned)), 1);
    const width = 600;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // SVG path için noktaları hesapla
    const getPoints = (dataKey) => {
      return data.map((item, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = height - padding - (item[dataKey] / maxValue) * chartHeight;
        return { x, y, value: item[dataKey] };
      });
    };
    
    const reviewsPoints = getPoints('reviews');
    const learnedPoints = getPoints('learned');
    
    // SVG path string oluştur
    const createPath = (points) => {
      if (points.length === 0) return '';
      return points.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      ).join(' ');
    };
    
    return (
      <div className="relative" style={{ height, width: '100%' }}>
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width={chartWidth / 6} height={chartHeight / 4} patternUnits="userSpaceOnUse">
              <path d={`M ${chartWidth / 6} 0 L 0 0 0 ${chartHeight / 4}`} fill="none" stroke="#e2e8f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="url(#grid)" x={padding} y={padding}/>
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <text
              key={index}
              x={padding - 10}
              y={height - padding - ratio * chartHeight}
              textAnchor="end"
              fontSize="12"
              fill="#64748b"
              alignmentBaseline="middle"
            >
              {Math.round(ratio * maxValue)}
            </text>
          ))}
          
          {/* X-axis labels */}
          {data.map((item, index) => (
            <text
              key={index}
              x={padding + (index / (data.length - 1)) * chartWidth}
              y={height - padding + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#64748b"
            >
              {formatDate(item.date)}
            </text>
          ))}
          
          {/* Reviews line */}
          <path
            d={createPath(reviewsPoints)}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Learned line */}
          <path
            d={createPath(learnedPoints)}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {reviewsPoints.map((point, index) => (
            <circle
              key={`reviews-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#06b6d4"
              stroke="white"
              strokeWidth="2"
            />
          ))}
          
          {learnedPoints.map((point, index) => (
            <circle
              key={`learned-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </svg>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
            <span className="text-sm text-slate-600">Öğrenilen Kelime</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-slate-600">Tekrar</span>
          </div>
        </div>
      </div>
    );
  };

  // Basit bar chart componenti
  const SimpleBarChart = ({ data, height = 300 }) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.reviews, d.learned)), 1);
    
    return (
      <div className="relative" style={{ height }}>
        <div className="absolute inset-0 flex items-end justify-between px-4 pb-8">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="flex items-end gap-2 mb-2">
                <div 
                  className="w-6 bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t"
                  style={{ height: `${(item.learned / maxValue) * (height - 80)}px` }}
                ></div>
                <div 
                  className="w-6 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                  style={{ height: `${(item.reviews / maxValue) * (height - 80)}px` }}
                ></div>
              </div>
              <span className="text-xs text-slate-600">{item.day}</span>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 px-4">
          <span>0</span>
          <span>{Math.ceil(maxValue / 2)}</span>
          <span>{maxValue}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-10 px-4">
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
              İstatistikler
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-4">
              Öğrenme İstatistikleri
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Öğrenme yolculuğundaki ilerlemeni detaylı grafikler ve analizlerle takip et
            </p>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-emerald-100/50 hover:shadow-3xl transition-all duration-500 ease-out transform group-hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎯</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-600 text-sm">
                    <span>↗</span>
                    <span>+12%</span>
                  </div>
                  <span className="text-slate-500 text-xs">Bu hafta</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-emerald-700 mb-2">
                {loading ? '...' : stats.learned}
              </h3>
              <p className="text-emerald-600 font-medium">Öğrenilen Kelime</p>
              <div className="mt-4 w-full bg-emerald-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((stats.learned / 100) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-blue-100/50 hover:shadow-3xl transition-all duration-500 ease-out transform group-hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📊</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-blue-600 text-sm">
                    <span>↗</span>
                    <span>+8%</span>
                  </div>
                  <span className="text-slate-500 text-xs">Bu hafta</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-blue-700 mb-2">
                {loading ? '...' : stats.reviews}
              </h3>
              <p className="text-blue-600 font-medium">Toplam Tekrar</p>
              <div className="mt-4 w-full bg-blue-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((stats.reviews / 500) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-orange-100/50 hover:shadow-3xl transition-all duration-500 ease-out transform group-hover:-translate-y-2">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">⭐</span>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-orange-600 text-sm">
                    <span>↗</span>
                    <span>+3</span>
                  </div>
                  <span className="text-slate-500 text-xs">Bu hafta</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-orange-700 mb-2">
                {loading ? '...' : stats.streak}
              </h3>
              <p className="text-orange-600 font-medium">Günlük Seri</p>
              <div className="mt-4 w-full bg-orange-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((stats.streak / 30) * 100, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Line Chart - Son 7 Günlük İlerleme */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-emerald-100/50 hover:shadow-3xl transition-all duration-500 ease-out">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">📈</span>
                  </div>
                  <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600">
                    Son 7 Günlük İlerleme
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedPeriod('7days')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedPeriod === '7days' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    7 Gün
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <SimpleLineChart data={chartData} height={300} />
              </div>
            </div>
          </div>

          {/* Bar Chart - Haftalık Aktivite */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-blue-100/50 hover:shadow-3xl transition-all duration-500 ease-out">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">📊</span>
                </div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600">
                  Haftalık Aktivite
                </h2>
              </div>
              
              <div className="relative">
                <SimpleBarChart data={weeklyData} height={300} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Words Table */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-purple-100/50 hover:shadow-3xl transition-all duration-500 ease-out">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">🏆</span>
                </div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-purple-600 to-pink-600">
                  En Çok Tekrar Edilen Kelimeler
                </h2>
              </div>
              
              {topWords.length > 0 ? (
                <div className="space-y-4">
                  {topWords.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100 hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{item.word}</p>
                          <p className="text-sm text-slate-600">{item.count} tekrar</p>
                        </div>
                      </div>
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <p className="text-slate-500 font-medium">Henüz yeterli veri yok</p>
                  <p className="text-slate-400 text-sm mt-1">Daha fazla kelime tekrarı yaparak istatistiklerini gör</p>
                </div>
              )}
            </div>
          </div>

          {/* Meeting Statistics */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-pink-100/50 hover:shadow-3xl transition-all duration-500 ease-out">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">👥</span>
                </div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-pink-600 to-rose-600">
                  Toplantı Katılımı
                </h2>
              </div>
              
              <div className="mb-6">
                <div className="text-center p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-100">
                  <h3 className="text-3xl font-bold text-pink-600 mb-2">{meetingStats.total}</h3>
                  <p className="text-pink-600 font-medium">Toplam Katıldığı Toplantı</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-pink-700 mb-4">Son 5 Toplantı</h3>
                {meetingStats.last5.length > 0 ? (
                  <div className="space-y-3">
                    {meetingStats.last5.map((m, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-100">
                        <div>
                          <p className="font-semibold text-slate-800">{m.meetingTitle}</p>
                          <p className="text-sm text-slate-600">{m.startTime.toLocaleDateString('tr-TR')}</p>
                        </div>
                        <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-semibold rounded-full capitalize">
                          {m.level}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">👥</span>
                    </div>
                    <p className="text-slate-500 text-sm">Henüz toplantı kaydın yok</p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-pink-700 mb-4">Son 30 Günlük Katılım</h3>
                <div className="h-48 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">📊</span>
                    </div>
                    <p className="text-slate-500 text-sm">Grafik verisi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 