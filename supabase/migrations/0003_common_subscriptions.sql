-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_common_subscriptions;

-- Create the function
CREATE OR REPLACE FUNCTION get_common_subscriptions(
    user_1_id UUID,
    user_2_id UUID
)
RETURNS TABLE (
    channel_id VARCHAR,
    channel_name VARCHAR
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT s1.channel_id, s1.channel_name
    FROM subscriptions s1
    INNER JOIN subscriptions s2 
        ON s1.channel_id = s2.channel_id
        AND s1.user_id = user_1_id 
        AND s2.user_id = user_2_id;

    -- Log the function call for debugging
    RAISE NOTICE 'get_common_subscriptions called with user_1_id: %, user_2_id: %', user_1_id, user_2_id;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_common_subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION get_common_subscriptions TO anon;
GRANT EXECUTE ON FUNCTION get_common_subscriptions TO service_role;

-- Test the function
COMMENT ON FUNCTION get_common_subscriptions IS 'Gets common YouTube channel subscriptions between two users'; 