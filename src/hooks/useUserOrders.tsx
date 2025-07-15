import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address: string;
  total_amount: number;
  status: string;
  order_status?: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    product_price: number;
    subtotal: number;
    special_requests?: string;
    toppings?: string;
  }>;
}

interface UseUserOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  refreshOrders: () => Promise<void>;
  getActiveOrder: () => Order | null;
  hasActiveOrders: boolean;
}

export const useUserOrders = (): UseUserOrdersReturn => {
  const { user, isAuthenticated } = useCustomerAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user orders from database
  const loadUserOrders = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setOrders([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          total_amount,
          status,
          order_status,
          payment_status,
          created_at,
          updated_at,
          order_items (
            id,
            product_name,
            quantity,
            product_price,
            subtotal,
            special_requests,
            toppings
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error loading user orders:', fetchError);
        setError('Errore durante il caricamento degli ordini');
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error loading user orders:', error);
      setError('Si è verificato un errore durante il caricamento degli ordini');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Refresh orders
  const refreshOrders = useCallback(async () => {
    await loadUserOrders();
  }, [loadUserOrders]);

  // Get the most recent active order (not delivered or cancelled)
  const getActiveOrder = useCallback((): Order | null => {
    const activeStatuses = ['confirmed', 'preparing', 'ready', 'arrived'];
    const activeOrder = orders.find(order => {
      const currentStatus = order.order_status || order.status;
      return activeStatuses.includes(currentStatus);
    });
    return activeOrder || null;
  }, [orders]);

  // Check if user has any active orders
  const hasActiveOrders = useCallback((): boolean => {
    return getActiveOrder() !== null;
  }, [getActiveOrder]);

  // Load orders when user authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserOrders();
    } else {
      setOrders([]);
      setError(null);
    }
  }, [isAuthenticated, user, loadUserOrders]);

  // Set up real-time subscription for user orders
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase
      .channel(`user-orders-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('User order updated:', payload);
        
        // Update the specific order in the list
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === payload.new.id 
              ? { ...order, ...payload.new }
              : order
          )
        );

        // Show notification
        toast({
          title: 'Ordine aggiornato!',
          description: 'Lo stato di uno dei tuoi ordini è cambiato',
        });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('New user order created:', payload);
        
        // Refresh orders to get the complete order with items
        refreshOrders();

        toast({
          title: 'Nuovo ordine creato!',
          description: 'Il tuo ordine è stato registrato con successo',
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user, toast, refreshOrders]);

  return {
    orders,
    loading,
    error,
    refreshOrders,
    getActiveOrder,
    hasActiveOrders: hasActiveOrders(),
  };
};

// Helper function to get order status info
export const getOrderStatusInfo = (status: string) => {
  const statusMap = {
    'pending': { label: 'In attesa', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    'confirmed': { label: 'Confermato', color: 'bg-blue-100 text-blue-800', icon: '✅' },
    'preparing': { label: 'In preparazione', color: 'bg-orange-100 text-orange-800', icon: '👨‍🍳' },
    'ready': { label: 'Pronto', color: 'bg-green-100 text-green-800', icon: '📦' },
    'arrived': { label: 'Arrivato', color: 'bg-purple-100 text-purple-800', icon: '🚪' },
    'delivered': { label: 'Consegnato', color: 'bg-green-100 text-green-800', icon: '🚚' },
    'cancelled': { label: 'Annullato', color: 'bg-red-100 text-red-800', icon: '❌' },
  };

  return statusMap[status] || statusMap['pending'];
};

// Helper function to format price
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default useUserOrders;
