import { useState } from 'react'
import { IconButton, TextField } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

interface Props {
  onSend: (message: string) => Promise<void>
}

export default function MessageInput({ onSend }: Props) {
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    await onSend(message)
    setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
      <TextField
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        variant="outlined"
        size="small"
      />
      <IconButton type="submit" color="primary">
        <SendIcon />
      </IconButton>
    </form>
  )
} 