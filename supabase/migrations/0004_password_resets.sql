-- Create password resets table
create table if not exists password_resets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) not null,
  token text not null,
  expires_at timestamp with time zone not null,
  used boolean default false,
  created_at timestamp with time zone default now(),
  unique(user_id, token)
);

-- Add RLS policies
alter table password_resets enable row level security;

-- Allow users to see their own reset tokens
create policy "Users can see their own reset tokens"
  on password_resets for select
  using (auth.uid() = user_id);

-- Allow the service role to manage all reset tokens
create policy "Service role can manage reset tokens"
  on password_resets for all
  using (true)
  with check (true);

-- Add indexes for performance
create index idx_password_resets_user_id on password_resets(user_id);
create index idx_password_resets_token on password_resets(token);
create index idx_password_resets_expires_at on password_resets(expires_at); 