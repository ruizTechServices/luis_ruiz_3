-- Keep public photo URLs without allowing clients to list the whole bucket.
-- Make profile pictures private so owner-scoped storage policies are effective.

update storage.buckets
set public = true
where id = 'photos';

drop policy if exists photos_public_select on storage.objects;

update storage.buckets
set public = false
where id = 'user_profile_pictures';
