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

    console.log('Setting up notifications for phone:', phone);

    // Temporarily disable polling to test if messages appear without it
    /*
    // Set up real-time notifications
    const unsubscribe = BidirectionalMessageService.listenForNewMessages((newMessage) => {
      // Show notification
      toast.success(`Nova mensagem de ${phone}`, {
        description: newMessage.content,
        duration: 5000,
      });

      // Call callback if provided
      if (onNewMessage) {
        onNewMessage(newMessage);
      }
    }, phone);

    setIsListening(true);

    return () => {
      unsubscribe();
      setIsListening(false);
    };
    */
  }, [phone, onNewMessage]);

  // This component doesn't render anything visible
  return null;
} 