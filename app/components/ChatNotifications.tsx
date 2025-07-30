'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import BidirectionalMessageService from '@/app/services/bidirectionalMessageService';

interface ChatNotificationsProps {
  phone: string;
  onNewMessage?: (message: any) => void;
}

export default function ChatNotifications({ phone, onNewMessage }: ChatNotificationsProps) {
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!phone) return;

    // Set up real-time notifications
    const unsubscribe = BidirectionalMessageService.listenForNewMessages((newConversation) => {
      // Check if this message is for the current conversation
      if (newConversation.phone === phone && newConversation.latest_message) {
        // Show notification
        toast.success(`Nova mensagem de ${newConversation.phone}`, {
          description: newConversation.latest_message.content,
          duration: 5000,
        });

        // Call callback if provided
        if (onNewMessage) {
          onNewMessage(newConversation.latest_message);
        }
      }
    });

    setIsListening(true);

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [phone, onNewMessage]);

  // This component doesn't render anything visible
  return null;
} 