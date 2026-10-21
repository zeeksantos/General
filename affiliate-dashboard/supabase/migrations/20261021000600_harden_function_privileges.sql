-- Found by the Supabase security advisor after the first real deploy.

-- handle_new_user only runs as an auth.users trigger; nobody should call it through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- is_admin() is evaluated by RLS policies for signed-in users only.
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
