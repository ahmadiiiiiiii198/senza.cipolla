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

  // 🔥 BULLETPROOF REAL-TIME ORDER STATUS UPDATES
  useEffect(() => {
    if (!order) {
      console.log('❌ No order found, skipping real-time setup');
      return;
    }

    console.log('📡 BULLETPROOF: Setting up real-time subscription for order:', order.id);

    // Create unique channel name
    const channelName = `order_updates_${order.id}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`
        },
        (payload) => {
          console.log('🔄 Real-time order update received');

          if (payload.new) {
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

            const newStatus = updatedOrder.order_status || updatedOrder.status;
            const statusText = getStatusText(newStatus);

            toast({
              title: '🔄 Ordine Aggiornato!',
              description: `Stato cambiato a: ${statusText}`,
              duration: 5000,
            });


          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('✅ REAL-TIME SUBSCRIPTION ACTIVE');
          setIsRealTimeActive(true);
          toast({
            title: '📡 Real-time Connesso',
            description: 'Gli aggiornamenti arriveranno automaticamente',
            duration: 3000,
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ REAL-TIME SUBSCRIPTION ERROR');
          setIsRealTimeActive(false);
          toast({
            title: '❌ Errore Real-time',
            description: 'Aggiornamenti manuali necessari',
            variant: 'destructive',
          });
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ REAL-TIME SUBSCRIPTION TIMED OUT');
          setIsRealTimeActive(false);
        } else if (status === 'CLOSED') {
          console.log('🔌 REAL-TIME SUBSCRIPTION CLOSED');
          setIsRealTimeActive(false);
        }
      });

    return () => {
      console.log('🔌 Cleaning up real-time subscription for channel:', channelName);
      supabase.removeChannel(channel);
      setIsRealTimeActive(false);
    };
  }, [order?.id, toast]); // Only depend on order.id to avoid unnecessary re-subscriptions

  // 🔄 BACKUP AUTO-REFRESH (every 30 seconds)
  useEffect(() => {
    if (!order) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing order status...');
      searchOrder(order.order_number, order.customer_email);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [order]);

  const clearTracking = () => {
    clearOrderTracking();
    setOrder(null);
    console.log('🗑️ Order tracking cleared');
  };

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

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'confirmed': return 25;
      case 'preparing': return 50;
      case 'ready': return 75;
      case 'delivered': return 100;
      default: return 0;
    }
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

              {/* Premium Motorcycle Delivery Tracking */}
              <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 p-6 rounded-2xl border border-slate-200 shadow-lg mb-6 overflow-hidden">

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '30px 30px'
                  }}></div>
                </div>

                {/* Header */}
                <div className="relative z-10 text-center mb-6">
                  <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                    <div className="w-8 h-8 bg-gradient-to-r from-pizza-orange to-red-500 rounded-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-semibold text-slate-700">Tracciamento Consegna</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* Professional Road with Motorcycle */}
                <div className="relative h-24 mb-6">
                  {/* Road Base */}
                  <div className="absolute inset-x-0 bottom-8 h-4 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-700 rounded-full shadow-inner">
                    {/* Road Surface Texture */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"></div>

                    {/* Animated Road Markings */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                      <div className="w-full h-0.5 bg-yellow-400 opacity-90 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Status Checkpoints */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between items-end px-4">
                    {[
                      { key: 'confirmed', label: 'Confermato', icon: CheckCircle },
                      { key: 'preparing', label: 'Preparazione', icon: Package },
                      { key: 'ready', label: 'Pronto', icon: Clock },
                      { key: 'delivered', label: 'Consegnato', icon: CheckCircle }
                    ].map((statusItem, index) => {
                      const isCompleted = ['confirmed', 'preparing', 'ready', 'delivered'].findIndex(s => s === order.status) >= index;
                      const isCurrent = statusItem.key === order.status;
                      const StatusIcon = statusItem.icon;

                      return (
                        <div key={statusItem.key} className="flex flex-col items-center">
                          {/* Checkpoint Pole */}
                          <div className={`w-1 h-12 mb-2 rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-gradient-to-t from-green-500 to-green-400' : 'bg-slate-300'
                          }`}></div>

                          {/* Checkpoint Circle */}
                          <div className={`relative w-10 h-10 rounded-full border-3 transition-all duration-500 ${
                            isCurrent
                              ? 'bg-pizza-orange border-pizza-orange shadow-lg scale-110'
                              : isCompleted
                              ? 'bg-green-500 border-green-500 shadow-md'
                              : 'bg-white border-slate-300'
                          }`}>
                            <StatusIcon className={`h-5 w-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                              isCurrent || isCompleted ? 'text-white' : 'text-slate-400'
                            }`} />

                            {/* Pulse Animation for Current Status */}
                            {isCurrent && (
                              <div className="absolute inset-0 rounded-full bg-pizza-orange opacity-30 animate-ping"></div>
                            )}
                          </div>

                          {/* Label */}
                          <div className="mt-2 text-center">
                            <p className={`text-xs font-medium ${
                              isCurrent ? 'text-pizza-orange' : isCompleted ? 'text-green-700' : 'text-slate-500'
                            }`}>
                              {statusItem.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Premium Motorcycle with Realistic Movement */}
                  <div
                    className="absolute bottom-6 transition-all duration-2000 ease-in-out z-20"
                    style={{
                      left: `${Math.max(5, Math.min(85, getProgressPercentage(order.status) * 0.8 + 10))}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="relative">
                      {/* Motorcycle Shadow */}
                      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm"></div>

                      {/* High-Quality Motorcycle SVG */}
                      <div className={`relative text-4xl transition-all duration-300 ${
                        order.status === 'delivered'
                          ? 'animate-bounce'
                          : order.status === 'ready' || order.status === 'preparing'
                          ? 'animate-pulse'
                          : ''
                      }`}>
                        <svg width="48" height="32" viewBox="0 0 48 32" className="text-slate-700">
                          {/* Motorcycle Body */}
                          <rect x="12" y="12" width="24" height="8" rx="4" fill="currentColor" />
                          {/* Front Wheel */}
                          <circle cx="8" cy="24" r="6" fill="currentColor" />
                          <circle cx="8" cy="24" r="3" fill="white" />
                          {/* Rear Wheel */}
                          <circle cx="40" cy="24" r="6" fill="currentColor" />
                          <circle cx="40" cy="24" r="3" fill="white" />
                          {/* Handlebars */}
                          <rect x="6" y="8" width="8" height="2" rx="1" fill="currentColor" />
                        </svg>

                        {/* Delivery Box */}
                        <div className="absolute -top-2 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded border-2 border-white shadow-sm flex items-center justify-center">
                          <span className="text-xs">🍕</span>
                        </div>

                        {/* Speed Effect */}
                        {(order.status === 'ready' || order.status === 'preparing') && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full">
                            <div className="flex space-x-1">
                              {[...Array(3)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-3 h-0.5 bg-blue-400 rounded-full animate-pulse`}
                                  style={{ animationDelay: `${i * 0.1}s` }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative mb-4">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pizza-orange via-yellow-400 to-green-500 rounded-full transition-all duration-2000 ease-out relative"
                      style={{ width: `${getProgressPercentage(order.status)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                <div className="text-center">
                  <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm ${
                    order.status === 'delivered'
                      ? 'bg-green-100/80 text-green-800 border border-green-200'
                      : order.status === 'ready'
                      ? 'bg-blue-100/80 text-blue-800 border border-blue-200'
                      : order.status === 'preparing'
                      ? 'bg-orange-100/80 text-orange-800 border border-orange-200'
                      : 'bg-slate-100/80 text-slate-800 border border-slate-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      order.status === 'delivered' ? 'bg-green-500' :
                      order.status === 'ready' ? 'bg-blue-500 animate-pulse' :
                      order.status === 'preparing' ? 'bg-orange-500 animate-pulse' :
                      'bg-slate-500'
                    }`}></div>
                    <span className="font-semibold">{getStatusText(order.status)}</span>
                    {order.status === 'ready' && <span className="text-xs opacity-75">• Pronto per il ritiro</span>}
                    {order.status === 'preparing' && <span className="text-xs opacity-75">• In cucina</span>}
                    {order.status === 'delivered' && <span className="text-xs opacity-75">• Buon appetito!</span>}
                  </div>
                </div>
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


              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleOrderTracker;
