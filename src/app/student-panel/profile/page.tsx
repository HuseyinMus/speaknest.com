"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { FiEdit2, FiMail, FiUser, FiCalendar, FiAward, FiX, FiTwitter, FiGithub, FiLinkedin } from "react-icons/fi";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";

export default function StudentProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [editPhoto, setEditPhoto] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [editTwitter, setEditTwitter] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [stats, setStats] = useState({ learned: 0, reviews: 0, streak: 0 });
  const [badges, setBadges] = useState([]);
  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        setProfile(userDoc.exists() ? userDoc.data() : null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (profile) {
      setEditName(profile.displayName || "");
      setEditLevel(profile.englishLevel || "");
      setEditBio(profile.bio || "");
      setEditTwitter(profile.twitter || "");
      setEditGithub(profile.github || "");
      setEditLinkedin(profile.linkedin || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    async function fetchStats() {
      const q = query(collection(db, "wordLearningStatus"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
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
    }
    fetchStats();
  }, [user]);

  // Fotoğraf yükleme fonksiyonu
  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file || !user) return;
    setPhotoUploading(true);
    setErrorMsg("");
    try {
      const storage = getStorage();
      const fileRef = storageRef(storage, `profile-photos/${user.uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      setProfile((prev) => ({ ...prev, photoURL: url }));
      setSuccessMsg("Profil fotoğrafı güncellendi!");
    } catch (err) {
      setErrorMsg("Fotoğraf yüklenirken hata oluştu.");
    }
    setPhotoUploading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-t-emerald-500 border-emerald-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <FiUser size={48} className="mb-4" />
        <div>Kullanıcı bilgileri bulunamadı.</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white/80 rounded-3xl shadow-xl p-6 md:p-10 flex flex-col items-center gap-6">
        <div className="relative">
          <img
            src={profile.photoURL || "/default-avatar.png"}
            alt="Profil Fotoğrafı"
            className="w-32 h-32 rounded-2xl object-cover border-4 border-emerald-200 shadow-lg"
          />
          <button onClick={() => setEditOpen(true)} className="absolute bottom-2 right-2 p-2 rounded-full bg-emerald-500 text-white shadow hover:bg-emerald-600 transition-colors" title="Profili Düzenle"><FiEdit2 size={18} /></button>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-emerald-700">{profile.displayName || profile.firstName || user.email}</h1>
          <div className="flex flex-col items-center gap-1 mt-2 text-slate-600 text-sm">
            <span className="flex items-center gap-2"><FiMail /> {user.email}</span>
            {profile.englishLevel && <span className="flex items-center gap-2"><FiAward /> Seviye: {profile.englishLevel}</span>}
            <span className="flex items-center gap-2"><FiUser /> Rol: {profile.role || "Öğrenci"}</span>
            {profile.createdAt?.seconds && (
              <span className="flex items-center gap-2"><FiCalendar /> Kayıt: {new Date(profile.createdAt.seconds * 1000).toLocaleDateString("tr-TR")}</span>
            )}
          </div>
        </div>
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
              <button className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200" onClick={() => setEditOpen(false)}><FiX size={20} /></button>
              <h2 className="text-xl font-bold text-emerald-700 mb-4">Profili Düzenle</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                setErrorMsg("");
                setSuccessMsg("");
                try {
                  await updateDoc(doc(db, "users", user.uid), {
                    displayName: editName,
                    englishLevel: editLevel,
                    bio: editBio,
                    twitter: editTwitter,
                    github: editGithub,
                    linkedin: editLinkedin,
                  });
                  setSuccessMsg("Profil başarıyla güncellendi!");
                  setProfile({ ...profile, displayName: editName, englishLevel: editLevel, bio: editBio, twitter: editTwitter, github: editGithub, linkedin: editLinkedin });
                  setTimeout(() => setEditOpen(false), 1200);
                } catch (err) {
                  setErrorMsg("Bir hata oluştu. Lütfen tekrar deneyin.");
                }
                setSaving(false);
              }} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-700">Ad Soyad</span>
                  <input type="text" className="input input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none" value={editName} onChange={e => setEditName(e.target.value)} required />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-700">Seviye</span>
                  <input type="text" className="input input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none" value={editLevel} onChange={e => setEditLevel(e.target.value)} placeholder="(ör: Beginner, Intermediate, Advanced)" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-700">Biyografi</span>
                  <textarea className="input input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none min-h-[60px]" value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Kendini kısaca tanıt..." />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-700">Twitter</span>
                  <input type="text" className="input input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none" value={editTwitter} onChange={e => setEditTwitter(e.target.value)} placeholder="twitter.com/kullanici" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-700">GitHub</span>
                  <input type="text" className="input input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none" value={editGithub} onChange={e => setEditGithub(e.target.value)} placeholder="github.com/kullanici" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-700">LinkedIn</span>
                  <input type="text" className="input input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none" value={editLinkedin} onChange={e => setEditLinkedin(e.target.value)} placeholder="linkedin.com/in/kullanici" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-700">Profil Fotoğrafı</span>
                  <input type="file" accept="image/*" className="file-input file-input-bordered rounded-lg px-3 py-2 border border-emerald-200 focus:border-emerald-500 outline-none" onChange={handlePhotoUpload} disabled={photoUploading} />
                  {photoUploading && <span className="text-xs text-emerald-600">Yükleniyor...</span>}
                  {profile.photoURL && <img src={profile.photoURL} alt="Profil" className="w-16 h-16 rounded-xl mt-2 border border-emerald-200 object-cover" />}
                </label>
                {successMsg && <div className="text-green-600 text-sm font-medium">{successMsg}</div>}
                {errorMsg && <div className="text-red-600 text-sm font-medium">{errorMsg}</div>}
                <button type="submit" className="mt-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow hover:shadow-emerald-200/50 transition-all duration-200 flex items-center gap-2 disabled:opacity-60" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</button>
              </form>
            </div>
          </div>
        )}
        {(profile.twitter || profile.github || profile.linkedin) && (
          <div className="flex justify-center gap-4 mt-4">
            {profile.twitter && (
              <a href={`https://${profile.twitter.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"><FiTwitter size={20} /></a>
            )}
            {profile.github && (
              <a href={`https://${profile.github.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"><FiGithub size={20} /></a>
            )}
            {profile.linkedin && (
              <a href={`https://${profile.linkedin.replace(/^https?:\/\//, "")}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"><FiLinkedin size={20} /></a>
            )}
          </div>
        )}
        <div className="w-full bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 border border-emerald-100 rounded-2xl shadow p-4 flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-emerald-700 font-bold text-lg">Öğrenilen Kelime</span>
            <span className="text-2xl font-extrabold text-emerald-600">{stats.learned}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-blue-700 font-bold text-lg">Toplam Tekrar</span>
            <span className="text-2xl font-extrabold text-blue-600">{stats.reviews}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-yellow-700 font-bold text-lg">Streak</span>
            <span className="text-2xl font-extrabold text-yellow-600">{stats.streak} gün</span>
          </div>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
              {badges.map((badge, i) => (
                <span key={i} className="bg-gradient-to-r from-emerald-400 to-blue-400 text-white px-3 py-1 rounded-full text-xs font-semibold shadow">🏅 {badge}</span>
              ))}
            </div>
          )}
        </div>
        <button className="mt-4 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl shadow hover:shadow-emerald-200/50 transition-all duration-200 flex items-center gap-2" onClick={() => setPwModal(true)}>
          Şifre Değiştir
        </button>
        {pwModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
              <button className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200" onClick={() => setPwModal(false)}><FiX size={20} /></button>
              <h2 className="text-xl font-bold text-emerald-700 mb-4">Şifre Değiştir</h2>
              <form onSubmit={async (e) => {
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
              }} className="flex flex-col gap-4">
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
      </div>
    </div>
  );
} 