"use client";

import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, setDoc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { Image } from 'lucide-react';

export default function AddWordPage() {
  const [wordGroups, setWordGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newWord, setNewWord] = useState({
    english: '',
    turkish: '',
    example: '',
    pronunciation: '',
    groupId: '',
    imageUrl: ''
  });
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [images, setImages] = useState<Array<{id: string, url: string}>>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [addWordMessage, setAddWordMessage] = useState('');
  const [addWordError, setAddWordError] = useState('');
  const [imageSource, setImageSource] = useState<'unsplash' | 'pixabay' | 'pexels' | 'upload'>('unsplash');
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [synonyms, setSynonyms] = useState('');
  const [antonyms, setAntonyms] = useState('');
  const [tags, setTags] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchWordGroups();
  }, []);

  const fetchWordGroups = async () => {
    setLoading(true);
    try {
      const wordGroupsQuery = query(collection(db, 'wordGroups'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(wordGroupsQuery);
      const groups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWordGroups(groups);
    } catch (error) {
      setError('Kelime grupları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Görsel arama fonksiyonunu kaynak seçimine göre güncelle
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
      setImages(images);
      if (images.length > 0) {
        setSelectedImageUrl(images[0].url);
        setNewWord(w => ({ ...w, imageUrl: images[0].url }));
      } else {
        setImageError('Bu kelime için resim bulunamadı');
      }
    } catch (error) {
      setImageError('Resim getirilirken hata!');
    } finally {
      setIsLoadingImage(false);
    }
  };

  // Sürükle-bırak ile görsel yükleme
  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        setSelectedImageUrl(ev.target?.result as string);
        setNewWord(w => ({ ...w, imageUrl: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImage(ev.target?.result as string);
        setSelectedImageUrl(ev.target?.result as string);
        setNewWord(w => ({ ...w, imageUrl: ev.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Toast gösterimi
  useEffect(() => {
    if (addWordMessage) setToast({ type: 'success', message: addWordMessage });
    if (addWordError) setToast({ type: 'error', message: addWordError });
  }, [addWordMessage, addWordError]);

  // Kelime ekleme fonksiyonu
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddWordError('');
    setAddWordMessage('');
    if (!newWord.english.trim() || !newWord.turkish.trim() || !newWord.groupId) {
      setAddWordError('Zorunlu alanları doldurun!');
      return;
    }
    try {
      // Firestore'a ekle
      const wordRef = doc(collection(db, 'wordGroups', newWord.groupId, 'words'));
      await setDoc(wordRef, {
        ...newWord,
        createdAt: Timestamp.now(),
        imageUrl: newWord.imageUrl || '',
        synonyms: synonyms.split(',').map(s => s.trim()).filter(Boolean),
        antonyms: antonyms.split(',').map(a => a.trim()).filter(Boolean),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      // Kelime sayısını güncelle
      const groupDoc = doc(db, 'wordGroups', newWord.groupId);
      await updateDoc(groupDoc, { wordCount: (wordGroups.find(g => g.id === newWord.groupId)?.wordCount || 0) + 1 });
      setAddWordMessage('Kelime başarıyla eklendi!');
      setNewWord({ english: '', turkish: '', example: '', pronunciation: '', groupId: '', imageUrl: '' });
      setImages([]);
      setSelectedImageUrl('');
      fetchWordGroups();
    } catch (err) {
      setAddWordError('Kelime eklenirken hata!');
    }
  };

  if (loading) return <div className="p-6 text-center">Kelime grupları yükleniyor...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="max-w-xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Yeni Kelime Ekle</h2>
      <form onSubmit={handleAddWord} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">İngilizce Kelime <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <input type="text" value={newWord.english} onChange={e => setNewWord({...newWord, english: e.target.value})} className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="İngilizce kelimeyi girin" required />
            <div className="mb-4 flex gap-2 items-center">
              <label className="font-medium">Görsel Kaynağı:</label>
              <select value={imageSource} onChange={e => setImageSource(e.target.value as any)} className="border rounded px-2 py-1">
                <option value="unsplash">Unsplash</option>
                <option value="pixabay">Pixabay</option>
                <option value="pexels">Pexels</option>
                <option value="upload">Yükle</option>
              </select>
              {imageSource === 'upload' && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">Dosya Seç</button>
              )}
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileInput} />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Türkçe Anlamı <span className="text-red-500">*</span></label>
          <input type="text" value={newWord.turkish} onChange={e => setNewWord({...newWord, turkish: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Türkçe anlamını girin" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Örnek Cümle</label>
          <textarea value={newWord.example} onChange={e => setNewWord({...newWord, example: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Örnek cümle girin" rows={2} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telaffuz</label>
          <input type="text" value={newWord.pronunciation} onChange={e => setNewWord({...newWord, pronunciation: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Telaffuzunu girin" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kelime Grubu <span className="text-red-500">*</span></label>
          <select value={newWord.groupId} onChange={e => setNewWord({...newWord, groupId: e.target.value})} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
            <option value="">Kelime Grubu Seçin</option>
            {wordGroups.map(group => (
              <option key={group.id} value={group.id}>{group.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kelime Görseli</label>
          {isLoadingImage && <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">Resimler yükleniyor...</div>}
          {!isLoadingImage && images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {images.map(img => (
                <img key={img.id} src={img.url} alt="img" className={`w-20 h-20 object-cover rounded-lg border-2 cursor-pointer ${selectedImageUrl === img.url ? 'border-blue-500' : 'border-gray-200'}`} onClick={() => { setSelectedImageUrl(img.url); setNewWord(w => ({...w, imageUrl: img.url})); }} />
              ))}
            </div>
          )}
          {selectedImageUrl && <img src={selectedImageUrl} alt="Seçili görsel" className="w-32 h-32 object-cover rounded-lg mt-2" />}
          {imageError && <div className="text-red-500 text-xs mt-1">{imageError}</div>}
        </div>
        {imageSource === 'upload' && (
          <div className="mb-4 border-2 border-dashed rounded-lg p-4 text-center bg-gray-50" onDrop={handleImageDrop} onDragOver={e => e.preventDefault()}>
            <p>Görseli buraya sürükleyin veya Dosya Seç ile yükleyin.</p>
            {uploadedImage && <img src={uploadedImage} alt="Yüklenen görsel" className="w-32 h-32 object-cover rounded-lg mx-auto mt-2" />}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Eş Anlamlılar</label>
          <input type="text" value={synonyms} onChange={e => setSynonyms(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Virgülle ayırarak yazın (ör: quick,fast,rapid)" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zıt Anlamlılar</label>
          <input type="text" value={antonyms} onChange={e => setAntonyms(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Virgülle ayırarak yazın (ör: slow,sluggish)" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Etiketler</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Virgülle ayırarak yazın (ör: fiil,duygu,hayvan)" />
        </div>
        {addWordError && <div className="text-red-500 text-sm">{addWordError}</div>}
        {addWordMessage && <div className="text-green-600 text-sm">{addWordMessage}</div>}
        <div className="mt-6 flex justify-end space-x-3">
          <button type="reset" onClick={() => { setNewWord({ english: '', turkish: '', example: '', pronunciation: '', groupId: '', imageUrl: '' }); setImages([]); setSelectedImageUrl(''); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Temizle</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Ekle</button>
        </div>
      </form>
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.message}</div>
      )}
    </div>
  );
} 