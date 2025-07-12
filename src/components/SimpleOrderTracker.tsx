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
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const { toast } = useToast();

  // Auto-load tracked order on mount
  useEffect(() => {
    const trackedOrder = getTrackedOrder();
    if (trackedOrder) {
      console.log('🎯 Auto-loading tracked order:', trackedOrder.orderNumber);
      setOrderNumber(trackedOrder.orderNumber);
      setCustomerEmail(trackedOrder.customerEmail);
      searchOrder(trackedOrder.orderNumber, trackedOrder.customerEmail);
    }
  }, []);

  const searchOrder = async (orderNum: string, email: string) => {
    if (!orderNum || !email) {
      toast({
        title: 'Campi richiesti',
        description: 'Inserisci numero ordine e email',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
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
        toast({
          title: 'Ordine non trovato',
          description: 'Verifica numero ordine e email',
          variant: 'destructive'
        });
        setOrder(null);
        return;
      }

      setOrder(orderData);
      console.log('✅ Order found and displayed:', orderData.order_number);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Errore di ricerca',
        description: 'Riprova più tardi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <Package className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
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
    setOrderNumber('');
    setCustomerEmail('');
    console.log('🗑️ Tracking cleared');
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
          {!order ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Numero Ordine"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
                <Input
                  placeholder="Email Cliente"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => searchOrder(orderNumber, customerEmail)}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Cerca Ordine
                </Button>
                
                <Button
                  variant="outline"
                  onClick={createTestOrder}
                  className="px-3"
                >
                  Test
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
                  {order.status.toUpperCase()}
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
