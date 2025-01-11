CREATE TABLE analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User metrics
    total_users INTEGER,
    active_users_24h INTEGER,
    avg_subscriptions_per_user FLOAT,
    
    -- Prematch metrics
    total_prematches INTEGER,
    avg_prematches_per_user FLOAT,
    avg_relevancy_score FLOAT,
    prematch_distribution JSONB, -- Store distribution data
    
    -- Performance metrics
    calculation_time_ms INTEGER,
    cache_hit_ratio FLOAT,
    queue_length INTEGER,
    
    -- Matching metrics
    successful_matches_24h INTEGER,
    skip_ratio_24h FLOAT,
    
    -- Additional data
    popular_channels JSONB, -- Store top channels data
    matching_param_distribution JSONB -- Store distribution of matching parameters
);

-- Index for efficient time-series queries
CREATE INDEX idx_analytics_timestamp ON analytics_snapshots(timestamp); 