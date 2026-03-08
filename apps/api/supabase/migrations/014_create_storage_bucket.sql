-- Create the storage bucket for trade images if it doesn't exist
insert into storage.buckets (id, name, public)
values ('trade_images', 'trade_images', true)
on conflict (id) do nothing;

-- Set up access controls for the bucket
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'trade_images' );

create policy "Users can upload their own trade images"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'trade_images' and
    (auth.uid() = owner)
);

create policy "Users can update their own trade images"
on storage.objects for update
to authenticated
using (
    bucket_id = 'trade_images' and
    (auth.uid() = owner)
);

create policy "Users can delete their own trade images"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'trade_images' and
    (auth.uid() = owner)
);
