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
  const { toast } = useToast();

  // DEBUGGING: Force load your specific order
  useEffect(() => {
    const loadOrder = async () => {
      console.log('🔍 DEBUGGING: Starting order detection...');

      // STEP 1: Check existing cookies
      let trackedOrder = getTrackedOrder();
      console.log('🍪 Existing tracked order:', trackedOrder);

      // STEP 2: Force load your specific order for testing
      console.log('🎯 FORCE LOADING YOUR ORDER: ORD-794783163');
      try {
        await searchOrder('ORD-794783163', 'iamemperor53@gmail.com');

        // Save it for tracking
        const yourOrderData = {
          id: 'f7d516b2-a5f3-4ec8-a573-71382fb5f16f',
          order_number: 'ORD-794783163',
          customer_email: 'iamemperor53@gmail.com',
          customer_name: 'daffdkfak fadkfadfj',
          total_amount: 19,
          created_at: '2025-07-12 17:36:36.057296+00'
        };

        console.log('💾 Saving your order for tracking...');
        const saved = saveOrderForTracking(yourOrderData);
        console.log('💾 Save result:', saved);

        return;
      } catch (error) {
        console.error('❌ Error loading your order:', error);
      }

      // STEP 3: Fallback - check recent orders
      if (!trackedOrder) {
        console.log('🔍 No cookie found, checking for recent orders...');
        try {
          const { data: recentOrders, error } = await supabase
            .from('orders')
            .select('id, order_number, customer_name, customer_email, total_amount, created_at, status')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .in('status', ['confirmed', 'preparing', 'ready'])
            .order('created_at', { ascending: false })
            .limit(3);

          console.log('📋 Recent orders query result:', { error, count: recentOrders?.length });

          if (!error && recentOrders && recentOrders.length > 0) {
            console.log('📋 Found recent orders:', recentOrders);
            const mostRecentOrder = recentOrders[0];

            saveOrderForTracking({
              id: mostRecentOrder.id,
              order_number: mostRecentOrder.order_number,
              customer_email: mostRecentOrder.customer_email,
              customer_name: mostRecentOrder.customer_name,
              total_amount: mostRecentOrder.total_amount,
              created_at: mostRecentOrder.created_at
            });

            console.log('✅ Auto-detected and saved order:', mostRecentOrder.order_number);
            await searchOrder(mostRecentOrder.order_number, mostRecentOrder.customer_email);
            return;
          }
        } catch (error) {
          console.error('❌ Error checking recent orders:', error);
        }
      }

      if (trackedOrder) {
        console.log('🎯 Loading existing tracked order:', trackedOrder.orderNumber);
        await searchOrder(trackedOrder.orderNumber, trackedOrder.customerEmail);
      } else {
        console.log('❌ No orders found');
        setLoading(false);
      }
    };

    loadOrder();
  }, []);

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
    switch (status) {
      case 'confirmed': return 'CONFERMATO';
      case 'preparing': return 'IN PREPARAZIONE';
      case 'ready': return 'PRONTO';
      case 'delivered': return 'CONSEGNATO';
      default: return 'CONFERMATO';
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
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Traccia il tuo Ordine
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

              <Button
                variant="outline"
                onClick={() => searchOrder(order.order_number, order.customer_email)}
                className="w-full"
              >
                Aggiorna Stato
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleOrderTracker;
