import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Eye, 
  Check, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle,
  Euro,
  User,
  MapPin,
  Phone,
  Calendar,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  product_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  delivery_address?: string;
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  total_amount: number;
  delivery_fee?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

const OrdersAdmin = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const orderStatuses = [
    { value: 'pending', label: 'In attesa', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'confirmed', label: 'Confermato', color: 'bg-blue-100 text-blue-800', icon: Check },
    { value: 'preparing', label: 'In preparazione', color: 'bg-orange-100 text-orange-800', icon: Clock },
    { value: 'ready', label: 'Pronto', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'delivered', label: 'Consegnato', color: 'bg-green-100 text-green-800', icon: Truck },
    { value: 'cancelled', label: 'Annullato', color: 'bg-red-100 text-red-800', icon: XCircle }
  ];

  // Load orders from database
  const loadOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            product_price,
            subtotal
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('order_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli ordini",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          order_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Create notification for status change
      await supabase
        .from('order_notifications')
        .insert([{
          order_id: orderId,
          message: `Ordine aggiornato a: ${orderStatuses.find(s => s.value === newStatus)?.label}`,
          type: 'order_update'
        }]);

      toast({
        title: "Successo",
        description: "Stato ordine aggiornato",
      });

      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'ordine",
        variant: "destructive",
      });
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Ordine eliminato con successo",
      });

      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'ordine",
        variant: "destructive",
      });
    }
  };

  // Delete all orders
  const deleteAllOrders = async () => {
    if (orders.length === 0) {
      toast({
        title: "Nessun Ordine",
        description: "Non ci sono ordini da eliminare",
        variant: "destructive",
      });
      return;
    }

    const confirmed = confirm(
      `⚠️ ELIMINA TUTTI GLI ORDINI?\n\nQuesta azione eliminerà permanentemente TUTTI i ${orders.length} ordini.\nQuesta azione NON PUÒ essere annullata!\n\nClicca OK per eliminare tutti gli ordini, o Annulla per interrompere.`
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      console.log('🗑️ Starting delete all orders process...');

      const orderCount = orders.length;
      let deletedCount = 0;

      // Use the database function to safely delete each order
      // This approach respects RLS policies and handles foreign key constraints properly
      for (const order of orders) {
        try {
          console.log(`🗑️ Deleting order ${order.id}...`);

          // Try using the database function first
          const { error: functionError } = await supabase.rpc('delete_order_cascade', {
            order_uuid: order.id
          });

          if (functionError) {
            console.log(`⚠️ Database function failed for order ${order.id}, trying manual deletion:`, functionError.message);

            // Fallback to manual deletion
            // Delete order items first
            await supabase
              .from('order_items')
              .delete()
              .eq('order_id', order.id);

            // Delete order notifications
            await supabase
              .from('order_notifications')
              .delete()
              .eq('order_id', order.id);

            // Delete the order
            const { error: orderError } = await supabase
              .from('orders')
              .delete()
              .eq('id', order.id);

            if (orderError) {
              console.error(`❌ Failed to delete order ${order.id}:`, orderError.message);
              throw orderError;
            }
          }

          deletedCount++;
          console.log(`✅ Order ${order.id} deleted successfully (${deletedCount}/${orderCount})`);

        } catch (error) {
          console.error(`❌ Failed to delete order ${order.id}:`, error);
          // Continue with other orders even if one fails
        }
      }

      console.log(`✅ Deletion process completed. ${deletedCount}/${orderCount} orders deleted.`);

      toast({
        title: "🗑️ Ordini Eliminati",
        description: `Eliminati con successo ${deletedCount} di ${orderCount} ordini`,
        duration: 10000,
      });

      // Refresh the orders list
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('❌ Error deleting all orders:', error);
      toast({
        title: "Errore",
        description: `Errore durante l'eliminazione degli ordini: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0];
  };

  // Get order counts by status
  const getOrderCounts = () => {
    const counts = {
      all: orders.length,
      pending: orders.filter(o => o.order_status === 'pending').length,
      confirmed: orders.filter(o => o.order_status === 'confirmed').length,
      preparing: orders.filter(o => o.order_status === 'preparing').length,
      ready: orders.filter(o => o.order_status === 'ready').length,
      delivered: orders.filter(o => o.order_status === 'delivered').length,
      cancelled: orders.filter(o => o.order_status === 'cancelled').length
    };
    return counts;
  };

  useEffect(() => {
    loadOrders();

    // Set up real-time subscription for orders
    const ordersSubscription = supabase
      .channel('orders_admin')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order change detected:', payload);
          loadOrders(); // Reload orders when any change occurs
          setLastRefresh(new Date());

          // Show toast for new orders
          if (payload.eventType === 'INSERT') {
            toast({
              title: "🔔 Nuovo Ordine!",
              description: `Ordine ricevuto da ${payload.new.customer_name}`,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for order items
    const orderItemsSubscription = supabase
      .channel('order_items_admin')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          console.log('Order items change detected');
          loadOrders(); // Reload orders when items change
        }
      )
      .subscribe();

    // Auto-refresh every 30 seconds as backup
    const refreshInterval = setInterval(() => {
      loadOrders();
      setLastRefresh(new Date());
    }, 30000);

    return () => {
      ordersSubscription.unsubscribe();
      orderItemsSubscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [statusFilter]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Caricamento...</div>;
  }

  const counts = getOrderCounts();

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestione Ordini</h3>
          <p className="text-sm text-gray-600">
            Visualizza e gestisci tutti gli ordini
            <span className="ml-2 text-xs text-green-600">
              🔄 Ultimo aggiornamento: {lastRefresh.toLocaleTimeString('it-IT')}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={deleteAllOrders}
            variant="outline"
            size="sm"
            className="bg-red-100 border-red-300 text-red-700 hover:bg-red-200 shadow-lg border-2 rounded-full text-xs sm:text-sm"
            disabled={orders.length === 0 || isLoading}
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">🗑️ Elimina Tutti</span>
            <span className="sm:hidden">🗑️</span>
          </Button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">Tutti gli ordini ({counts.all})</option>
            {orderStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label} ({counts[status.value as keyof typeof counts] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {orderStatuses.map((status) => {
          const count = counts[status.value as keyof typeof counts] || 0;
          const StatusIcon = status.icon;
          return (
            <Card key={status.value}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">{status.label}</p>
                    <p className="text-xl font-bold">{count}</p>
                  </div>
                  <StatusIcon size={20} className="text-gray-500" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold">Lista Ordini</h4>
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.order_status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card 
                key={order.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedOrder?.id === order.id ? 'ring-2 ring-red-500' : ''
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm">
                        Ordine #{order.id.slice(-8)}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-2">
                        <User size={14} />
                        <span>{order.customer_name}</span>
                      </CardDescription>
                    </div>
                    <Badge className={statusInfo.color}>
                      <StatusIcon size={12} className="mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Totale:</span>
                      <span className="font-semibold">€{order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Articoli:</span>
                      <span>{order.order_items?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data:</span>
                      <span>{new Date(order.created_at).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {orders.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <ShoppingCart className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-500">Nessun ordine trovato</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Details */}
        <div>
          {selectedOrder ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Dettagli Ordine #{selectedOrder.id.slice(-8)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteOrder(selectedOrder.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div>
                  <h5 className="font-semibold mb-2">Informazioni Cliente</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <User size={14} />
                      <span>{selectedOrder.customer_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>📧</span>
                      <span>{selectedOrder.customer_email}</span>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone size={14} />
                        <span>{selectedOrder.customer_phone}</span>
                      </div>
                    )}
                    {selectedOrder.delivery_address && (
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} />
                        <span>{selectedOrder.delivery_address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h5 className="font-semibold mb-2">Articoli Ordinati</h5>
                  <div className="space-y-2">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span>€{((item.subtotal || (item.product_price * item.quantity)) || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Totale:</span>
                      <span>€{(selectedOrder.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <h5 className="font-semibold mb-2">Aggiorna Stato</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {orderStatuses.map((status) => {
                      const StatusIcon = status.icon;
                      return (
                        <Button
                          key={status.value}
                          size="sm"
                          variant={selectedOrder.order_status === status.value ? "default" : "outline"}
                          onClick={() => updateOrderStatus(selectedOrder.id, status.value)}
                          className="text-xs"
                        >
                          <StatusIcon size={12} className="mr-1" />
                          {status.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h5 className="font-semibold mb-2">Note</h5>
                    <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar size={12} />
                    <span>Creato: {new Date(selectedOrder.created_at).toLocaleString('it-IT')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar size={12} />
                    <span>Aggiornato: {new Date(selectedOrder.updated_at).toLocaleString('it-IT')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Eye className="mx-auto mb-4 text-gray-400" size={48} />
                <p className="text-gray-500">Seleziona un ordine per vedere i dettagli</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersAdmin;
