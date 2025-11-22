'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { supabaseBrowserClient } from '@/lib/supabase-browser';
import type { Database } from '@/types/database';

type Institute = Database['public']['Tables']['institute_lookup']['Row'];

export default function InstitutesManagementPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    type: '',
    district: '',
    departments: [] as string[],
    batches: [] as string[],
    is_active: true,
  });

  // Temp inputs for adding departments/batches
  const [newDepartment, setNewDepartment] = useState('');
  const [newBatch, setNewBatch] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      loadInstitutes();
    }
  }, [user]);

  const loadInstitutes = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = supabaseBrowserClient();
    
    const { data, error: fetchError } = await supabase
      .from('institute_lookup')
      .select('*')
      .order('name', { ascending: true });

    if (fetchError) {
      setError('ইনস্টিটিউট লোড করতে সমস্যা হয়েছে');
      console.error(fetchError);
    } else {
      setInstitutes((data as Institute[]) ?? []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = supabaseBrowserClient();

    try {
      if (editingId) {
        // Update existing
        const { data, error: updateError } = await supabase.rpc('admin_update_institute', {
          p_id: editingId,
          p_name: formData.name,
          p_name_en: formData.name_en || null,
          p_type: formData.type || null,
          p_district: formData.district || null,
          p_departments: formData.departments,
          p_batches: formData.batches,
          p_is_active: formData.is_active,
        } as any);

        if (updateError) {
          setError('আপডেট করতে সমস্যা হয়েছে: ' + updateError.message);
          console.error(updateError);
          return;
        }

        if (!data?.success) {
          setError(data?.message || 'আপডেট করতে সমস্যা হয়েছে');
          return;
        }
      } else {
        // Insert new
        const { data, error: insertError } = await supabase.rpc('admin_add_institute', {
          p_name: formData.name,
          p_name_en: formData.name_en || null,
          p_type: formData.type || null,
          p_district: formData.district || null,
          p_departments: formData.departments,
          p_batches: formData.batches,
          p_is_active: formData.is_active,
        } as any);

        if (insertError) {
          setError('যোগ করতে সমস্যা হয়েছে: ' + insertError.message);
          console.error(insertError);
          return;
        }

        if (!data?.success) {
          setError(data?.message || 'যোগ করতে সমস্যা হয়েছে');
          return;
        }
      }

      // Reset form and reload
      setFormData({ name: '', name_en: '', type: '', district: '', departments: [], batches: [], is_active: true });
      setNewDepartment('');
      setNewBatch('');
      setIsAdding(false);
      setEditingId(null);
      loadInstitutes();
    } catch (err) {
      setError('একটি সমস্যা হয়েছে');
      console.error(err);
    }
  };

  const handleEdit = (institute: Institute) => {
    setFormData({
      name: institute.name,
      name_en: institute.name_en || '',
      type: institute.type || '',
      district: institute.district || '',
      departments: institute.departments || [],
      batches: institute.batches || [],
      is_active: institute.is_active,
    });
    setEditingId(institute.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিত এই ইনস্টিটিউট মুছতে চান?')) return;

    const supabase = supabaseBrowserClient();
    const { data, error: deleteError } = await supabase.rpc('admin_delete_institute', {
      p_id: id,
    } as any);

    if (deleteError) {
      setError('মুছতে সমস্যা হয়েছে: ' + deleteError.message);
      console.error(deleteError);
    } else if (!data?.success) {
      setError(data?.message || 'মুছতে সমস্যা হয়েছে');
    } else {
      loadInstitutes();
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', name_en: '', type: '', district: '', departments: [], batches: [], is_active: true });
    setNewDepartment('');
    setNewBatch('');
    setEditingId(null);
    setIsAdding(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-slate-500">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">ইনস্টিটিউট ম্যানেজমেন্ট</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-600"
        >
          {isAdding ? 'বাতিল করুন' : '+ নতুন ইনস্টিটিউট'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      )}

      {/* Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <form onSubmit={handleSubmit}>
              <h2 className="mb-6 text-xl font-bold text-slate-900">
                {editingId ? 'ইনস্টিটিউট এডিট করুন' : 'নতুন ইনস্টিটিউট যোগ করুন'}
              </h2>
          
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700">
                    নাম (বাংলা) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700">Name (English)</label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="university">University</option>
                    <option value="engineering">Engineering</option>
                    <option value="medical">Medical</option>
                    <option value="college">College</option>
                    <option value="school">School</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700">জেলা</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="ঢাকা">ঢাকা</option>
                    <option value="চট্টগ্রাম">চট্টগ্রাম</option>
                    <option value="রাজশাহী">রাজশাহী</option>
                    <option value="খুলনা">খুলনা</option>
                    <option value="সিলেট">সিলেট</option>
                    <option value="বরিশাল">বরিশাল</option>
                    <option value="রংপুর">রংপুর</option>
                    <option value="ময়মনসিংহ">ময়মনসিংহ</option>
                    <option value="গাজীপুর">গাজীপুর</option>
                    <option value="নারায়ণগঞ্জ">নারায়ণগঞ্জ</option>
                    <option value="কুমিল্লা">কুমিল্লা</option>
                    <option value="নোয়াখালী">নোয়াখালী</option>
                    <option value="ফেনী">ফেনী</option>
                    <option value="কক্সবাজার">কক্সবাজার</option>
                    <option value="কুষ্টিয়া">কুষ্টিয়া</option>
                    <option value="যশোর">যশোর</option>
                    <option value="দিনাজপুর">দিনাজপুর</option>
                    <option value="পাবনা">পাবনা</option>
                    <option value="টাঙ্গাইল">টাঙ্গাইল</option>
                    <option value="কিশোরগঞ্জ">কিশোরগঞ্জ</option>
                    <option value="নরসিংদী">নরসিংদী</option>
                    <option value="মানিকগঞ্জ">মানিকগঞ্জ</option>
                    <option value="ফরিদপুর">ফরিদপুর</option>
                    <option value="সুনামগঞ্জ">সুনামগঞ্জ</option>
                    <option value="হবিগঞ্জ">হবিগঞ্জ</option>
                    <option value="পটুয়াখালী">পটুয়াখালী</option>
                    <option value="বগুড়া">বগুড়া</option>
                    <option value="নাটোর">নাটোর</option>
                    <option value="নওগাঁ">নওগাঁ</option>
                    <option value="সিরাজগঞ্জ">সিরাজগঞ্জ</option>
                    <option value="গোপালগঞ্জ">গোপালগঞ্জ</option>
                    <option value="ব্রাহ্মণবাড়িয়া">ব্রাহ্মণবাড়িয়া</option>
                  </select>
                </div>

                {/* Departments Section */}
                <div className="grid gap-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Departments</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder="e.g., Computer Science"
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newDepartment.trim() && !formData.departments.includes(newDepartment.trim())) {
                            setFormData({ ...formData, departments: [...formData.departments, newDepartment.trim()] });
                            setNewDepartment('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newDepartment.trim() && !formData.departments.includes(newDepartment.trim())) {
                          setFormData({ ...formData, departments: [...formData.departments, newDepartment.trim()] });
                          setNewDepartment('');
                        }
                      }}
                      className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
                    >
                      Add
                    </button>
                  </div>
                  {formData.departments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.departments.map((dept, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700"
                        >
                          {dept}
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, departments: formData.departments.filter((_, i) => i !== idx) })}
                            className="hover:text-primary-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Batches Section */}
                <div className="grid gap-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Batches</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBatch}
                      onChange={(e) => setNewBatch(e.target.value)}
                      placeholder="e.g., 2020, 47th"
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newBatch.trim() && !formData.batches.includes(newBatch.trim())) {
                            setFormData({ ...formData, batches: [...formData.batches, newBatch.trim()] });
                            setNewBatch('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newBatch.trim() && !formData.batches.includes(newBatch.trim())) {
                          setFormData({ ...formData, batches: [...formData.batches, newBatch.trim()] });
                          setNewBatch('');
                        }
                      }}
                      className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
                    >
                      Add
                    </button>
                  </div>
                  {formData.batches.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.batches.map((batch, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700"
                        >
                          {batch}
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, batches: formData.batches.filter((_, i) => i !== idx) })}
                            className="hover:text-emerald-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <label className="text-sm font-semibold text-slate-700">Active</label>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
                >
                  {editingId ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">নাম</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">English</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">জেলা</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {institutes.map((institute) => (
              <tr key={institute.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">{institute.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{institute.name_en || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{institute.type || '-'}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{institute.district || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      institute.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {institute.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <button
                    onClick={() => handleEdit(institute)}
                    className="mr-2 text-primary-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(institute.id)}
                    className="text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        মোট {institutes.length} টি ইনস্টিটিউট
      </p>
    </div>
  );
}
