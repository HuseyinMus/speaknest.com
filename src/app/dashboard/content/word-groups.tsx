"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, query, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

export default function WordGroupsManagementPage() {
  const [wordGroups, setWordGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWordGroup, setEditingWordGroup] = useState<any>(null);
  const [newWordGroup, setNewWordGroup] = useState({
    title: '',
    description: '',
    level: 'beginner',
    category: 'daily',
    wordCount: 0,
    creator: ''
  });
  const [addingWordGroup, setAddingWordGroup] = useState(false);
  const [editingWordGroupState, setEditingWordGroupState] = useState(false);

  useEffect(() => {
    fetchWordGroups();
  }, []);

  const fetchWordGroups = async () => {
    try {
      const wordGroupsQuery = query(collection(db, 'wordGroups'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(wordGroupsQuery);
      const groups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWordGroups(groups);
    } catch (error) {
      setError('Kelime grupları yüklenemedi.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWordGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingWordGroup(true);
    setError('');
    try {
      if (!newWordGroup.title.trim()) {
        setError('Başlık alanı zorunludur.');
        setAddingWordGroup(false);
        return;
      }
      const docRef = await addDoc(collection(db, 'wordGroups'), {
        ...newWordGroup,
        createdAt: Timestamp.now(),
        creator: 'Admin'
      });
      setWordGroups([{ id: docRef.id, ...newWordGroup, createdAt: Timestamp.now(), creator: 'Admin' }, ...wordGroups]);
      setNewWordGroup({ title: '', description: '', level: 'beginner', category: 'daily', wordCount: 0, creator: '' });
      setShowAddModal(false);
    } catch (error) {
      const errorMessage = error instanceof FirebaseError || error instanceof Error ? error.message : 'Bilinmeyen hata';
      setError('Kelime grubu eklenirken bir hata oluştu: ' + errorMessage);
      console.error('Kelime grubu ekleme hatası:', error);
    } finally {
      setAddingWordGroup(false);
    }
  };

  const handleEditWordGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditingWordGroupState(true);
    setError('');
    try {
      if (!editingWordGroup.title.trim()) {
        setError('Başlık alanı zorunludur.');
        setEditingWordGroupState(false);
        return;
      }
      await updateDoc(doc(db, 'wordGroups', editingWordGroup.id), {
        ...editingWordGroup,
        updatedAt: Timestamp.now(),
      });
      setWordGroups(wordGroups.map(group => group.id === editingWordGroup.id ? editingWordGroup : group));
      setShowEditModal(false);
      setEditingWordGroup(null);
    } catch (error) {
      const errorMessage = error instanceof FirebaseError || error instanceof Error ? error.message : 'Bilinmeyen hata';
      setError('Kelime grubu güncellenirken bir hata oluştu: ' + errorMessage);
      console.error('Kelime grubu güncelleme hatası:', error);
    } finally {
      setEditingWordGroupState(false);
    }
  };

  const handleDeleteWordGroup = async (id: string) => {
    if (!confirm('Bu kelime grubunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'wordGroups', id));
      setWordGroups(wordGroups.filter(group => group.id !== id));
    } catch (error) {
      const errorMessage = error instanceof FirebaseError || error instanceof Error ? error.message : 'Bilinmeyen hata';
      setError('Kelime grubu silinirken bir hata oluştu: ' + errorMessage);
      console.error('Kelime grubu silme hatası:', error);
    }
  };

  if (loading) return <div className="p-6 text-center">Kelime grupları yükleniyor...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Kelime Grupları Yönetimi</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Yeni Kelime Grubu
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlık</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seviye</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelime Sayısı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {wordGroups.length > 0 ? (
                wordGroups.map((group) => (
                  <tr key={group.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{group.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        group.level === 'beginner' ? 'bg-green-100 text-green-800' :
                        group.level === 'intermediate' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {group.level === 'beginner' ? 'Başlangıç Seviyesi' :
                         group.level === 'intermediate' ? 'Orta Seviye' : 'İleri Seviye'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {group.category === 'daily' ? 'Günlük Konuşma' :
                       group.category === 'business' ? 'İş İngilizcesi' :
                       group.category === 'travel' ? 'Seyahat' : 'Akademik'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.wordCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.creator}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingWordGroup(group);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium transition duration-150 ease-in-out"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteWordGroup(group.id)}
                          className="text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm font-semibold transition duration-150 ease-in-out shadow-sm hover:shadow"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Henüz kelime grubu eklenmemiş</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-green-800">Yeni Kelime Grubu</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddWordGroup} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık <span className="text-red-500">*</span></label>
                  <input type="text" value={newWordGroup.title} onChange={e => setNewWordGroup({ ...newWordGroup, title: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Kelime grubu başlığı" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea value={newWordGroup.description} onChange={e => setNewWordGroup({ ...newWordGroup, description: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Açıklama" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seviye</label>
                    <select value={newWordGroup.level} onChange={e => setNewWordGroup({ ...newWordGroup, level: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="beginner">Başlangıç</option>
                      <option value="intermediate">Orta</option>
                      <option value="advanced">İleri</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select value={newWordGroup.category} onChange={e => setNewWordGroup({ ...newWordGroup, category: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="daily">Günlük Konuşma</option>
                      <option value="business">İş İngilizcesi</option>
                      <option value="travel">Seyahat</option>
                      <option value="academic">Akademik</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelime Sayısı</label>
                  <input type="number" value={newWordGroup.wordCount} onChange={e => setNewWordGroup({ ...newWordGroup, wordCount: parseInt(e.target.value) || 0 })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" min="0" />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">İptal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Ekle</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {showEditModal && editingWordGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-blue-800">Kelime Grubu Düzenle</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditWordGroup} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık <span className="text-red-500">*</span></label>
                  <input type="text" value={editingWordGroup.title} onChange={e => setEditingWordGroup({ ...editingWordGroup, title: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kelime grubu başlığı" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <textarea value={editingWordGroup.description} onChange={e => setEditingWordGroup({ ...editingWordGroup, description: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Açıklama" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seviye</label>
                    <select value={editingWordGroup.level} onChange={e => setEditingWordGroup({ ...editingWordGroup, level: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="beginner">Başlangıç</option>
                      <option value="intermediate">Orta</option>
                      <option value="advanced">İleri</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select value={editingWordGroup.category} onChange={e => setEditingWordGroup({ ...editingWordGroup, category: e.target.value })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="daily">Günlük Konuşma</option>
                      <option value="business">İş İngilizcesi</option>
                      <option value="travel">Seyahat</option>
                      <option value="academic">Akademik</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelime Sayısı</label>
                  <input type="number" value={editingWordGroup.wordCount} onChange={e => setEditingWordGroup({ ...editingWordGroup, wordCount: parseInt(e.target.value) || 0 })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">İptal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 