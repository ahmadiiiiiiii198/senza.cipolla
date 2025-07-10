import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrderNotification {
  id: string;
  order_id: string;
  message: string;
  type: 'new_order' | 'order_update' | 'payment_received';
  is_read: boolean;
  created_at: string;
  order_details?: {
    customer_name: string;
    total_amount: number;
    items_count: number;
  };
}

const OrderNotificationSystem = () => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/notification-sound.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.8;

    // Fallback to a web-based notification sound if file doesn't exist
    audioRef.current.onerror = () => {
      // Create a simple beep sound using Web Audio API
      const createBeepSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      };

      audioRef.current = {
        play: () => {
          createBeepSound();
          return Promise.resolve();
        },
        pause: () => {},
        loop: true,
        volume: 0.8
      } as any;
    };

    return () => {
      if (audioRef.current && typeof audioRef.current.pause === 'function') {
        audioRef.current.pause();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('order_notifications')
        .select(`
          *,
          orders (
            customer_name,
            total_amount,
            order_items (count)
          )
        `)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications = data?.map(notification => ({
        ...notification,
        order_details: notification.orders ? {
          customer_name: notification.orders.customer_name,
          total_amount: notification.orders.total_amount,
          items_count: notification.orders.order_items?.length || 0
        } : undefined
      })) || [];

      setNotifications(formattedNotifications);

      // Start sound if there are unread notifications
      if (formattedNotifications.length > 0 && isSoundEnabled && !isPlaying) {
        startNotificationSound();
      } else if (formattedNotifications.length === 0 && isPlaying) {
        stopNotificationSound();
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Start continuous notification sound
  const startNotificationSound = () => {
    if (audioRef.current && isSoundEnabled && !isPlaying) {
      setIsPlaying(true);
      audioRef.current.loop = true;
      audioRef.current.play().catch(console.error);
    }
  };

  // Stop notification sound
  const stopNotificationSound = () => {
    if (audioRef.current) {
      setIsPlaying(false);
      audioRef.current.pause();
      if (typeof audioRef.current.currentTime !== 'undefined') {
        audioRef.current.currentTime = 0;
      }
    }
  };

  // Force stop all sounds (for stop button)
  const forceStopSound = () => {
    stopNotificationSound();
    setIsSoundEnabled(false);
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Stop sound if no more notifications
      if (notifications.length <= 1) {
        stopNotificationSound();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications([]);
      stopNotificationSound();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel('order_notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'order_notifications' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    // Poll for notifications every 30 seconds as backup
    intervalRef.current = setInterval(fetchNotifications, 30000);

    return () => {
      subscription.unsubscribe();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSoundEnabled]);

  const unreadCount = notifications.length;

  return (
    <>
      {/* Notification Bell */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-3 rounded-full shadow-lg transition-all duration-300 ${
            unreadCount > 0 
              ? 'bg-red-600 text-white animate-pulse' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Bell size={24} className={unreadCount > 0 ? 'animate-bounce' : ''} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-heartbeat">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            setIsSoundEnabled(!isSoundEnabled);
            if (!isSoundEnabled && unreadCount > 0) {
              startNotificationSound();
            } else {
              stopNotificationSound();
            }
          }}
          className={`mt-2 p-2 rounded-full shadow-lg transition-all duration-300 ${
            isSoundEnabled
              ? 'bg-green-600 text-white'
              : 'bg-gray-400 text-white'
          }`}
          title={isSoundEnabled ? 'Disabilita suoni' : 'Abilita suoni'}
        >
          {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Stop Sound Button - Only show when sound is playing */}
        {isPlaying && (
          <button
            onClick={forceStopSound}
            className="mt-2 p-3 rounded-full shadow-lg bg-red-600 text-white animate-pulse hover:bg-red-700 transition-all duration-300"
            title="FERMA SUONO"
          >
            <X size={20} className="animate-bounce" />
          </button>
        )}
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="fixed top-20 right-4 w-96 max-h-96 bg-white rounded-lg shadow-2xl border z-50 overflow-hidden">
          <div className="p-4 bg-red-600 text-white flex items-center justify-between">
            <h3 className="font-semibold flex items-center">
              <AlertCircle className="mr-2" size={20} />
              Nuovi Ordini ({unreadCount})
            </h3>
            <div className="flex items-center space-x-2">
              {isPlaying && (
                <button
                  onClick={forceStopSound}
                  className="text-sm bg-red-800 text-white px-3 py-1 rounded font-bold hover:bg-red-900 transition-colors animate-pulse"
                >
                  🔇 FERMA SUONO
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
                >
                  Segna tutti letti
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="hover:bg-white/20 p-1 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="mx-auto mb-2 opacity-50" size={32} />
                <p>Nessun nuovo ordine</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-1">
                        {notification.message}
                      </p>
                      {notification.order_details && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Cliente: {notification.order_details.customer_name}</p>
                          <p>Totale: €{notification.order_details.total_amount.toFixed(2)}</p>
                          <p>Articoli: {notification.order_details.items_count}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString('it-IT')}
                      </p>
                    </div>
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-2 p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                      title="Segna come letto"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating Alert for New Orders */}
      {isPlaying && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white p-6 rounded-lg shadow-2xl z-50 animate-bounce">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-2 animate-spin" size={32} />
            <h3 className="text-xl font-bold mb-2">NUOVO ORDINE!</h3>
            <p className="mb-4">Hai {unreadCount} ordini in attesa</p>
            <button
              onClick={markAllAsRead}
              className="bg-white text-red-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition-colors"
            >
              OK, Ho Visto
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderNotificationSystem;
