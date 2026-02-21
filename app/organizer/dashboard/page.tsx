'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatModal from '@/app/(auth)/components/ChatModal';

export default function OrganizerDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // We fetch bookings and try to grab the related event and vendor profile
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events (event_name, organizer_id),
          vendor_profiles:vendor_id (stall_name, food_category)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Fetch Error:", error.message);
      }

      // Filter: Only show bookings for events owned by this organizer
      if (bookings) {
        const myRequests = bookings.filter(b => b.events?.organizer_id === user.id);
        setRequests(myRequests);
      }
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
      alert("Failed to update status: " + error.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">Loading Hub...</p>
    </div>
  );

  // Calculate revenue based on APPROVED bookings only
  const totalRevenue = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-blue-100">
      <div className="max-w-5xl mx-auto p-6 md:p-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-black italic tracking-tighter uppercase">Organizer Hub</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Live Stall Management</p>
          </div>
          <div className="bg-white border border-gray-100 px-8 py-6 rounded-[32px] shadow-sm text-center md:text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Booked Revenue</p>
            <p className="text-4xl font-black text-green-600 tracking-tighter italic">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* REQUESTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-[40px]">
              <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No stall requests found yet</p>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-black uppercase italic leading-none mb-2">
                      {req.vendor_profiles?.stall_name || 'New Stall Request'}
                    </h3>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                      {req.vendor_profiles?.food_category || 'Pending Profile'}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-black tracking-tighter italic">₹{req.total_amount}</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Event Name</p>
                  <p className="text-sm font-bold text-gray-700">{req.events?.event_name || 'Festopiya Event'}</p>
                </div>

                <div className="flex gap-3">
                  {req.status === 'pending' ? (
                    <>
                      <button onClick={() => updateStatus(req.id, 'approved')} className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-600 transition-colors">Approve</button>
                      <button onClick={() => updateStatus(req.id, 'declined')} className="flex-1 bg-gray-100 text-gray-400 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Decline</button>
                    </>
                  ) : (
                    <div className={`w-full text-center py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest ${req.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {req.status === 'approved' ? '✅ Approved' : '❌ Declined'}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setActiveChat({ id: req.vendor_id, name: req.vendor_profiles?.stall_name || 'Vendor' })}
                  className="w-full mt-3 bg-white border border-gray-100 text-gray-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  💬 Open Chat
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {activeChat && (
        <ChatModal 
          currentUserId={currentUserId} 
          recipientId={activeChat.id} 
          recipientName={activeChat.name} 
          onClose={() => setActiveChat(null)} 
        />
      )}
    </div>
  );
}