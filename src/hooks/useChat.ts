import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
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
      if (!session?.user?.id) return

      try {
        setLoading(true)
        // Fetch existing messages
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true })

        if (error) throw error
        setMessages(data || [])
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

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
        (payload) => {
          setMessages(current => [...current, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [matchId, session?.user?.id])

  const sendMessage = async (message: string) => {
    if (!session?.user?.id) return

    try {
      const { error } = await supabase
        .from('chats')
        .insert({
          match_id: matchId,
          sender_id: session.user.id,
          message
        })

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return { messages, loading, sendMessage }
} 