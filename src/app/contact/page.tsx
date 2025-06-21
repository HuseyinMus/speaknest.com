'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Users, Globe } from 'lucide-react';

export default function Contact() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const router = useRouter();
  
  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setUser(user);
          await fetchUserProfile(user.uid);
        }
        setLoading(false);
      });
      
      return () => unsubscribe();
    };
    
    checkAuth();
  }, []);
  
  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (err) {
      console.error('Kullanıcı bilgileri alınamadı:', err);
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Çıkış yapılamadı:', err);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simüle edilmiş form gönderme
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // 3 saniye sonra success mesajını kaldır
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    }, 2000);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-xl text-slate-600">Yükleniyor...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200 to-transparent rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-tl from-blue-200 to-transparent rounded-full opacity-20 animate-pulse delay-500"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full text-emerald-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              İletişim
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-6">
              Bizimle{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
                İletişime Geçin
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Sorularınız, önerileriniz veya işbirliği talepleriniz için bizimle iletişime geçin. 
              Size en kısa sürede dönüş yapacağız.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100/50">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Hızlı Yanıt</h3>
                <p className="text-slate-600 text-sm">24 saat içinde dönüş</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100/50">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Uzman Destek</h3>
                <p className="text-slate-600 text-sm">Deneyimli ekip</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100/50">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">7/24 Erişim</h3>
                <p className="text-slate-600 text-sm">Her zaman yanınızdayız</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-6">
                  İletişim Bilgileri
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Size en iyi şekilde yardımcı olabilmek için buradayız. 
                  Aşağıdaki kanallardan bize ulaşabilirsiniz.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-1 border border-slate-100/50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 ease-out">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Adres</h3>
                      <p className="text-slate-600">İstanbul, Türkiye</p>
                      <p className="text-slate-500 text-sm mt-1">Merkez ofisimiz</p>
                    </div>
                  </div>
                </div>
                
                <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-1 border border-slate-100/50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 ease-out">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Telefon</h3>
                      <p className="text-slate-600">+90 555 123 4567</p>
                      <p className="text-slate-500 text-sm mt-1">Pazartesi - Cuma: 09:00 - 18:00</p>
                    </div>
                  </div>
                </div>
                
                <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-1 border border-slate-100/50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 ease-out">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">E-posta</h3>
                      <p className="text-slate-600">info@speaknest.com</p>
                      <p className="text-slate-500 text-sm mt-1">24 saat içinde yanıt</p>
                    </div>
                  </div>
                </div>
                
                <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-1 border border-slate-100/50">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 ease-out">
                        <Clock className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Çalışma Saatleri</h3>
                      <p className="text-slate-600">Pazartesi - Cuma: 09:00 - 18:00</p>
                      <p className="text-slate-500 text-sm mt-1">Cumartesi: 10:00 - 14:00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-100/50">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-4">
                  Bize Ulaşın
                </h2>
                <p className="text-slate-600">
                  Formu doldurun, size en kısa sürede dönüş yapalım.
                </p>
              </div>
              
              {submitSuccess && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-100 to-blue-100 border border-emerald-200 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-800">Mesajınız Gönderildi!</h4>
                      <p className="text-emerald-700 text-sm">En kısa sürede size dönüş yapacağız.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="Adınız ve soyadınız"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    E-posta
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
                    Konu
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="Mesajınızın konusu"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                    Mesaj
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-white/50 backdrop-blur-sm resize-none"
                    placeholder="Mesajınızı buraya yazın..."
                    required
                  ></textarea>
                </div>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Gönderiliyor...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Send className="w-5 h-5 mr-2" />
                      Mesaj Gönder
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200 to-transparent rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200 to-transparent rounded-full opacity-20 animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Konum
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-4">
              Bizi Ziyaret Edin
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              İstanbul'daki merkez ofisimizi ziyaret edebilir, 
              ekibimizle yüz yüze görüşebilirsiniz.
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100/50">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.96336983393!2d28.978358315415!3d41.037002979298!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab7650656bd63%3A0x8ca058b28c20b6c3!2zVGFrc2ltIE1eyZnyxZ9hcmtzxLE!5e0!3m2!1str!2str!4v1635167261304!5m2!1str!2str"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              className="w-full"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
} 