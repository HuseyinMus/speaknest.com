import { NextResponse } from 'next/server';
import { middleware } from '../middleware';
import { UserRole } from '@/lib/auth/rbac';

// Mock NextRequest
const createMockRequest = (path: string, cookie?: string) => {
  const url = new URL(`http://localhost${path}`);
  
  // Mock request objesi
  const request = {
    nextUrl: {
      pathname: path,
      searchParams: new URLSearchParams(),
    },
    url: url.toString(),
    cookies: {
      get: (name: string) => {
        if (name === 'auth' && cookie) {
          return { value: cookie };
        }
        return undefined;
      },
    },
  };
  
  return request as any;
};

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    next: () => ({ status: 200 }),
    redirect: (url: string) => ({ 
      status: 302, 
      headers: { get: () => url.toString() } 
    }),
  },
}));

// Mock PagePermissions
jest.mock('@/lib/auth/rbac', () => ({
  UserRole: {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin',
  },
  PagePermissions: {
    '/student-panel': ['student'],
    '/teacher-panel': ['teacher'],
    '/test': ['student', 'teacher'],
    '/dashboard': ['student', 'teacher'],
  },
}));

describe('Middleware', () => {
  describe('Public sayfalar', () => {
    const publicPaths = [
      '/',
      '/login',
      '/register',
      '/forgot-password',
      '/privacy-policy',
      '/terms-of-service',
      '/about',
      '/contact',
    ];

    publicPaths.forEach(path => {
      it(`${path} sayfasına herkes erişebilir`, () => {
        const request = createMockRequest(path);
        const response = middleware(request);
        
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Kimlik doğrulama kontrolü', () => {
    it('giriş yapılmamışsa login sayfasına yönlendirir', () => {
      const request = createMockRequest('/dashboard');
      const response = middleware(request);
      
      expect(response.status).toBe(302);
      expect(response.headers.get('')).toContain('/login');
    });

    it('geçerli auth cookie ile erişime izin verir', () => {
      const authCookie = encodeURIComponent(JSON.stringify({ role: UserRole.STUDENT }));
      const request = createMockRequest('/student-panel', authCookie);
      const response = middleware(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Rol tabanlı erişim kontrolü', () => {
    it('öğrenci rolü ile öğrenci paneli sayfasına erişebilir', () => {
      const authCookie = encodeURIComponent(JSON.stringify({ role: UserRole.STUDENT }));
      const request = createMockRequest('/student-panel', authCookie);
      const response = middleware(request);
      
      expect(response.status).toBe(200);
    });

    it('öğrenci rolü ile öğretmen paneli sayfasına erişemez', () => {
      const authCookie = encodeURIComponent(JSON.stringify({ role: UserRole.STUDENT }));
      const request = createMockRequest('/teacher-panel', authCookie);
      const response = middleware(request);
      
      expect(response.status).toBe(302);
      expect(response.headers.get('')).toContain('/access-denied');
    });

    it('öğretmen rolü ile öğretmen paneli sayfasına erişebilir', () => {
      const authCookie = encodeURIComponent(JSON.stringify({ role: UserRole.TEACHER }));
      const request = createMockRequest('/teacher-panel', authCookie);
      const response = middleware(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Test sayfası kontrolü', () => {
    it('test sayfasına geçerli auth cookie ile erişebilir', () => {
      const authCookie = encodeURIComponent(JSON.stringify({ role: UserRole.STUDENT }));
      const request = createMockRequest('/test', authCookie);
      const response = middleware(request);
      
      expect(response.status).toBe(200);
    });

    it('geçersiz auth cookie ile test sayfasına erişemez', () => {
      const request = createMockRequest('/test', 'invalid-cookie');
      const response = middleware(request);
      
      expect(response.status).toBe(302);
      expect(response.headers.get('')).toContain('/login');
    });
  });

  describe('Path normalizasyonu', () => {
    it('URL parametrelerini temizler', () => {
      const authCookie = encodeURIComponent(JSON.stringify({ role: UserRole.STUDENT }));
      const request = createMockRequest('/student-panel?param=value', authCookie);
      const response = middleware(request);
      
      expect(response.status).toBe(200);
    });

    it('sondaki slash\'ı kaldırır', () => {
      const authCookie = encodeURIComponent(JSON.stringify({ role: UserRole.STUDENT }));
      const request = createMockRequest('/student-panel/', authCookie);
      const response = middleware(request);
      
      expect(response.status).toBe(200);
    });
  });
}); 