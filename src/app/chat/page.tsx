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
  CircularProgress,
  Badge
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

interface ChatPreview {
  match_id: string
  partner_name: string
  partner_profile_picture?: string
  last_message?: string
  last_message_time?: string
  unread_count: number
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
  created_at: string
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
            ),
            created_at
          `)
          .or(`user_1_id.eq.${session.user.id},user_2_id.eq.${session.user.id}`)
          .order('created_at', { ascending: false }) as { data: Match[] | null, error: any }

        if (supabaseError) {
          throw supabaseError
        }

        if (matches) {
          const chatPreviews: ChatPreview[] = await Promise.all(matches.map(async match => {
            const isUser1 = match.user_1_id === session.user.id
            const partnerData = isUser1 ? match.user2 : match.user1
            
            const latestMessage = match.chats?.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]

            // Fetch unread count
            const { data: unreadData, error: unreadError } = await supabase
              .from('unread_messages')
              .select('unread_count')
              .eq('user_id', session.user.id)
              .eq('match_id', match.id)
              .maybeSingle()

            console.log('Fetched unread count:', {
              matchId: match.id,
              unreadData,
              unreadError,
              userId: session.user.id
            })

            return {
              match_id: match.id,
              partner_name: partnerData?.name || 'Unknown',
              partner_profile_picture: partnerData?.profile_picture,
              last_message: latestMessage?.message,
              last_message_time: latestMessage?.created_at,
              unread_count: unreadData?.unread_count || 0
            }
          }))

          const sortedChats = chatPreviews.sort((a, b) => {
            const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0
            const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0
            return timeB - timeA
          })

          setChats(sortedChats)
        }
      } catch (error) {
        console.error('Error loading chats:', error)
        setError('Failed to load chats. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadChats()

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
                <Badge badgeContent={chat.unread_count} color="error">
                  <Avatar 
                    src={chat.partner_profile_picture}
                    alt={chat.partner_name}
                  >
                    {!chat.partner_profile_picture && (chat.partner_name[0]?.toUpperCase() || '?')}
                  </Avatar>
                </Badge>
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