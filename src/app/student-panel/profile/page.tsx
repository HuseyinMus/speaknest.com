"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { FiEdit2, FiMail, FiUser, FiCalendar, FiAward, FiX, FiTwitter, FiGithub, FiLinkedin, FiCamera, FiLock, FiStar, FiTrendingUp, FiTarget, FiCheckCircle, FiArrowRight } from "react-icons/fi";
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
      if (learned >= 10) badgeArr.push({ name: "10 Kelime Öğrendi", icon: "📚", color: "from-emerald-400 to-teal-500" });
      if (learned >= 50) badgeArr.push({ name: "50 Kelime Öğrendi", icon: "🎓", color: "from-blue-400 to-indigo-500" });
      if (reviews >= 100) badgeArr.push({ name: "100 Tekrar Yaptı", icon: "🔄", color: "from-purple-400 to-pink-500" });
      if (streakVal >= 3) badgeArr.push({ name: "3 Gün Seri", icon: "🔥", color: "from-orange-400 to-red-500" });
      if (streakVal >= 7) badgeArr.push({ name: "7 Gün Seri", icon: "⚡", color: "from-yellow-400 to-orange-500" });
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
        <div className="relative">
          <div className="w-12 h-12 border-4 border-emerald-200 rounded-full animate-spin"></div>
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center mb-4">
          <FiUser size={32} className="text-emerald-500" />
        </div>
        <div className="text-lg font-medium">Kullanıcı bilgileri bulunamadı.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="relative mb-8">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200 to-transparent rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-gradient-to-tl from-blue-200 to-transparent rounded-full opacity-20 animate-pulse delay-500"></div>
          </div>
          
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 border border-slate-100/50">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Profile Photo Section */}
              <div className="relative group">
                <div className="relative">
                  <img
                    src={profile.photoURL || "/default-avatar.png"}
                    alt="Profil Fotoğrafı"
                    className="w-40 h-40 rounded-3xl object-cover border-4 border-white shadow-2xl group-hover:scale-105 transition-all duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"></div>
                  
                  {/* Edit Photo Button */}
                  <button 
                    onClick={() => document.getElementById('photo-upload').click()} 
                    className="absolute bottom-4 right-4 p-3 rounded-2xl bg-white/90 backdrop-blur-sm text-emerald-600 shadow-lg hover:bg-white hover:scale-110 transition-all duration-300"
                    title="Fotoğraf Değiştir"
                  >
                    <FiCamera size={20} />
                  </button>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={photoUploading}
                  />
                </div>
                
                {/* Upload Status */}
                {photoUploading && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                    Yükleniyor...
                  </div>
                )}
              </div>

              {/* Profile Info Section */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-2">
                    {profile.displayName || profile.firstName || user.email}
                  </h1>
                  <p className="text-slate-600 text-lg">{profile.bio || "SpeakNest öğrencisi"}</p>
                </div>

                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <FiMail className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-500">E-posta</p>
                      <p className="font-medium text-slate-800">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <FiAward className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-500">Seviye</p>
                      <p className="font-medium text-slate-800">{profile.englishLevel || "Belirtilmemiş"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <FiUser className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-500">Rol</p>
                      <p className="font-medium text-slate-800">{profile.role || "Öğrenci"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-emerald-50 rounded-2xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <FiCalendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-500">Kayıt Tarihi</p>
                      <p className="font-medium text-slate-800">
                        {profile.createdAt?.seconds 
                          ? new Date(profile.createdAt.seconds * 1000).toLocaleDateString("tr-TR")
                          : "Belirtilmemiş"
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => setEditOpen(true)} 
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <FiEdit2 size={18} />
                    Profili Düzenle
                  </button>
                  
                  <button 
                    onClick={() => setPwModal(true)} 
                    className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <FiLock size={18} />
                    Şifre Değiştir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Statistics Cards */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-100/50">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-6 flex items-center gap-3">
              <FiTrendingUp className="w-6 h-6 text-emerald-500" />
              İstatistikler
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiTarget className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-700 mb-1">{stats.learned}</h3>
                <p className="text-sm text-emerald-600 font-medium">Öğrenilen Kelime</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiCheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-blue-700 mb-1">{stats.reviews}</h3>
                <p className="text-sm text-blue-600 font-medium">Toplam Tekrar</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FiStar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-orange-700 mb-1">{stats.streak}</h3>
                <p className="text-sm text-orange-600 font-medium">Günlük Seri</p>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-100/50">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-6 flex items-center gap-3">
              <FiAward className="w-6 h-6 text-emerald-500" />
              Rozetler
            </h2>
            
            {badges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {badges.map((badge, i) => (
                  <div key={i} className={`p-4 bg-gradient-to-r ${badge.color} rounded-2xl text-white shadow-lg transform hover:scale-105 transition-all duration-300`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{badge.name}</p>
                        <p className="text-xs opacity-90">Başarıyla kazanıldı!</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiAward className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Henüz rozet kazanmadınız</p>
                <p className="text-slate-400 text-sm mt-1">Daha fazla çalışarak rozetler kazanın!</p>
              </div>
            )}
          </div>
        </div>

        {/* Social Links Section */}
        {(profile.twitter || profile.github || profile.linkedin) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-100/50 mb-8">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-6">
              Sosyal Medya
            </h2>
            
            <div className="flex flex-wrap gap-4">
              {profile.twitter && (
                <a 
                  href={`https://${profile.twitter.replace(/^https?:\/\//, "")}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <FiTwitter className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Twitter</p>
                    <p className="text-sm text-slate-600">{profile.twitter}</p>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                </a>
              )}
              
              {profile.github && (
                <a 
                  href={`https://${profile.github.replace(/^https?:\/\//, "")}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-slate-100 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center">
                    <FiGithub className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">GitHub</p>
                    <p className="text-sm text-slate-600">{profile.github}</p>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                </a>
              )}
              
              {profile.linkedin && (
                <a 
                  href={`https://${profile.linkedin.replace(/^https?:\/\//, "")}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <FiLinkedin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">LinkedIn</p>
                    <p className="text-sm text-slate-600">{profile.linkedin}</p>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {editOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl mx-4 relative animate-fade-in max-h-[90vh] overflow-y-auto">
              <button 
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors" 
                onClick={() => setEditOpen(false)}
              >
                <FiX size={20} />
              </button>
              
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-6">
                Profili Düzenle
              </h2>
              
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
              }} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Ad Soyad</span>
                    <input 
                      type="text" 
                      className="px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      required 
                    />
                  </label>
                  
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Seviye</span>
                    <input 
                      type="text" 
                      className="px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300" 
                      value={editLevel} 
                      onChange={e => setEditLevel(e.target.value)} 
                      placeholder="(ör: Beginner, Intermediate, Advanced)" 
                    />
                  </label>
                </div>
                
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-700">Biyografi</span>
                  <textarea 
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300 min-h-[100px] resize-none" 
                    value={editBio} 
                    onChange={e => setEditBio(e.target.value)} 
                    placeholder="Kendini kısaca tanıt..." 
                  />
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Twitter</span>
                    <input 
                      type="text" 
                      className="px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300" 
                      value={editTwitter} 
                      onChange={e => setEditTwitter(e.target.value)} 
                      placeholder="twitter.com/kullanici" 
                    />
                  </label>
                  
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">GitHub</span>
                    <input 
                      type="text" 
                      className="px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300" 
                      value={editGithub} 
                      onChange={e => setEditGithub(e.target.value)} 
                      placeholder="github.com/kullanici" 
                    />
                  </label>
                  
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">LinkedIn</span>
                    <input 
                      type="text" 
                      className="px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300" 
                      value={editLinkedin} 
                      onChange={e => setEditLinkedin(e.target.value)} 
                      placeholder="linkedin.com/in/kullanici" 
                    />
                  </label>
                </div>
                
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-700">Profil Fotoğrafı</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all duration-300" 
                    onChange={handlePhotoUpload} 
                    disabled={photoUploading} 
                  />
                  {photoUploading && <span className="text-sm text-emerald-600 font-medium">Yükleniyor...</span>}
                  {profile.photoURL && (
                    <img 
                      src={profile.photoURL} 
                      alt="Profil" 
                      className="w-20 h-20 rounded-xl border-2 border-emerald-200 object-cover mt-2" 
                    />
                  )}
                </label>
                
                {successMsg && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl text-emerald-700 font-medium">
                    {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl text-red-700 font-medium">
                    {errorMsg}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:transform-none" 
                  disabled={saving}
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {pwModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 relative animate-fade-in">
              <button 
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors" 
                onClick={() => setPwModal(false)}
              >
                <FiX size={20} />
              </button>
              
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-6">
                Şifre Değiştir
              </h2>
              
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
              }} className="space-y-6">
                
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-700">Mevcut Şifre</span>
                  <input 
                    type="password" 
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300" 
                    value={currentPw} 
                    onChange={e => setCurrentPw(e.target.value)} 
                    required 
                  />
                </label>
                
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-slate-700">Yeni Şifre</span>
                  <input 
                    type="password" 
                    className="px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300" 
                    value={newPw} 
                    onChange={e => setNewPw(e.target.value)} 
                    required 
                    minLength={6} 
                  />
                </label>
                
                {pwSuccess && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl text-emerald-700 font-medium">
                    {pwSuccess}
                  </div>
                )}
                {pwError && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl text-red-700 font-medium">
                    {pwError}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:transform-none" 
                  disabled={pwLoading}
                >
                  {pwLoading ? "Kaydediliyor..." : "Şifreyi Değiştir"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 