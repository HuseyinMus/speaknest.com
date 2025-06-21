'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { Check, Star, Zap, Crown, Users, Clock, Shield, Award } from 'lucide-react';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Başlangıç',
      price: isAnnual ? '159' : '199',
      originalPrice: '199',
      description: 'İngilizce öğrenme yolculuğuna başlamak için ideal',
      icon: <Users className="w-8 h-8" />,
      features: [
        'Haftada 2 grup dersi (45 dk)',
        'Temel kelime kartları (500+ kelime)',
        'Topluluk desteği',
        'Temel seviye materyaller',
        'Haftalık ilerleme raporu',
        'Mobil uygulama erişimi',
      ],
      buttonText: 'Ücretsiz Dene',
      popular: false,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
    },
    {
      name: 'Pro',
      price: isAnnual ? '319' : '399',
      originalPrice: '399',
      description: 'Hızlı ilerleme için en popüler seçenek',
      icon: <Zap className="w-8 h-8" />,
      features: [
        'Haftada 3 grup dersi (45 dk)',
        'Ayda 2 özel ders (30 dk)',
        'Gelişmiş kelime kartları (1000+ kelime)',
        'Tüm seviye materyaller',
        'Öncelikli destek',
        'Haftalık ilerleme raporu',
        'Mobil uygulama erişimi',
        'Kayıtlı ders tekrarı',
      ],
      buttonText: 'Ücretsiz Dene',
      popular: true,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
    },
    {
      name: 'Premium',
      price: isAnnual ? '639' : '799',
      originalPrice: '799',
      description: 'En kapsamlı öğrenme deneyimi',
      icon: <Crown className="w-8 h-8" />,
      features: [
        'Sınırsız grup dersi',
        'Haftada 1 özel ders (45 dk)',
        'Premium kelime kartları (2000+ kelime)',
        'Tüm seviye materyaller',
        '7/24 öncelikli destek',
        'Günlük ilerleme raporu',
        'Mobil uygulama erişimi',
        'Kayıtlı ders tekrarı',
        'Özel çalışma materyalleri',
        'Sertifika programı',
        'Mentorluk desteği',
      ],
      buttonText: 'Ücretsiz Dene',
      popular: false,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
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
                Fiyatlandırma
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-6">
                Sizin İçin En Uygun{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
                  Planı Seçin
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                İngilizce öğrenme hedeflerinize uygun, esnek ve uygun fiyatlı planlarımızla
                konuşma becerinizi geliştirin.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-12">
                <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
                  Aylık
                </span>
                <button
                  onClick={() => setIsAnnual(!isAnnual)}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 ${
                    isAnnual ? 'bg-gradient-to-r from-emerald-500 to-blue-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      isAnnual ? 'translate-x-9' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
                  Yıllık
                  <span className="ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-emerald-100 to-blue-100 text-emerald-700">
                    %20 İndirim
                  </span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={`group relative ${
                    plan.popular ? 'lg:scale-105' : ''
                  }`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${plan.bgColor} rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out`}></div>
                  
                  <div className={`relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform group-hover:-translate-y-2 border border-slate-100/50 overflow-hidden`}>
                    <div className="p-8">
                      {plan.popular && (
                        <div className="text-center mb-6">
                          <div className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                            <Star className="w-4 h-4 mr-1" />
                            En Popüler
                          </div>
                        </div>
                      )}
                      
                      {/* Plan Header */}
                      <div className="text-center mb-8">
                        <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-500 ease-out`}>
                          <div className="text-white">
                            {plan.icon}
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">
                          {plan.name}
                        </h3>
                        <p className="text-slate-600">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-4xl font-bold text-slate-800">
                            ₺{isAnnual ? (parseInt(plan.price) * 12).toString() : plan.price}
                          </span>
                          <span className="text-slate-600">{isAnnual ? '/yıl' : '/ay'}</span>
                        </div>
                        {isAnnual && (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm text-slate-500 line-through">
                              ₺{parseInt(plan.originalPrice) * 12}
                            </span>
                            <span className="text-sm text-emerald-600 font-semibold">
                              %20 tasarruf
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start">
                            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-slate-600 text-sm leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <Link href="/register">
                        <Button
                          className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                            plan.popular
                              ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {plan.buttonText}
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Button>
                      </Link>
                    </div>
                    
                    {/* Decorative line */}
                    <div className={`h-1 bg-gradient-to-r ${plan.color} transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 ease-out`}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100/50">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-slate-800">14 Gün Para İade Garantisi</h4>
                  <p className="text-slate-600 text-sm">Memnun kalmazsanız ücretinizi iade ediyoruz</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white/50 backdrop-blur-sm relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200 to-transparent rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200 to-transparent rounded-full opacity-20 animate-pulse delay-1000"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                SSS
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-4">
                Sıkça Sorulan Sorular
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Aklınızdaki soruların cevaplarını burada bulabilirsiniz.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-1 border border-slate-100/50">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
                  Planlar arasında geçiş yapabilir miyim?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Evet, istediğiniz zaman planınızı yükseltebilir veya düşürebilirsiniz.
                  Değişiklik bir sonraki fatura döneminde geçerli olacaktır.
                </p>
              </div>
              
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-1 border border-slate-100/50">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
                  İade politikası nedir?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  İlk 14 gün içinde memnun kalmazsanız, ücretinizi iade ediyoruz.
                  Herhangi bir soru işaretiniz varsa bizimle iletişime geçebilirsiniz.
                </p>
              </div>
              
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-1 border border-slate-100/50">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
                  Ödeme seçenekleri nelerdir?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz.
                  Tüm ödemeler güvenli ödeme sistemleri üzerinden gerçekleştirilir.
                </p>
              </div>
              
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 ease-out transform hover:-translate-y-1 border border-slate-100/50">
                <h3 className="text-xl font-semibold text-slate-800 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
                  Ders programı nasıl belirlenir?
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Seviyenize ve tercihlerinize göre size uygun ders programı oluşturulur.
                  Esnek saat seçenekleri ile size en uygun zamanı seçebilirsiniz.
                </p>
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
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
              🚀 Hemen Başlayın
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              İngilizce Konuşma Becerinizi{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                Geliştirin
              </span>
            </h2>
            
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              En uygun planı seçin ve hemen pratik yapmaya başlayın.
              <span className="font-semibold text-yellow-300"> İlk dersiniz ücretsiz!</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-50 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  <span>Ücretsiz Deneme Başlat</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-4 rounded-xl transition-all duration-300">
                  <span>Bize Ulaşın</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 