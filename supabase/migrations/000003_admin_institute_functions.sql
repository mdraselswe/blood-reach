-- Server-side functions for admin institute management (bypasses RLS)

-- Function to add institute (admin only, but uses service role internally)
create or replace function public.admin_add_institute(
  p_name text,
  p_name_en text default null,
  p_type text default null,
  p_district text default null,
  p_is_active boolean default true
)
returns json
language plpgsql
security definer -- Run with function owner's privileges
set search_path = public
as $$
declare
  v_new_id integer;
  v_user_role text;
begin
  -- Check if user is admin/moderator
  select role into v_user_role
  from public.profiles
  where id = auth.uid();
  
  if v_user_role not in ('admin', 'moderator') then
    raise exception 'Unauthorized: Only admins can manage institutes';
  end if;
  
  -- Insert the institute
  insert into public.institute_lookup (name, name_en, type, district, is_active)
  values (p_name, p_name_en, p_type, p_district, p_is_active)
  returning id into v_new_id;
  
  return json_build_object(
    'success', true,
    'id', v_new_id,
    'message', 'Institute added successfully'
  );
exception
  when others then
    return json_build_object(
      'success', false,
      'message', SQLERRM
    );
end;
$$;

-- Function to update institute
create or replace function public.admin_update_institute(
  p_id integer,
  p_name text,
  p_name_en text default null,
  p_type text default null,
  p_district text default null,
  p_is_active boolean default true
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_role text;
begin
  -- Check if user is admin/moderator
  select role into v_user_role
  from public.profiles
  where id = auth.uid();
  
  if v_user_role not in ('admin', 'moderator') then
    raise exception 'Unauthorized: Only admins can manage institutes';
  end if;
  
  -- Update the institute
  update public.institute_lookup
  set 
    name = p_name,
    name_en = p_name_en,
    type = p_type,
    district = p_district,
    is_active = p_is_active
  where id = p_id;
  
  return json_build_object(
    'success', true,
    'message', 'Institute updated successfully'
  );
exception
  when others then
    return json_build_object(
      'success', false,
      'message', SQLERRM
    );
end;
$$;

-- Function to delete institute
create or replace function public.admin_delete_institute(p_id integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_role text;
begin
  -- Check if user is admin/moderator
  select role into v_user_role
  from public.profiles
  where id = auth.uid();
  
  if v_user_role not in ('admin', 'moderator') then
    raise exception 'Unauthorized: Only admins can manage institutes';
  end if;
  
  -- Delete the institute
  delete from public.institute_lookup where id = p_id;
  
  return json_build_object(
    'success', true,
    'message', 'Institute deleted successfully'
  );
exception
  when others then
    return json_build_object(
      'success', false,
      'message', SQLERRM
    );
end;
$$;
