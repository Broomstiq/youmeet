'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button, TextField, Box, Typography } from '@mui/material'

export default function TestChat() {
  const [otherUserId, setOtherUserId] = useState('')
  const { data: session } = useSession()

  const createMatch = async () => {
    try {
      const response = await fetch('/api/test/create-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user1Id: session?.user?.id,
          user2Id: otherUserId
        })
      })

      const data = await response.json()
      if (data.match) {
        alert(`Match created! Match ID: ${data.match.id}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to create match')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create Test Match
      </Typography>
      <Typography gutterBottom>
        Your ID: {session?.user?.id}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Other User ID"
          value={otherUserId}
          onChange={(e) => setOtherUserId(e.target.value)}
        />
        <Button variant="contained" onClick={createMatch}>
          Create Match
        </Button>
      </Box>
    </Box>
  )
} 