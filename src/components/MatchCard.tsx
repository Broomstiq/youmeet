import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Box } from '@mui/material';
import { User, CommonSubscription } from '../lib/types';

interface MatchCardProps {
  user: {
    id: string;
    name: string;
    birth_date: string;
    profile_picture?: string;
    commonSubscriptions: CommonSubscription[];
  };
  onMatch: () => void;
  onSkip: () => void;
  onShowMore: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ user, onMatch, onSkip, onShowMore }) => {
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const randomCommonChannels = user.commonSubscriptions
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  return (
    <Card sx={{ maxWidth: 600, width: '100%', position: 'relative' }}>
      <CardMedia
        component="img"
        height="400"
        image={user.profile_picture || '/default-profile.jpg'}
        alt={user.name}
      />
      <CardContent>
        <Typography variant="h5" component="div">
          {user.name}, {calculateAge(user.birth_date)}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          {user.commonSubscriptions.length} common subscriptions
        </Typography>
        
        <Box sx={{ mt: 1 }}>
          {randomCommonChannels.map((sub, index) => (
            <Typography key={index} variant="body2" color="text.secondary">
              • {sub.channel_name}
            </Typography>
          ))}
        </Box>

        <Button
          variant="text"
          color="primary"
          onClick={onShowMore}
          sx={{ mt: 1 }}
        >
          Show more
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="contained"
            color="error"
            onClick={onSkip}
            sx={{ width: '45%' }}
          >
            Skip
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={onMatch}
            sx={{ width: '45%' }}
          >
            Match
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MatchCard; 