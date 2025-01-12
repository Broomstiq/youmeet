import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'

export interface Message {
  id: string
  match_id: string
  sender_id: string
  message: string
  created_at: string
}

export function useChat(matchId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('chats')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data)
      }
      setLoading(false)
    }

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `match_id=eq.${matchId}`
        },
        async (payload) => {
          const newMessage = payload.new as Message
          setMessages(current => [...current, newMessage])
        }
      )
      .subscribe()

    loadMessages()

    return () => {
      subscription.unsubscribe()
    }
  }, [matchId])

  const sendMessage = async (message: string) => {
    if (!session?.user?.id) return

    const { data: matchData } = await supabase
      .from('matches')
      .select('id')
      .eq('id', matchId)
      .single()

    if (!matchData) {
      console.error('Invalid match')
      return
    }

    const newMessage = {
      match_id: matchId,
      sender_id: session.user.id,
      message
    }

    const { error } = await supabase
      .from('chats')
      .insert(newMessage)

    if (error) {
      console.error('Error sending message:', error)
    }
  }

  return { messages, loading, sendMessage }
} 