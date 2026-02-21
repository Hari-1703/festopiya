'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatModal from '@/app/(auth)/components/ChatModal';

export default function OrganizerDashboard() {
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

      // 1. Get Events owned by this Organizer
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id); // Fixed .eq typo
      
      if (events) setMyEvents(events);

      // 2. Get All Bookings for those events + Vendor Profile Data
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events!inner (event_name, organizer_id),
          vendor_profiles:vendor_id (stall_name, food_category, phone)
        `)
        .eq('events.organizer_id', user.id)
        .order('created_at', { ascending: false });

      if (bookings) setRequests(bookings);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-gray-400">LOADING...</div>;

  const totalRevenue = requests.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">Organizer Hub</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Stalls & Revenue</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Booked</p>
            <p className="text-3xl font-black text-green-600 tracking-tighter italic">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase italic">{req.vendor_profiles?.stall_name || 'New Vendor'}</h3>
                  <span className="text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-md">{req.vendor_profiles?.food_category || 'Stall'}</span>
                </div>
                <p className="text-2xl font-black text-gray-900 tracking-tighter italic">₹{req.total_amount}</p>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Event: {req.events?.event_name}</p>
              <div className="flex gap-2 mb-3">
                {req.status === 'pending' ? (
                  <>
                    <button onClick={() => updateStatus(req.id, 'approved')} className="flex-1 bg-black text-white py-3 rounded-xl font-black uppercase text-[10px] hover:bg-green-600 transition-colors">Approve</button>
                    <button onClick={() => updateStatus(req.id, 'declined')} className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl font-black uppercase text-[10px]">Decline</button>
                  </>
                ) : (
                  <div className={`w-full text-center py-3 rounded-xl font-black uppercase text-[10px] ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {req.status === 'approved' ? '✅ Approved' : '❌ Declined'}
                  </div>
                )}
              </div>
              <button onClick={() => setActiveChat({ id: req.vendor_id, name: req.vendor_profiles?.stall_name })} className="w-full bg-gray-50 text-gray-900 py-3 rounded-xl font-black uppercase text-[10px] hover:bg-blue-600 hover:text-white transition-all">💬 Chat with Vendor</button>
            </div>
          ))}
        </section>
      </div>
      {activeChat && <ChatModal currentUserId={currentUserId} recipientId={activeChat.id} recipientName={activeChat.name} onClose={() => setActiveChat(null)} />}
    </div>
  );
}