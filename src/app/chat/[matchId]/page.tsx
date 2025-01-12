'use client'

import { useParams } from 'next/navigation'
import { useChat } from '@/hooks/useChat'
import ChatHeader from '../components/ChatHeader'
import MessageList from '../components/MessageList'
import MessageInput from '../components/MessageInput'

export default function ChatPage() {
  const { matchId } = useParams()
  const { messages, loading, sendMessage } = useChat(matchId as string)

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader matchId={matchId as string} />
      <MessageList messages={messages} loading={loading} />
      <MessageInput onSend={sendMessage} />
    </div>
  )
} 