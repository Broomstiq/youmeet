import { Message } from '@/hooks/useChat'
import { useSession } from 'next-auth/react'

interface Props {
  messages: Message[]
  loading: boolean
}

export default function MessageList({ messages, loading }: Props) {
  const { data: session } = useSession()

  if (loading) {
    return <div className="flex-1 p-4">Loading messages...</div>
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`mb-4 max-w-[70%] ${
            message.sender_id === session?.user?.id
              ? 'ml-auto'
              : 'mr-auto'
          }`}
        >
          <div
            className={`p-3 rounded-lg ${
              message.sender_id === session?.user?.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            {message.message}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(message.created_at).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  )
} 