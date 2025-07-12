import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle, 
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Euro,
  Pizza,
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

const OrderTracking: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [customerEmail, setCustomerEmail] = useState(searchParams.get('email') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Order status configuration matching admin system
  const orderStatuses = [
    { 
      value: 'pending', 
      label: 'In attesa', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      icon: Clock,
      description: 'Il tuo ordine è stato ricevuto e verrà confermato a breve'
    },
    { 
      value: 'confirmed', 
      label: 'Confermato', 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      icon: CheckCircle,
      description: 'Il tuo ordine è stato confermato e verrà preparato'
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
      description: 'Il tuo ordine è stato consegnato con successo'
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

  // Search for order
  const searchOrder = async () => {
    if (!orderNumber.trim() || !customerEmail.trim()) {
      setError('Inserisci sia il numero ordine che l\'email');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

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
      toast({
        title: 'Ordine trovato!',
        description: `Ordine #${data.order_number} caricato con successo`,
      });

    } catch (err) {
      console.error('Search error:', err);
      setError('Errore durante la ricerca dell\'ordine.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if URL params are provided
  useEffect(() => {
    if (orderNumber && customerEmail) {
      searchOrder();
    }
  }, []);

  // Real-time order updates
  useEffect(() => {
    if (!order) return;

    const channel = supabase
      .channel(`order-${order.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${order.id}`
      }, (payload) => {
        console.log('Order updated:', payload);
        setOrder(prev => prev ? { ...prev, ...payload.new } : null);
        
        toast({
          title: 'Ordine aggiornato!',
          description: 'Lo stato del tuo ordine è stato aggiornato',
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order, toast]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-pizza-orange p-4 rounded-full">
              <Pizza className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Traccia il tuo Ordine
          </h1>
          <p className="text-gray-600">
            Inserisci i tuoi dati per seguire lo stato del tuo ordine in tempo reale
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Cerca il tuo Ordine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Numero Ordine
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
                  Email
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
              onClick={searchOrder} 
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
                  Cerca Ordine
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Order Header */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">
                      Ordine #{order.order_number}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">
                      Ordinato il {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-pizza-orange">
                      {formatPrice(order.total_amount)}
                    </div>
                    <Badge
                      className={`${getCurrentStatusInfo(order.status).color} border`}
                    >
                      {getCurrentStatusInfo(order.status).label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Status Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Stato dell'Ordine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Current Status */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {React.createElement(getCurrentStatusInfo(order.status).icon, {
                      className: "h-8 w-8 text-pizza-orange"
                    })}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {getCurrentStatusInfo(order.status).label}
                      </h3>
                      <p className="text-gray-600">
                        {getCurrentStatusInfo(order.status).description}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Ultimo aggiornamento: {formatDate(order.updated_at)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {order.status !== 'cancelled' && (
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progresso</span>
                        <span>{getStatusProgress(order.status).percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pizza-orange to-pizza-red h-2 rounded-full transition-all duration-500"
                          style={{ width: `${getStatusProgress(order.status).percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Timeline */}
                  <div className="space-y-3">
                    {orderStatuses
                      .filter(status => status.value !== 'cancelled')
                      .map((status, index) => {
                        const isCompleted = orderStatuses.findIndex(s => s.value === order.status) >= index;
                        const isCurrent = status.value === order.status;
                        const StatusIcon = status.icon;

                        return (
                          <div
                            key={status.value}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                              isCurrent
                                ? 'bg-pizza-orange/10 border border-pizza-orange/20'
                                : isCompleted
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className={`p-2 rounded-full ${
                              isCurrent
                                ? 'bg-pizza-orange text-white'
                                : isCompleted
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              <StatusIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-medium ${
                                isCurrent ? 'text-pizza-orange' : isCompleted ? 'text-green-700' : 'text-gray-600'
                              }`}>
                                {status.label}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {status.description}
                              </p>
                            </div>
                            {isCompleted && !isCurrent && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Informazioni Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="font-medium">{order.customer_email}</span>
                    </div>
                    {order.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Telefono:</span>
                        <span className="font-medium">{order.customer_phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {order.customer_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="text-sm text-gray-600">Indirizzo:</span>
                          <p className="font-medium">{order.customer_address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            {order.order_items && order.order_items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pizza className="h-5 w-5" />
                    Dettagli Ordine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.order_items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="flex justify-between items-start p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{item.product_name}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <span>Quantità: {item.quantity}</span>
                            <span className="mx-2">•</span>
                            <span>Prezzo unitario: {formatPrice(item.unit_price)}</span>
                          </div>
                          {item.special_requests && (
                            <div className="mt-2">
                              <span className="text-sm font-medium text-gray-700">
                                Richieste speciali:
                              </span>
                              <p className="text-sm text-gray-600 mt-1">
                                {item.special_requests}
                              </p>
                            </div>
                          )}
                          {item.toppings && item.toppings.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm font-medium text-gray-700">
                                Extra:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.toppings.map((topping, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {topping}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-lg">
                            {formatPrice(item.subtotal)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Order Total */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Totale:</span>
                        <span className="text-2xl font-bold text-pizza-orange">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Notes */}
            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Note Ordine
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Stato Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Stato pagamento:</span>
                  <Badge
                    className={
                      order.payment_status === 'paid'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : order.payment_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }
                  >
                    {order.payment_status === 'paid' ? 'Pagato' :
                     order.payment_status === 'pending' ? 'In attesa' :
                     'Non pagato'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Hai bisogno di aiuto?
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Se hai domande sul tuo ordine, non esitare a contattarci
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                      <Phone className="h-4 w-4 mr-2" />
                      Chiamaci
                    </Button>
                    <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                      <Mail className="h-4 w-4 mr-2" />
                      Invia Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
