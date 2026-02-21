'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const [stallName, setStallName] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch existing profile data if they have already saved it before
      const { data: profileData } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setStallName(profileData.stall_name || '');
        setFoodCategory(profileData.food_category || '');
        setPhone(profileData.phone || '');
      }
      
      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // "Upsert" means: If the profile exists, UPDATE it. If it doesn't exist, CREATE it!
    const { error } = await supabase
      .from('vendor_profiles')
      .upsert({
        id: user.id, // This links the profile securely to this exact user account
        stall_name: stallName,
        food_category: foodCategory,
        phone: phone,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex justify-center items-center font-black text-gray-400">LOADING PROFILE...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 selection:bg-blue-200">
      <div className="max-w-xl mx-auto">
        
        {/* Header Navigation */}
        <div className="mb-10 border-b-4 border-black pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">MY PROFILE</h1>
            <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest">Manage your business identity.</p>
          </div>
          <button onClick={() => router.back()} className="text-blue-600 font-bold text-[10px] uppercase tracking-widest hover:underline mb-2">
            ← GO BACK
          </button>
        </div>

        {/* Profile Form */}
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-200">
          
          {message.text && (
            <div className={`p-4 rounded-xl mb-8 font-bold text-[10px] uppercase tracking-widest border ${
              message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            {/* Stall Name */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Stall / Brand Name *</label>
              <input 
                type="text" 
                required 
                value={stallName} 
                onChange={(e) => setStallName(e.target.value)} 
                placeholder="e.g., Biryani Bhai" 
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-xl text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Food Category */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Business Category</label>
              <select 
                value={foodCategory} 
                onChange={(e) => setFoodCategory(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="" disabled>Select a category...</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Clothing & Apparel">Clothing & Apparel</option>
                <option value="Accessories & Jewelry">Accessories & Jewelry</option>
                <option value="Games & Entertainment">Games & Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Contact Phone Number</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="+91 9876543210" 
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Organizers will use this to call you directly.</p>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-black hover:bg-blue-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saving ? 'SAVING PROFILE...' : 'UPDATE PROFILE'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}