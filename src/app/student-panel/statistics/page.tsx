"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
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

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-emerald-700 mb-4">İstatistikler</h1>
      <p className="text-slate-600 text-sm mb-8">Öğrenme yolculuğundaki ilerlemeni burada detaylı görebilirsin.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white/80 rounded-2xl shadow p-6 flex flex-col items-center border border-emerald-100">
          <span className="text-emerald-700 font-bold text-base">Öğrenilen Kelime</span>
          <span className="text-2xl font-extrabold text-emerald-600">{loading ? '...' : stats.learned}</span>
        </div>
        <div className="bg-white/80 rounded-2xl shadow p-6 flex flex-col items-center border border-blue-100">
          <span className="text-blue-700 font-bold text-base">Toplam Tekrar</span>
          <span className="text-2xl font-extrabold text-blue-600">{loading ? '...' : stats.reviews}</span>
        </div>
        <div className="bg-white/80 rounded-2xl shadow p-6 flex flex-col items-center border border-yellow-100">
          <span className="text-yellow-700 font-bold text-base">Streak</span>
          <span className="text-2xl font-extrabold text-yellow-600">{loading ? '...' : stats.streak} gün</span>
        </div>
      </div>
      <div className="bg-white/80 rounded-2xl shadow p-6 border border-emerald-100 mb-10">
        <h2 className="text-lg font-semibold text-emerald-700 mb-4">Son 7 Günlük İlerleme</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => value + ' adet'} />
            <Legend />
            <Line type="monotone" dataKey="reviews" name="Tekrar" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} />
            <Line type="monotone" dataKey="learned" name="Öğrenilen Kelime" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Haftanın günlerine göre bar grafik */}
      <div className="bg-white/80 rounded-2xl shadow p-6 border border-blue-100 mb-10">
        <h2 className="text-lg font-semibold text-blue-700 mb-4">Haftanın Günlerine Göre Aktivite</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(value) => value + ' adet'} />
            <Legend />
            <Bar dataKey="reviews" name="Tekrar" fill="#06b6d4" />
            <Bar dataKey="learned" name="Öğrenilen Kelime" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* En çok tekrar edilen kelimeler tablosu */}
      <div className="bg-white/80 rounded-2xl shadow p-6 border border-purple-100 mb-10">
        <h2 className="text-lg font-semibold text-purple-700 mb-4">En Çok Tekrar Edilen 5 Kelime</h2>
        {topWords.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-3 text-slate-700 font-semibold">Kelime</th>
                <th className="py-2 px-3 text-slate-700 font-semibold">Tekrar Sayısı</th>
              </tr>
            </thead>
            <tbody>
              {topWords.map((item, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-2 px-3">{item.word}</td>
                  <td className="py-2 px-3">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-slate-500 text-sm">Yeterli veri yok.</div>
        )}
      </div>
      {/* Toplantı Katılımı Kutusu */}
      <div className="bg-white/80 rounded-2xl shadow p-6 border border-pink-100 mb-10">
        <h2 className="text-lg font-semibold text-pink-700 mb-4">Toplantı Katılımı</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="text-2xl font-bold text-pink-600">Toplam Katıldığı Toplantı: {meetingStats.total}</div>
        </div>
        <div className="mb-6">
          <h3 className="text-base font-semibold text-pink-700 mb-2">Son 5 Toplantı</h3>
          {meetingStats.last5.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2 px-3 text-slate-700 font-semibold">Başlık</th>
                  <th className="py-2 px-3 text-slate-700 font-semibold">Tarih</th>
                  <th className="py-2 px-3 text-slate-700 font-semibold">Seviye</th>
                </tr>
              </thead>
              <tbody>
                {meetingStats.last5.map((m, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-2 px-3">{m.meetingTitle}</td>
                    <td className="py-2 px-3">{m.startTime.toLocaleDateString('tr-TR')}</td>
                    <td className="py-2 px-3 capitalize">{m.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-slate-500 text-sm">Toplantı kaydın yok.</div>
          )}
        </div>
        <div>
          <h3 className="text-base font-semibold text-pink-700 mb-2">Son 30 Günlük Katılım</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={meetingStats.daily} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => value + ' toplantı'} />
              <Bar dataKey="count" name="Katılım" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 