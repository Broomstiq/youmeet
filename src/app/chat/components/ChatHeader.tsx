'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Button,
  DialogActions,
  DialogContentText
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import InfoIcon from '@mui/icons-material/Info'
import DeleteIcon from '@mui/icons-material/Delete'

interface ChatHeaderProps {
  matchId: string
}

interface MatchDetails {
  user1: {
    id: string
    name: string
    profile_picture?: string
    birth_date?: string
    city?: string
  }
  user2: {
    id: string
    name: string
    profile_picture?: string
    birth_date?: string
    city?: string
  }
  user_1_id: string
  user_2_id: string
  relevancy_score: number
  commonSubscriptions?: Array<{
    channel_id: string
    channel_name: string
  }>
}

export default function ChatHeader({ matchId }: ChatHeaderProps) {
  const [partnerInfo, setPartnerInfo] = useState<MatchDetails['user1'] | null>(null)
  const [commonSubs, setCommonSubs] = useState<Array<{ channel_name: string }>>([])
  const [showProfile, setShowProfile] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    const loadMatchDetails = async () => {
      if (!session?.user?.id) return

      try {
        // Fetch match and user details
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select(`
            user_1_id,
            user_2_id,
            relevancy_score,
            user1:user_1_id(
              id,
              name,
              profile_picture,
              birth_date,
              city
            ),
            user2:user_2_id(
              id,
              name,
              profile_picture,
              birth_date,
              city
            )
          `)
          .eq('id', matchId)
          .single() as { data: MatchDetails | null, error: any }

        if (matchError) throw matchError

        if (match) {
          const isUser1 = match.user_1_id === session.user.id
          const partner = isUser1 ? match.user2 : match.user1
          setPartnerInfo(partner)

          // Fetch common subscriptions
          const { data: commonSubs } = await getCommonSubscriptions(
            session.user.id,
            partner.id
          )
          setCommonSubs(commonSubs || [])
        }
      } catch (error) {
        console.error('Error loading match details:', error)
      }
    }

    loadMatchDetails()
  }, [matchId, session?.user?.id])

  const getCommonSubscriptions = async (userId: string, partnerId: string) => {
    // Get partner's subscriptions
    const { data: partnerSubs } = await supabase
      .from('subscriptions')
      .select('channel_id')
      .eq('user_id', partnerId)

    if (!partnerSubs) return { data: [] }

    // Get common subscriptions
    const { data } = await supabase
      .from('subscriptions')
      .select('channel_name')
      .eq('user_id', userId)
      .in('channel_id', partnerSubs.map(sub => sub.channel_id))

    return { data }
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const handleDeleteMatch = async () => {
    if (!session?.user?.id) return

    try {
      // Delete chats first (due to foreign key constraint)
      const { error: chatsError } = await supabase
        .from('chats')
        .delete()
        .eq('match_id', matchId)

      if (chatsError) throw chatsError

      // Delete unread messages
      const { error: unreadError } = await supabase
        .from('unread_messages')
        .delete()
        .eq('match_id', matchId)

      if (unreadError) throw unreadError

      // Delete the match
      const { error: matchError } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId)

      if (matchError) throw matchError

      // Redirect to chat dashboard
      router.push('/chat')
    } catch (error) {
      console.error('Error deleting match:', error)
      // You might want to show an error message to the user here
    }
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/chat')}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, flexGrow: 1 }}>
            <Avatar
              src={partnerInfo?.profile_picture}
              alt={partnerInfo?.name || 'User'}
              sx={{ mr: 2 }}
            >
              {!partnerInfo?.profile_picture && (partnerInfo?.name?.[0]?.toUpperCase() || '?')}
            </Avatar>
            <Typography variant="h6">
              {partnerInfo?.name || 'Loading...'}
            </Typography>
          </Box>

          <IconButton color="inherit" onClick={() => setShowProfile(true)}>
            <InfoIcon />
          </IconButton>
          <IconButton 
            color="inherit" 
            onClick={() => setShowDeleteConfirm(true)}
            sx={{ ml: 1 }}
          >
            <DeleteIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Dialog
        open={showProfile}
        onClose={() => setShowProfile(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Profile Details</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              src={partnerInfo?.profile_picture}
              alt={partnerInfo?.name || 'User'}
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
            >
              {!partnerInfo?.profile_picture && (partnerInfo?.name?.[0]?.toUpperCase() || '?')}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {partnerInfo?.name}
            </Typography>
            {partnerInfo?.birth_date && (
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {calculateAge(partnerInfo.birth_date)} years old
              </Typography>
            )}
            {partnerInfo?.city && (
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {partnerInfo.city}
              </Typography>
            )}
          </Box>

          <Typography variant="h6" gutterBottom>
            Common Subscriptions ({commonSubs.length})
          </Typography>
          <List>
            {commonSubs.map((sub, index) => (
              <ListItem key={index}>
                <ListItemText primary={sub.channel_name} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <DialogTitle>Delete Match</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this match? This will permanently remove all messages and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteMatch} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
} 