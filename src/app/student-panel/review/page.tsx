"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

interface Word {
  id: string;
  english: string;
  turkish: string;
  example?: string;
  groupId?: string;
  groupTitle?: string;
}

export default function ReviewPage() {
  const [loading, setLoading] = useState(true);
  const [dueWords, setDueWords] = useState<Word[]>([]);

  useEffect(() => {
    const fetchDueWords = async () => {
      const user = auth.currentUser;
      if (!user) return;
      setLoading(true);
      try {
        const now = new Date();
        const statusRef = collection(db, "wordLearningStatus");
        const q = query(statusRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const words: Word[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          if (data.nextReview && data.nextReview.toDate() <= now) {
            // Kelimeyi bulmak için grupları tara
            const wordGroupsRef = collection(db, "wordGroups");
            const wordGroupsSnap = await getDocs(wordGroupsRef);
            let found = false;
            for (const groupDoc of wordGroupsSnap.docs) {
              const wordsRef = collection(db, "wordGroups", groupDoc.id, "words");
              const wordSnap = await getDoc(doc(wordsRef, data.wordId));
              if (wordSnap.exists()) {
                words.push({
                  id: wordSnap.id,
                  english: wordSnap.data().english,
                  turkish: wordSnap.data().turkish,
                  example: wordSnap.data().example,
                  groupId: groupDoc.id,
                  groupTitle: groupDoc.data().title,
                });
                found = true;
                break;
              }
            }
            if (!found) {
              // Grup bulunamazsa yine de ekle
              words.push({
                id: data.wordId,
                english: "(Bilinmiyor)",
                turkish: "(Bilinmiyor)",
              });
            }
          }
        }
        setDueWords(words);
      } catch (e) {
        setDueWords([]);
      }
      setLoading(false);
    };
    fetchDueWords();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-emerald-700 mb-6">Tekrar Edilecekler</h1>
      {loading ? (
        <div className="text-center text-slate-500">Yükleniyor...</div>
      ) : dueWords.length === 0 ? (
        <div className="text-center text-slate-500">Tekrar zamanı gelen kelimen yok!</div>
      ) : (
        <div className="space-y-4">
          {dueWords.map((word, i) => (
            <div key={word.id} className="bg-white/80 rounded-xl shadow p-4 flex flex-col gap-2 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-emerald-700">{word.english}</span>
                <span className="text-base text-slate-600">- {word.turkish}</span>
                {word.groupTitle && (
                  <span className="ml-auto px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs">{word.groupTitle}</span>
                )}
              </div>
              {word.example && <div className="text-slate-500 text-sm italic">{word.example}</div>}
              {/* Buraya tekrar butonları eklenecek */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 