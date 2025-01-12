import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  sender_id: string
  message: string
  created_at: string
}

interface MatchDetails {
  user_1_id: string
  user_2_id: string
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

    // Subscribe to new messages and unread updates
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
          const newMessage = payload.new as Message
          console.log('New message received:', {
            message: newMessage,
            isFromCurrentUser: newMessage.sender_id === session?.user?.id
          })
          setMessages(current => [...current, newMessage])

          // If the message is from the other user, update unread count
          if (newMessage.sender_id !== session?.user?.id) {
            console.log('Message is from other user, reloading messages')
            loadMessages()
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [matchId, session?.user?.id])

  const updateUnreadCount = async (recipientId: string) => {
    try {
      // Simply create a new unread_messages entry
      await supabase
        .from('unread_messages')
        .insert({
          user_id: recipientId,
          match_id: matchId,
          unread_count: 1,
          last_message_time: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error creating unread message entry:', error)
    }
  }

  const sendMessage = async (message: string) => {
    if (!session?.user?.id) return

    try {
      // Get match details to determine recipient
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user_1_id, user_2_id')
        .eq('id', matchId)
        .single()

      if (matchError) throw matchError

      // Determine recipient
      const recipientId = match.user_1_id === session.user.id 
        ? match.user_2_id 
        : match.user_1_id

      // Insert the message
      const { error: messageError } = await supabase
        .from('chats')
        .insert({
          match_id: matchId,
          sender_id: session.user.id,
          message
        })

      if (messageError) throw messageError

      // Update unread count for recipient
      await updateUnreadCount(recipientId)

    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return { messages, loading, sendMessage }
} 