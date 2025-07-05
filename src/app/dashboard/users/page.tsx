"use client";

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { userService, User } from '@/lib/services/UserService';
import { rbacService } from '@/lib/auth/rbac';
import { collection, getDocs, query, orderBy, where, updateDoc, doc } from 'firebase/firestore';
import { Users, Search, Filter, Eye, Edit, Trash2, Shield, UserCheck, UserX, Mail, Calendar, MapPin } from 'lucide-react';

interface UserWithDetails extends User {
  lastLogin?: any;
  createdAt?: any;
  profile?: {
    country?: string;
    city?: string;
    bio?: string;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersList = await userService.getAllUsers();
      setUsers(usersList as UserWithDetails[]);
    } catch (err) {
      setError('Kullanıcılar yüklenirken hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    setMessage('');
    
    try {
      await userService.updateUserRole(userId, newRole);
      
      // Kullanıcı listesini güncelle
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, role: newRole } as UserWithDetails;
        }
        return user;
      }));
      
      setMessage(`Kullanıcı rolü "${rbacService.getRoleDisplayName(newRole)}" olarak güncellendi.`);
      
    } catch (error: any) {
      setError('Rol güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setChangingRole(null);
    }
  };

  const handleUserStatusChange = async (userId: string, newStatus: 'active' | 'suspended') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { status: newStatus });
      
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, status: newStatus } as UserWithDetails;
        }
        return user;
      }));
      
      setMessage(`Kullanıcı durumu "${newStatus === 'active' ? 'Aktif' : 'Askıya Alındı'}" olarak güncellendi.`);
    } catch (error: any) {
      setError('Kullanıcı durumu güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      // Kullanıcıyı sil (gerçek uygulamada soft delete yapılabilir)
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { deleted: true, deletedAt: new Date() });
      
      setUsers(users.filter(user => user.id !== userId));
      setMessage('Kullanıcı başarıyla silindi.');
    } catch (error: any) {
      setError('Kullanıcı silinemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      proUser: 'bg-purple-100 text-purple-800',
      student: 'bg-blue-100 text-blue-800',
      native: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {rbacService.getRoleDisplayName(role)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktif</span>;
    } else if (status === 'suspended') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Askıya Alındı</span>;
    } else {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Bilinmiyor</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Kullanıcılar yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
            <p className="text-gray-600">Toplam {users.length} kullanıcı</p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Email, isim veya ID ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol Filtresi</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Roller</option>
              {rbacService.getAllRoles().map(role => (
                <option key={role} value={role}>{rbacService.getRoleDisplayName(role)}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum Filtresi</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="suspended">Askıya Alındı</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mesajlar */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {/* Kullanıcı Listesi */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName || 'İsimsiz Kullanıcı'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">ID: {user.id?.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status || 'active')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={changingRole === user.id || user.role === 'admin'}
                        className="text-xs rounded border-gray-300 bg-white"
                        title="Rol Değiştir"
                      >
                        {rbacService.getAllRoles().map(role => (
                          <option key={role} value={role}>{rbacService.getRoleDisplayName(role)}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => handleUserStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}
                        className={`px-2 py-1 rounded text-xs ${
                          user.status === 'active' 
                            ? 'text-red-600 hover:text-red-900 bg-red-50' 
                            : 'text-green-600 hover:text-green-900 bg-green-50'
                        }`}
                        title={user.status === 'active' ? 'Askıya Al' : 'Aktifleştir'}
                      >
                        {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                        title="Kullanıcıyı Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kullanıcı Detay Modalı */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-blue-800">Kullanıcı Detayları</h3>
              <button 
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Temel Bilgiler</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ad Soyad</label>
                      <p className="text-sm text-gray-900">{selectedUser.displayName || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Kullanıcı ID</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedUser.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Rol</label>
                      <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Durum</label>
                      <div className="mt-1">{getStatusBadge(selectedUser.status || 'active')}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-4">Ek Bilgiler</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Kayıt Tarihi</label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt.seconds * 1000).toLocaleString('tr-TR') : 'Bilinmiyor'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Son Giriş</label>
                      <p className="text-sm text-gray-900">
                        {selectedUser.lastLogin ? new Date(selectedUser.lastLogin.seconds * 1000).toLocaleString('tr-TR') : 'Bilinmiyor'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ülke</label>
                      <p className="text-sm text-gray-900">{selectedUser.profile?.country || 'Belirtilmemiş'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Şehir</label>
                      <p className="text-sm text-gray-900">{selectedUser.profile?.city || 'Belirtilmemiş'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedUser.profile?.bio && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-2">Hakkında</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedUser.profile.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 