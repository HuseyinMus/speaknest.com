'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MessageCircle, Plus, MinusCircle, Calendar, Globe, Users, Clock, Target, Hash, HelpCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';

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

interface MeetingFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  level: string;
  topic: string;
  participantCount: number;
  keywords: string[];
  questions: string[];
  isSubmitting: boolean;
  error: string;
  success: string;
}

const translations = {
  en: {
    createMeeting: "Create New Meeting",
    meetingTitle: "Meeting Title *",
    meetingDescription: "Meeting Description",
    meetingDate: "Meeting Date *",
    meetingTime: "Meeting Time *",
    level: "Level",
    topic: "Topic",
    participantCount: "Participant Count",
    addKeyword: "Add keyword",
    addQuestion: "Add question",
    keywords: "Keywords",
    questions: "Questions",
    submit: "Create Meeting",
    creating: "Creating...",
    success: "Meeting created successfully!",
    error: "An error occurred while creating the meeting.",
    backToMeetings: "Back to Meetings",
    meetingInfo: "Meeting Information",
    details: "Details",
    participants: "Participants",
    content: "Content",
    // Level translations
    beginner: "Beginner",
    intermediate: "Intermediate", 
    advanced: "Advanced",
    any: "Any Level",
    // Topic translations
    daily: "Daily Conversation",
    business: "Business",
    education: "Education/School",
    science: "Science",
    technology: "Technology",
    arts: "Arts & Culture",
    travel: "Travel",
    food: "Food & Cooking",
    sports: "Sports",
    health: "Health & Wellness",
    environment: "Environment",
    entertainment: "Entertainment & Hobbies",
    // Placeholders
    titlePlaceholder: "e.g., Daily Conversation Practice",
    descriptionPlaceholder: "What will be discussed in this meeting?",
    keywordPlaceholder: "Add a new keyword",
    questionPlaceholder: "Add a question for the meeting",
    participantInfo: "Number of participants (3-6 people)",
  },
  tr: {
    createMeeting: "Yeni Toplantı Oluştur",
    meetingTitle: "Toplantı Başlığı *",
    meetingDescription: "Toplantı Açıklaması",
    meetingDate: "Toplantı Tarihi *",
    meetingTime: "Toplantı Saati *",
    level: "Seviye",
    topic: "Konu",
    participantCount: "Katılımcı Sayısı",
    addKeyword: "Anahtar kelime ekle",
    addQuestion: "Soru ekle",
    keywords: "Anahtar Kelimeler",
    questions: "Konu Soruları",
    submit: "Toplantı Oluştur",
    creating: "Oluşturuluyor...",
    success: "Toplantı başarıyla oluşturuldu!",
    error: "Toplantı oluşturulurken bir hata oluştu.",
    backToMeetings: "Toplantılara Dön",
    meetingInfo: "Toplantı Bilgileri",
    details: "Detaylar",
    participants: "Katılımcılar",
    content: "İçerik",
    // Level translations
    beginner: "Başlangıç Seviyesi",
    intermediate: "Orta Seviye",
    advanced: "İleri Seviye",
    any: "Tüm Seviyeler",
    // Topic translations
    daily: "Günlük Konuşma",
    business: "İş Dünyası",
    education: "Eğitim/Okul",
    science: "Bilim",
    technology: "Teknoloji",
    arts: "Sanat ve Kültür",
    travel: "Seyahat",
    food: "Yemek ve Mutfak",
    sports: "Spor",
    health: "Sağlık ve Wellness",
    environment: "Çevre",
    entertainment: "Eğlence ve Hobiler",
    // Placeholders
    titlePlaceholder: "örn: Günlük Konuşma Pratiği",
    descriptionPlaceholder: "Bu toplantıda neler konuşulacak?",
    keywordPlaceholder: "Yeni anahtar kelime ekle",
    questionPlaceholder: "Toplantı için soru ekle",
    participantInfo: "Katılımcı sayısı (3-6 kişi)",
  }
};

export default function CreateMeeting() {
  const router = useRouter();
  const toast = useToast();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<'en' | 'tr'>('en');
  const t = translations[lang];
  
  // Form State
  const [formData, setFormData] = useState<MeetingFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    level: 'intermediate',
    topic: 'daily',
    participantCount: 6,
    keywords: [],
    questions: [],
    isSubmitting: false,
    error: '',
    success: ''
  });
  
  // Anahtar kelimeler için state
  const [currentKeyword, setCurrentKeyword] = useState('');
  
  // Konu soruları için state
  const [currentQuestion, setCurrentQuestion] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserProfile(user.toJSON());
      } else {
        router.push('/login');
      }
    });
    
    return () => unsubscribe();
  }, [router]);
  
  // Form verisini güncelleme fonksiyonu
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Anahtar kelime ekleme işlevi
  const addKeyword = () => {
    if (currentKeyword.trim() && !formData.keywords.includes(currentKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, currentKeyword.trim()]
      }));
      setCurrentKeyword('');
    }
  };
  
  // Anahtar kelime silme işlevi
  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };
  
  // Soru ekleme işlevi
  const addQuestion = () => {
    if (currentQuestion.trim() && !formData.questions.includes(currentQuestion.trim())) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, currentQuestion.trim()]
      }));
      setCurrentQuestion('');
    }
  };
  
  // Soru silme işlevi
  const removeQuestion = (question: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q !== question)
    }));
  };
  
  // Form gönderme işlevi
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setFormData(prev => ({ ...prev, isSubmitting: true, error: '' }));
      
      // Form validasyonu
      if (!formData.title.trim()) {
        const errorMsg = lang === 'tr' ? 'Başlık alanı zorunludur.' : 'Title field is required.';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!formData.date || !formData.time) {
        const errorMsg = lang === 'tr' ? 'Tarih ve saat seçimi zorunludur.' : 'Date and time selection is required.';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Tarih bilgisini oluştur
      const [year, month, day] = formData.date.split('-').map(Number);
      const [hours, minutes] = formData.time.split(':').map(Number);
      
      // Yeni tarih nesnesi oluştur - tarayıcı zaman diliminde
      const meetingDateTime = new Date(year, month - 1, day, hours, minutes);
      
      // Geçerli zamanla karşılaştır
      const now = new Date();
      if (meetingDateTime < now) {
        const errorMsg = lang === 'tr' ? 'Toplantı tarihi gelecekte olmalıdır.' : 'Meeting date must be in the future.';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Katılımcı sayısı doğrulama
      if (formData.participantCount < 3 || formData.participantCount > 6) {
        const errorMsg = lang === 'tr' ? 'Katılımcı sayısı 3 ile 6 arasında olmalıdır.' : 'Participant count must be between 3 and 6.';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error(lang === 'tr' ? 'Kullanıcı oturumu bulunamadı.' : 'User session not found.');
      }
      
      // Toplantıyı Firestore'a kaydet
      const meetingRef = await addDoc(collection(db, 'meetings'), {
        title: formData.title,
        description: formData.description,
        startTime: meetingDateTime,
        level: formData.level,
        topic: formData.topic,
        participantCount: formData.participantCount,
        keywords: formData.keywords,
        questions: formData.questions,
        hostId: user.uid,
        hostName: userProfile?.displayName || `${userProfile?.firstName} ${userProfile?.lastName}`,
        hostPhotoURL: userProfile?.photoURL || null,
        status: 'scheduled',
        participants: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Toplantı oluşturuldu, ID:', meetingRef.id);
      
      // Başarılı mesajı göster
      const successMsg = t.success;
      toast.success(successMsg);
      
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        level: 'intermediate',
        topic: 'daily',
        participantCount: 6,
        keywords: [],
        questions: [],
        isSubmitting: false,
        error: '',
        success: successMsg
      });
      
      // Toplantı sayfasına yönlendir
      router.push('/prouser-panel/my-meetings');
      
    } catch (error: unknown) {
      console.error('Toplantı oluşturulurken hata:', error);
      const errorMsg = error instanceof Error ? error.message : t.error;
      toast.error(errorMsg);
      
      setFormData(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: errorMsg
      }));
    }
  };
  
  // Konu seçenekleri
  const topicOptions = [
    { value: 'daily', label: t.daily, icon: '💬' },
    { value: 'business', label: t.business, icon: '💼' },
    { value: 'education', label: t.education, icon: '📚' },
    { value: 'science', label: t.science, icon: '🔬' },
    { value: 'technology', label: t.technology, icon: '💻' },
    { value: 'arts', label: t.arts, icon: '🎨' },
    { value: 'travel', label: t.travel, icon: '✈️' },
    { value: 'food', label: t.food, icon: '🍽️' },
    { value: 'sports', label: t.sports, icon: '⚽' },
    { value: 'health', label: t.health, icon: '🏥' },
    { value: 'environment', label: t.environment, icon: '🌱' },
    { value: 'entertainment', label: t.entertainment, icon: '🎮' },
  ];
  
  // Seviye seçenekleri
  const levelOptions = [
    { value: 'beginner', label: t.beginner, color: 'bg-green-100 text-green-800' },
    { value: 'intermediate', label: t.intermediate, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'advanced', label: t.advanced, color: 'bg-red-100 text-red-800' },
    { value: 'any', label: t.any, color: 'bg-blue-100 text-blue-800' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/prouser-panel/my-meetings')}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-all duration-200"
          >
            <ArrowLeft size={20} />
            {t.backToMeetings}
          </button>
          
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

        {/* Başlık */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-3 flex items-center gap-3">
              <MessageCircle size={32} className="text-blue-200" />
              {t.createMeeting}
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              {lang === 'tr' 
                ? 'Yeni bir İngilizce pratik toplantısı oluşturun ve konuşma sunucusu olarak katılımcılara yardımcı olun.'
                : 'Create a new English practice meeting and help participants as a conversation host.'
              }
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>
      
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Toplantı Bilgileri */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Target size={20} className="text-blue-600" />
                {t.meetingInfo}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Başlık ve Açıklama */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
                    {t.meetingTitle}
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white"
                    placeholder={t.titlePlaceholder}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
                    {t.meetingDescription}
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white resize-none"
                    placeholder={t.descriptionPlaceholder}
                  />
                </div>
              </div>
              
              {/* Tarih, Saat, Seviye ve Konu */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="date" className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar size={16} className="text-blue-600" />
                      {t.meetingDate}
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="time" className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Clock size={16} className="text-blue-600" />
                      {t.meetingTime}
                    </label>
                    <input
                      type="time"
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="level" className="block text-sm font-semibold text-slate-700">
                      {t.level}
                    </label>
                    <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white"
                    >
                      {levelOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="topic" className="block text-sm font-semibold text-slate-700">
                      {t.topic}
                    </label>
                    <select
                      id="topic"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-slate-50 hover:bg-white"
                    >
                      {topicOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Katılımcı Sayısı */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-green-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-green-600" />
                {t.participants}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                <label htmlFor="participantCount" className="block text-sm font-semibold text-slate-700 mb-4 flex items-center justify-between">
                  <span>{t.participantCount}</span>
                  <span className="text-2xl font-bold text-green-700 px-4 py-2 bg-green-100 rounded-full shadow-sm">
                    {formData.participantCount}
                  </span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="participantCount"
                    name="participantCount"
                    value={formData.participantCount}
                    onChange={handleChange}
                    min="3"
                    max="6"
                    className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(formData.participantCount - 3) * 33.33}%, #e5e7eb ${(formData.participantCount - 3) * 33.33}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex gap-1">
                    {[3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, participantCount: num }))}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                          formData.participantCount === num
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-3 flex items-center gap-2">
                  <HelpCircle size={16} className="text-slate-400" />
                  {t.participantInfo}
                </p>
              </div>
            </div>
          </div>
          
          {/* Anahtar Kelimeler */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Hash size={20} className="text-purple-600" />
                {t.keywords}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={currentKeyword}
                  onChange={(e) => setCurrentKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-slate-50 hover:bg-white"
                  placeholder={t.keywordPlaceholder}
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md flex items-center gap-2 font-medium"
                >
                  <Plus size={18} />
                  {t.addKeyword}
                </button>
              </div>
              {formData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {formData.keywords.map((keyword, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 rounded-full flex items-center gap-2 text-sm font-medium shadow-sm border border-purple-200 animate-in slide-in-from-top-2 duration-300"
                    >
                      <Hash size={14} />
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeKeyword(keyword)}
                        className="text-purple-600 hover:text-purple-800 focus:outline-none transition-colors"
                      >
                        <MinusCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Konu Soruları */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-orange-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <HelpCircle size={20} className="text-orange-600" />
                {t.questions}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQuestion())}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-slate-50 hover:bg-white"
                  placeholder={t.questionPlaceholder}
                />
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-md flex items-center gap-2 font-medium"
                >
                  <Plus size={18} />
                  {t.addQuestion}
                </button>
              </div>
              {formData.questions.length > 0 && (
                <div className="space-y-3">
                  {formData.questions.map((question, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 text-slate-800 rounded-xl flex items-center justify-between text-sm shadow-sm animate-in slide-in-from-left-2 duration-300"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        {question}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question)}
                        className="text-orange-600 hover:text-red-600 focus:outline-none transition-colors"
                      >
                        <MinusCircle size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Hata/Başarı Mesajları */}
          {formData.error && (
            <div className="px-6 py-4 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              {formData.error}
            </div>
          )}
          
          {formData.success && (
            <div className="px-6 py-4 bg-green-50 text-green-800 rounded-xl border border-green-200 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {formData.success}
            </div>
          )}
          
          {/* Gönderme Butonu */}
          <div className="pt-6 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={formData.isSubmitting}
              className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 flex items-center gap-3 transform hover:scale-105 ${formData.isSubmitting ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
            >
              {formData.isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.creating}
                </>
              ) : (
                <>
                  <Calendar size={20} />
                  {t.submit}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
} 