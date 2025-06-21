"use client";

import React from "react";
import { FaMoneyBillWave, FaChalkboardTeacher, FaClock, FaUserCheck, FaQuestionCircle, FaRegCheckCircle, FaGlobe, FaVideo } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";

const earningData = [
  { name: 'Group Class', value: 150, color: '#38bdf8' },
  { name: 'Private 1:1', value: 225, color: '#34d399' },
];

export default function ApplyPage() {
  const { user, loading } = useAuth();

  // Kullanıcı giriş yapmamışsa giriş sayfasına yönlendir
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-sky-400 to-green-300 flex flex-col items-center justify-center py-12 px-2">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-sky-400 to-green-300 flex flex-col items-center justify-center py-12 px-2">
        <div className="max-w-2xl w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-14 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-sky-600 to-green-500 mb-4">Başvuru İçin Giriş Yapın</h1>
          <p className="text-lg text-gray-700 mb-8">
            Native Speaker başvurusu yapabilmek için önce hesabınıza giriş yapmanız gerekmektedir.
          </p>
          <div className="space-y-4">
            <Link 
              href="/login" 
              className="inline-block bg-gradient-to-r from-indigo-500 via-sky-400 to-green-400 hover:from-green-400 hover:to-indigo-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-lg"
            >
              Giriş Yap
            </Link>
            <div className="text-gray-600">
              Hesabınız yok mu? <Link href="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">Kayıt Ol</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-sky-400 to-green-300 flex flex-col items-center py-12 px-2 animate-fadein">
      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-14 flex flex-col gap-10">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-sky-600 to-green-500 mb-4 animate-gradient">Apply as a Native English Speaker</h1>
          <p className="text-lg md:text-xl text-gray-700 font-medium mb-2">Guide Turkish learners, make an impact, and earn extra income on Speak Nest!</p>
          <div className="text-sm text-gray-600 mt-2">
            Giriş yapan: <span className="font-medium">{user.email}</span>
          </div>
        </header>
        {/* Earnings Chart Section */}
        <section className="w-full flex flex-col md:flex-row items-center justify-center gap-8 mb-4 animate-fadein">
          <div className="flex-1 flex flex-col items-center justify-center">
            <h3 className="text-xl font-bold text-sky-700 mb-2 flex items-center gap-2"><FaMoneyBillWave className="text-sky-400 animate-bounce" /> Potential Earnings</h3>
            <p className="text-gray-600 text-base mb-2 text-center max-w-xs">See how much you can earn per month by teaching group and private sessions. Example below:</p>
            <ResponsiveContainer width="100%" height={220} minWidth={220}>
              <PieChart>
                <Pie
                  data={earningData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={40}
                  label={({ name, value }) => `${name}: ₺${value}`}
                  isAnimationActive={true}
                >
                  {earningData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`₺${value}`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-gradient-to-br from-sky-200 via-green-100 to-indigo-100 rounded-2xl p-6 shadow-md border border-sky-100 w-full max-w-xs">
              <h4 className="text-lg font-semibold text-sky-700 mb-2">Sample Monthly Income</h4>
              <ul className="text-gray-700 text-base space-y-1">
                <li>3 group classes/week × 4 weeks × ₺50 = <span className="font-bold">₺600</span></li>
                <li>2 private 1:1/month × ₺75 = <span className="font-bold">₺150</span></li>
                <li className="mt-2 text-lg font-bold text-green-700">Total: ₺750/month</li>
              </ul>
            </div>
          </div>
        </section>
        <section className="grid md:grid-cols-2 gap-8">
          <AnimatedCard icon={<FaMoneyBillWave className="text-5xl text-green-500 animate-bounce" />} title="How You Earn" content={<ul className="list-disc list-inside text-gray-700 text-base space-y-1"><li>Fixed fee for every session</li><li>Students join 1:1 or group classes</li><li>Attendance tracked automatically</li></ul>} />
          <AnimatedCard icon={<FaChalkboardTeacher className="text-5xl text-indigo-500 animate-bounce" />} title="Payment Model" content={<ul className="text-gray-700 text-base space-y-1"><li>Group Class (1 hour): <span className="font-bold">₺50 / session</span></li><li>Private 1:1 (1 hour): <span className="font-bold">₺75 / session</span></li><li>Income visible instantly after each class</li></ul>} />
        </section>
        <section className="grid md:grid-cols-2 gap-8">
          <AnimatedCard icon={<FaRegCheckCircle className="text-5xl text-sky-500 animate-bounce" />} title="How You Get Paid" content={<ul className="list-disc list-inside text-gray-700 text-base space-y-1"><li>Monthly payments</li><li>Via Wise, Payoneer or bank transfer</li><li>Earnings calculated and paid automatically at month end</li></ul>} />
          <AnimatedCard icon={<FaClock className="text-5xl text-purple-500 animate-bounce" />} title="How Much You Teach" content={<ul className="list-disc list-inside text-gray-700 text-base space-y-1"><li>3 group classes per week (via Zoom)</li><li>2 private 1:1 classes per month</li><li>Flexible schedule, you set your own times</li></ul>} />
        </section>
        <section className="bg-gradient-to-r from-green-200 via-sky-100 to-indigo-100 rounded-2xl p-6 border border-green-200 shadow-md animate-fadein">
          <h2 className="text-2xl font-bold text-green-700 mb-2 flex items-center gap-2"><FaUserCheck className="text-green-500" /> Benefits</h2>
          <ul className="text-gray-700 text-base grid md:grid-cols-2 gap-x-8 list-disc list-inside">
            <li>Set your own hours</li>
            <li>No teaching degree required, just speak English</li>
            <li>Earn for every session you contribute</li>
            <li>Work remotely, from anywhere</li>
          </ul>
        </section>
        <section className="bg-gradient-to-r from-indigo-100 via-sky-50 to-green-100 rounded-2xl p-6 border border-indigo-200 shadow-md animate-fadein">
          <h2 className="text-2xl font-bold text-indigo-700 mb-2 flex items-center gap-2"><FaQuestionCircle className="text-indigo-500" /> FAQ</h2>
          <Accordion />
        </section>
        <section className="bg-gradient-to-r from-green-100 via-sky-50 to-indigo-100 rounded-2xl p-6 border border-green-200 shadow-md animate-fadein">
          <h2 className="text-2xl font-bold text-green-700 mb-2 flex items-center gap-2"><FaGlobe className="text-green-500" /> How to Apply?</h2>
          <ul className="text-gray-700 text-base list-disc list-inside mb-4">
            <li>Short resume</li>
            <li>Proof of native English (video, certificate, citizenship, etc.)</li>
            <li>Zoom account info</li>
            <li>Your weekly availability</li>
          </ul>
          <p className="text-green-800 font-semibold mb-2">Join the Speak Nest ProUser community, make an impact and earn!</p>
        </section>
        <NativeSpeakerApplicationForm user={user} />
      </div>
      <style jsx global>{`
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadein { animation: fadein 1.2s; }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function AnimatedCard({ icon, title, content }: { icon: React.ReactNode, title: string, content: React.ReactNode }) {
  return (
    <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col items-center border border-gray-100 hover:scale-105 transition-transform duration-300 animate-fadein">
      <div className="mb-2">{icon}</div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <div>{content}</div>
    </div>
  );
}

function NativeSpeakerApplicationForm({ user }: { user: any }) {
  const [form, setForm] = React.useState({
    name: '',
    email: user?.email || '',
    country: '',
    motivation: '',
    proof: '',
    zoom: '',
    availability: ''
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.country || !form.motivation || !form.proof || !form.zoom || !form.availability) {
      setError('Please fill in all fields.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    
    try {
      await addDoc(collection(db, "applications"), {
        ...form,
        userId: user.uid, // Kullanıcı ID'sini ekle
        userEmail: user.email, // Kullanıcı email'ini ekle
        status: 'pending', // default status
        submittedAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8 animate-fadein">
        <div className="text-4xl mb-2">🎉</div>
        <div className="text-green-700 text-xl font-semibold mb-2">Thank you for your application!</div>
        <div className="text-gray-600">We will contact you soon.</div>
      </div>
    );
  }

  return (
    <form className="space-y-5 mt-4 animate-fadein" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-green-700 mb-2 text-center">Application Form</h2>
      <div>
        <label className="block text-gray-700 font-medium mb-1">Full Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Your full name"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="you@email.com"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-1">Country</label>
        <input
          type="text"
          name="country"
          value={form.country}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Your country"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-1">Short Bio & Motivation</label>
        <textarea
          name="motivation"
          value={form.motivation}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Why do you want to join? Any experience?"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-1">Proof of Native English (video, certificate, citizenship, etc.)</label>
        <input
          type="text"
          name="proof"
          value={form.proof}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Link or description"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-1">Zoom Account</label>
        <input
          type="text"
          name="zoom"
          value={form.zoom}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="Zoom username or email"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-1">Weekly Availability</label>
        <input
          type="text"
          name="availability"
          value={form.availability}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="e.g. Monday 6-8pm, Wednesday 2-4pm"
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-green-400 hover:from-green-400 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Apply Now ➜'}
      </button>
    </form>
  );
}

function Accordion() {
  const [open, setOpen] = React.useState<number | null>(null);
  const data = [
    {
      q: "Do I need to be a certified teacher?",
      a: "No, you just need to be a native English speaker and open to communication."
    },
    {
      q: "Who sets the class times?",
      a: "You set your own schedule. We offer full flexibility."
    },
    {
      q: "How and when do I get paid?",
      a: "At the end of each month, your total earnings are calculated and paid via Wise, Payoneer, or bank transfer."
    },
    {
      q: "How do group and private classes work?",
      a: "Group classes are on Zoom with 3-6 students, private classes are 1:1. Attendance and payment are tracked automatically."
    }
  ];
  return (
    <div>
      {data.map((item, idx) => (
        <div key={idx} className="mb-2">
          <button
            type="button"
            className="w-full text-left px-4 py-2 bg-sky-200 rounded-lg font-semibold text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors duration-200"
            onClick={() => setOpen(open === idx ? null : idx)}
          >
            {item.q}
          </button>
          {open === idx && (
            <div className="px-4 py-2 text-gray-700 bg-sky-50 rounded-b-lg border border-t-0 border-sky-200 animate-fadein">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 