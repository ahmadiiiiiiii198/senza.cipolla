import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import useUserOrders from '@/hooks/useUserOrders';
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  RefreshCw,
  AlertCircle,
  Loader2,
  MapPin,
  ChefHat,
  DoorOpen,
  Home,
  Pizza
} from 'lucide-react';

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

const DatabaseOrderTracker: React.FC = () => {
  const { isAuthenticated, user } = useCustomerAuth();
  const { orders, loading, error, refetchOrders } = useUserOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Get the most recent order for tracking
  const latestOrder = orders && orders.length > 0 ? orders[0] : null;

  // Auto-select the latest order if available
  useEffect(() => {
    if (latestOrder && !selectedOrder) {
      setSelectedOrder(latestOrder);
    }
  }, [latestOrder, selectedOrder]);

  // Real-time order updates using Supabase subscriptions
  useEffect(() => {
    if (!selectedOrder || !autoRefresh || !isAuthenticated) return;

    console.log('🔄 Setting up real-time order tracking for:', selectedOrder.order_number);

    const channel = supabase
      .channel(`order-tracking-${selectedOrder.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${selectedOrder.id}`
      }, (payload) => {
        console.log('📦 Order updated:', payload);
        const updatedOrder = { ...selectedOrder, ...payload.new };
        setSelectedOrder(updatedOrder);
        
        // Refresh the orders list to keep everything in sync
        refetchOrders();
        
        toast({
          title: '🔄 Ordine aggiornato!',
          description: 'Lo stato del tuo ordine è cambiato',
        });
      })
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up order tracking subscription');
      supabase.removeChannel(channel);
    };
  }, [selectedOrder, autoRefresh, isAuthenticated, refetchOrders, toast]);

  // Status mapping for display
  const getStatusInfo = (status: string) => {
    const statusMap = {
      'pending': { label: 'In attesa', color: 'bg-yellow-500', icon: Clock },
      'confirmed': { label: 'Confermato', color: 'bg-blue-500', icon: CheckCircle },
      'preparing': { label: 'In preparazione', color: 'bg-orange-500', icon: ChefHat },
      'ready': { label: 'Pronto', color: 'bg-green-500', icon: Package },
      'out_for_delivery': { label: 'In consegna', color: 'bg-purple-500', icon: Truck },
      'arrived': { label: 'Arrivato alla porta', color: 'bg-indigo-500', icon: DoorOpen },
      'delivered': { label: 'Consegnato', color: 'bg-green-600', icon: Home },
      'cancelled': { label: 'Annullato', color: 'bg-red-500', icon: XCircle }
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  // Get status progress
  const getStatusProgress = (currentStatus: string) => {
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'arrived', 'delivered'];
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

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pizza className="text-red-500" />
            Tracciamento Ordini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accesso Richiesto</h3>
            <p className="text-gray-600 mb-4">
              Devi essere autenticato per visualizzare i tuoi ordini.
            </p>
            <p className="text-sm text-gray-500">
              Effettua il login per vedere lo stato dei tuoi ordini in tempo reale.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pizza className="text-red-500" />
            Tracciamento Ordini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p>Caricamento ordini...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pizza className="text-red-500" />
            Tracciamento Ordini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Errore</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refetchOrders} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Riprova
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show no orders state
  if (!orders || orders.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pizza className="text-red-500" />
            Tracciamento Ordini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun Ordine</h3>
            <p className="text-gray-600">
              Non hai ancora effettuato nessun ordine.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentOrder = selectedOrder || latestOrder;
  if (!currentOrder) return null;

  const statusInfo = getStatusInfo(currentOrder.status);
  const progress = getStatusProgress(currentOrder.status);
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pizza className="text-red-500" />
            Tracciamento Ordini
          </div>
          <Button
            onClick={refetchOrders}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Selection */}
        {orders.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Seleziona Ordine:</label>
            <select
              value={currentOrder.id}
              onChange={(e) => {
                const order = orders.find(o => o.id === e.target.value);
                setSelectedOrder(order || null);
              }}
              className="w-full p-2 border rounded-md"
            >
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  #{order.order_number} - {formatDate(order.created_at)} - €{order.total_amount}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Order Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Ordine #{currentOrder.order_number}</h3>
              <p className="text-sm text-gray-600">
                Ordinato il {formatDate(currentOrder.created_at)}
              </p>
            </div>
            <Badge className={`${statusInfo.color} text-white`}>
              <StatusIcon className="w-4 h-4 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{progress.current > 0 ? `${progress.current}/${progress.total}` : 'Annullato'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  currentOrder.status === 'cancelled' ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-4 border-t pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Cliente:</span>
              <p>{currentOrder.customer_name}</p>
            </div>
            <div>
              <span className="font-medium">Totale:</span>
              <p>€{currentOrder.total_amount.toFixed(2)}</p>
            </div>
            <div className="col-span-2">
              <span className="font-medium">Indirizzo:</span>
              <p className="flex items-start gap-1">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                {currentOrder.customer_address}
              </p>
            </div>
          </div>

          {/* Order Items */}
          {currentOrder.order_items && currentOrder.order_items.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Articoli Ordinati:</h4>
              <div className="space-y-2">
                {currentOrder.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{item.product_name}</span>
                      <span className="text-gray-600 ml-2">x{item.quantity}</span>
                      {item.special_requests && (
                        <p className="text-xs text-gray-500 mt-1">{item.special_requests}</p>
                      )}
                    </div>
                    <span className="font-medium">€{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Auto-refresh toggle */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-gray-600">Aggiornamento automatico</span>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            {autoRefresh ? "Attivo" : "Disattivo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseOrderTracker;
