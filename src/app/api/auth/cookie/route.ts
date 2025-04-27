import { NextRequest, NextResponse } from 'next/server';
import { setAuthCookie, deleteAuthCookie } from '@/lib/auth/cookie';

// Kimlik doğrulama için cookie oluşturma
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    await setAuthCookie(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Cookie ayarlanamadı' }, { status: 500 });
  }
}

// Kimlik doğrulama cookie'sini silme
export async function DELETE() {
  try {
    await deleteAuthCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Cookie silinemedi' }, { status: 500 });
  }
} 