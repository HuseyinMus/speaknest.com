import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Dynamic API route yapılandırması
export const runtime = 'nodejs';

// Zoom OAuth credentials
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID || '';
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET || '';
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID || '';

// Firebase Admin başlat
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS handler
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Zoom OAuth token alma fonksiyonu (mevcut koddan kopyalandı)
async function getZoomAccessToken(): Promise<string> {
  try {
    console.log('Zoom OAuth token alınıyor...');
    
    if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
      throw new Error('Zoom API kimlik bilgileri eksik.');
    }
    
    const formData = new URLSearchParams({
      'grant_type': 'account_credentials',
      'account_id': ZOOM_ACCOUNT_ID
    });
    
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64')}`
      },
      body: formData.toString()
    });
    
    if (!tokenResponse.ok) {
      const responseText = await tokenResponse.text();
      throw new Error(`Token alınamadı: ${tokenResponse.status} - ${responseText}`);
    }
    
    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Token alma hatası:', error);
    throw error;
  }
}

// Toplantı katılımcılarını ve süresini kontrol et
export async function POST(request: Request) {
  try {
    console.log('Toplantı kontrol isteği alındı');
    
    const { meetingId, earningId } = await request.json();
    console.log('Kontrol parametreleri:', { meetingId, earningId });

    if (!meetingId || !earningId) {
      return NextResponse.json(
        { error: 'Meeting ID ve Earning ID gerekli' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Zoom OAuth token al
    const accessToken = await getZoomAccessToken();

    // 1. Toplantı bilgilerini al (süre için)
    const meetingResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!meetingResponse.ok) {
      console.error('Toplantı bilgisi alınamadı:', meetingResponse.status);
      return NextResponse.json(
        { error: 'Toplantı bilgisi alınamadı' },
        { status: meetingResponse.status, headers: corsHeaders }
      );
    }

    const meetingData = await meetingResponse.json();
    const duration = meetingData.duration || 0; // dakika cinsinden
    console.log('Toplantı süresi:', duration, 'dakika');

    // 2. Toplantı katılımcılarını al
    const participantsResponse = await fetch(`https://api.zoom.us/v2/report/meetings/${meetingId}/participants`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!participantsResponse.ok) {
      console.error('Katılımcı bilgisi alınamadı:', participantsResponse.status);
      return NextResponse.json(
        { error: 'Katılımcı bilgisi alınamadı' },
        { status: participantsResponse.status, headers: corsHeaders }
      );
    }

    const participantsData = await participantsResponse.json();
    const participants = participantsData.participants || [];
    console.log('Toplam katılımcı sayısı:', participants.length);

    // 3. Katılımcı analizi
    // ProUser'ı katılımcılardan çıkar, sadece öğrencileri say
    const students = participants.filter((p: any) => {
      // ProUser'ın email'i ile eşleşmeyen katılımcılar öğrenci sayılır
      // Bu kısım projenin email yapısına göre özelleştirilebilir
      return !p.email?.includes('@prouser.com') && !p.email?.includes('@speaknest.com');
    });

    const hasStudents = students.length > 0;
    const studentCount = students.length;
    const minimumDurationMet = duration >= 45;

    console.log('Analiz sonuçları:', {
      totalParticipants: participants.length,
      studentCount,
      hasStudents,
      duration,
      minimumDurationMet
    });

    // 4. Firestore'da earning kaydını güncelle
    try {
      await db.collection('earnings').doc(earningId).update({
        hasParticipants: hasStudents,
        minimumDurationMet: minimumDurationMet,
        isCompleted: true,
        actualDuration: duration,
        studentCount: studentCount,
        lastChecked: new Date(),
        // Eğer kriterler sağlanmıyorsa ödeme durumunu güncelle
        status: (hasStudents && minimumDurationMet) ? 'pending' : 'cancelled',
        cancellationReason: (!hasStudents) ? 'Öğrenci katılımı yok' : 
                           (!minimumDurationMet) ? 'Süre yetersiz (45dk altı)' : null
      });

      console.log('Earning kaydı güncellendi:', earningId);
    } catch (firestoreError) {
      console.error('Firestore güncelleme hatası:', firestoreError);
      return NextResponse.json(
        { error: 'Veritabanı güncelleme hatası' },
        { status: 500, headers: corsHeaders }
      );
    }

    // 5. Sonuç döndür
    return NextResponse.json({
      success: true,
      meetingId,
      earningId,
      hasStudents,
      studentCount,
      duration,
      minimumDurationMet,
      isEligibleForPayment: hasStudents && minimumDurationMet,
      message: hasStudents && minimumDurationMet 
        ? 'Toplantı ödeme için uygun' 
        : 'Toplantı ödeme kriterlerini karşılamıyor'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Toplantı kontrol hatası:', error);
    return NextResponse.json(
      { error: 'Toplantı kontrol edilirken bir hata oluştu' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Test için GET endpoint'i
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const meetingId = searchParams.get('meetingId');
  const earningId = searchParams.get('earningId');

  if (!meetingId || !earningId) {
    return NextResponse.json(
      { error: 'Meeting ID ve Earning ID gerekli' },
      { status: 400, headers: corsHeaders }
    );
  }

  // POST metodunu çağır
  const postRequest = new Request(request.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ meetingId, earningId }),
  });

  return POST(postRequest);
} 