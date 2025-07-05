'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, Bell, FileText, Book, Settings, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { useEffect, useState } from "react";

const menuItems = [
  { id: "dashboard", label: "Gösterge Paneli", icon: <Home size={20} />, href: "/dashboard" },
  { id: "users", label: "Kullanıcılar", icon: <Users size={20} />, href: "/dashboard/users" },
  { id: "notifications", label: "Bildirimler", icon: <Bell size={20} />, href: "/dashboard/notifications" },
  { id: "payments", label: "Ödeme Talepleri", icon: <FileText size={20} />, href: "/dashboard/payments" },
  { id: "native-applications", label: "Native Başvuruları", icon: <FileText size={20} />, href: "/dashboard/native-applications" },
  { id: "content", label: "İçerik Yönetimi", icon: <Book size={20} />, href: "/dashboard/content" },
  { id: "settings", label: "Ayarlar", icon: <Settings size={20} />, href: "/dashboard/settings" },
  { id: "comments", label: "Yorum Yönetimi", icon: '📝', href: "/dashboard/content/comments" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-white border-r shadow-sm w-64 flex flex-col fixed md:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b flex items-center gap-2 font-bold text-xl text-blue-700">
          <Home size={28} className="mr-2" /> SpeakNest Admin
        </div>
        <nav className="flex-1 py-4 space-y-1">
          {menuItems.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg mx-2 text-base font-medium transition-colors duration-200 ${pathname === item.href ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-blue-100 hover:text-blue-800'}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-3 m-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} /> Çıkış
        </button>
      </aside>
      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-64 min-h-screen flex flex-col">
        {/* Mobil üst bar */}
        <div className="md:hidden bg-white border-b shadow-sm flex items-center justify-between px-4 py-3 sticky top-0 z-30">
          <span className="font-bold text-blue-700 text-lg">SpeakNest Admin</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md text-gray-500 hover:bg-gray-100">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        <main className="flex-1 p-6 md:p-10 bg-gray-100">{children}</main>
      </div>
    </div>
  );
} 