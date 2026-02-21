'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import ChatModal from '@/app/(auth)/components/ChatModal'; 
import Link from 'next/link'; // <-- Added the Link import here!

export default function VendorDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeChat, setActiveChat] = useState<{ id: string, name: string } | null>(null);

  // States for the "Make Offer" Booking Modal
  const [bookingModalEvent, setBookingModalEvent] = useState<any | null>(null);
  const [offerPrice, setOfferPrice] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (eventsData) {
        setEvents(eventsData);
        setFilteredEvents(eventsData);
      }

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          events (
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

  const openBookingModal = (event: any) => {
    setBookingModalEvent(event);
    setOfferPrice(event.base_stall_fee);
  };

  const submitBookingRequest = async () => {
    if (!currentUserId || !bookingModalEvent) return;
    setIsSubmitting(true);
    
    const festopiyaCut = offerPrice * 0.05; 

    const { error } = await supabase
      .from('bookings')
      .insert([{
          event_id: bookingModalEvent.id,
          vendor_id: currentUserId,
          agreed_fee: offerPrice,      
          total_amount: offerPrice,    
          commission_amount: festopiyaCut, 
          status: 'pending' 
      }]);

    if (error) {
      alert("DATABASE ERROR: " + error.message);
      setIsSubmitting(false);
    } else {
      window.location.reload(); 
    }
  };

  if (loading) return <div className="p-8 text-center font-black text-gray-400">LOADING MARKETPLACE...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* NEW HEADER WITH PROFILE BUTTON */}
        <div className="mb-10 border-b-4 border-black pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">VENDOR DASHBOARD</h1>
            <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest">Negotiate first, then make your offer.</p>
          </div>
          
          <Link href="/vendor/profile" className="bg-white border-2 border-gray-200 hover:border-black text-gray-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm">
            Edit Profile ⚙️
          </Link>
        </div>

        {/* SECTION 1: MY BOOKINGS TRACKER */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tighter">My Stall Requests</h2>
          
          {myBookings.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-300 text-center shadow-sm">
              <p className="text-gray-500 font-bold uppercase tracking-widest">You haven't requested any stalls yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBookings.map((booking) => (
                <div key={booking.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-xl text-gray-900 uppercase italic">
                      {booking.events?.event_name || 'Unknown Event'}
                    </h3>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
                      Offered Fee: ₹{booking.total_amount}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                    {booking.events?.organizer_id && (
                       <button 
                         onClick={() => setActiveChat({ id: booking.events.organizer_id, name: `Org: ${booking.events.event_name}` })}
                         className="bg-gray-100 hover:bg-black hover:text-white text-gray-900 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                       >
                         Message
                       </button>
                    )}
                    {booking.status === 'approved' && <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">APPROVED ✅</span>}
                    {booking.status === 'pending' && <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse">PENDING ⏳</span>}
                    {booking.status === 'declined' && <span className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">DECLINED ❌</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: THE FESTOPIYA MARKETPLACE */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Discover Fests</h2>
            </div>
            <div className="w-full md:w-96 relative">
              <input 
                type="text" 
                placeholder="Search for a fest..." 
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-5 pr-12 py-4 bg-white border-2 border-gray-200 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
              />
              <span className="absolute right-5 top-4 text-gray-300 text-xl">🔍</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.length === 0 ? (
              <div className="col-span-full bg-white p-10 rounded-3xl border border-gray-200 text-center shadow-sm">
                 <p className="text-gray-500 font-bold uppercase tracking-widest">No fests found.</p>
              </div>
            ) : (
              filteredEvents.map((event) => {
                const alreadyApplied = myBookings.some(b => b.event_id === event.id);
                
                return (
                  <div key={event.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:border-black transition-all flex flex-col justify-between group">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 uppercase italic group-hover:text-blue-600 transition-colors">{event.event_name}</h3>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                          <span className="w-5">📅</span> {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBA'}
                        </div>
                        <div className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                          <span className="w-5">👥</span> {event.expected_footfall ? `${event.expected_footfall.toLocaleString()} Students` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Asking Price</p>
                      
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-3xl font-black text-gray-900">₹{event.base_stall_fee}</p>
                        
                        {alreadyApplied ? (
                          <button disabled className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs cursor-not-allowed">
                            Applied
                          </button>
                        ) : (
                          <button 
                            onClick={() => openBookingModal(event)}
                            className="bg-black hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg"
                          >
                            Make Offer
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setActiveChat({ id: event.organizer_id, name: `Org: ${event.event_name}` })}
                          className="flex-1 bg-green-50 hover:bg-green-500 hover:text-white text-green-700 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
                        >
                          Chat to Negotiate
                        </button>
                        <a 
                          href={event.contact_phone ? `tel:${event.contact_phone}` : '#'}
                          onClick={(e) => !event.contact_phone && e.preventDefault()}
                          className={`flex-1 flex justify-center items-center py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                            event.contact_phone ? 'bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {event.contact_phone ? 'Call Organizer' : 'No Phone'}
                        </a>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* THE "MAKE OFFER" MODAL */}
      {bookingModalEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-gray-900 uppercase italic mb-2">Send Request</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
              {bookingModalEvent.event_name}
            </p>

            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Negotiated Price (₹)
              </label>
              <input 
                type="number" 
                value={offerPrice}
                onChange={(e) => setOfferPrice(Number(e.target.value))}
                className="w-full text-3xl font-black text-gray-900 bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                Original Asking Price: ₹{bookingModalEvent.base_stall_fee}
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setBookingModalEvent(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitBookingRequest}
                disabled={isSubmitting || offerPrice <= 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg"
              >
                {isSubmitting ? 'Sending...' : 'Send Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT MODAL */}
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