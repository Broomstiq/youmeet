'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Container,
  CircularProgress
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

interface ChatPreview {
  match_id: string
  partner_name: string
  partner_profile_picture?: string
  last_message?: string
  last_message_time?: string
}

interface UserData {
  name: string
  profile_picture?: string
}

interface Match {
  id: string
  user_1_id: string
  user_2_id: string
  user1: UserData
  user2: UserData
  chats?: Array<{
    message: string
    created_at: string
  }>
}

export default function ChatDashboard() {
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    const loadChats = async () => {
      if (!session?.user?.id) return

      try {
        setIsLoading(true)
        setError(null)

        const { data: matches, error: supabaseError } = await supabase
          .from('matches')
          .select(`
            id,
            user_1_id,
            user_2_id,
            user1:user_1_id(
              name,
              profile_picture
            ),
            user2:user_2_id(
              name,
              profile_picture
            ),
            chats(
              message,
              created_at
            )
          `)
          .or(`user_1_id.eq.${session.user.id},user_2_id.eq.${session.user.id}`)
          .order('created_at', { ascending: false }) as { data: Match[] | null, error: any }

        console.log('Raw matches data:', matches) // Debug log

        if (supabaseError) {
          throw supabaseError
        }

        if (matches) {
          const chatPreviews: ChatPreview[] = matches.map(match => {
            console.log('Match:', match)
            const isUser1 = match.user_1_id === session.user.id
            const partnerData = isUser1 ? match.user2 : match.user1

            console.log('Processing match:', {
              matchId: match.id,
              user1Data: match.user1,
              user2Data: match.user2,
              partnerData
            })

            return {
              match_id: match.id,
              partner_name: partnerData?.name || 'Unknown',
              partner_profile_picture: partnerData?.profile_picture,
              last_message: match.chats?.[0]?.message,
              last_message_time: match.chats?.[0]?.created_at
            }
          })

          setChats(chatPreviews)
        }
      } catch (error) {
        console.error('Error loading chats:', error)
        setError('Failed to load chats. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadChats()

    // Subscribe to new messages
    const subscription = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats'
        },
        async () => {
          await loadChats()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [session])

  if (error) {
    return (
      <Box>
        <AppBar position="static">
          <Toolbar>
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={() => router.push('/dashboard')}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 2 }}>
              Chats
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 2 }}>
          <Typography color="error" align="center">
            {error}
          </Typography>
        </Container>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box>
        <AppBar position="static">
          <Toolbar>
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={() => router.push('/dashboard')}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ ml: 2 }}>
              Chats
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="md" sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </Box>
    )
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={() => router.push('/dashboard')}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2 }}>
            Chats
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 2 }}>
        <List>
          {chats.map((chat) => (
            <ListItem 
              key={chat.match_id}
              button
              onClick={() => router.push(`/chat/${chat.match_id}`)}
              divider
            >
              <ListItemAvatar>
                <Avatar 
                  src={chat.partner_profile_picture}
                  alt={chat.partner_name}
                >
                  {!chat.partner_profile_picture && (chat.partner_name[0]?.toUpperCase() || '?')}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={chat.partner_name}
                secondary={
                  chat.last_message 
                    ? `${chat.last_message.substring(0, 50)}${chat.last_message.length > 50 ? '...' : ''}`
                    : 'No messages yet'
                }
              />
              {chat.last_message_time && (
                <Typography variant="caption" color="text.secondary">
                  {new Date(chat.last_message_time).toLocaleDateString()}
                </Typography>
              )}
            </ListItem>
          ))}
          {chats.length === 0 && (
            <Typography variant="body1" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
              No matches yet. Start swiping to find matches!
            </Typography>
          )}
        </List>
      </Container>
    </Box>
  )
} 