'use client';

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Toaster, toast } from 'sonner';

interface ToastContextType {
  success: (message: string, options?: any) => void;
  error: (message: string, options?: any) => void;
  info: (message: string, options?: any) => void;
  warning: (message: string, options?: any) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

// Client-side portal bileşeni
function ToasterPortal() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (!mounted) return null;
  
  // Document body'ye portal oluştur
  return ReactDOM.createPortal(
    <Toaster 
      position="top-right" 
      richColors 
      closeButton 
      duration={3000}
      dir="ltr"
      toastOptions={{
        style: {
          fontSize: '0.875rem',
        },
      }}
    />,
    document.body
  );
}

export function ToastProvider({ children }: ToastProviderProps) {
  // Toast fonksiyonları
  const toastFunctions: ToastContextType = {
    success: (message, options) => toast.success(message, options),
    error: (message, options) => toast.error(message, options),
    info: (message, options) => toast.info(message, options),
    warning: (message, options) => toast.warning(message, options),
  };

  return (
    <ToastContext.Provider value={toastFunctions}>
      {children}
      <ToasterPortal />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
} 