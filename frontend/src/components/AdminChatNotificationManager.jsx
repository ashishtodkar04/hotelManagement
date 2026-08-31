import React, { useEffect } from 'react';
import useStore from '../store/useStore';
import socket from '../services/socket';

export default function AdminChatNotificationManager() {
  const { isAdmin, updateAdminThreadMessage, updateAdminUserOnlineStatus, setAdminUserTyping, updateAdminMessagesRead } = useStore();

  useEffect(() => {
    if (!isAdmin) return;

    socket.connect();
    socket.emit('join_admin');

    const handleReceiveMessage = (msg) => {
      updateAdminThreadMessage(msg);
    };

    const handleUserStatus = (data) => {
      updateAdminUserOnlineStatus(data.userId, data.status);
    };

    const handleTyping = (data) => {
      setAdminUserTyping(data.userId, data.isTyping);
    };

    const handleMessagesRead = (data) => {
      updateAdminMessagesRead(data);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_status', handleUserStatus);
    socket.on('typing', handleTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_status', handleUserStatus);
      socket.off('typing', handleTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [isAdmin, updateAdminThreadMessage, updateAdminUserOnlineStatus, setAdminUserTyping, updateAdminMessagesRead]);

  return null;
}
