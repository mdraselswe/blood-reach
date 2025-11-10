import type { Database } from '@/types/database';
import { supabaseAdminClient } from '@/lib/supabase-admin';
import { StoryAdminTable } from '@/components/admin/story-admin-table';

export const dynamic = 'force-dynamic';

type StoryRow = Database['public']['Tables']['donation_posts']['Row'] & {
  donors: {
    display_name: string | null;
    blood_group: string | null;
    district: string | null;
    area: string | null;
  } | null;
};

export default async function AdminStoriesPage() {
  const supabase = supabaseAdminClient();
  const { data, error } = await supabase
    .from('donation_posts')
    .select(
      `
      *,
      donors (
        display_name,
        blood_group,
        district,
        area
      )
    `,
    )
    .order('created_at', { ascending: false });

  return (
    <StoryAdminTable
      stories={(data ?? []) as StoryRow[]}
      error={error?.message ?? null}
      adminEmails={(process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)}
    />
  );
}

