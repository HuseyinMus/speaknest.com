"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword, deleteUser, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { FiX } from "react-icons/fi";

export default function SettingsPage() {
  // Şifre değiştirme state
  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");
  // Hesap silme state
  const [delModal, setDelModal] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [delLoading, setDelLoading] = useState(false);
  const [delError, setDelError] = useState("");
  const [delSuccess, setDelSuccess] = useState("");
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifApp, setNotifApp] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState("");
  const [notifError, setNotifError] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState("");
  const [infoError, setInfoError] = useState("");
  const [stats, setStats] = useState({ learned: 0, reviews: 0, streak: 0 });
  const [badges, setBadges] = useState([]);
  const [motivation, setMotivation] = useState("");

  const user = auth.currentUser;
  const isGoogleUser = user?.providerData?.[0]?.providerId === "google.com";

  useEffect(() => {
    if (!user) return;
    async function fetchNotif() {
      setNotifLoading(true);
      try {
        const userDoc = await import("firebase/firestore").then(m => m.getDoc(m.doc(db, "users", user.uid)));
        const data = userDoc.exists() ? userDoc.data() : {};
        setNotifEmail(!!data.notifEmail);
        setNotifApp(!!data.notifApp);
      } catch {}
      setNotifLoading(false);
    }
    fetchNotif();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    async function fetchInfo() {
      setInfoLoading(true);
      try {
        const userDoc = await import("firebase/firestore").then(m => m.getDoc(m.doc(db, "users", user.uid)));
        const data = userDoc.exists() ? userDoc.data() : {};
        setBirthDate(data.birthDate || "");
        setPhone(data.phone || "");
        setGender(data.gender || "");
      } catch {}
      setInfoLoading(false);
    }
    fetchInfo();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    async function fetchStats() {
      const q = await import("firebase/firestore").then(m => m.query(m.collection(db, "wordLearningStatus"), m.where("userId", "==", user.uid)));
      const snap = await import("firebase/firestore").then(m => m.getDocs(q));
      let learned = 0, reviews = 0, streak = 0;
      let today = 0;
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if ((data.consecutiveCorrectReviews || 0) >= 2) learned++;
        if (typeof data.lastReviewed === "object" && data.lastReviewed.toDate) {
          reviews++;
          const reviewedDate = data.lastReviewed.toDate();
          const reviewedStr = reviewedDate.toISOString().slice(0, 10);
          if (reviewedStr === todayStr) today++;
        }
      }
      // Streak localStorage'dan (dashboard ile uyumlu)
      let streakVal = 0;
      try {
        const streakData = JSON.parse(localStorage.getItem(`streak_${user.uid}`) || '{"count":0}');
        streakVal = streakData.count || 0;
      } catch {}
      setStats({ learned, reviews, streak: streakVal });
      // Rozetler
      const badgeArr = [];
      if (learned >= 10) badgeArr.push("10 Kelime Öğrendi");
      if (learned >= 50) badgeArr.push("50 Kelime Öğrendi");
      if (reviews >= 100) badgeArr.push("100 Tekrar Yaptı");
      if (streakVal >= 3) badgeArr.push("3 Gün Seri");
      if (streakVal >= 7) badgeArr.push("7 Gün Seri");
      setBadges(badgeArr);
      // Motive edici mesaj
      if (learned >= 50) setMotivation("Harika! 50'den fazla kelime öğrendin, bu büyük bir başarı!");
      else if (streakVal >= 7) setMotivation("7 gün üst üste çalıştın, mükemmel bir alışkanlık kazandın!");
      else if (reviews >= 100) setMotivation("100 tekrar yaptın, istikrarlı bir şekilde ilerliyorsun!");
      else if (learned >= 10) setMotivation("10 kelime öğrendin, devam et!");
      else setMotivation("Her gün küçük bir adım, büyük başarılar getirir. Devam et!");
    }
    fetchStats();
  }, [user]);

  async function handleNotifSave(e) {
    e.preventDefault();
    setNotifLoading(true);
    setNotifSuccess("");
    setNotifError("");
    try {
      await import("firebase/firestore").then(m => m.updateDoc(m.doc(db, "users", user.uid), {
        notifEmail,
        notifApp,
      }));
      setNotifSuccess("Bildirim tercihlerin kaydedildi.");
    } catch {
      setNotifError("Tercihler kaydedilemedi.");
    }
    setNotifLoading(false);
  }

  async function handleInfoSave(e) {
    e.preventDefault();
    setInfoLoading(true);
    setInfoSuccess("");
    setInfoError("");
    try {
      await import("firebase/firestore").then(m => m.updateDoc(m.doc(db, "users", user.uid), {
        birthDate,
        phone,
        gender,
      }));
      setInfoSuccess("Kişisel bilgiler kaydedildi.");
    } catch {
      setInfoError("Bilgiler kaydedilemedi.");
    }
    setInfoLoading(false);
  }

  // Şifre değiştirme fonksiyonu
  async function handlePwChange(e) {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    setPwSuccess("");
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      setPwSuccess("Şifre başarıyla değiştirildi!");
      setTimeout(() => setPwModal(false), 1200);
    } catch (err) {
      setPwError("Şifre değiştirilemedi. Mevcut şifrenizi doğru girdiğinizden emin olun ve yeni şifreniz en az 6 karakter olsun.");
    }
    setPwLoading(false);
  }

  // Hesap silme fonksiyonu
  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDelLoading(true);
    setDelError("");
    setDelSuccess("");
    try {
      const credential = EmailAuthProvider.credential(user.email, delPw);
      await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      setDelSuccess("Hesabınız silindi. Yönlendiriliyorsunuz...");
      setTimeout(() => { window.location.href = "/"; }, 1500);
    } catch (err) {
      setDelError("Hesap silinemedi. Şifrenizi doğru girdiğinizden emin olun.");
    }
    setDelLoading(false);
  }

  // Google ile re-auth ve silme
  async function handleGoogleDelete() {
    setDelLoading(true);
    setDelError("");
    setDelSuccess("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider); // re-auth
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      setDelSuccess("Hesabınız silindi. Yönlendiriliyorsunuz...");
      setTimeout(() => { window.location.href = "/"; }, 1500);
    } catch (err) {
      setDelError("Google ile tekrar giriş yapılamadı veya hesap silinemedi.");
    }
    setDelLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-emerald-700 mb-8">Ayarlar</h1>
      <div className="space-y-8">
        {/* Bildirim Ayarları */}
        <section className="bg-white/80 rounded-2xl shadow p-6 border border-emerald-100">
          <h2 className="text-lg font-semibold text-emerald-700 mb-2">Bildirim Ayarları</h2>
          <p className="text-slate-600 text-sm mb-2">E-posta ve uygulama içi bildirim tercihlerinizi buradan yönetebilirsiniz.</p>
          <form onSubmit={handleNotifSave} className="flex flex-col gap-4 mt-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={notifEmail} onChange={e => setNotifEmail(e.target.checked)} className="accent-emerald-500 w-5 h-5" />
              <span className="text-slate-700">E-posta ile bildirim almak istiyorum</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={notifApp} onChange={e => setNotifApp(e.target.checked)} className="accent-emerald-500 w-5 h-5" />
              <span className="text-slate-700">Uygulama içi bildirim almak istiyorum</span>
            </label>
            {notifSuccess && <div className="text-green-600 text-sm font-medium">{notifSuccess}</div>}
            {notifError && <div className="text-red-600 text-sm font-medium">{notifError}</div>}
            <button type="submit" className="mt-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow hover:shadow-emerald-200/50 transition-all duration-200 flex items-center gap-2 disabled:opacity-60" disabled={notifLoading}>{notifLoading ? "Kaydediliyor..." : "Kaydet"}</button>
          </form>
        </section>
        {/* Kişisel Bilgiler */}
        <section className="bg-white/80 rounded-2xl shadow p-6 border border-emerald-100">
          <h2 className="text-lg font-semibold text-emerald-700 mb-2">Kişisel Bilgiler</h2>
          <p className="text-slate-600 text-sm mb-2">Doğum tarihi, telefon, cinsiyet gibi isteğe bağlı bilgilerinizi güncelleyebilirsiniz.</p>
          <form onSubmit={handleInfoSave} className="flex flex-col gap-4 mt-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Doğum Tarihi</span>
              <input type="date" className="input input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Telefon</span>
              <input type="tel" className="input input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Cinsiyet</span>
              <select className="input input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Seçiniz</option>
                <option value="Erkek">Erkek</option>
                <option value="Kadın">Kadın</option>
                <option value="Diğer">Diğer</option>
              </select>
            </label>
            {infoSuccess && <div className="text-green-600 text-sm font-medium">{infoSuccess}</div>}
            {infoError && <div className="text-red-600 text-sm font-medium">{infoError}</div>}
            <button type="submit" className="mt-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow hover:shadow-emerald-200/50 transition-all duration-200 flex items-center gap-2 disabled:opacity-60" disabled={infoLoading}>{infoLoading ? "Kaydediliyor..." : "Kaydet"}</button>
          </form>
        </section>
        {/* Hesap Güvenliği */}
        <section className="bg-white/80 rounded-2xl shadow p-6 border border-emerald-100">
          <h2 className="text-lg font-semibold text-emerald-700 mb-2">Hesap Güvenliği</h2>
          <p className="text-slate-600 text-sm mb-2">Şifre değiştirme, hesap silme ve güvenlik ayarları.</p>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            {!isGoogleUser && (
              <button className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow hover:shadow-emerald-200/50 transition-all duration-200" onClick={() => setPwModal(true)}>
                Şifre Değiştir
              </button>
            )}
            {isGoogleUser && (
              <div className="px-5 py-2 bg-slate-100 text-slate-500 font-medium rounded-xl border border-slate-200 select-none cursor-not-allowed">
                Google ile giriş yaptığınız için şifre değiştiremezsiniz.
              </div>
            )}
            <button className="px-5 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium rounded-xl shadow hover:shadow-red-200/50 transition-all duration-200" onClick={() => setDelModal(true)}>
              Hesabımı Sil
            </button>
          </div>
          {/* Şifre Değiştir Modalı */}
          {pwModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
                <button className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200" onClick={() => setPwModal(false)}><FiX size={20} /></button>
                <h2 className="text-xl font-bold text-emerald-700 mb-4">Şifre Değiştir</h2>
                <form onSubmit={handlePwChange} className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-700">Mevcut Şifre</span>
                    <input type="password" className="input input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-700">Yeni Şifre</span>
                    <input type="password" className="input input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} />
                  </label>
                  {pwSuccess && <div className="text-green-600 text-sm font-medium">{pwSuccess}</div>}
                  {pwError && <div className="text-red-600 text-sm font-medium">{pwError}</div>}
                  <button type="submit" className="mt-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow hover:shadow-emerald-200/50 transition-all duration-200 flex items-center gap-2 disabled:opacity-60" disabled={pwLoading}>{pwLoading ? "Kaydediliyor..." : "Kaydet"}</button>
                </form>
              </div>
            </div>
          )}
          {/* Hesap Silme Modalı */}
          {delModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
                <button className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200" onClick={() => setDelModal(false)}><FiX size={20} /></button>
                <h2 className="text-xl font-bold text-red-600 mb-4">Hesabını Sil</h2>
                {isGoogleUser ? (
                  <>
                    <p className="text-slate-700 mb-3">Google ile giriş yaptığınız için hesabınızı silmek için Google ile tekrar giriş yapmanız gerekir.</p>
                    {delSuccess && <div className="text-green-600 text-sm font-medium">{delSuccess}</div>}
                    {delError && <div className="text-red-600 text-sm font-medium">{delError}</div>}
                    <button onClick={handleGoogleDelete} className="mt-2 px-5 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium rounded-xl shadow hover:shadow-red-200/50 transition-all duration-200 flex items-center gap-2 disabled:opacity-60" disabled={delLoading}>{delLoading ? "Siliniyor..." : "Google ile Hesabımı Sil"}</button>
                  </>
                ) : (
                  <form onSubmit={handleDeleteAccount} className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-700">Şifre</span>
                      <input type="password" className="input input-bordered rounded-lg px-3 py-2 border border-red-200 focus:border-red-500 outline-none" value={delPw} onChange={e => setDelPw(e.target.value)} required />
                    </label>
                    {delSuccess && <div className="text-green-600 text-sm font-medium">{delSuccess}</div>}
                    {delError && <div className="text-red-600 text-sm font-medium">{delError}</div>}
                    <button type="submit" className="mt-2 px-5 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white font-medium rounded-xl shadow hover:shadow-red-200/50 transition-all duration-200 flex items-center gap-2 disabled:opacity-60" disabled={delLoading}>{delLoading ? "Siliniyor..." : "Hesabımı Sil"}</button>
                  </form>
                )}
              </div>
            </div>
          )}
        </section>
        {/* Motivasyonel Mesajlar & Başarılar */}
        <section className="bg-white/80 rounded-2xl shadow p-6 border border-emerald-100">
          <h2 className="text-lg font-semibold text-emerald-700 mb-2">Motivasyonel Mesajlar & Başarılar</h2>
          <div className="w-full bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 border border-emerald-100 rounded-2xl shadow p-4 flex flex-col items-center gap-3 mt-4">
            <div className="text-lg font-bold text-emerald-700 mb-1">Başarıların</div>
            <div className="flex flex-wrap gap-6 justify-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-emerald-700 font-bold text-base">Öğrenilen Kelime</span>
                <span className="text-xl font-extrabold text-emerald-600">{stats.learned}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-blue-700 font-bold text-base">Toplam Tekrar</span>
                <span className="text-xl font-extrabold text-blue-600">{stats.reviews}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-yellow-700 font-bold text-base">Streak</span>
                <span className="text-xl font-extrabold text-yellow-600">{stats.streak} gün</span>
              </div>
            </div>
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {badges.map((badge, i) => (
                  <span key={i} className="bg-gradient-to-r from-emerald-400 to-blue-400 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">🏅 {badge}</span>
                ))}
              </div>
            )}
            <div className="mt-3 text-indigo-700 font-semibold text-base text-center">{motivation}</div>
          </div>
        </section>
      </div>
    </div>
  );
} 