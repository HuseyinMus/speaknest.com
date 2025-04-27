/// <reference types="jest" />

import '@testing-library/jest-dom';
import type { Mock } from 'jest-mock';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChatBox from '../ChatBox';
import SocketService from '@/lib/services/SocketService';
import { useAuth } from '@/lib/hooks/useAuth';

// Mock SocketService
jest.mock('@/lib/services/SocketService', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      connect: jest.fn(),
      joinRoom: jest.fn(),
      leaveRoom: jest.fn(),
      sendMessage: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    })),
  },
}));

// Mock useAuth
jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('ChatBox', () => {
  const mockUser = {
    uid: '123',
    displayName: 'Test User',
  };

  const mockSocketService = {
    connect: jest.fn().mockResolvedValue(undefined),
    joinRoom: jest.fn().mockResolvedValue(undefined),
    leaveRoom: jest.fn(),
    sendMessage: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as Mock).mockReturnValue({ user: mockUser });
    (SocketService.getInstance as Mock).mockReturnValue(mockSocketService);
  });

  it('bileşen başarıyla render edilmeli', async () => {
    await act(async () => {
      render(<ChatBox roomId="test-room" />);
    });
    expect(screen.getByText('Sohbet')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mesajınızı yazın...')).toBeInTheDocument();
  });

  it('kullanıcı giriş yapmamışsa misafir olarak görünmeli', async () => {
    (useAuth as Mock).mockReturnValue({ user: null });
    await act(async () => {
      render(<ChatBox roomId="test-room" />);
    });
    expect(screen.getByText('Henüz mesaj yok. İlk mesajı gönderen siz olun!')).toBeInTheDocument();
  });

  it('mesaj gönderme işlemi çalışmalı', async () => {
    await act(async () => {
      render(<ChatBox roomId="test-room" />);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    const input = screen.getByPlaceholderText('Mesajınızı yazın...');
    const button = screen.getByText('Gönder');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test mesajı' } });
      fireEvent.click(button);
    });

    expect(mockSocketService.sendMessage).toHaveBeenCalledWith('Test mesajı', 'Test User');
    expect(input).toHaveValue('');
  });

  it('boş mesaj gönderilememeli', async () => {
    await act(async () => {
      render(<ChatBox roomId="test-room" />);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    const input = screen.getByPlaceholderText('Mesajınızı yazın...');
    const button = screen.getByText('Gönder');

    await act(async () => {
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(button);
    });

    expect(mockSocketService.sendMessage).not.toHaveBeenCalled();
  });

  it('yeni mesaj geldiğinde mesaj listesi güncellenmeli', async () => {
    const mockMessage = {
      id: '1',
      message: 'Yeni mesaj',
      sender: 'Test User',
      timestamp: new Date(),
    };

    await act(async () => {
      render(<ChatBox roomId="test-room" />);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await act(async () => {
      const onHandler = mockSocketService.on.mock.calls.find(call => call[0] === 'newMessage')[1];
      onHandler(mockMessage);
    });

    expect(screen.getByText('Yeni mesaj')).toBeInTheDocument();
  });

  it('kullanıcı katıldığında sistem mesajı gösterilmeli', async () => {
    const mockJoinData = {
      userName: 'Yeni Kullanıcı',
      timestamp: new Date(),
    };

    await act(async () => {
      render(<ChatBox roomId="test-room" />);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await act(async () => {
      const onHandler = mockSocketService.on.mock.calls.find(call => call[0] === 'userJoined')[1];
      onHandler(mockJoinData);
    });

    expect(screen.getByText('Yeni Kullanıcı odaya katıldı')).toBeInTheDocument();
  });

  it('kullanıcı ayrıldığında sistem mesajı gösterilmeli', async () => {
    const mockLeaveData = {
      userName: 'Ayrılan Kullanıcı',
      timestamp: new Date(),
    };

    await act(async () => {
      render(<ChatBox roomId="test-room" />);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await act(async () => {
      const onHandler = mockSocketService.on.mock.calls.find(call => call[0] === 'userLeft')[1];
      onHandler(mockLeaveData);
    });

    expect(screen.getByText('Ayrılan Kullanıcı odadan ayrıldı')).toBeInTheDocument();
  });

  it('bağlantı hatası durumunda hata mesajı gösterilmeli', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSocketService.connect.mockRejectedValue(new Error('Bağlantı hatası'));

    await act(async () => {
      render(<ChatBox roomId="test-room" />);
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(consoleSpy).toHaveBeenCalledWith('Socket bağlantı hatası:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('bileşen kapatıldığında temizlik işlemleri yapılmalı', async () => {
    let unmount: () => void;
    
    await act(async () => {
      const { unmount: unmountComponent } = render(<ChatBox roomId="test-room" />);
      unmount = unmountComponent;
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await act(async () => {
      unmount();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(mockSocketService.leaveRoom).toHaveBeenCalledWith('test-room', '123', 'Test User');
    expect(mockSocketService.off).toHaveBeenCalledWith('newMessage');
    expect(mockSocketService.off).toHaveBeenCalledWith('userJoined');
    expect(mockSocketService.off).toHaveBeenCalledWith('userLeft');
  });
}); 