import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  total_amount: number;
  status: string;
  order_status?: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_requests?: string;
  toppings?: string[];
}

interface StoredOrderInfo {
  orderNumber: string;
  customerEmail: string;
  lastChecked: string;
  orderId?: string;
}

interface UsePersistentOrderReturn {
  order: Order | null;
  loading: boolean;
  error: string | null;
  searchOrder: (orderNumber: string, customerEmail: string) => Promise<void>;
  clearOrder: () => void;
  refreshOrder: () => Promise<void>;
  hasStoredOrder: boolean;
  storedOrderInfo: StoredOrderInfo | null;
}

const STORAGE_KEY = 'pizzeria_order_tracking';
const LAST_ORDER_KEY = 'pizzeria_last_order';

export const usePersistentOrder = (): UsePersistentOrderReturn => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storedOrderInfo, setStoredOrderInfo] = useState<StoredOrderInfo | null>(null);

  // Save order info to localStorage
  const saveOrderInfo = useCallback((orderNum: string, email: string, orderId?: string) => {
    const orderInfo: StoredOrderInfo = {
      orderNumber: orderNum,
      customerEmail: email,
      lastChecked: new Date().toISOString(),
      orderId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderInfo));
    setStoredOrderInfo(orderInfo);
  }, []);

  // Load order info from localStorage
  const loadStoredOrderInfo = useCallback((): StoredOrderInfo | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStoredOrderInfo(parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading stored order info:', error);
    }
    return null;
  }, []);

  // Clear stored order info
  const clearOrder = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_ORDER_KEY);
    setOrder(null);
    setStoredOrderInfo(null);
    setError(null);
  }, []);

  // Search for order
  const searchOrder = useCallback(async (orderNumber: string, customerEmail: string) => {
    if (!orderNumber.trim() || !customerEmail.trim()) {
      setError('Inserisci sia il numero ordine che l\'email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: searchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            subtotal,
            special_requests,
            toppings
          )
        `)
        .eq('order_number', orderNumber.trim())
        .eq('customer_email', customerEmail.trim().toLowerCase())
        .single();

      if (searchError) {
        if (searchError.code === 'PGRST116') {
          setError('Ordine non trovato. Verifica il numero ordine e l\'email.');
        } else {
          setError('Errore durante la ricerca dell\'ordine.');
        }
        return;
      }

      setOrder(data);
      saveOrderInfo(orderNumber.trim(), customerEmail.trim(), data.id);
      
      // Save as last successful order
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(data));

    } catch (err) {
      console.error('Search error:', err);
      setError('Errore durante la ricerca dell\'ordine.');
    } finally {
      setLoading(false);
    }
  }, [saveOrderInfo]);

  // Refresh current order - FIXED to prevent infinite loop by inlining the search logic
  const refreshOrder = useCallback(async () => {
    if (!storedOrderInfo) return;

    // Inline the search logic to avoid dependency chain
    setLoading(true);
    setError(null);

    try {
      const { data, error: searchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            subtotal,
            special_requests,
            toppings
          )
        `)
        .eq('order_number', storedOrderInfo.orderNumber.trim())
        .eq('customer_email', storedOrderInfo.customerEmail.trim().toLowerCase())
        .single();

      if (searchError) {
        if (searchError.code === 'PGRST116') {
          setError('Ordine non trovato. Verifica il numero ordine e l\'email.');
        } else {
          setError('Errore durante la ricerca dell\'ordine.');
        }
        return;
      }

      setOrder(data);

      // Save as last successful order
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(data));

    } catch (err) {
      console.error('Refresh error:', err);
      setError('Errore durante la ricerca dell\'ordine.');
    } finally {
      setLoading(false);
    }
  }, [storedOrderInfo?.orderNumber, storedOrderInfo?.customerEmail]);

  // Auto-load stored order on hook initialization - FIXED to break dependency chain
  useEffect(() => {
    let isMounted = true;

    const initializeOrder = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored || !isMounted) return;

        const parsedStored = JSON.parse(stored);
        setStoredOrderInfo(parsedStored);

        // Try to load from last order cache first
        try {
          const lastOrder = localStorage.getItem(LAST_ORDER_KEY);
          if (lastOrder && isMounted) {
            const parsedOrder = JSON.parse(lastOrder);
            setOrder(parsedOrder);
          }
        } catch (error) {
          console.error('Error loading cached order:', error);
        }

        // Then refresh from database - INLINE to avoid dependency chain
        if (isMounted && parsedStored.orderNumber && parsedStored.customerEmail) {
          setLoading(true);
          setError(null);

          try {
            const { data, error: searchError } = await supabase
              .from('orders')
              .select(`
                *,
                order_items (
                  id,
                  product_name,
                  quantity,
                  unit_price,
                  subtotal,
                  special_requests,
                  toppings
                )
              `)
              .eq('order_number', parsedStored.orderNumber.trim())
              .eq('customer_email', parsedStored.customerEmail.trim().toLowerCase())
              .single();

            if (!searchError && isMounted) {
              setOrder(data);
              localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(data));
            } else if (searchError && isMounted) {
              console.warn('Order not found during initialization:', searchError);
            }
          } catch (err) {
            console.error('Error refreshing order during initialization:', err);
          } finally {
            if (isMounted) {
              setLoading(false);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing order:', error);
      }
    };

    initializeOrder();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run on mount

  // Set up real-time subscription for order updates
  useEffect(() => {
    if (!order) return;

    console.log('📋 [PERSISTENT-ORDER-SUB] Setting up subscription for order:', order.id);

    // Generate unique channel name with timestamp to prevent reuse
    const timestamp = Date.now();
    const channelName = `persistent-order-${order.id}-${timestamp}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`
      }, (payload) => {
        console.log('📋 [PERSISTENT-ORDER-SUB] Order updated:', payload);
        const updatedOrder = { ...order, ...payload.new };
        setOrder(updatedOrder);

        // Update localStorage cache
        localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(updatedOrder));
      })
      .subscribe((status) => {
        console.log('📋 [PERSISTENT-ORDER-SUB] Subscription status:', status);
      });

    return () => {
      console.log('📋 [PERSISTENT-ORDER-SUB] Cleaning up subscription for:', channelName);
      // Unsubscribe first, then remove channel
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [order]);

  return {
    order,
    loading,
    error,
    searchOrder,
    clearOrder,
    refreshOrder,
    hasStoredOrder: !!storedOrderInfo,
    storedOrderInfo
  };
};

// Utility functions for order status
export const getOrderStatusInfo = (status: string) => {
  const orderStatuses = [
    { 
      value: 'pending', 
      label: 'In attesa', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      description: 'Il tuo ordine è stato ricevuto'
    },
    { 
      value: 'confirmed', 
      label: 'Confermato', 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      description: 'Il tuo ordine è stato confermato'
    },
    { 
      value: 'preparing', 
      label: 'In preparazione', 
      color: 'bg-orange-100 text-orange-800 border-orange-200', 
      description: 'I nostri chef stanno preparando il tuo ordine'
    },
    {
      value: 'ready',
      label: 'Pronto',
      color: 'bg-green-100 text-green-800 border-green-200',
      description: 'Il tuo ordine è pronto per la consegna'
    },
    {
      value: 'arrived',
      label: 'Arrivato',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'Il tuo ordine è arrivato alla porta'
    },
    {
      value: 'delivered',
      label: 'Consegnato',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      description: 'Il tuo ordine è stato consegnato'
    },
    { 
      value: 'cancelled', 
      label: 'Annullato', 
      color: 'bg-red-100 text-red-800 border-red-200', 
      description: 'Il tuo ordine è stato annullato'
    }
  ];

  return orderStatuses.find(s => s.value === status) || orderStatuses[0];
};

export const getOrderProgress = (currentStatus: string) => {
  const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'arrived', 'delivered'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (currentStatus === 'cancelled') {
    return { current: -1, total: statusOrder.length, percentage: 0 };
  }

  return {
    current: currentIndex + 1,
    total: statusOrder.length,
    percentage: ((currentIndex + 1) / statusOrder.length) * 100
  };
};

// Check if there's a stored order without initializing the hook
export const hasStoredOrder = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return !!stored;
  } catch {
    return false;
  }
};

// Get stored order info without initializing the hook
export const getStoredOrderInfo = (): StoredOrderInfo | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting stored order info:', error);
  }
  return null;
};
