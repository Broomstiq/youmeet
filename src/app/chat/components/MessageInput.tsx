'use client'

import { useState } from 'react'
import { Box, TextField, IconButton } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

interface MessageInputProps {
  onSend: (message: string) => void
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSend(message.trim())
      setMessage('')
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        gap: 1
      }}
    >
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        size="small"
      />
      <IconButton 
        color="primary" 
        type="submit"
        disabled={!message.trim()}
      >
        <SendIcon />
      </IconButton>
    </Box>
  )
} 