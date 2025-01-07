-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    password_hash TEXT,
    google_id VARCHAR,
    name VARCHAR NOT NULL,
    birth_date DATE NOT NULL,
    city VARCHAR,
    profile_picture TEXT,
    matching_param INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions Table
CREATE TABLE subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id VARCHAR NOT NULL,
    channel_name VARCHAR NOT NULL,
    category VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches Table
CREATE TABLE matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relevancy_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_match UNIQUE(user_1_id, user_2_id),
    CONSTRAINT different_users CHECK (user_1_id != user_2_id)
);

-- Prematches Table
CREATE TABLE prematches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relevancy_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    skipped BOOLEAN DEFAULT FALSE,
    CONSTRAINT different_users CHECK (user_id != match_user_id)
);

-- Chats Table
CREATE TABLE chats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_matches_users ON matches(user_1_id, user_2_id);
CREATE INDEX idx_prematches_user_id ON prematches(user_id);
CREATE INDEX idx_prematches_match_user_id ON prematches(match_user_id);
CREATE INDEX idx_chats_match_id ON chats(match_id); 