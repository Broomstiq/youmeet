'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Box, CircularProgress, Typography } from '@mui/material'

interface Message {
  id: string
  sender_id: string
  message: string
  created_at: string
}

interface MessageListProps {
  messages: Message[]
  loading: boolean
}

export default function MessageList({ messages, loading }: MessageListProps) {
  const { data: session } = useSession()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ 
      height: '100%',
      overflowY: 'auto',
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }}>
      {messages.map((message) => {
        const isOwnMessage = message.sender_id === session?.user?.id

        return (
          <Box
            key={message.id}
            sx={{
              alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
              backgroundColor: isOwnMessage ? 'primary.main' : 'grey.200',
              color: isOwnMessage ? 'white' : 'text.primary',
              borderRadius: 2,
              p: 1,
              maxWidth: '70%'
            }}
          >
            <Typography variant="body1">
              {message.message}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {new Date(message.created_at).toLocaleTimeString()}
            </Typography>
          </Box>
        )
      })}
      {messages.length === 0 && (
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ textAlign: 'center', mt: 2 }}
        >
          No messages yet. Start the conversation!
        </Typography>
      )}
      <div ref={messagesEndRef} />
    </Box>
  )
} 