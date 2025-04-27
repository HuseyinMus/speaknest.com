import { cookies } from 'next/headers';

export const setAuthCookie = async (data: { uid: string; role: string }) => {
  const cookieStore = cookies();
  cookieStore.set('auth', JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
};

export const deleteAuthCookie = async () => {
  const cookieStore = cookies();
  cookieStore.delete('auth');
}; 