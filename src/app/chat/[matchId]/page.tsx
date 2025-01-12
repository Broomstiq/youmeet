'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useChat } from '@/hooks/useChat'
import { supabase } from '@/lib/supabase'
import ChatHeader from '../components/ChatHeader'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'
import { Box } from '@mui/material'

export default function ChatPage() {
  const { matchId } = useParams()
  const { data: session } = useSession()
  const { messages, loading, sendMessage } = useChat(matchId as string)

  useEffect(() => {
    const resetUnreadCount = async () => {
      if (!session?.user?.id) return

      console.log('Attempting to delete unread messages:', {
        userId: session.user.id,
        matchId
      })

      const { data, error } = await supabase
        .from('unread_messages')
        .delete()
        .eq('user_id', session.user.id)
        .eq('match_id', matchId)

      console.log('Delete unread messages result:', { data, error })
    }

    resetUnreadCount()
  }, [matchId, session?.user?.id])

  return (
    <Box 
      sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'  // Prevent outer scrolling
      }}
    >
      <ChatHeader matchId={matchId as string} />
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>  {/* Message list container */}
        <MessageList messages={messages} loading={loading} />
      </Box>
      <MessageInput onSend={sendMessage} />
    </Box>
  )
} 