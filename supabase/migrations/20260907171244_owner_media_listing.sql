begin;

-- Public image URLs already work because photos is a public bucket. Listing
-- object metadata is a separate permission, reserved for the verified owner.
create policy photos_gio_select
on storage.objects for select to authenticated
using (bucket_id = 'photos' and (select public.is_gio_admin()));

commit;
