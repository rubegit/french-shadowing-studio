-- ============================================================================
-- FRENCH SHADOWING STUDIO - BẢNG ĐỒNG BỘ DỮ LIỆU ĐÁM MÂY (SUPABASE SQL)
-- Chạy đoạn mã này trong mục "SQL Editor" trên bảng điều khiển Supabase của bạn.
-- ============================================================================

-- 1. Tạo bảng lưu trữ dữ liệu đồng bộ cá nhân (Từ vựng, Video import, Tiến độ)
create table if not exists public.fss_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  vocab jsonb default '[]'::jsonb,
  history jsonb default '[]'::jsonb,
  progress jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 2. Bật Row Level Security (RLS) để đảm bảo an toàn tuyệt đối
alter table public.fss_user_data enable row level security;

-- 3. Tạo chính sách bảo mật: Mỗi người dùng chỉ được đọc/ghi dữ liệu của chính mình
drop policy if exists "Users can view own data" on public.fss_user_data;
create policy "Users can view own data" 
  on public.fss_user_data for select 
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own data" on public.fss_user_data;
create policy "Users can insert own data" 
  on public.fss_user_data for insert 
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own data" on public.fss_user_data;
create policy "Users can update own data" 
  on public.fss_user_data for update 
  using (auth.uid() = user_id);

-- ============================================================================
-- 4. Tạo Bucket lưu trữ file âm thanh MP3 bài báo (article-audios)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('article-audios', 'article-audios', false, 26214400, array['audio/mpeg', 'audio/mp3'])
on conflict (id) do update set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = array['audio/mpeg', 'audio/mp3'];

-- 5. Chính sách bảo mật Storage: Mỗi người dùng chỉ đọc/ghi file trong thư mục của chính mình (auth.uid()/*)
drop policy if exists "Users can upload their own article audios" on storage.objects;
create policy "Users can upload their own article audios"
  on storage.objects for insert
  with check (bucket_id = 'article-audios' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can update their own article audios" on storage.objects;
create policy "Users can update their own article audios"
  on storage.objects for update
  using (bucket_id = 'article-audios' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'article-audios' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can view their own article audios" on storage.objects;
create policy "Users can view their own article audios"
  on storage.objects for select
  using (bucket_id = 'article-audios' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete their own article audios" on storage.objects;
create policy "Users can delete their own article audios"
  on storage.objects for delete
  using (bucket_id = 'article-audios' and auth.uid()::text = (storage.foldername(name))[1]);
