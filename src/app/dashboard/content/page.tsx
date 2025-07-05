"use client";

import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, updateDoc, doc, deleteDoc, addDoc, setDoc } from 'firebase/firestore';
import { FileText, Search, Filter, Eye, Edit, Trash2, Plus, BookOpen, MessageSquare, Star, Users, Calendar, Tag, Clock, CheckCircle } from 'lucide-react';

interface WordGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  level: string;
  words: string[];
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  isActive: boolean;
  wordCount?: number;
}

interface Testimonial {
  id: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  createdAt: any;
  approved: boolean;
  userId?: string;
}

interface ContentStats {
  totalWordGroups: number;
  totalTestimonials: number;
  pendingTestimonials: number;
  activeWordGroups: number;
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState<'wordgroups' | 'testimonials'>('wordgroups');
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<WordGroup | Testimonial | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'add' | 'addWord' | 'addDetailedWord'>('view');
  const [message, setMessage] = useState('');
  const [newWord, setNewWord] = useState('');
  const [newDetailedWord, setNewDetailedWord] = useState({
    english: '',
    turkish: '',
    example: '',
    pronunciation: '',
    imageUrl: '',
    synonyms: '',
    antonyms: '',
    tags: ''
  });
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [images, setImages] = useState<Array<{id: string, url: string}>>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [imageSource, setImageSource] = useState<'unsplash' | 'pixabay' | 'pexels' | 'upload'>('unsplash');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for adding/editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    level: 'beginner',
    words: '',
    isActive: true
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Fetch word groups
      const wordGroupsQuery = query(collection(db, 'wordGroups'), orderBy('createdAt', 'desc'));
      const wordGroupsSnapshot = await getDocs(wordGroupsQuery);
      const wordGroupsData = wordGroupsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
          level: data.level || 'beginner',
          words: Array.isArray(data.words) ? data.words : [],
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date(),
          createdBy: data.createdBy || 'admin',
          isActive: data.isActive !== undefined ? data.isActive : true,
          wordCount: data.wordCount || 0
        };
      }) as WordGroup[];
      setWordGroups(wordGroupsData);

      // Fetch testimonials
      const testimonialsQuery = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
      const testimonialsSnapshot = await getDocs(testimonialsQuery);
      const testimonialsData = testimonialsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          rating: data.rating || 0,
          comment: data.comment || '',
          createdAt: data.createdAt || new Date(),
          approved: data.approved !== undefined ? data.approved : false,
          userId: data.userId || ''
        };
      }) as Testimonial[];
      setTestimonials(testimonialsData);
    } catch (err) {
      setError('İçerik yüklenirken hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWordGroup = async () => {
    try {
      const wordsArray = (formData.words || '').split(',').map(word => word.trim()).filter(word => word);
      
      await addDoc(collection(db, 'wordGroups'), {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        words: wordsArray,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin',
        isActive: formData.isActive
      });

      setMessage('Kelime grubu başarıyla eklendi.');
      setShowModal(false);
      resetForm();
      fetchContent();
    } catch (error: any) {
      setError('Kelime grubu eklenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleUpdateWordGroup = async (id: string) => {
    try {
      const wordsArray = (formData.words || '').split(',').map(word => word.trim()).filter(word => word);
      
      await updateDoc(doc(db, 'wordGroups', id), {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        words: wordsArray,
        updatedAt: new Date(),
        isActive: formData.isActive
      });

      setMessage('Kelime grubu başarıyla güncellendi.');
      setShowModal(false);
      resetForm();
      fetchContent();
    } catch (error: any) {
      setError('Kelime grubu güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleDeleteWordGroup = async (id: string) => {
    if (!confirm('Bu kelime grubunu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'wordGroups', id));
      setMessage('Kelime grubu başarıyla silindi.');
      fetchContent();
    } catch (error: any) {
      setError('Kelime grubu silinemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleTestimonialStatus = async (id: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'testimonials', id), { approved });
      setMessage(`Yorum ${approved ? 'onaylandı' : 'reddedildi'}.`);
      fetchContent();
    } catch (error: any) {
      setError('Yorum durumu güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'testimonials', id));
      setMessage('Yorum başarıyla silindi.');
      fetchContent();
    } catch (error: any) {
      setError('Yorum silinemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleAddWord = async (groupId: string) => {
    if (!newWord.trim()) {
      setError('Lütfen bir kelime girin.');
      return;
    }

    try {
      const wordGroup = wordGroups.find(wg => wg.id === groupId);
      if (!wordGroup) {
        setError('Kelime grubu bulunamadı.');
        return;
      }

      const currentWords = Array.isArray(wordGroup.words) ? wordGroup.words : [];
      const updatedWords = [...currentWords, newWord.trim()];

      await updateDoc(doc(db, 'wordGroups', groupId), {
        words: updatedWords,
        updatedAt: new Date()
      });

      setMessage('Kelime başarıyla eklendi.');
      setNewWord('');
      setShowModal(false);
      fetchContent();
    } catch (error: any) {
      setError('Kelime eklenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleRemoveWord = async (groupId: string, wordToRemove: string) => {
    if (!confirm(`"${wordToRemove}" kelimesini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const wordGroup = wordGroups.find(wg => wg.id === groupId);
      if (!wordGroup) {
        setError('Kelime grubu bulunamadı.');
        return;
      }

      const currentWords = Array.isArray(wordGroup.words) ? wordGroup.words : [];
      const updatedWords = currentWords.filter(word => word !== wordToRemove);

      await updateDoc(doc(db, 'wordGroups', groupId), {
        words: updatedWords,
        updatedAt: new Date()
      });

      setMessage('Kelime başarıyla silindi.');
      fetchContent();
    } catch (error: any) {
      setError('Kelime silinemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  // Görsel arama fonksiyonu
  const fetchImage = async (word: string) => {
    setIsLoadingImage(true);
    setImageError('');
    try {
      let url = '';
      let images: any[] = [];
      if (imageSource === 'unsplash') {
        url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(word)}&client_id=YOUR_UNSPLASH_API_KEY&per_page=5`;
        const response = await fetch(url);
        const data = await response.json();
        images = data.results?.map((img: any) => ({ id: img.id, url: img.urls.regular })) || [];
      } else if (imageSource === 'pixabay') {
        url = `https://pixabay.com/api/?key=YOUR_PIXABAY_API_KEY&q=${encodeURIComponent(word)}&image_type=photo&per_page=5`;
        const response = await fetch(url);
        const data = await response.json();
        images = data.hits?.map((img: any) => ({ id: img.id, url: img.webformatURL })) || [];
      } else if (imageSource === 'pexels') {
        url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(word)}&per_page=5`;
        const response = await fetch(url, { headers: { Authorization: 'YOUR_PEXELS_API_KEY' } });
        const data = await response.json();
        images = data.photos?.map((img: any) => ({ id: img.id, url: img.src.medium })) || [];
      }
      
      // Görselleri sıkıştır
      const compressedImages = await Promise.all(
        images.map(async (img) => {
          try {
            const compressedUrl = await compressImageFromUrl(img.url, 800, 0.7);
            return { ...img, url: compressedUrl };
          } catch (error) {
            console.error('Görsel sıkıştırma hatası:', error);
            return img;
          }
        })
      );
      
      setImages(compressedImages);
      if (compressedImages.length > 0) {
        setSelectedImageUrl(compressedImages[0].url);
        setNewDetailedWord(w => ({ ...w, imageUrl: compressedImages[0].url }));
      } else {
        setImageError('Bu kelime için resim bulunamadı');
      }
    } catch (error) {
      setImageError('Resim getirilirken hata!');
    } finally {
      setIsLoadingImage(false);
    }
  };

  // URL'den görsel sıkıştırma
  const compressImageFromUrl = (url: string, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context oluşturulamadı'));
          return;
        }
        
        // Boyut hesaplama
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Görseli çiz
        ctx.drawImage(img, 0, 0, width, height);
        
        // Sıkıştırılmış görseli al
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Boyut kontrolü
        const base64Length = compressedDataUrl.length - 'data:image/jpeg;base64,'.length;
        const sizeInBytes = Math.ceil(base64Length * 3 / 4);
        
        if (sizeInBytes > 800000) { // 800KB limit
          reject(new Error('Görsel çok büyük'));
          return;
        }
        
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Görsel yüklenemedi'));
      };
      
      img.src = url;
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Dosya boyutu kontrolü (1MB = 1048576 bytes)
      if (file.size > 1048576) {
        setImageError('Dosya boyutu 1MB\'dan küçük olmalıdır. Lütfen daha küçük bir görsel seçin.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        compressImage(result, 800, 0.7); // 800px genişlik, %70 kalite
      };
      reader.readAsDataURL(file);
    }
  };

  // Görsel sıkıştırma fonksiyonu
  const compressImage = (dataUrl: string, maxWidth: number, quality: number) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setImageError('Görsel işlenirken hata oluştu.');
        return;
      }
      
      // Boyut hesaplama
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Görseli çiz
      ctx.drawImage(img, 0, 0, width, height);
      
      // Sıkıştırılmış görseli al
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Boyut kontrolü
      const base64Length = compressedDataUrl.length - 'data:image/jpeg;base64,'.length;
      const sizeInBytes = Math.ceil(base64Length * 3 / 4);
      
      if (sizeInBytes > 800000) { // 800KB limit
        setImageError('Görsel çok büyük. Lütfen daha küçük bir görsel seçin.');
        return;
      }
      
      setUploadedImage(compressedDataUrl);
      setSelectedImageUrl(compressedDataUrl);
      setNewDetailedWord(w => ({ ...w, imageUrl: compressedDataUrl }));
      setImageError('');
    };
    
    img.onerror = () => {
      setImageError('Görsel yüklenirken hata oluştu.');
    };
    
    img.src = dataUrl;
  };

  // Sürükle-bırak ile görsel yükleme güncellendi
  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      // Dosya boyutu kontrolü
      if (file.size > 1048576) {
        setImageError('Dosya boyutu 1MB\'dan küçük olmalıdır. Lütfen daha küçük bir görsel seçin.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        compressImage(result, 800, 0.7);
      };
      reader.readAsDataURL(file);
    }
  };

  // Detaylı kelime ekleme fonksiyonu
  const handleAddDetailedWord = async (groupId: string) => {
    if (!newDetailedWord.english.trim() || !newDetailedWord.turkish.trim()) {
      setError('İngilizce ve Türkçe kelime alanları zorunludur.');
      return;
    }

    // Görsel boyut kontrolü
    if (newDetailedWord.imageUrl) {
      const base64Length = newDetailedWord.imageUrl.length - 'data:image/jpeg;base64,'.length;
      const sizeInBytes = Math.ceil(base64Length * 3 / 4);
      
      if (sizeInBytes > 800000) { // 800KB limit
        setError('Görsel boyutu çok büyük. Lütfen daha küçük bir görsel seçin.');
        return;
      }
    }

    try {
      const wordData = {
        english: newDetailedWord.english.trim(),
        turkish: newDetailedWord.turkish.trim(),
        example: newDetailedWord.example.trim(),
        pronunciation: newDetailedWord.pronunciation.trim(),
        imageUrl: newDetailedWord.imageUrl,
        synonyms: newDetailedWord.synonyms.split(',').map(s => s.trim()).filter(Boolean),
        antonyms: newDetailedWord.antonyms.split(',').map(a => a.trim()).filter(Boolean),
        tags: newDetailedWord.tags.split(',').map(t => t.trim()).filter(Boolean),
        createdAt: new Date()
      };

      // Firestore'a ekle
      const wordRef = doc(collection(db, 'wordGroups', groupId, 'words'));
      await setDoc(wordRef, wordData);

      // Kelime sayısını güncelle
      const groupDoc = doc(db, 'wordGroups', groupId);
      const currentGroup = wordGroups.find(g => g.id === groupId);
      await updateDoc(groupDoc, { 
        wordCount: (currentGroup?.wordCount || 0) + 1,
        updatedAt: new Date()
      });

      setMessage('Detaylı kelime başarıyla eklendi.');
      setNewDetailedWord({
        english: '',
        turkish: '',
        example: '',
        pronunciation: '',
        imageUrl: '',
        synonyms: '',
        antonyms: '',
        tags: ''
      });
      setImages([]);
      setSelectedImageUrl('');
      setShowModal(false);
      fetchContent();
    } catch (error: any) {
      setError('Detaylı kelime eklenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      level: 'beginner',
      words: '',
      isActive: true
    });
  };

  const openModal = (type: 'view' | 'edit' | 'add' | 'addWord' | 'addDetailedWord', item?: WordGroup | Testimonial) => {
    setModalType(type);
    setSelectedItem(item || null);
    setNewWord('');
    
    if (type === 'edit' && item && 'name' in item) {
      const wordGroup = item as WordGroup;
      setFormData({
        name: wordGroup.name,
        description: wordGroup.description,
        category: wordGroup.category,
        level: wordGroup.level,
        words: Array.isArray(wordGroup.words) ? wordGroup.words.join(', ') : '',
        isActive: wordGroup.isActive
      });
    } else if (type === 'add') {
      resetForm();
    }
    
    setShowModal(true);
  };

  const filteredWordGroups = (Array.isArray(wordGroups) ? wordGroups : []).filter(group => {
    const matchesSearch = 
      (group.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || group.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && group.isActive) || 
      (statusFilter === 'inactive' && !group.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredTestimonials = (Array.isArray(testimonials) ? testimonials : []).filter(testimonial => {
    const matchesSearch = 
      (testimonial.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (testimonial.comment || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && testimonial.approved) || 
      (statusFilter === 'pending' && !testimonial.approved);
    
    return matchesSearch && matchesStatus;
  });

  const getStats = (): ContentStats => {
    return {
      totalWordGroups: Array.isArray(wordGroups) ? wordGroups.length : 0,
      totalTestimonials: Array.isArray(testimonials) ? testimonials.length : 0,
      pendingTestimonials: Array.isArray(testimonials) ? testimonials.filter(t => !t.approved).length : 0,
      activeWordGroups: Array.isArray(wordGroups) ? wordGroups.filter(w => w.isActive).length : 0
    };
  };

  const stats = getStats();

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString('tr-TR');
  };

  const getLevelBadge = (level: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      beginner: 'Başlangıç',
      intermediate: 'Orta',
      advanced: 'İleri'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[level as keyof typeof labels] || level}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">İçerik yükleniyor...</div>
      </div>
    );
  }

  // Test mesajı - sayfanın çalışıp çalışmadığını kontrol etmek için
  console.log('ContentPage component rendered');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">İçerik Yönetimi</h1>
            <p className="text-gray-600">Kelime grupları ve yorumları yönetin</p>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Kelime Grubu</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWordGroups}</p>
            </div>
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktif Kelime Grupları</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeWordGroups}</p>
            </div>
            <Tag className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Yorum</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTestimonials}</p>
            </div>
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bekleyen Yorumlar</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTestimonials}</p>
            </div>
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('wordgroups')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'wordgroups'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Kelime Grupları
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'testimonials'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Yorumlar
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Filtreler */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'wordgroups' ? 'Kelime grubu ara...' : 'Yorum ara...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {activeTab === 'wordgroups' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Filtresi</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Kategoriler</option>
                  <option value="günlük hayat">Günlük Hayat</option>
                  <option value="iş">İş</option>
                  <option value="eğitim">Eğitim</option>
                  <option value="seyahat">Seyahat</option>
                  <option value="yemek">Yemek</option>
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Durum Filtresi</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {activeTab === 'wordgroups' ? (
                  <>
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                  </>
                ) : (
                  <>
                    <option value="all">Tüm Durumlar</option>
                    <option value="approved">Onaylandı</option>
                    <option value="pending">Beklemede</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Mesajlar */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
          )}

          {/* Kelime Grupları Tab */}
          {activeTab === 'wordgroups' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Kelime Grupları</h3>
                <button
                  onClick={() => openModal('add')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Kelime Grubu
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kelime Grubu
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seviye
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredWordGroups.length > 0 ? (
                        filteredWordGroups.map((group) => (
                          <tr key={group.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{group.name}</div>
                                <div className="text-sm text-gray-500">{group.description}</div>
                                <div className="text-xs text-gray-400">{Array.isArray(group.words) ? group.words.length : 0} kelime</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">{group.category}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getLevelBadge(group.level)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                group.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {group.isActive ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => openModal('view', group)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                                title="Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => openModal('edit', group)}
                                className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs"
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => openModal('addWord', group)}
                                className="text-purple-600 hover:text-purple-900 bg-purple-50 px-2 py-1 rounded text-xs"
                                title="Kelime Ekle"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => openModal('addDetailedWord', group)}
                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded text-xs"
                                title="Detaylı Kelime Ekle"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteWordGroup(group.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            Kelime grubu bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Yorumlar Tab */}
          {activeTab === 'testimonials' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Yorumları</h3>

              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kullanıcı
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Yorum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Puan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTestimonials.length > 0 ? (
                        filteredTestimonials.map((testimonial) => (
                          <tr key={testimonial.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{testimonial.name}</div>
                                <div className="text-sm text-gray-500">{testimonial.email}</div>
                                <div className="text-xs text-gray-400">{formatTimestamp(testimonial.createdAt)}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 max-w-xs truncate">
                                {testimonial.comment}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                <span className="text-sm text-gray-900">{testimonial.rating}/5</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                testimonial.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {testimonial.approved ? 'Onaylandı' : 'Beklemede'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => openModal('view', testimonial)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                                title="Görüntüle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {!testimonial.approved && (
                                <button
                                  onClick={() => handleTestimonialStatus(testimonial.id, true)}
                                  className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs"
                                  title="Onayla"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDeleteTestimonial(testimonial.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            Yorum bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center sticky top-0 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-800">
                {modalType === 'add' ? 'Yeni Kelime Grubu Ekle' :
                 modalType === 'edit' ? 'Kelime Grubunu Düzenle' :
                 modalType === 'addWord' ? 'Kelime Ekle' :
                 modalType === 'addDetailedWord' ? 'Detaylı Kelime Ekle' :
                 activeTab === 'wordgroups' ? 'Kelime Grubu Detayları' : 'Yorum Detayları'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedItem(null);
                  resetForm();
                  setNewWord('');
                  setNewDetailedWord({
                    english: '',
                    turkish: '',
                    example: '',
                    pronunciation: '',
                    imageUrl: '',
                    synonyms: '',
                    antonyms: '',
                    tags: ''
                  });
                  setImages([]);
                  setSelectedImageUrl('');
                }}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === 'wordgroups' && (modalType === 'add' || modalType === 'edit') ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kelime Grubu Adı</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Kelime grubu adını girin"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Kelime grubu açıklamasını girin"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Kategori seçin</option>
                        <option value="günlük hayat">Günlük Hayat</option>
                        <option value="iş">İş</option>
                        <option value="eğitim">Eğitim</option>
                        <option value="seyahat">Seyahat</option>
                        <option value="yemek">Yemek</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Seviye</label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="beginner">Başlangıç</option>
                        <option value="intermediate">Orta</option>
                        <option value="advanced">İleri</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                      <select
                        value={formData.isActive ? 'active' : 'inactive'}
                        onChange={(e) => setFormData({...formData, isActive: e.target.value === 'active'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Aktif</option>
                        <option value="inactive">Pasif</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kelimeler (virgülle ayırın)</label>
                    <textarea
                      value={formData.words}
                      onChange={(e) => setFormData({...formData, words: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="hello, world, example, test"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedItem(null);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      onClick={() => modalType === 'add' ? handleAddWordGroup() : handleUpdateWordGroup(selectedItem!.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {modalType === 'add' ? 'Ekle' : 'Güncelle'}
                    </button>
                  </div>
                </div>
              ) : modalType === 'addWord' && selectedItem && 'name' in selectedItem ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Kelime Grubu: {selectedItem.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">Bu kelime grubuna yeni kelimeler ekleyebilirsiniz.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Kelime</label>
                    <input
                      type="text"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Yeni kelimeyi girin"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddWord(selectedItem.id);
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-800 mb-3">Mevcut Kelimeler</h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {'words' in selectedItem && Array.isArray(selectedItem.words) && selectedItem.words.length > 0 ? (
                          selectedItem.words.map((word: string, index: number) => (
                            <div key={index} className="bg-white px-3 py-2 rounded-lg border flex items-center gap-2">
                              <span className="text-sm">{word}</span>
                              <button
                                onClick={() => handleRemoveWord(selectedItem.id, word)}
                                className="text-red-500 hover:text-red-700 text-xs"
                                title="Kelimeyi Sil"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Henüz kelime eklenmemiş.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedItem(null);
                        setNewWord('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      onClick={() => handleAddWord(selectedItem.id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Kelime Ekle
                    </button>
                  </div>
                </div>
              ) : modalType === 'addDetailedWord' && selectedItem && 'name' in selectedItem ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Kelime Grubu: {selectedItem.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">Bu kelime grubuna detaylı kelime bilgileri ile yeni kelimeler ekleyebilirsiniz.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">İngilizce Kelime <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newDetailedWord.english}
                            onChange={(e) => setNewDetailedWord({...newDetailedWord, english: e.target.value})}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="İngilizce kelimeyi girin"
                          />
                          <button
                            type="button"
                            onClick={() => fetchImage(newDetailedWord.english)}
                            disabled={isLoadingImage || !newDetailedWord.english.trim()}
                            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                          >
                            {isLoadingImage ? 'Aranıyor...' : 'Görsel Ara'}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Türkçe Anlamı <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={newDetailedWord.turkish}
                          onChange={(e) => setNewDetailedWord({...newDetailedWord, turkish: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Türkçe anlamını girin"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Örnek Cümle</label>
                        <textarea
                          value={newDetailedWord.example}
                          onChange={(e) => setNewDetailedWord({...newDetailedWord, example: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                          placeholder="Örnek cümle girin"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telaffuz</label>
                        <input
                          type="text"
                          value={newDetailedWord.pronunciation}
                          onChange={(e) => setNewDetailedWord({...newDetailedWord, pronunciation: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Telaffuzunu girin (örn: /həˈloʊ/)"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Görsel Kaynağı</label>
                        <div className="flex gap-2 mb-2">
                          <select
                            value={imageSource}
                            onChange={(e) => setImageSource(e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="unsplash">Unsplash</option>
                            <option value="pixabay">Pixabay</option>
                            <option value="pexels">Pexels</option>
                            <option value="upload">Yükle</option>
                          </select>
                          {imageSource === 'upload' && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                              Dosya Seç
                            </button>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileInput}
                          />
                        </div>
                        
                        {imageSource === 'upload' && (
                          <div
                            onDrop={handleImageDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center"
                          >
                            <p className="text-sm text-gray-500">Görseli buraya sürükleyin veya dosya seçin</p>
                            <p className="text-xs text-gray-400 mt-1">Maksimum dosya boyutu: 1MB</p>
                            <p className="text-xs text-gray-400">Önerilen boyut: 800px genişlik</p>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Eş Anlamlılar</label>
                        <input
                          type="text"
                          value={newDetailedWord.synonyms}
                          onChange={(e) => setNewDetailedWord({...newDetailedWord, synonyms: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Eş anlamlıları virgülle ayırın"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Zıt Anlamlılar</label>
                        <input
                          type="text"
                          value={newDetailedWord.antonyms}
                          onChange={(e) => setNewDetailedWord({...newDetailedWord, antonyms: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Zıt anlamlıları virgülle ayırın"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Etiketler</label>
                        <input
                          type="text"
                          value={newDetailedWord.tags}
                          onChange={(e) => setNewDetailedWord({...newDetailedWord, tags: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Etiketleri virgülle ayırın"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Görsel Seçimi */}
                  {(images.length > 0 || selectedImageUrl) && (
                    <div>
                      <h5 className="font-medium text-gray-800 mb-3">Görsel Seçimi</h5>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {images.map((img) => (
                          <div
                            key={img.id}
                            onClick={() => {
                              setSelectedImageUrl(img.url);
                              setNewDetailedWord(w => ({ ...w, imageUrl: img.url }));
                            }}
                            className={`cursor-pointer border-2 rounded-lg overflow-hidden ${
                              selectedImageUrl === img.url ? 'border-blue-500' : 'border-gray-200'
                            }`}
                          >
                            <img src={img.url} alt="Seçenek" className="w-full h-20 object-cover" />
                          </div>
                        ))}
                        {uploadedImage && (
                          <div
                            onClick={() => {
                              setSelectedImageUrl(uploadedImage);
                              setNewDetailedWord(w => ({ ...w, imageUrl: uploadedImage }));
                            }}
                            className={`cursor-pointer border-2 rounded-lg overflow-hidden ${
                              selectedImageUrl === uploadedImage ? 'border-blue-500' : 'border-gray-200'
                            }`}
                          >
                            <img src={uploadedImage} alt="Yüklenen" className="w-full h-20 object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {imageError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {imageError}
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedItem(null);
                        setNewDetailedWord({
                          english: '',
                          turkish: '',
                          example: '',
                          pronunciation: '',
                          imageUrl: '',
                          synonyms: '',
                          antonyms: '',
                          tags: ''
                        });
                        setImages([]);
                        setSelectedImageUrl('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      İptal
                    </button>
                    <button
                      onClick={() => handleAddDetailedWord(selectedItem.id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Detaylı Kelime Ekle
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTab === 'wordgroups' && selectedItem && 'name' in selectedItem ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">Kelime Grubu Bilgileri</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Ad</label>
                            <p className="text-sm text-gray-900">{selectedItem.name}</p>
                          </div>
                          {'description' in selectedItem && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Açıklama</label>
                              <p className="text-sm text-gray-900">{selectedItem.description}</p>
                            </div>
                          )}
                          {'category' in selectedItem && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Kategori</label>
                              <p className="text-sm text-gray-900">{selectedItem.category}</p>
                            </div>
                          )}
                          {'level' in selectedItem && (
                            <div>
                              <label className="text-sm font-medium text-gray-600">Seviye</label>
                              <div className="mt-1">{getLevelBadge(selectedItem.level)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">Kelimeler</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex flex-wrap gap-2">
                            {'words' in selectedItem && Array.isArray(selectedItem.words) && selectedItem.words.map((word: string, index: number) => (
                              <span key={index} className="bg-white px-2 py-1 rounded text-sm border">
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : selectedItem && 'comment' in selectedItem ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4">Yorum Detayları</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Kullanıcı</label>
                            <p className="text-sm text-gray-900">{selectedItem.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Email</label>
                            <p className="text-sm text-gray-900">{selectedItem.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Puan</label>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              <span className="text-sm text-gray-900">{selectedItem.rating}/5</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Yorum</label>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <p className="text-sm text-gray-700">{selectedItem.comment}</p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Tarih</label>
                            <p className="text-sm text-gray-900">{formatTimestamp(selectedItem.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 