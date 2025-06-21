'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { 
  MessageSquare, 
  BookOpen, 
  Users, 
  Award,
  Clock,
  Globe,
  CheckCircle2,
  Star
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';

export default function HomePage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Otomatik geçiş için useEffect
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 6000); // 6 saniyede bir geçiş (daha yavaş)

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const fetchTestimonials = async () => {
    try {
      const testimonialsQuery = query(
        collection(db, 'testimonials'), 
        where('approved', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(testimonialsQuery);
      const testimonialsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTestimonials(testimonialsData);
    } catch (err) {
      console.error('Yorumlar yüklenemedi:', err);
      // Fallback olarak statik yorumları kullan
      setTestimonials([
        {
          name: 'Ayşe Yılmaz',
          role: 'Yazılım Geliştirici',
          content: 'SpeakNest sayesinde İngilizce konuşma korkumu yendim. Artık iş görüşmelerinde kendimi çok daha rahat ifade edebiliyorum. Native speaker eğitmenler gerçekten çok yardımcı oldu!',
          rating: 5,
          date: '2 hafta önce'
        },
        {
          name: 'Mehmet Demir',
          role: 'İşletme Sahibi',
          content: 'Esnek ders programı ve kaliteli eğitmenler sayesinde iş hayatımı aksatmadan İngilizce öğrenebiliyorum. Özellikle grup dersleri çok eğlenceli geçiyor.',
          rating: 5,
          date: '1 ay önce'
        },
        {
          name: 'Zeynep Kaya',
          role: 'Üniversite Öğrencisi',
          content: 'Online dersler çok interaktif ve eğlenceli. Her ders sonrası kendimi daha iyi hissediyorum. Kelime öğrenme sistemi de çok pratik!',
          rating: 5,
          date: '3 hafta önce'
        },
        {
          name: 'Ahmet Özkan',
          role: 'Doktor',
          content: 'Yoğun çalışma temposuna rağmen SpeakNest ile İngilizce pratiği yapabiliyorum. Eğitmenler çok anlayışlı ve sabırlı.',
          rating: 5,
          date: '1 hafta önce'
        },
        {
          name: 'Elif Şahin',
          role: 'Öğretmen',
          content: 'Öğrencilerimle daha iyi iletişim kurabilmek için İngilizce öğreniyorum. SpeakNest gerçekten çok etkili bir platform.',
          rating: 5,
          date: '2 ay önce'
        },
        {
          name: 'Can Yıldız',
          role: 'Mühendis',
          content: 'Yurtdışı seyahatlerimde artık kendimi çok daha rahat hissediyorum. SpeakNest sayesinde günlük konuşma İngilizcem çok gelişti.',
          rating: 5,
          date: '1 ay önce'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const features = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'Konuşma Pratiği',
      description: 'Ana dili İngilizce olan eğitmenlerle birebir konuşma pratiği yapın.'
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Kelime Öğrenimi',
      description: 'Günlük hayatta kullanılan kelimeleri ve deyimleri öğrenin.'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Grup Dersleri',
      description: 'Diğer öğrencilerle birlikte pratik yapma fırsatı yakalayın.'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Esnek Program',
      description: 'Kendi programınıza uygun esnek ders saatleri seçin.'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Aktif Öğrenci' },
    { number: '50+', label: 'Uzman Eğitmen' },
    { number: '95%', label: 'Memnuniyet' },
    { number: '24/7', label: 'Destek' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50"></div>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-br from-emerald-200 to-transparent rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-tl from-blue-200 to-transparent rounded-full opacity-20 animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full text-emerald-700 text-sm font-medium mb-6">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                  #1 İngilizce Konuşma Platformu
                </div>
                
                <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-6 leading-tight">
                  İngilizce Konuşma Becerinizi{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
                    Geliştirin
                  </span>
                </h1>
                
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Ana dili İngilizce olan eğitmenlerle pratik yapın, 
                  <span className="font-semibold text-emerald-600"> bilimsel yöntemlerle kelime öğrenin</span> ve 
                  <span className="font-semibold text-blue-600"> rakiplerden %70 daha uygun fiyatlarla</span> kendinize güvenin.
                </p>

                {/* Key Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-emerald-100/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">Native Speaker</div>
                      <div className="text-slate-600 text-xs">Ana dili İngilizce</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-blue-100/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">Bilimsel Yöntem</div>
                      <div className="text-slate-600 text-xs">Kanıtlanmış teknikler</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-purple-100/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">%70 Daha Uygun</div>
                      <div className="text-slate-600 text-xs">Rakip fiyatlarına göre</div>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                      <span>Ücretsiz Dene</span>
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline" className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-emerald-500 font-semibold px-8 py-4 rounded-xl transition-all duration-300">
                      <span>Planları İncele</span>
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center gap-6 mt-8 pt-8 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-slate-600">4.9/5 (2,500+ değerlendirme)</span>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-3xl transform rotate-3"></div>
                <Image
                  src="/images/homepage_hero_illustration_for_a_modern_language_learning_platform_soft_green_color_palette_minimal_oqb01o9l6rcglswonop4_2.png"
                  alt="SpeakNest Hero"
                  width={600}
                  height={600}
                  className="relative rounded-3xl shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-200 to-transparent rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-tl from-blue-200 to-transparent rounded-full opacity-20 animate-pulse delay-500"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Avantajlarımız
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-4">
                Neden SpeakNest?
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Modern ve etkili öğrenme yöntemleriyle İngilizce konuşma becerinizi geliştirin.
                <span className="font-semibold text-emerald-600"> Gerçek sonuçlar, gerçek ilerleme!</span>
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform group-hover:-translate-y-2 border border-slate-100/50 h-full">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 ease-out">
                      <div className="text-emerald-600 group-hover:text-blue-600 transition-colors duration-300">
                        {feature.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    {/* Decorative line */}
                    <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full mt-6 transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 ease-out"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional CTA */}
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100/50">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-slate-800">Hızlı Başlangıç</h4>
                  <p className="text-slate-600 text-sm">İlk dersinizi bugün planlayın!</p>
                </div>
                <button className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105">
                  Başla
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-emerald-50 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200 to-transparent rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200 to-transparent rounded-full opacity-20 animate-pulse delay-1000"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Kolay Başlangıç
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-4">
                Nasıl Çalışır?
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Üç basit adımda İngilizce konuşmaya başlayın. 
                <span className="font-semibold text-emerald-600"> Hızlı, kolay ve etkili!</span>
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {/* Step 1 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform group-hover:-translate-y-2 border border-emerald-100/50">
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    1
                  </div>
                  
                  {/* Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 ease-out">
                    <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center group-hover:text-emerald-600 transition-colors duration-300">
                    Kayıt Olun
                  </h3>
                  <p className="text-slate-600 text-center leading-relaxed">
                    Hızlı ve güvenli kayıt süreciyle hemen başlayın. 
                    <span className="font-medium text-emerald-600"> 2 dakikada tamamlanır!</span>
                  </p>
                  
                  {/* Decorative line */}
                  <div className="w-16 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full mx-auto mt-6 transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 ease-out"></div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform group-hover:-translate-y-2 border border-blue-100/50">
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    2
                  </div>
                  
                  {/* Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 ease-out">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center group-hover:text-blue-600 transition-colors duration-300">
                    Seviyenizi Belirleyin
                  </h3>
                  <p className="text-slate-600 text-center leading-relaxed">
                    Ücretsiz seviye belirleme testi ile size uygun programı seçin.
                    <span className="font-medium text-blue-600"> Kişiselleştirilmiş deneyim!</span>
                  </p>
                  
                  {/* Decorative line */}
                  <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mx-auto mt-6 transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 ease-out"></div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-emerald-500/10 rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform group-hover:-translate-y-2 border border-purple-100/50">
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    3
                  </div>
                  
                  {/* Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 ease-out">
                    <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 text-center group-hover:text-purple-600 transition-colors duration-300">
                    Pratik Yapın
                  </h3>
                  <p className="text-slate-600 text-center leading-relaxed">
                    Native speaker eğitmenlerle birebir veya grup derslerinde pratik yapın.
                    <span className="font-medium text-purple-600"> Hemen konuşmaya başlayın!</span>
                  </p>
                  
                  {/* Decorative line */}
                  <div className="w-16 h-1 bg-gradient-to-r from-purple-400 to-emerald-400 rounded-full mx-auto mt-6 transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 ease-out"></div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center mt-12">
              <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out">
                <span>Hemen Başlayın</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
              <p className="text-slate-500 text-sm mt-4">
                Ücretsiz deneme dersi için hemen kayıt olun!
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-sky-600 to-green-500 mb-4">
                Öğrencilerimizin Deneyimleri
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Binlerce öğrencimizin başarı hikayeleri ve SpeakNest ile yaşadıkları deneyimler.
              </p>
            </div>
            
            {/* Carousel Container */}
            <div className="relative">
              {loading ? (
                // Loading skeleton
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-pulse">
                      <div className="p-6">
                        <div className="flex items-center mb-4">
                          <div className="flex space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="w-5 h-5 bg-gray-200 rounded"></div>
                            ))}
                          </div>
                          <div className="ml-2 w-20 h-4 bg-gray-200 rounded"></div>
                        </div>
                        <div className="space-y-2 mb-6">
                          <div className="h-4 bg-gray-200 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                          <div className="space-y-1">
                            <div className="w-24 h-4 bg-gray-200 rounded"></div>
                            <div className="w-32 h-3 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Carousel Track */}
                  <div className="overflow-hidden">
                    <div 
                      className="flex transition-all duration-1000 ease-out"
                      style={{ 
                        transform: `translateX(-${currentSlide * (100 / 3)}%)`,
                        width: `${Math.ceil(testimonials.length / 3) * 100}%`
                      }}
                    >
                      {testimonials.map((testimonial, index) => (
                        <div 
                          key={testimonial.id || index} 
                          className="w-1/3 px-4 flex-shrink-0"
                        >
                          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform hover:-translate-y-3 border border-gray-100 overflow-hidden group h-full">
                            <div className="p-6 h-full flex flex-col">
                              {/* Rating */}
                              <div className="flex items-center mb-4">
                                <div className="flex">
                                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current transition-all duration-300 ease-out" />
                                  ))}
                                </div>
                                <span className="ml-2 text-sm text-gray-500 transition-all duration-300 ease-out">{testimonial.date}</span>
                              </div>
                              
                              {/* Content */}
                              <blockquote className="text-gray-700 mb-6 leading-relaxed flex-grow transition-all duration-300 ease-out">
                                "{testimonial.content}"
                              </blockquote>
                              
                              {/* Author */}
                              <div className="flex items-center mt-auto">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 ring-2 ring-green-200 group-hover:ring-green-400 transition-all duration-500 ease-out">
                                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg transition-all duration-300 ease-out">
                                    {testimonial.name.charAt(0)}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-all duration-300 ease-out">
                                    {testimonial.name}
                                  </h4>
                                  <p className="text-gray-600 text-sm transition-all duration-300 ease-out">
                                    {testimonial.role}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Decorative element */}
                            <div className="h-1 bg-gradient-to-r from-green-400 via-sky-400 to-indigo-400 transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 ease-out"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Buttons */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-500 ease-out hover:scale-110 z-10 hover:bg-white/90"
                    aria-label="Önceki yorum"
                  >
                    <svg className="w-6 h-6 text-gray-600 transition-all duration-300 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-500 ease-out hover:scale-110 z-10 hover:bg-white/90"
                    aria-label="Sonraki yorum"
                  >
                    <svg className="w-6 h-6 text-gray-600 transition-all duration-300 ease-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Dot Indicators */}
                  <div className="flex justify-center mt-8 space-x-3">
                    {Array.from({ length: Math.ceil(testimonials.length / 3) }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index * 3)}
                        className={`w-4 h-4 rounded-full transition-all duration-500 ease-out hover:scale-125 ${
                          Math.floor(currentSlide / 3) === index
                            ? 'bg-gradient-to-r from-indigo-500 to-green-500 scale-125 shadow-lg'
                            : 'bg-gray-300 hover:bg-gray-400 hover:shadow-md'
                        }`}
                        aria-label={`Yorum grubu ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Auto-play Toggle */}
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      className={`flex items-center space-x-3 px-6 py-3 rounded-full text-sm font-medium transition-all duration-500 ease-out hover:scale-105 ${
                        isAutoPlaying
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-md'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full transition-all duration-500 ease-out ${
                        isAutoPlaying ? 'bg-green-500 scale-110' : 'bg-gray-400'
                      }`} />
                      <span className="transition-all duration-300 ease-out">{isAutoPlaying ? 'Otomatik Oynatma Açık' : 'Otomatik Oynatma Kapalı'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">4.9/5</div>
                <div className="text-gray-600 text-sm">Ortalama Puan</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-sky-600 mb-2">98%</div>
                <div className="text-gray-600 text-sm">Memnuniyet</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600 mb-2">10K+</div>
                <div className="text-gray-600 text-sm">Mutlu Öğrenci</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">50K+</div>
                <div className="text-gray-600 text-sm">Tamamlanan Ders</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-600 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-white/10 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full animate-pulse delay-500"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              🎯 Hemen Başlayın
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              İngilizce Konuşmaya{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                Başlayın
              </span>
            </h2>
            
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              İlk dersiniz <span className="font-semibold text-yellow-300">ücretsiz</span>! Hemen kayıt olun ve İngilizce konuşma yolculuğunuza başlayın.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/register">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-50 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  <span>Ücretsiz Deneme Başlat</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-4 rounded-xl transition-all duration-300">
                  <span>Planları İncele</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">2 dakikada kayıt</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Güvenli ödeme</span>
              </div>
              
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">İstediğiniz zaman iptal</span>
              </div>
            </div>
          </div>
        </section>

        {/* Native Speaker Application Section */}
        <section className="py-20 bg-gradient-to-br from-indigo-50 via-sky-50 to-green-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-sky-600 to-green-500 mb-4">
                  Are you a Native English Speaker?
                </h2>
                <p className="text-xl text-gray-700 mb-6 max-w-3xl mx-auto">
                  Earn money while teaching English to Turkish students, make new friends and 
                  become part of the SpeakNest community!
                </p>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Earnings</h3>
                    <p className="text-gray-600 text-sm">Fixed rate per lesson</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-8 w-8 text-sky-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexibility</h3>
                    <p className="text-gray-600 text-sm">Set your own schedule</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Community</h3>
                    <p className="text-gray-600 text-sm">Make new friends</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Link href="/apply">
                  <Button size="lg" className="bg-gradient-to-r from-indigo-500 via-sky-400 to-green-400 hover:from-green-400 hover:to-indigo-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                    🎯 Apply as Native Speaker
                  </Button>
                </Link>
                <p className="text-gray-600 mt-4 text-sm">
                  We will review your application and get back to you as soon as possible.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
