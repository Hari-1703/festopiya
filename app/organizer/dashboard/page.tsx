'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatModal from '@/app/(auth)/components/ChatModal';
import Link from 'next/link';

type TabType = 'events' | 'requests' | 'finances';

export default function OrganizerDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // 1. Fetch Events created by this Organizer
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id) 
        .order('created_at', { ascending: false });
      
      if (eventsData) setMyEvents(eventsData);

      // 2. Fetch All Stall Requests for this Organizer's events
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          events!inner (event_name, organizer_id),
          vendor_profiles:vendor_id (stall_name, food_category)
        `)
        .eq('events.organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsData) setRequests(bookingsData);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const updateStatus = async (id: string, newStatus: 'approved' | 'declined') => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } else {
      alert("Update failed: " + error.message);
    }
  };

  const totalRevenue = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-gray-400 tracking-widest uppercase">LOADING HUB...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r p-6 z-20">
        <div className="mb-12 mt-4">
          <h1 className="text-3xl font-black tracking-tighter italic">FESTOPIYA</h1>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ml-1">Organizer Hub</span>
        </div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-xs ${activeTab === 'requests' ? 'bg-black text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'}`}>📥 Requests</button>
          <button onClick={() => setActiveTab('events')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-xs ${activeTab === 'events' ? 'bg-black text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'}`}>📅 My Events</button>
          <button onClick={() => setActiveTab('finances')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-xs ${activeTab === 'finances' ? 'bg-black text-white shadow-xl' : 'text-gray-500 hover:bg-gray-50'}`}>💰 Revenue</button>
        </nav>
      </aside>

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 p-2 flex justify-around">
        <button onClick={() => setActiveTab('requests')} className={activeTab === 'requests' ? 'text-purple-600' : 'text-gray-400'}>📥</button>
        <button onClick={() => setActiveTab('events')} className={activeTab === 'events' ? 'text-purple-600' : 'text-gray-400'}>📅</button>
        <button onClick={() => setActiveTab('finances')} className={activeTab === 'finances' ? 'text-purple-600' : 'text-gray-400'}>💰</button>
      </nav>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 pb-24">
        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black uppercase italic">{req.vendor_profiles?.stall_name || 'New Vendor'}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest">Event: {req.events?.event_name}</p>
                  </div>
                  <p className="text-2xl font-black tracking-tighter italic">₹{req.total_amount}</p>
                </div>
                <div className="flex gap-2">
                  {req.status === 'pending' ? (
                    <>
                      <button onClick={() => updateStatus(req.id, 'approved')} className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px]">Approve</button>
                      <button onClick={() => updateStatus(req.id, 'declined')} className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-2xl font-black uppercase text-[10px]">Decline</button>
                    </>
                  ) : (
                    <div className={`w-full text-center py-4 rounded-2xl font-black uppercase text-[10px] ${req.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {req.status === 'approved' ? '✅ Approved' : '❌ Declined'}
                    </div>
                  )}
                </div>
                <button onClick={() => setActiveChat({ id: req.vendor_id, name: req.vendor_profiles?.stall_name })} className="w-full mt-3 bg-gray-50 py-4 rounded-2xl font-black uppercase text-[10px]">💬 Chat</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'finances' && (
          <div className="bg-black text-white p-12 rounded-[40px] italic">
            <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-4">Net Revenue</p>
            <h3 className="text-7xl font-black tracking-tighter">₹{totalRevenue.toLocaleString()}</h3>
          </div>
        )}
      </main>
      {activeChat && <ChatModal currentUserId={currentUserId} recipientId={activeChat.id} recipientName={activeChat.name} onClose={() => setActiveChat(null)} />}
    </div>
  );
}