import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getTrackedOrder, hasActiveOrder, clearOrderTracking, saveOrderForTracking } from '@/utils/orderTracking';
import {
  Search,
  Pizza,
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';

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
}

const PersistentOrderTracker: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // LocalStorage keys
  const STORAGE_KEY = 'pizzeria_order_tracking';
  const LAST_ORDER_KEY = 'pizzeria_last_order';

  // Order status configuration
  const orderStatuses = [
    { 
      value: 'pending', 
      label: 'In attesa', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: Clock,
      description: 'Il tuo ordine è stato ricevuto'
    },
    { 
      value: 'confirmed', 
      label: 'Confermato', 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: CheckCircle,
      description: 'Il tuo ordine è stato confermato'
    },
    { 
      value: 'preparing', 
      label: 'In preparazione', 
      color: 'bg-orange-100 text-orange-800 border-orange-200', 
      icon: Package,
      description: 'I nostri chef stanno preparando il tuo ordine'
    },
    { 
      value: 'ready', 
      label: 'Pronto', 
      color: 'bg-green-100 text-green-800 border-green-200', 
      icon: CheckCircle,
      description: 'Il tuo ordine è pronto per la consegna'
    },
    { 
      value: 'delivered', 
      label: 'Consegnato', 
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
      icon: Truck,
      description: 'Il tuo ordine è stato consegnato'
    },
    { 
      value: 'cancelled', 
      label: 'Annullato', 
      color: 'bg-red-100 text-red-800 border-red-200', 
      icon: XCircle,
      description: 'Il tuo ordine è stato annullato'
    }
  ];

  // Get current status info
  const getCurrentStatusInfo = (status: string) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0];
  };

  // Get status progress
  const getStatusProgress = (currentStatus: string) => {
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
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

  // Save order info to localStorage
  const saveOrderInfo = (orderNum: string, email: string) => {
    const orderInfo: StoredOrderInfo = {
      orderNumber: orderNum,
      customerEmail: email,
      lastChecked: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orderInfo));
  };

  // Load order info from localStorage
  const loadStoredOrderInfo = (): StoredOrderInfo | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading stored order info:', error);
    }
    return null;
  };

  // Clear stored order info
  const clearStoredOrderInfo = () => {
    clearOrderTracking();
    setOrder(null);
    setOrderNumber('');
    setCustomerEmail('');
    setError(null);
  };

  // Search for order
  const searchOrder = async (orderNum?: string, email?: string) => {
    const searchOrderNumber = orderNum || orderNumber.trim();
    const searchEmail = email || customerEmail.trim();

    if (!searchOrderNumber || !searchEmail) {
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
        .eq('order_number', searchOrderNumber)
        .eq('customer_email', searchEmail.toLowerCase())
        .single();

      if (searchError) {
        if (searchError.code === 'PGRST116') {
          // Don't set error if we already have a basic order showing
          if (!order) {
            setError('Ordine non trovato. Verifica il numero ordine e l\'email.');
          }
        } else {
          setError('Errore durante la ricerca dell\'ordine.');
        }
        return;
      }
      setOrder(data);
      saveOrderInfo(searchOrderNumber, searchEmail);

      // Save as last successful order
      localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(data));

      if (!order) {
        // Only show toast if this is a new search, not an auto-update
        toast({
          title: '🍕 Ordine trovato!',
          description: `Ordine #${data.order_number} caricato con successo`,
        });
      }

    } catch (err) {
      console.error('❌ Search error:', err);
      setError('Errore durante la ricerca dell\'ordine.');
    } finally {
      setLoading(false);
    }
  };

  // Smart auto-detection system for orders
  const smartOrderDetection = async () => {
    console.log('🧠 Starting smart order detection...');

    // Method 1: Check existing tracking data
    const trackedOrder = getTrackedOrder();
    if (trackedOrder) {
      console.log('✅ Found tracked order:', trackedOrder.orderNumber);
      return trackedOrder;
    }

    // Method 2: Check for recent orders from database (last 24 hours)
    console.log('🔍 No tracking data found, checking recent orders...');
    try {
      const { data: recentOrders, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_email, total_amount, created_at, status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .in('status', ['pending', 'confirmed', 'preparing', 'ready']) // Active statuses
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Error fetching recent orders:', error);
        return null;
      }

      if (recentOrders && recentOrders.length > 0) {
        console.log('📋 Found recent orders:', recentOrders.length);

        // Try to match with browser session or use most recent
        const mostRecentOrder = recentOrders[0];
        console.log('🎯 Auto-selecting most recent order:', mostRecentOrder.order_number);

        // Convert to tracking format
        const autoDetectedOrder = {
          orderId: mostRecentOrder.id,
          orderNumber: mostRecentOrder.order_number,
          customerName: mostRecentOrder.customer_name,
          customerEmail: mostRecentOrder.customer_email,
          totalAmount: mostRecentOrder.total_amount,
          createdAt: mostRecentOrder.created_at
        };

        // Save for future tracking
        saveOrderForTracking({
          id: mostRecentOrder.id,
          order_number: mostRecentOrder.order_number,
          customer_email: mostRecentOrder.customer_email,
          customer_name: mostRecentOrder.customer_name,
          total_amount: mostRecentOrder.total_amount,
          created_at: mostRecentOrder.created_at
        });

        console.log('💾 Auto-detected order saved for tracking');
        return autoDetectedOrder;
      }
    } catch (error) {
      console.error('❌ Smart detection error:', error);
    }

    return null;
  };

  // Auto-load order on component mount
  useEffect(() => {
    console.log('🔍 PersistentOrderTracker mounted, starting smart detection...');

    const loadOrder = async () => {
      // Debug storage content
      const localStorageContent = localStorage.getItem('pizzeria_active_order');
      const hasCookie = document.cookie.includes('pizzeria_active_order');
      console.log('📦 localStorage content:', localStorageContent);
      console.log('🍪 Cookie exists:', hasCookie);

      const detectedOrder = await smartOrderDetection();

      if (detectedOrder) {
        setOrderNumber(detectedOrder.orderNumber);
        setCustomerEmail(detectedOrder.customerEmail);

        console.log('✅ Auto-loading order:', detectedOrder.orderNumber, 'for customer:', detectedOrder.customerName);

        // Create a basic order object to show immediately
        const basicOrder: Order = {
          id: detectedOrder.orderId,
          order_number: detectedOrder.orderNumber,
          customer_name: detectedOrder.customerName,
          customer_email: detectedOrder.customerEmail,
          total_amount: detectedOrder.totalAmount,
          status: 'pending', // Default status, will be updated from DB
          order_status: 'pending',
          payment_status: 'pending',
          created_at: detectedOrder.createdAt,
          updated_at: detectedOrder.createdAt,
          order_items: []
        };

        // Show the order immediately
        setOrder(basicOrder);
        console.log('📱 Order auto-loaded and displayed');

        // Then fetch full details from database
        setTimeout(() => {
          console.log('🔄 Fetching complete order details...');
          searchOrder(detectedOrder.orderNumber, detectedOrder.customerEmail);
        }, 1000);
      } else {
        console.log('❌ No orders found for auto-detection');
      }
    };

    // Run with small delay to ensure component is ready
    const timeoutId = setTimeout(loadOrder, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Real-time order updates
  useEffect(() => {
    if (!order || !autoRefresh) return;

    const channel = supabase
      .channel(`homepage-order-${order.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`
      }, (payload) => {
        console.log('Order updated on homepage:', payload);
        const updatedOrder = { ...order, ...payload.new };
        setOrder(updatedOrder);
        
        // Update localStorage
        localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(updatedOrder));
        
        toast({
          title: '🔄 Ordine aggiornato!',
          description: 'Lo stato del tuo ordine è cambiato',
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order, autoRefresh, toast]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!order || !autoRefresh) return;

    const interval = setInterval(() => {
      searchOrder(orderNumber, customerEmail);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [order, autoRefresh, orderNumber, customerEmail]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `€${price.toFixed(2)}`;
  };

  const currentStatus = order?.order_status || order?.status || 'pending';
  const currentStatusInfo = getCurrentStatusInfo(currentStatus);
  const progress = getStatusProgress(currentStatus);

  return (
    <section className="py-12 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-pizza-orange p-3 rounded-full shadow-lg">
                <Pizza className="h-6 w-6 text-white" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Stato del tuo Ordine
            </h2>
            <p className="text-gray-600">
              Segui il progresso del tuo ordine in tempo reale
            </p>
          </div>

          {/* Order Display or Search Form */}
          {order ? (
            /* Order Status Display */
            <div className="space-y-6">
              {/* Order Header with Controls */}
              <Card className="shadow-lg border-l-4 border-pizza-orange">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Pizza className="h-5 w-5 text-pizza-orange" />
                        Ordine #{order.order_number}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">
                        Ordinato il {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-pizza-orange">
                          {formatPrice(order.total_amount)}
                        </div>
                        <Badge className={`${currentStatusInfo.color} border`}>
                          {currentStatusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAutoRefresh(!autoRefresh)}
                          className={autoRefresh ? 'text-green-600' : 'text-gray-600'}
                        >
                          <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsExpanded(!isExpanded)}
                        >
                          {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearStoredOrderInfo}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Current Status */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                    {React.createElement(currentStatusInfo.icon, {
                      className: "h-8 w-8 text-pizza-orange"
                    })}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {currentStatusInfo.label}
                      </h3>
                      <p className="text-gray-600">
                        {currentStatusInfo.description}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Ultimo aggiornamento: {formatDate(order.updated_at)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {currentStatus !== 'cancelled' && (
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progresso</span>
                        <span>{progress.percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-pizza-orange to-pizza-red h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Quick Status Timeline */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {orderStatuses
                      .filter(status => status.value !== 'cancelled')
                      .map((status, index) => {
                        const isCompleted = orderStatuses.findIndex(s => s.value === currentStatus) >= index;
                        const isCurrent = status.value === currentStatus;
                        const StatusIcon = status.icon;

                        return (
                          <div
                            key={status.value}
                            className={`text-center p-2 rounded-lg transition-all ${
                              isCurrent
                                ? 'bg-pizza-orange text-white'
                                : isCompleted
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <StatusIcon className="h-4 w-4 mx-auto mb-1" />
                            <p className="text-xs font-medium">{status.label}</p>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Order Items */}
                  {order.order_items && order.order_items.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Dettagli Ordine</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {order.order_items.map((item, index) => (
                          <div key={item.id || index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.product_name}</h4>
                              <p className="text-sm text-gray-600">
                                Quantità: {item.quantity} × {formatPrice(item.unit_price)}
                              </p>
                              {item.special_requests && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Note: {item.special_requests}
                                </p>
                              )}
                            </div>
                            <div className="font-semibold">
                              {formatPrice(item.subtotal)}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Customer Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informazioni</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <p><strong>Cliente:</strong> {order.customer_name}</p>
                        <p><strong>Email:</strong> {order.customer_email}</p>
                        {order.customer_phone && (
                          <p><strong>Telefono:</strong> {order.customer_phone}</p>
                        )}
                        {order.customer_address && (
                          <p><strong>Indirizzo:</strong> {order.customer_address}</p>
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Pagamento:</span>
                          <Badge
                            className={
                              order.payment_status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {order.payment_status === 'paid' ? 'Pagato' : 'In attesa'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            /* Search Form */
            <Card className="shadow-lg max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-5 w-5 text-pizza-orange" />
                  Cerca il tuo Ordine
                </CardTitle>
                <p className="text-gray-600">
                  I tuoi dati verranno salvati per non doverli reinserire
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Numero Ordine *
                    </label>
                    <Input
                      placeholder="es. ORD-2024-001"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="la-tua-email@esempio.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  onClick={() => searchOrder()}
                  disabled={loading}
                  className="w-full bg-pizza-orange hover:bg-pizza-red"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ricerca in corso...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Traccia Ordine
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-gray-500">
                  <p>
                    💾 I tuoi dati verranno salvati localmente per comodità
                  </p>
                </div>

                {/* Temporary Debug Section */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 text-blue-800">Debug Info:</h4>
                  <div className="text-xs space-y-1 text-blue-700">
                    <p>localStorage: {localStorage.getItem('pizzeria_active_order') ? '✅ Has data' : '❌ Empty'}</p>
                    <p>cookies: {document.cookie.includes('pizzeria_active_order') ? '✅ Has cookie' : '❌ No cookie'}</p>
                    <p>getTrackedOrder(): {getTrackedOrder() ? '✅ Found' : '❌ None'}</p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log('🔍 localStorage content:', localStorage.getItem('pizzeria_active_order'));
                          console.log('🍪 All cookies:', document.cookie);
                          console.log('🍪 Tracking cookie exists:', document.cookie.includes('pizzeria_active_order'));
                          console.log('🔍 getTrackedOrder result:', getTrackedOrder());
                          console.log('🔍 hasActiveOrder result:', hasActiveOrder());
                          console.log('🔍 Current order state:', order);
                          console.log('🔍 Current orderNumber state:', orderNumber);
                          console.log('🔍 Current customerEmail state:', customerEmail);
                          alert('Check console for debug info');
                        }}
                        className="text-xs"
                      >
                        Debug Log
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const testOrder = {
                            id: 'test-' + Date.now(),
                            order_number: 'ORD-TEST-' + Date.now(),
                            customer_email: 'test@example.com',
                            customer_name: 'Test Customer',
                            total_amount: 25.50,
                            created_at: new Date().toISOString()
                          };
                          console.log('🧪 Creating test order:', testOrder);
                          const result = saveOrderForTracking(testOrder);
                          console.log('🧪 Save result:', result);
                          console.log('🧪 localStorage after save:', localStorage.getItem('pizzeria_active_order'));

                          // Immediately trigger auto-load to test
                          setTimeout(() => {
                            console.log('🔄 Auto-triggering reload after test order...');
                            window.location.reload();
                          }, 500);

                          alert('Test order created! Page will refresh to test auto-load.');
                        }}
                        className="text-xs"
                      >
                        Test & Reload
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          localStorage.removeItem('pizzeria_active_order');
                          clearOrderTracking();
                          setOrder(null);
                          alert('Tracking cleared!');
                        }}
                        className="text-xs"
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log('🔄 Force refreshing tracking...');
                          const trackedOrder = getTrackedOrder();
                          console.log('🎯 Force refresh - tracked order:', trackedOrder);

                          if (trackedOrder) {
                            setOrderNumber(trackedOrder.orderNumber);
                            setCustomerEmail(trackedOrder.customerEmail);

                            const basicOrder: Order = {
                              id: trackedOrder.orderId,
                              order_number: trackedOrder.orderNumber,
                              customer_name: trackedOrder.customerName,
                              customer_email: trackedOrder.customerEmail,
                              total_amount: trackedOrder.totalAmount,
                              status: 'pending',
                              order_status: 'pending',
                              payment_status: 'pending',
                              created_at: trackedOrder.createdAt,
                              updated_at: trackedOrder.createdAt,
                              order_items: []
                            };

                            setOrder(basicOrder);
                            console.log('✅ Force refresh - order set:', basicOrder);
                            alert('Order loaded! Check if it appears above.');
                          } else {
                            alert('No tracked order found!');
                          }
                        }}
                        className="text-xs"
                      >
                        Auto Load
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default PersistentOrderTracker;
