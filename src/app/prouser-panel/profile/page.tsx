'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Camera, 
  Edit, 
  Save, 
  X,
  Calendar,
  Award,
  Star,
  MessageCircle,
  Users,
  Clock,
  Settings,
  Shield,
  Bell,
  Palette,
  Languages,
  Download,
  Share2,
  Heart,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';

interface UserProfile {
  uid: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  role: string;
  englishLevel: string;
  bio: string;
  location: string;
  phone: string;
  website: string;
  socialMedia: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  preferences: {
    language: string;
    theme: string;
    notifications: boolean;
    emailUpdates: boolean;
  };
  stats: {
    totalMeetings: number;
    totalParticipants: number;
    averageRating: number;
    totalHours: number;
    completedMeetings: number;
    cancelledMeetings: number;
  };
  createdAt: Date;
  lastLogin: Date;
}

const translations = {
  en: {
    profile: "Profile",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    personalInfo: "Personal Information",
    contactInfo: "Contact Information",
    preferences: "Preferences",
    statistics: "Statistics",
    bio: "Bio",
    location: "Location",
    phone: "Phone",
    website: "Website",
    language: "Language",
    theme: "Theme",
    notifications: "Notifications",
    emailUpdates: "Email Updates",
    socialMedia: "Social Media",
    twitter: "Twitter",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    totalMeetings: "Total Meetings",
    totalParticipants: "Total Participants",
    averageRating: "Average Rating",
    totalHours: "Total Hours",
    completedMeetings: "Completed Meetings",
    cancelledMeetings: "Cancelled Meetings",
    memberSince: "Member Since",
    lastLogin: "Last Login",
    englishLevel: "English Level",
    role: "Role",
    conversationHost: "Conversation Host",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert",
    light: "Light",
    dark: "Dark",
    system: "System",
    // Placeholders
    bioPlaceholder: "Tell us about yourself...",
    locationPlaceholder: "Where are you located?",
    phonePlaceholder: "Your phone number",
    websitePlaceholder: "Your website",
    twitterPlaceholder: "@username",
    linkedinPlaceholder: "linkedin.com/in/username",
    instagramPlaceholder: "@username",
    // Messages
    profileUpdated: "Profile updated successfully!",
    errorUpdating: "Error updating profile",
    loading: "Loading profile...",
    error: "Error loading profile",
  },
  tr: {
    profile: "Profil",
    editProfile: "Profili Düzenle",
    saveChanges: "Değişiklikleri Kaydet",
    cancel: "İptal",
    personalInfo: "Kişisel Bilgiler",
    contactInfo: "İletişim Bilgileri",
    preferences: "Tercihler",
    statistics: "İstatistikler",
    bio: "Hakkında",
    location: "Konum",
    phone: "Telefon",
    website: "Website",
    language: "Dil",
    theme: "Tema",
    notifications: "Bildirimler",
    emailUpdates: "E-posta Güncellemeleri",
    socialMedia: "Sosyal Medya",
    twitter: "Twitter",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    totalMeetings: "Toplam Toplantı",
    totalParticipants: "Toplam Katılımcı",
    averageRating: "Ortalama Puan",
    totalHours: "Toplam Saat",
    completedMeetings: "Tamamlanan Toplantı",
    cancelledMeetings: "İptal Edilen Toplantı",
    memberSince: "Üyelik Tarihi",
    lastLogin: "Son Giriş",
    englishLevel: "İngilizce Seviyesi",
    role: "Rol",
    conversationHost: "Konuşma Sunucusu",
    beginner: "Başlangıç",
    intermediate: "Orta",
    advanced: "İleri",
    expert: "Uzman",
    light: "Açık",
    dark: "Koyu",
    system: "Sistem",
    // Placeholders
    bioPlaceholder: "Kendiniz hakkında bilgi verin...",
    locationPlaceholder: "Nerede bulunuyorsunuz?",
    phonePlaceholder: "Telefon numaranız",
    websitePlaceholder: "Web siteniz",
    twitterPlaceholder: "@kullaniciadi",
    linkedinPlaceholder: "linkedin.com/in/kullaniciadi",
    instagramPlaceholder: "@kullaniciadi",
    // Messages
    profileUpdated: "Profil başarıyla güncellendi!",
    errorUpdating: "Profil güncellenirken hata oluştu",
    loading: "Profil yükleniyor...",
    error: "Profil yüklenirken hata oluştu",
  }
};

export default function Profile() {
  const router = useRouter();
  const toast = useToast();
  const [lang, setLang] = useState<'en' | 'tr'>('en');
  const t = translations[lang];
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    englishLevel: 'intermediate',
    socialMedia: {
      twitter: '',
      linkedin: '',
      instagram: ''
    },
    preferences: {
      language: 'en',
      theme: 'light',
      notifications: true,
      emailUpdates: true
    }
  });

  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          await fetchUserProfile(user.uid);
        } else {
          router.push('/login');
        }
      });
      
      return () => unsubscribe();
    };
    
    checkAuth();
  }, [router]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const profile: UserProfile = {
          uid: userId,
          displayName: data.displayName || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          photoURL: data.photoURL || '',
          role: data.role || 'proUser',
          englishLevel: data.englishLevel || 'intermediate',
          bio: data.bio || '',
          location: data.location || '',
          phone: data.phone || '',
          website: data.website || '',
          socialMedia: data.socialMedia || {},
          preferences: data.preferences || {
            language: 'en',
            theme: 'light',
            notifications: true,
            emailUpdates: true
          },
          stats: data.stats || {
            totalMeetings: 0,
            totalParticipants: 0,
            averageRating: 0,
            totalHours: 0,
            completedMeetings: 0,
            cancelledMeetings: 0
          },
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || new Date()
        };
        
        setUserProfile(profile);
        setFormData({
          firstName: profile.firstName,
          lastName: profile.lastName,
          bio: profile.bio,
          location: profile.location,
          phone: profile.phone,
          website: profile.website,
          englishLevel: profile.englishLevel,
          socialMedia: profile.socialMedia,
          preferences: profile.preferences
        });
      } else {
        setError(t.error);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      await updateDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        website: formData.website,
        englishLevel: formData.englishLevel,
        socialMedia: formData.socialMedia,
        preferences: formData.preferences,
        updatedAt: new Date()
      });

      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          firstName: formData.firstName,
          lastName: formData.lastName,
          bio: formData.bio,
          location: formData.location,
          phone: formData.phone,
          website: formData.website,
          englishLevel: formData.englishLevel,
          socialMedia: formData.socialMedia,
          preferences: formData.preferences
        });
      }

      toast.success(t.profileUpdated);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t.errorUpdating);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        bio: userProfile.bio,
        location: userProfile.location,
        phone: userProfile.phone,
        website: userProfile.website,
        englishLevel: userProfile.englishLevel,
        socialMedia: userProfile.socialMedia,
        preferences: userProfile.preferences
      });
    }
    setIsEditing(false);
  };

  const getEnglishLevelLabel = (level: string) => {
    return t[level as keyof typeof t] || level;
  };

  const getRoleLabel = (role: string) => {
    return role === 'proUser' ? t.conversationHost : role;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 text-slate-700 px-6 py-5 rounded-xl max-w-md shadow-lg">
          <h2 className="text-lg font-semibold mb-3 text-red-600">{t.error}</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <User size={32} className="text-blue-600" />
              {t.profile}
            </h1>
            <p className="text-slate-600 mt-2">
              {lang === 'tr' 
                ? 'Profil bilgilerinizi yönetin ve ayarlarınızı güncelleyin'
                : 'Manage your profile information and update your settings'
              }
            </p>
          </div>
          
          {/* Dil Seçici */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                lang === 'en' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('tr')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                lang === 'tr' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              TR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon - Profil Kartı */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Profil Fotoğrafı */}
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
                    {userProfile.photoURL ? (
                      <img 
                        src={userProfile.photoURL} 
                        alt={userProfile.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center">
                        <User size={48} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
                      <Camera size={20} className="text-blue-600" />
                    </button>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mt-4">
                  {userProfile.firstName} {userProfile.lastName}
                </h2>
                <p className="text-blue-100">{getRoleLabel(userProfile.role)}</p>
              </div>

              {/* Profil Bilgileri */}
              <div className="p-6 space-y-6">
                {/* Temel Bilgiler */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Award size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">{t.englishLevel}</p>
                      <p className="font-semibold text-slate-800">{getEnglishLevelLabel(userProfile.englishLevel)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">{t.memberSince}</p>
                      <p className="font-semibold text-slate-800">
                        {userProfile.createdAt.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Clock size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">{t.lastLogin}</p>
                      <p className="font-semibold text-slate-800">
                        {userProfile.lastLogin.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* İstatistikler */}
                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-600" />
                    {t.statistics}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{userProfile.stats.totalMeetings}</p>
                      <p className="text-xs text-slate-600">{t.totalMeetings}</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{userProfile.stats.totalParticipants}</p>
                      <p className="text-xs text-slate-600">{t.totalParticipants}</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{userProfile.stats.averageRating.toFixed(1)}</p>
                      <p className="text-xs text-slate-600">{t.averageRating}</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{userProfile.stats.totalHours}h</p>
                      <p className="text-xs text-slate-600">{t.totalHours}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Kolon - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Düzenleme Butonları */}
            <div className="flex justify-end gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit size={18} />
                  {t.editProfile}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors flex items-center gap-2"
                  >
                    <X size={18} />
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save size={18} />
                    )}
                    {t.saveChanges}
                  </button>
                </div>
              )}
            </div>

            {/* Kişisel Bilgiler */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <User size={20} className="text-blue-600" />
                  {t.personalInfo}
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t.firstName}</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t.lastName}</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.bio}</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100 resize-none"
                    placeholder={t.bioPlaceholder}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.englishLevel}</label>
                  <select
                    value={formData.englishLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, englishLevel: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100"
                  >
                    <option value="beginner">{t.beginner}</option>
                    <option value="intermediate">{t.intermediate}</option>
                    <option value="advanced">{t.advanced}</option>
                    <option value="expert">{t.expert}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* İletişim Bilgileri */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-green-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Mail size={20} className="text-green-600" />
                  {t.contactInfo}
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <MapPin size={16} className="text-green-600" />
                      {t.location}
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100"
                      placeholder={t.locationPlaceholder}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Phone size={16} className="text-green-600" />
                      {t.phone}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100"
                      placeholder={t.phonePlaceholder}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Globe size={16} className="text-green-600" />
                    {t.website}
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100"
                    placeholder={t.websitePlaceholder}
                  />
                </div>

                {/* Sosyal Medya */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-4">{t.socialMedia}</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">{t.twitter}</label>
                      <input
                        type="text"
                        value={formData.socialMedia.twitter}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                        }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100 text-sm"
                        placeholder={t.twitterPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">{t.linkedin}</label>
                      <input
                        type="text"
                        value={formData.socialMedia.linkedin}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          socialMedia: { ...prev.socialMedia, linkedin: e.target.value }
                        }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100 text-sm"
                        placeholder={t.linkedinPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">{t.instagram}</label>
                      <input
                        type="text"
                        value={formData.socialMedia.instagram}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                        }))}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100 text-sm"
                        placeholder={t.instagramPlaceholder}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tercihler */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Settings size={20} className="text-purple-600" />
                  {t.preferences}
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Languages size={16} className="text-purple-600" />
                      {t.language}
                    </label>
                    <select
                      value={formData.preferences.language}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        preferences: { ...prev.preferences, language: e.target.value }
                      }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100"
                    >
                      <option value="en">English</option>
                      <option value="tr">Türkçe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Palette size={16} className="text-purple-600" />
                      {t.theme}
                    </label>
                    <select
                      value={formData.preferences.theme}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        preferences: { ...prev.preferences, theme: e.target.value }
                      }))}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-slate-50 hover:bg-white disabled:bg-slate-100"
                    >
                      <option value="light">{t.light}</option>
                      <option value="dark">{t.dark}</option>
                      <option value="system">{t.system}</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Bell size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{t.notifications}</p>
                        <p className="text-sm text-slate-600">Push notifications</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferences.notifications}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          preferences: { ...prev.preferences, notifications: e.target.checked }
                        }))}
                        disabled={!isEditing}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Mail size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{t.emailUpdates}</p>
                        <p className="text-sm text-slate-600">Email notifications</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferences.emailUpdates}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          preferences: { ...prev.preferences, emailUpdates: e.target.checked }
                        }))}
                        disabled={!isEditing}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
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