'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <nav className="flex justify-between items-center px-8 py-8">
        <h1 className="text-3xl font-black italic tracking-tighter">FESTOPIYA</h1>
        <Link href="/login" className="bg-black text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">Join Now</Link>
      </nav>

      <section className="px-8 pt-12 pb-32 flex flex-col items-center text-center">
        <h2 className="text-6xl md:text-9xl font-black leading-[0.85] tracking-tighter uppercase italic">
          Host the <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-400">Perfect Fest.</span>
        </h2>
        <p className="mt-12 max-w-lg text-lg font-bold text-gray-400 leading-tight">
          The ultimate marketplace connecting India's biggest events with premium stall vendors. 
        </p>
        <div className="mt-12 flex flex-col md:flex-row gap-6">
          <Link href="/register?role=organizer" className="bg-purple-600 text-white px-12 py-6 rounded-[32px] font-black uppercase text-xl shadow-2xl shadow-purple-200">I'm an Organizer</Link>
          <Link href="/register?role=vendor" className="bg-black text-white px-12 py-6 rounded-[32px] font-black uppercase text-xl shadow-2xl">I'm a Vendor</Link>
        </div>
      </section>

      <section className="bg-black py-32 px-8 flex flex-col md:flex-row gap-8 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=2070" className="w-full md:w-1/2 h-96 object-cover rounded-[60px] grayscale hover:grayscale-0 transition-all duration-700" alt="Fest" />
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">Manage Stalls <br /> Like a Pro.</h3>
          <p className="mt-6 text-zinc-500 font-bold max-w-sm">Direct chats, automated ledgers, and secure UPI payments for every stall.</p>
        </div>
      </section>
    </div>
  );
}