"use client";
import { useState } from 'react';
import { User, Mail, Phone, Image, Globe, Lock, Bell, CreditCard, Languages, Shield, Trash2, Calendar, Sun, Moon, HelpCircle, Link, LogOut, CheckCircle, XCircle, Instagram, Linkedin, Twitter } from 'lucide-react';

const translations = {
  tr: {
    profile: 'Profil',
    notifications: 'Bildirimler',
    payment: 'Ödeme',
    language: 'Dil',
    security: 'Güvenlik',
    advanced: 'Ekstra',
    save: 'Kaydet',
    cancel: 'İptal',
    success: 'Başarıyla güncellendi!',
    error: 'Bir hata oluştu',
    // Profil
    name: 'Ad',
    surname: 'Soyad',
    email: 'E-posta',
    phone: 'Telefon',
    bio: 'Biyografi',
    photo: 'Profil Fotoğrafı',
    upload: 'Yükle',
    social: 'Sosyal Medya',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    twitter: 'Twitter',
    website: 'Web Sitesi',
    // Bildirim
    emailNotif: 'E-posta Bildirimleri',
    smsNotif: 'SMS Bildirimleri',
    pushNotif: 'Platform İçi Bildirimler',
    meetingNotif: 'Toplantı Bildirimi',
    paymentNotif: 'Ödeme Bildirimi',
    systemNotif: 'Sistem Bildirimi',
    // Ödeme
    iban: 'IBAN / Banka',
    paymentMethod: 'Ödeme Yöntemi',
    invoice: 'Fatura Bilgileri',
    address: 'Adres',
    taxNo: 'Vergi No',
    company: 'Şirket Adı',
    // Dil
    interfaceLang: 'Arayüz Dili',
    lessonLang: 'Varsayılan Ders Dili',
    // Güvenlik
    password: 'Şifre',
    changePassword: 'Şifre Değiştir',
    newPassword: 'Yeni Şifre',
    confirmPassword: 'Şifre Tekrar',
    twofa: '2 Adımlı Doğrulama',
    enable2fa: '2FA Aktif',
    disable2fa: '2FA Pasif',
    deleteAccount: 'Hesabı Sil',
    deleteWarning: 'Bu işlem geri alınamaz!',
    // Ekstra
    calendar: 'Takvim Entegrasyonu',
    zoom: 'Zoom Hesabı',
    theme: 'Tema',
    dark: 'Karanlık',
    light: 'Aydınlık',
    sessions: 'Oturum Geçmişi',
    devices: 'Cihazlar',
    support: 'Destek',
    logout: 'Çıkış Yap',
    connect: 'Bağla',
    disconnect: 'Bağlantıyı Kaldır',
    help: 'Yardım',
    // Diğer
    required: 'Zorunlu alan',
    optional: 'Opsiyonel',
  },
  en: {
    profile: 'Profile',
    notifications: 'Notifications',
    payment: 'Payment',
    language: 'Language',
    security: 'Security',
    advanced: 'Advanced',
    save: 'Save',
    cancel: 'Cancel',
    success: 'Updated successfully!',
    error: 'An error occurred',
    // Profile
    name: 'Name',
    surname: 'Surname',
    email: 'Email',
    phone: 'Phone',
    bio: 'Bio',
    photo: 'Profile Photo',
    upload: 'Upload',
    social: 'Social Media',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    twitter: 'Twitter',
    website: 'Website',
    // Notification
    emailNotif: 'Email Notifications',
    smsNotif: 'SMS Notifications',
    pushNotif: 'In-App Notifications',
    meetingNotif: 'Meeting Notification',
    paymentNotif: 'Payment Notification',
    systemNotif: 'System Notification',
    // Payment
    iban: 'IBAN / Bank',
    paymentMethod: 'Payment Method',
    invoice: 'Invoice Info',
    address: 'Address',
    taxNo: 'Tax No',
    company: 'Company Name',
    // Language
    interfaceLang: 'Interface Language',
    lessonLang: 'Default Lesson Language',
    // Security
    password: 'Password',
    changePassword: 'Change Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    twofa: 'Two-Factor Authentication',
    enable2fa: '2FA Enabled',
    disable2fa: '2FA Disabled',
    deleteAccount: 'Delete Account',
    deleteWarning: 'This action cannot be undone!',
    // Advanced
    calendar: 'Calendar Integration',
    zoom: 'Zoom Account',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    sessions: 'Session History',
    devices: 'Devices',
    support: 'Support',
    logout: 'Logout',
    connect: 'Connect',
    disconnect: 'Disconnect',
    help: 'Help',
    // Other
    required: 'Required',
    optional: 'Optional',
  }
};

const TABS = ['profile', 'notifications', 'payment', 'language', 'security', 'advanced'];

export default function SettingsPage() {
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const t = translations[lang];
  const [tab, setTab] = useState('profile');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // ... Form state'leri burada olacak (örnek olarak sadece inputlar, backend entegrasyonu yok)

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-2 md:px-0">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10">
        {/* Dil seçici */}
        <div className="flex justify-end mb-4">
          <button onClick={() => setLang('tr')} className={`px-3 py-1 rounded-lg text-sm font-medium mr-2 ${lang==='tr' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'}`}>TR</button>
          <button onClick={() => setLang('en')} className={`px-3 py-1 rounded-lg text-sm font-medium ${lang==='en' ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'}`}>EN</button>
        </div>
        {/* Sekmeler */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${tab===key ? 'bg-green-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-green-100'}`}
            >
              {key === 'profile' && <User size={18} />}
              {key === 'notifications' && <Bell size={18} />}
              {key === 'payment' && <CreditCard size={18} />}
              {key === 'language' && <Languages size={18} />}
              {key === 'security' && <Shield size={18} />}
              {key === 'advanced' && <SettingsIcon />}
              {t[key]}
            </button>
          ))}
        </div>
        {/* Başarı/Hata mesajı */}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 mb-4">
            <CheckCircle size={18} /> {success}
            <button onClick={()=>setSuccess('')} className="ml-auto"><XCircle size={16} /></button>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4">
            <XCircle size={18} /> {error}
            <button onClick={()=>setError('')} className="ml-auto"><XCircle size={16} /></button>
          </div>
        )}
        {/* İçerik */}
        <div>
          {tab === 'profile' && <ProfileTab t={t} />}
          {tab === 'notifications' && <NotificationsTab t={t} />}
          {tab === 'payment' && <PaymentTab t={t} />}
          {tab === 'language' && <LanguageTab t={t} lang={lang} setLang={setLang} />}
          {tab === 'security' && <SecurityTab t={t} />}
          {tab === 'advanced' && <AdvancedTab t={t} />}
        </div>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09c0 .66.38 1.26 1 1.51a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.66 0 1.26.38 1.51 1H21a2 2 0 0 1 0 4h-.09c-.25 0-.48.09-.68.26z"/></svg>;
}

// Her sekme için örnek modern içerik bileşenleri (sadece UI, backend yok)
function ProfileTab({ t }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
          <Image size={40} className="text-slate-400" />
        </div>
        <div>
          <button className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
            {t.upload}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.name}</label>
          <input className="w-full px-3 py-2 border rounded-lg" placeholder={t.name} />
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.surname}</label>
          <input className="w-full px-3 py-2 border rounded-lg" placeholder={t.surname} />
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.email}</label>
          <input className="w-full px-3 py-2 border rounded-lg" placeholder={t.email} />
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.phone}</label>
          <input className="w-full px-3 py-2 border rounded-lg" placeholder={t.phone} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-600 text-sm mb-1">{t.bio}</label>
          <textarea className="w-full px-3 py-2 border rounded-lg" placeholder={t.bio} rows={2} />
        </div>
      </div>
      <div>
        <label className="block text-slate-600 text-sm mb-1">{t.social}</label>
        <div className="flex gap-2">
          <input className="w-full px-3 py-2 border rounded-lg" placeholder={t.linkedin} />
          <input className="w-full px-3 py-2 border rounded-lg" placeholder={t.instagram} />
          <input className="w-full px-3 py-2 border rounded-lg" placeholder={t.twitter} />
          <input className="w-full px-3 py-2 border rounded-lg" placeholder={t.website} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">{t.save}</button>
        <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">{t.cancel}</button>
      </div>
    </div>
  );
}

function NotificationsTab({ t }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-green-600" /> {t.emailNotif}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-green-600" /> {t.smsNotif}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-green-600" /> {t.pushNotif}
          </label>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-green-600" /> {t.meetingNotif}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-green-600" /> {t.paymentNotif}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-green-600" /> {t.systemNotif}
          </label>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">{t.save}</button>
        <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">{t.cancel}</button>
      </div>
    </div>
  );
}

function PaymentTab({ t }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.iban}</label>
          <input className="w-full px-3 py-2 border rounded-lg" placeholder="TR..." />
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.paymentMethod}</label>
          <select className="w-full px-3 py-2 border rounded-lg">
            <option>Banka</option>
            <option>Kredi Kartı</option>
            <option>PayPal</option>
            <option>Kripto</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-slate-600 text-sm mb-1">{t.invoice}</label>
          <input className="w-full px-3 py-2 border rounded-lg" placeholder={t.company} />
          <input className="w-full px-3 py-2 border rounded-lg mt-2" placeholder={t.address} />
          <input className="w-full px-3 py-2 border rounded-lg mt-2" placeholder={t.taxNo} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">{t.save}</button>
        <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">{t.cancel}</button>
      </div>
    </div>
  );
}

function LanguageTab({ t, lang, setLang }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.interfaceLang}</label>
          <select className="w-full px-3 py-2 border rounded-lg" value={lang} onChange={e => setLang(e.target.value)}>
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.lessonLang}</label>
          <select className="w-full px-3 py-2 border rounded-lg">
            <option>Türkçe</option>
            <option>English</option>
            <option>Deutsch</option>
            <option>Español</option>
            <option>Français</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">{t.save}</button>
        <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">{t.cancel}</button>
      </div>
    </div>
  );
}

function SecurityTab({ t }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.password}</label>
          <input type="password" className="w-full px-3 py-2 border rounded-lg" placeholder={t.newPassword} />
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.confirmPassword}</label>
          <input type="password" className="w-full px-3 py-2 border rounded-lg" placeholder={t.confirmPassword} />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input type="checkbox" className="accent-green-600" />
          <span>{t.twofa}</span>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">{t.save}</button>
        <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors">{t.cancel}</button>
      </div>
      <div className="mt-8">
        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <Trash2 size={18} /> {t.deleteAccount}
        </button>
        <p className="text-xs text-red-500 mt-2">{t.deleteWarning}</p>
      </div>
    </div>
  );
}

function AdvancedTab({ t }: any) {
  const [theme, setTheme] = useState('light');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.calendar}</label>
          <button className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2">
            <Calendar size={16} /> {t.connect}
          </button>
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.zoom}</label>
          <button className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2">
            <Link size={16} /> {t.connect}
          </button>
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.theme}</label>
          <div className="flex gap-2">
            <button onClick={()=>setTheme('light')} className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${theme==='light' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700'}`}><Sun size={16} /> {t.light}</button>
            <button onClick={()=>setTheme('dark')} className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${theme==='dark' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700'}`}><Moon size={16} /> {t.dark}</button>
          </div>
        </div>
        <div>
          <label className="block text-slate-600 text-sm mb-1">{t.sessions}</label>
          <button className="px-3 py-1 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2">
            <LogOut size={16} /> {t.devices}
          </button>
        </div>
      </div>
      <div className="mt-6">
        <a href="#" className="flex items-center gap-2 text-blue-600 hover:underline"><HelpCircle size={16} /> {t.support}</a>
      </div>
    </div>
  );
} 