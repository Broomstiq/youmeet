import React, { useState, useEffect } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText } from '@mui/material';
import { createClient } from '@supabase/supabase-js';
import MatchCard from './MatchCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SwipeContainerProps {
  userId: string;
}

const SwipeContainer: React.FC<SwipeContainerProps> = ({ userId }) => {
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [showSubscriptions, setShowSubscriptions] = useState(false);

  const getCommonSubscriptions = async (userId: string, matchUserId: string) => {
    // First get the match user's channel IDs
    const { data: matchChannels, error: matchError } = await supabase
      .from('subscriptions')
      .select('channel_id')
      .eq('user_id', matchUserId);

    if (matchError) {
      console.error('Error fetching match channels:', matchError);
      return [];
    }

    // Extract channel IDs into an array
    const channelIds = matchChannels.map(sub => sub.channel_id);

    // Then get the common subscriptions
    const { data, error } = await supabase
      .from('subscriptions')
      .select('channel_id, channel_name')
      .eq('user_id', userId)
      .in('channel_id', channelIds);

    if (error) {
      console.error('Error fetching common subscriptions:', error);
      return [];
    }

    return data || [];
  };

  const fetchNextMatch = async () => {
    try {
      console.log('Fetching next match for user:', userId);

      // First check if there are any matches at all
      const { count: totalMatches, error: countError } = await supabase
        .from('prematches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;

      // If no matches exist at all, return early
      if (totalMatches === 0) {
        console.log('No matches exist in the database');
        setCurrentMatch(null);
        return;
      }

      // First check if there are any non-skipped matches
      const { data: nonSkippedMatches, error: checkError } = await supabase
        .from('prematches')
        .select('id')
        .eq('user_id', userId)
        .eq('skipped', false)
        .limit(1);

      // If no non-skipped matches exist, reset all skipped matches
      if (!nonSkippedMatches?.length) {
        console.log('No non-skipped matches found, resetting skipped status');
        const { error: resetError } = await supabase
          .from('prematches')
          .update({ skipped: false })
          .eq('user_id', userId);

        if (resetError) {
          console.error('Error resetting skipped matches:', resetError);
          throw resetError;
        }
      }

      // Get the next match
      const { data: matches, error: matchError } = await supabase
        .from('prematches')
        .select(`
          match_user_id,
          relevancy_score,
          skipped,
          users:match_user_id (
            id,
            name,
            birth_date,
            profile_picture,
            city
          )
        `)
        .eq('user_id', userId)
        .order('skipped', { ascending: true })
        .order('relevancy_score', { ascending: false })
        .limit(1);

      if (matchError) throw matchError;

      // Handle no matches found
      if (!matches || matches.length === 0) {
        console.log('No matches found after query');
        setCurrentMatch(null);
        return;
      }

      const prematch = matches[0];
      console.log('Fetched prematch:', prematch);

      // Get common subscriptions
      const commonSubs = await getCommonSubscriptions(userId, prematch.match_user_id);
      console.log('Found common subscriptions:', commonSubs);

      // Set the current match with common subscriptions
      const matchData = {
        ...prematch.users,
        commonSubscriptions: commonSubs,
        relevancy_score: prematch.relevancy_score
      };

      console.log('Setting current match data:', matchData);
      setCurrentMatch(matchData);

    } catch (error: any) {
      console.error('Error fetching match:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stack: error.stack
      });
      setCurrentMatch(null);
    }
  };

  useEffect(() => {
    if (userId) {
      console.log('SwipeContainer mounted/updated with userId:', userId);
      fetchNextMatch();
    }
  }, [userId]);

  const handleMatch = async () => {
    if (!currentMatch) return;

    try {
      // 1. Create the match in matches table
      const { error: matchError } = await supabase.from('matches').insert({
        user_1_id: userId,
        user_2_id: currentMatch.id,
        relevancy_score: currentMatch.relevancy_score
      });

      if (matchError) throw matchError;

      // 2. Remove this prematch from both users' prematch lists
      const { error: deleteError } = await supabase
        .from('prematches')
        .delete()
        .or(
          `and(user_id.eq.${userId},match_user_id.eq.${currentMatch.id}),` +
          `and(user_id.eq.${currentMatch.id},match_user_id.eq.${userId})`
        );

      if (deleteError) throw deleteError;

      console.log('Successfully created match and removed prematches for both users');
      
      // 3. Fetch the next most relevant prematch
      await fetchNextMatch();
    } catch (error: any) {
      console.error('Error handling match:', {
        message: error.message,
        details: error.details,
        code: error.code
      });
    }
  };

  const handleSkip = async () => {
    if (!currentMatch) return;

    try {
      // Update the prematch as skipped
      const { error: updateError } = await supabase
        .from('prematches')
        .update({ skipped: true })
        .eq('user_id', userId)
        .eq('match_user_id', currentMatch.id);

      if (updateError) throw updateError;

      // Fetch the next match
      await fetchNextMatch();
    } catch (error: any) {
      console.error('Error handling skip:', {
        message: error.message,
        details: error.details,
        code: error.code
      });
    }
  };

  if (!currentMatch) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        No more matches available at the moment.
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <MatchCard
        user={currentMatch}
        onMatch={handleMatch}
        onSkip={handleSkip}
        onShowMore={() => setShowSubscriptions(true)}
      />

      <Dialog
        open={showSubscriptions}
        onClose={() => setShowSubscriptions(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Common Subscriptions</DialogTitle>
        <DialogContent>
          <List>
            {currentMatch.commonSubscriptions.map((sub: any, index: number) => (
              <ListItem key={index}>
                <ListItemText primary={sub.channel_name} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SwipeContainer; 