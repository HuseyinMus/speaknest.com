'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { 
  MessageSquare, 
  Headphones, 
  Video, 
  BookOpen,
  Users,
  Mic,
  Globe,
  Calendar,
  Clock,
  Star,
  Play,
  Target,
  Zap,
  Award,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function PracticesPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState('Pazartesi');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const practiceTypes = [
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'Birebir Konuşma',
      description: 'Ana dili İngilizce olan eğitmenlerle birebir konuşma pratiği yapın.',
      features: [
        'Kişiselleştirilmiş ders programı',
        'Anlık geri bildirim',
        'Telaffuz düzeltmeleri',
        'Esnek saat seçenekleri',
        'Seviye uyumlu içerik',
        'Kayıtlı ders tekrarı'
      ],
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      bgColor: 'from-emerald-50 to-blue-50',
      price: '₺150',
      duration: '45 dk',
      rating: 4.9,
      students: 1200
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Grup Dersleri',
      description: 'Diğer öğrencilerle birlikte pratik yapma fırsatı yakalayın.',
      features: [
        'Maksimum 4 kişilik gruplar',
        'Günlük konuşma pratiği',
        'Sosyal öğrenme ortamı',
        'Uygun fiyatlı dersler',
        'Farklı seviyeler',
        'Haftalık ilerleme raporu'
      ],
      gradient: 'from-blue-400 via-indigo-500 to-purple-500',
      bgColor: 'from-blue-50 to-purple-50',
      price: '₺80',
      duration: '60 dk',
      rating: 4.7,
      students: 2800
    },
    {
      icon: <Headphones className="h-8 w-8" />,
      title: 'Dinleme Pratiği',
      description: 'İngilizce dinleme becerinizi geliştirin.',
      features: [
        'Farklı aksanlarda dinleme',
        'Günlük konuşma örnekleri',
        'Altyazılı videolar',
        'Dinleme alıştırmaları',
        'Ses hızı ayarlama',
        'Kelime öğrenme'
      ],
      gradient: 'from-purple-400 via-pink-500 to-rose-500',
      bgColor: 'from-purple-50 to-pink-50',
      price: '₺60',
      duration: '30 dk',
      rating: 4.8,
      students: 950
    },
    {
      icon: <Mic className="h-8 w-8" />,
      title: 'Telaffuz Pratiği',
      description: 'Doğru telaffuz için özel dersler.',
      features: [
        'Ses kayıtları',
        'Telaffuz düzeltmeleri',
        'Aksan geliştirme',
        'Konuşma alıştırmaları',
        'Fonetik dersleri',
        'Aksan analizi'
      ],
      gradient: 'from-rose-400 via-orange-500 to-amber-500',
      bgColor: 'from-pink-50 to-emerald-50',
      price: '₺100',
      duration: '45 dk',
      rating: 4.9,
      students: 750
    }
  ];

  const schedule = [
    {
      day: 'Pazartesi',
      classes: [
        { time: '09:00', type: 'Birebir', level: 'Başlangıç', teacher: 'Sarah Johnson', available: true },
        { time: '11:00', type: 'Grup', level: 'Orta', teacher: 'Mike Wilson', available: true },
        { time: '14:00', type: 'Birebir', level: 'İleri', teacher: 'Emma Davis', available: false },
        { time: '16:00', type: 'Grup', level: 'Başlangıç', teacher: 'John Smith', available: true },
        { time: '18:00', type: 'Telaffuz', level: 'Orta', teacher: 'Lisa Brown', available: true }
      ]
    },
    {
      day: 'Salı',
      classes: [
        { time: '10:00', type: 'Grup', level: 'Orta', teacher: 'David Miller', available: true },
        { time: '13:00', type: 'Birebir', level: 'Başlangıç', teacher: 'Anna Taylor', available: true },
        { time: '15:00', type: 'Grup', level: 'İleri', teacher: 'Robert Johnson', available: false },
        { time: '17:00', type: 'Birebir', level: 'Orta', teacher: 'Maria Garcia', available: true },
        { time: '19:00', type: 'Dinleme', level: 'Başlangıç', teacher: 'James Wilson', available: true }
      ]
    },
    {
      day: 'Çarşamba',
      classes: [
        { time: '09:30', type: 'Birebir', level: 'İleri', teacher: 'Jennifer Lee', available: true },
        { time: '11:30', type: 'Grup', level: 'Başlangıç', teacher: 'Thomas Anderson', available: true },
        { time: '14:30', type: 'Telaffuz', level: 'Orta', teacher: 'Amanda White', available: true },
        { time: '16:30', type: 'Grup', level: 'Orta', teacher: 'Christopher Brown', available: false },
        { time: '18:30', type: 'Birebir', level: 'Başlangıç', teacher: 'Jessica Davis', available: true }
      ]
    },
    {
      day: 'Perşembe',
      classes: [
        { time: '10:30', type: 'Dinleme', level: 'Orta', teacher: 'Daniel Martinez', available: true },
        { time: '13:30', type: 'Grup', level: 'İleri', teacher: 'Rachel Green', available: true },
        { time: '15:30', type: 'Birebir', level: 'Orta', teacher: 'Kevin Thompson', available: true },
        { time: '17:30', type: 'Telaffuz', level: 'Başlangıç', teacher: 'Nicole Adams', available: false },
        { time: '19:30', type: 'Grup', level: 'Orta', teacher: 'Steven Clark', available: true }
      ]
    },
    {
      day: 'Cuma',
      classes: [
        { time: '09:00', type: 'Birebir', level: 'Başlangıç', teacher: 'Michelle Rodriguez', available: true },
        { time: '11:00', type: 'Grup', level: 'Orta', teacher: 'Andrew Lewis', available: true },
        { time: '14:00', type: 'Dinleme', level: 'İleri', teacher: 'Stephanie Hall', available: true },
        { time: '16:00', type: 'Birebir', level: 'Orta', teacher: 'Ryan Turner', available: true },
        { time: '18:00', type: 'Grup', level: 'Başlangıç', teacher: 'Lauren Scott', available: false }
      ]
    }
  ];

  const getCurrentDay = () => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[currentTime.getDay()];
  };

  const isClassActive = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const classTime = new Date();
    classTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const diff = Math.abs(classTime.getTime() - now.getTime()) / (1000 * 60); // dakika cinsinden fark
    
    return diff <= 30; // 30 dakika içindeyse aktif
  };

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
                Pratik Seçenekleri
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-6">
                İngilizce{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
                  Pratik Yapın
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Farklı pratik seçenekleriyle İngilizce konuşma becerinizi geliştirin.
                Size en uygun pratik yöntemini seçin ve hemen başlayın.
              </p>

              {/* Live Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">2,847</h3>
                  <p className="text-slate-600 text-sm">Aktif Öğrenci</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">156</h3>
                  <p className="text-slate-600 text-sm">Bugünkü Ders</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">4.8</h3>
                  <p className="text-slate-600 text-sm">Ortalama Puan</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">89%</h3>
                  <p className="text-slate-600 text-sm">Başarı Oranı</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Practice Types Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full text-emerald-700 text-sm font-medium mb-4">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Pratik Türleri
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-4">
                Size Uygun Pratik Türünü Seçin
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Farklı öğrenme stillerine uygun pratik seçenekleri sunuyoruz.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {practiceTypes.map((type, index) => (
                <div key={index} className="group relative">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${type.bgColor} rounded-3xl transform group-hover:scale-105 transition-all duration-500 ease-out`}></div>
                  
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-out transform group-hover:-translate-y-2 border border-slate-100/50 overflow-hidden">
                    {/* Gradient Header */}
                    <div className={`relative h-64 bg-gradient-to-br ${type.gradient} overflow-hidden`}>
                      {/* Animated background elements */}
                      <div className="absolute inset-0">
                        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full animate-pulse delay-300"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full animate-pulse delay-500"></div>
                      </div>
                      
                      {/* Icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 ease-out">
                          <div className="text-white">
                            {type.icon}
                          </div>
                        </div>
                      </div>
                      
                      {/* Price Badge */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-800">{type.price}</div>
                          <div className="text-xs text-slate-600">{type.duration}</div>
                        </div>
                      </div>
                      
                      {/* Rating Badge */}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold text-slate-800">{type.rating}</span>
                      </div>
                      
                      {/* Decorative lines */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                    </div>
                    
                    <div className="p-8">
                      <div className="flex items-center mb-6">
                        <div className={`w-16 h-16 bg-gradient-to-br ${type.gradient} rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-500 ease-out shadow-lg`}>
                          <div className="text-white">
                            {type.icon}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800 mb-2">
                            {type.title}
                          </h3>
                          <p className="text-slate-600">{type.description}</p>
                        </div>
                      </div>
                      
                      <ul className="space-y-3 mb-6">
                        {type.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center text-slate-600">
                            <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-sm text-slate-500">
                          <span className="font-semibold">{type.students}</span> öğrenci katıldı
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-semibold text-slate-800">{type.rating}</span>
                        </div>
                      </div>
                      
                      <Link href="/register">
                        <Button className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                          <span>Hemen Başla</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                    
                    {/* Decorative line */}
                    <div className={`h-1 bg-gradient-to-r ${type.gradient} transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 ease-out`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Schedule Section */}
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
                Canlı Program
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-emerald-600 to-blue-600 mb-4">
                Haftalık Ders Programı
              </h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
                Size uygun zamanı seçin ve hemen pratik yapmaya başlayın.
              </p>
              
              {/* Current Time Display */}
              <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-100/50 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-slate-800">Şu Anki Zaman</h4>
                  <p className="text-slate-600 text-sm">
                    {getCurrentDay()}, {currentTime.toLocaleTimeString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Day Selector */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {schedule.map((day, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDay(day.day)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    selectedDay === day.day
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                      : 'bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white shadow-md border border-slate-100/50'
                  }`}
                >
                  {day.day}
                </button>
              ))}
            </div>
            
            {/* Schedule Grid */}
            <div className="grid lg:grid-cols-1 gap-6">
              {schedule
                .filter(day => day.day === selectedDay)
                .map((day, index) => (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-slate-100/50">
                    <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                      {day.day} Programı
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {day.classes.map((class_, classIndex) => (
                        <div
                          key={classIndex}
                          className={`group relative p-6 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                            isClassActive(class_.time)
                              ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                              : class_.available
                              ? 'bg-white shadow-lg hover:shadow-xl border border-slate-100/50'
                              : 'bg-slate-100 text-slate-500 shadow-md'
                          }`}
                        >
                          {isClassActive(class_.time) && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                          )}
                          
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <Clock className={`h-5 w-5 mr-2 ${
                                isClassActive(class_.time) ? 'text-white' : 'text-emerald-600'
                              }`} />
                              <span className={`font-bold text-lg ${
                                isClassActive(class_.time) ? 'text-white' : 'text-slate-800'
                              }`}>
                                {class_.time}
                              </span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              isClassActive(class_.time)
                                ? 'bg-white/20 text-white'
                                : class_.available
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {class_.type}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className={`font-semibold ${
                              isClassActive(class_.time) ? 'text-white' : 'text-slate-800'
                            }`}>
                              {class_.teacher}
                            </div>
                            <div className={`text-sm ${
                              isClassActive(class_.time) ? 'text-white/90' : 'text-slate-600'
                            }`}>
                              Seviye: {class_.level}
                            </div>
                            <div className={`text-sm ${
                              isClassActive(class_.time) ? 'text-white/90' : 'text-slate-600'
                            }`}>
                              {class_.available ? 'Müsait' : 'Dolu'}
                            </div>
                          </div>
                          
                          {class_.available && !isClassActive(class_.time) && (
                            <button className="mt-4 w-full py-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105">
                              Katıl
                            </button>
                          )}
                          
                          {isClassActive(class_.time) && (
                            <button className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105">
                              <Play className="w-4 h-4 inline mr-2" />
                              Canlı Derse Katıl
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
              Hemen Pratik Yapmaya{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                Başlayın
              </span>
            </h2>
            
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Size en uygun pratik yöntemini seçin ve ilk dersinizi ücretsiz deneyin.
              <span className="font-semibold text-yellow-300"> Hemen başlayın!</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-emerald-600 hover:bg-gray-50 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  <span>Ücretsiz Deneme Başlat</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold px-8 py-4 rounded-xl transition-all duration-300">
                  <span>Planları İncele</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 