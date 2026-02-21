'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatModal from '@/app/(auth)/components/ChatModal'; 
import Link from 'next/link';

type TabType = 'marketplace' | 'requests' | 'finances';

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('marketplace');
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);
  const [bookingModalEvent, setBookingModalEvent] = useState<any | null>(null);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Fetch All Available Fests
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (eventsData) {
        setEvents(eventsData);
        setFilteredEvents(eventsData);
      }

      // Fetch My Stall Bookings + Related Event Data
      // This query uses '!inner' to ensure we only get bookings that have a valid linked event
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          events!inner (
            event_name,
            event_date,
            base_stall_fee,
            organizer_id,
            contact_phone
          )
        `)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsData) {
        setMyBookings(bookingsData);
      }
      
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (query === '') setFilteredEvents(events);
    else setFilteredEvents(events.filter((event) => event.event_name.toLowerCase().includes(query)));
  };

  const submitBookingRequest = async () => {
    if (!currentUserId || !bookingModalEvent) return;
    setIsSubmitting(true);
    const festopiyaCut = offerPrice * 0.05; 
    
    const { error } = await supabase.from('bookings').insert([{
      event_id: bookingModalEvent.id, 
      vendor_id: currentUserId, 
      agreed_fee: offerPrice,      
      total_amount: offerPrice, 
      commission_amount: festopiyaCut, 
      status: 'pending' 
    }]);

    if (error) {
      alert("🚨 DATABASE ERROR: " + error.message);
      setIsSubmitting(false);
    } else {
      alert("✅ Offer sent successfully!");
      setBookingModalEvent(null);
      window.location.reload(); 
    }
  };

  // UPI Intent Logic for "Pay Now"
  const handleUPIPayment = (amount: number, eventName: string) => {
    const upiId = "waheed@upi"; // Replace with your actual UPI ID
    const name = "Festopiya Payments";
    const note = `Stall Payment for ${eventName}`;
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note)}&cu=INR`;
    
    window.location.href = upiUrl;
  };

  // --- TAB RENDERERS ---

  const renderMarketplace = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Marketplace</h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Book your next stall</p>
        </div>
        <div className="w-full md:w-96 relative">
          <input 
            type="text" placeholder="Search for a fest..." value={searchQuery} onChange={handleSearch}
            className="w-full pl-5 pr-12 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-900 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const alreadyApplied = myBookings.some(b => b.event_id === event.id);
          return (
            <div key={event.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-xl transition-all group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic group-hover:text-blue-600 transition-colors">{event.event_name}</h3>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Open</span>
                </div>
                <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <div>📅 {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBA'}</div>
                  <div>👥 {event.expected_footfall?.toLocaleString() || 'N/A'} Expected</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stall Fee</p>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{event.base_stall_fee}</p>
                  {alreadyApplied ? (
                    <button disabled className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] cursor-not-allowed">Applied</button>
                  ) : (
                    <button onClick={() => { setBookingModalEvent(event); setOfferPrice(event.base_stall_fee); }} className="bg-black hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-md">Make Offer</button>
                  )}
                </div>
                <button onClick={() => setActiveChat({ id: event.organizer_id, name: `Org: ${event.event_name}` })} className="w-full bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">💬 Chat</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderRequests = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-8">My Requests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {myBookings.map((booking) => (
          <div key={booking.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-black text-xl text-gray-900 uppercase italic">{booking.events?.event_name || 'Festopiya Event'}</h3>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Offered: ₹{booking.total_amount}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                booking.status === 'approved' ? 'bg-green-100 text-green-700' : 
                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 animate-pulse' : 'bg-red-100 text-red-700'
              }`}>
                {booking.status === 'approved' ? '✅ Approved' : booking.status === 'pending' ? '⏳ Pending' : '❌ Declined'}
              </span>
            </div>
            {booking.status === 'approved' && (
              <button 
                onClick={() => handleUPIPayment(booking.total_amount, booking.events?.event_name)}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black uppercase text-[10px] transition-all shadow-lg"
              >
                💳 Pay ₹{booking.total_amount} via UPI
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderFinances = () => {
    const totalSpent = myBookings.filter(b => b.status === 'approved').reduce((sum, b) => sum + (b.total_amount || 0), 0);
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-8">Finances</h2>
        <div className="bg-black text-white p-10 rounded-3xl shadow-xl bg-gradient-to-br from-black to-gray-800">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Stall Investment</p>
          <h3 className="text-6xl font-black tracking-tighter italic mb-6">₹{totalSpent.toLocaleString()}</h3>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-t border-gray-700 pt-6">Confirmed via Approved status.</p>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-black text-gray-400 uppercase">LOADING...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 p-6 z-20">
        <div className="mb-12 mt-4"><h1 className="text-3xl font-black tracking-tighter italic">FESTOPIYA</h1></div>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('marketplace')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-xs ${activeTab === 'marketplace' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>🏪 Market</button>
          <button onClick={() => setActiveTab('requests')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-xs ${activeTab === 'requests' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>🎟️ Requests</button>
          <button onClick={() => setActiveTab('finances')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black uppercase text-xs ${activeTab === 'finances' ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}>📊 Ledger</button>
        </nav>
        <Link href="/vendor/profile" className="w-full flex justify-center py-4 bg-gray-100 rounded-xl font-black uppercase text-[10px]">⚙️ Settings</Link>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around z-50">
        <button onClick={() => setActiveTab('marketplace')} className={activeTab === 'marketplace' ? 'text-blue-600' : 'text-gray-400'}>🏪</button>
        <button onClick={() => setActiveTab('requests')} className={activeTab === 'requests' ? 'text-blue-600' : 'text-gray-400'}>🎟️</button>
        <button onClick={() => setActiveTab('finances')} className={activeTab === 'finances' ? 'text-blue-600' : 'text-gray-400'}>📊</button>
        <Link href="/vendor/profile">⚙️</Link>
      </nav>

      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        {activeTab === 'marketplace' && renderMarketplace()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'finances' && renderFinances()}
      </main>

      {bookingModalEvent && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black uppercase italic mb-6">Send Offer</h3>
            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Offer (₹)</label>
              <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(Number(e.target.value))} className="w-full text-3xl font-black bg-gray-50 border-2 rounded-2xl p-4" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setBookingModalEvent(null)} className="flex-1 bg-gray-100 py-4 rounded-xl font-black uppercase text-xs">Cancel</button>
              <button onClick={submitBookingRequest} className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg">{isSubmitting ? '...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {activeChat && <ChatModal currentUserId={currentUserId} recipientId={activeChat.id} recipientName={activeChat.name} onClose={() => setActiveChat(null)} />}
    </div>
  );
}