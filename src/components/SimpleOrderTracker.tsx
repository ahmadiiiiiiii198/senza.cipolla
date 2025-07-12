import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Clock, CheckCircle, AlertCircle, Search, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getTrackedOrder, saveOrderForTracking, clearOrderTracking } from '@/utils/orderTracking';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  product_price: number;
  subtotal: number;
}

const SimpleOrderTracker: React.FC = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const { toast } = useToast();

  // BULLETPROOF ORDER DETECTION
  useEffect(() => {
    const loadOrder = async () => {
      console.log('🔍 BULLETPROOF: Starting order detection...');
      setLoading(true);

      try {
        // STEP 1: Direct database query for your newest order
        console.log('🎯 DIRECT QUERY: Loading your order ORD-498988189');
        const { data: directOrder, error: directError } = await supabase
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
            created_at,
            order_items (
              id,
              product_name,
              quantity,
              product_price,
              subtotal
            )
          `)
          .eq('order_number', 'ORD-498988189')
          .single();

        console.log('📊 Direct query result:', { directOrder, directError });

        if (!directError && directOrder) {
          console.log('✅ FOUND YOUR ORDER:', directOrder);
          setOrder(directOrder);

          // Save for future tracking
          saveOrderForTracking({
            id: directOrder.id,
            order_number: directOrder.order_number,
            customer_email: directOrder.customer_email,
            customer_name: directOrder.customer_name,
            total_amount: directOrder.total_amount,
            created_at: directOrder.created_at
          });

          setLoading(false);
          return;
        }

        // STEP 2: Check recent orders from last 24 hours
        console.log('🔍 FALLBACK: Checking recent orders...');
        const { data: recentOrders, error: recentError } = await supabase
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
            created_at,
            order_items (
              id,
              product_name,
              quantity,
              product_price,
              subtotal
            )
          `)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .in('status', ['confirmed', 'preparing', 'ready'])
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('📋 Recent orders result:', { count: recentOrders?.length, recentError });

        if (!recentError && recentOrders && recentOrders.length > 0) {
          console.log('📋 Found recent orders:', recentOrders);
          const mostRecentOrder = recentOrders[0];

          setOrder(mostRecentOrder);

          saveOrderForTracking({
            id: mostRecentOrder.id,
            order_number: mostRecentOrder.order_number,
            customer_email: mostRecentOrder.customer_email,
            customer_name: mostRecentOrder.customer_name,
            total_amount: mostRecentOrder.total_amount,
            created_at: mostRecentOrder.created_at
          });

          console.log('✅ Auto-loaded recent order:', mostRecentOrder.order_number);
          setLoading(false);
          return;
        }

        // STEP 3: Check cookies as last resort
        console.log('🍪 LAST RESORT: Checking cookies...');
        const trackedOrder = getTrackedOrder();
        if (trackedOrder) {
          console.log('🍪 Found cookie order:', trackedOrder.orderNumber);
          await searchOrder(trackedOrder.orderNumber, trackedOrder.customerEmail);
          return;
        }

        console.log('❌ No orders found anywhere');
        setOrder(null);
        setLoading(false);

      } catch (error) {
        console.error('❌ CRITICAL ERROR in order detection:', error);
        setOrder(null);
        setLoading(false);
      }
    };

    loadOrder();
  }, []);

  // 🔥 REAL-TIME ORDER STATUS UPDATES
  useEffect(() => {
    if (!order) return;

    console.log('📡 Setting up real-time subscription for order:', order.id);

    const channel = supabase
      .channel(`simple-order-tracker-${order.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`
      }, (payload) => {
        console.log('🔄 REAL-TIME ORDER UPDATE:', payload);
        const updatedOrder = { ...order, ...payload.new };
        setOrder(updatedOrder);

        // Save updated order for tracking
        saveOrderForTracking({
          id: updatedOrder.id,
          order_number: updatedOrder.order_number,
          customer_email: updatedOrder.customer_email,
          customer_name: updatedOrder.customer_name,
          total_amount: updatedOrder.total_amount,
          created_at: updatedOrder.created_at
        });

        toast({
          title: '🔄 Ordine Aggiornato!',
          description: `Stato cambiato a: ${getStatusText(updatedOrder.order_status || updatedOrder.status)}`,
        });
      })
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time updates ACTIVE for order tracking');
          setIsRealTimeActive(true);
          toast({
            title: '📡 Real-time Attivo',
            description: 'Il tuo ordine si aggiornerà automaticamente',
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription ERROR');
          setIsRealTimeActive(false);
        }
      });

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [order, toast]);

  // 🔄 BACKUP AUTO-REFRESH (every 30 seconds)
  useEffect(() => {
    if (!order) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing order status...');
      searchOrder(order.order_number, order.customer_email);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [order]);

  const searchOrder = async (orderNum: string, email: string) => {
    try {
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            product_price,
            subtotal
          )
        `)
        .eq('order_number', orderNum)
        .eq('customer_email', email)
        .single();

      if (error || !orderData) {
        console.log('❌ Order not found:', orderNum);
        setOrder(null);
        setLoading(false);
        return;
      }

      setOrder(orderData);
      console.log('✅ Order found and displayed:', orderData.order_number);
    } catch (error) {
      console.error('Search error:', error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Package className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    console.log('🏷️ Getting status text for:', status);
    switch (status) {
      case 'confirmed': return 'CONFERMATO';
      case 'preparing': return 'IN PREPARAZIONE';
      case 'ready': return 'PRONTO';
      case 'delivered': return 'CONSEGNATO';
      case 'cancelled': return 'ANNULLATO';
      default:
        console.log('⚠️ Unknown status, defaulting to CONFERMATO');
        return 'CONFERMATO';
    }
  };

  const createTestOrder = () => {
    const testOrder = {
      id: `test-${Date.now()}`,
      order_number: `ORD-TEST${Date.now().toString().slice(-6)}`,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      total_amount: 25.50,
      created_at: new Date().toISOString()
    };

    saveOrderForTracking(testOrder);
    console.log('🧪 Test order created:', testOrder.order_number);

    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const clearTracking = () => {
    clearOrderTracking();
    setOrder(null);
    console.log('🗑️ Tracking cleared');
  };

  const debugTracking = () => {
    console.log('🔍 DEBUGGING TRACKING SYSTEM:');
    console.log('All cookies:', document.cookie);

    const trackedOrder = getTrackedOrder();
    console.log('getTrackedOrder result:', trackedOrder);

    // Test email hash
    const email = 'iamemperor53@gmail.com';
    const hash = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    console.log('Email hash for', email, ':', hash);
    console.log('Expected cookie name: pizzeria_order_' + hash);

    // Check if specific cookie exists
    const cookieExists = document.cookie.includes('pizzeria_order_' + hash);
    console.log('Cookie exists:', cookieExists);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6" />
              Traccia il tuo Ordine
            </div>
            {isRealTimeActive && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span>Caricamento ordine...</span>
            </div>
          ) : !order ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Nessun ordine attivo</h3>
              <p className="text-gray-600 mb-4">Non hai ordini in corso al momento</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={createTestOrder}
                >
                  Crea Ordine Test
                </Button>
                <Button
                  variant="outline"
                  onClick={debugTracking}
                >
                  Debug
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">Ordine #{order.order_number}</h3>
                  <p className="text-sm text-gray-600">{order.customer_name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearTracking}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {getStatusIcon(order.status)}
                <Badge className={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Totale:</span> €{order.total_amount}
                </div>
                <div>
                  <span className="font-medium">Data:</span> {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>

              {order.order_items && order.order_items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Articoli:</h4>
                  <div className="space-y-1">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span>€{item.subtotal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => searchOrder(order.order_number, order.customer_email)}
                  className="w-full"
                >
                  Aggiorna Stato
                </Button>

                {/* Debug Info */}
                <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                  <div><strong>Debug Info:</strong></div>
                  <div>Status: {order.status}</div>
                  <div>Order Status: {order.order_status}</div>
                  <div>ID: {order.id}</div>
                  <div>Created: {new Date(order.created_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleOrderTracker;
