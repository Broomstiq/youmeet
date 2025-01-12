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
  Box
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

interface ChatHeaderProps {
  matchId: string
}

interface MatchDetails {
  user1: {
    name: string
    profile_picture?: string
  }
  user2: {
    name: string
    profile_picture?: string
  }
  user_1_id: string
  user_2_id: string
}

export default function ChatHeader({ matchId }: ChatHeaderProps) {
  const [partnerInfo, setPartnerInfo] = useState<{ name: string, profile_picture?: string } | null>(null)
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    const loadMatchDetails = async () => {
      if (!session?.user?.id) return

      const { data: match, error } = await supabase
        .from('matches')
        .select(`
          user_1_id,
          user_2_id,
          user1:user_1_id(
            name,
            profile_picture
          ),
          user2:user_2_id(
            name,
            profile_picture
          )
        `)
        .eq('id', matchId)
        .single() as { data: MatchDetails | null, error: any }

      if (error) {
        console.error('Error loading match details:', error)
        return
      }

      if (match) {
        const isUser1 = match.user_1_id === session.user.id
        const partner = isUser1 ? match.user2 : match.user1
        setPartnerInfo(partner)
      }
    }

    loadMatchDetails()
  }, [matchId, session?.user?.id])

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => router.push('/chat')}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
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
      </Toolbar>
    </AppBar>
  )
} 