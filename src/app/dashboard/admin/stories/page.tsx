import { supabaseAdminClient } from '@/lib/supabase-admin';
import { StoryAdminTable } from '@/components/admin/story-admin-table';

export const dynamic = 'force-dynamic';

export default async function AdminStoriesPage() {
  const supabase = supabaseAdminClient();
  const { data, error } = await supabase
    .from('donation_posts')
    .select(
      `
      id,
      title,
      story,
      donation_date,
      created_at,
      updated_at,
      is_published,
      reactions_count,
      comments_count,
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
      stories={data ?? []}
      error={error?.message ?? null}
      adminEmails={(process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)}
    />
  );
}

