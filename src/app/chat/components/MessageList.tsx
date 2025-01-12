'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Box, CircularProgress, Typography, Paper } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from '../../styles/theme'

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
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        height: '100%',
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor: 'background.default',
      }}>
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === session?.user?.id

          return (
            <Paper
              key={message.id}
              elevation={1}
              sx={{
                alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                backgroundColor: isOwnMessage ? 'primary.main' : 'background.paper',
                color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                borderRadius: '20px',
                p: 1.5,
                maxWidth: '70%',
              }}
            >
              <Typography variant="body1">
                {message.message}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', textAlign: 'right', mt: 0.5 }}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Paper>
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
    </ThemeProvider>
  )
}

