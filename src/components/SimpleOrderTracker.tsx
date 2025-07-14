import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Clock, CheckCircle, AlertCircle, Search, Trash2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { searchClientOrderInDatabase, saveClientOrder, clearClientOrder } from '@/utils/clientSpecificOrderTracking';
import { getOrCreateClientIdentity } from '@/utils/clientIdentification';

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

  // CLIENT-SPECIFIC ORDER DETECTION WITH SMART FALLBACK
  useEffect(() => {
    const loadClientOrder = async () => {
      console.log('🔍 CLIENT-SPECIFIC: Starting order detection...');
      setLoading(true);

      try {
        // Get client identity
        const clientIdentity = getOrCreateClientIdentity();
        console.log('🆔 Client ID:', clientIdentity.clientId.slice(-12));

        // Search for client-specific order
        const searchResult = await searchClientOrderInDatabase();
        console.log('📊 Search result:', searchResult);

        if (searchResult.order) {
          console.log('✅ FOUND CLIENT ORDER:', searchResult.order.order_number, 'Source:', searchResult.source);
          setOrder(searchResult.order);
          setLoading(false);
          return;
        }

        console.log('❌ No client-specific orders found');
        setOrder(null);
        setLoading(false);

      } catch (error) {
        console.error('❌ CRITICAL ERROR in client order detection:', error);
        setOrder(null);
        setLoading(false);
      }
    };

    loadClientOrder();
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
    clearClientOrder();
    setOrder(null);
    console.log('🗑️ Client order tracking cleared');
  };

  const forceRefresh = async () => {
    console.log('🔄 Force refreshing order search...');
    setLoading(true);
    try {
      const searchResult = await searchClientOrderInDatabase();
      if (searchResult.order) {
        setOrder(searchResult.order);
        toast({
          title: "Ordine trovato!",
          description: `Ordine ${searchResult.order.order_number} caricato con successo`,
        });
      } else {
        toast({
          title: "Nessun ordine trovato",
          description: "Crea un nuovo ordine per vedere il tracciamento",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Force refresh error:', error);
      toast({
        title: "Errore di ricerca",
        description: "Si è verificato un errore durante la ricerca",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

      // Save updated order data for this client
      saveClientOrder({
        id: orderData.id,
        order_number: orderData.order_number,
        customer_email: orderData.customer_email,
        customer_name: orderData.customer_name,
        total_amount: orderData.total_amount,
        created_at: orderData.created_at
      });

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
      case 'arrived': return 'ARRIVATO ALLA PORTA';
      case 'delivered': return 'CONSEGNATO';
      case 'cancelled': return 'ANNULLATO';
      default:
        console.log('⚠️ Unknown status, defaulting to CONFERMATO');
        return 'CONFERMATO';
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'confirmed': return 20;
      case 'preparing': return 40;
      case 'ready': return 60;
      case 'arrived': return 80;
      case 'delivered': return 100;
      default: return 0;
    }
  };







  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Modern Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-lg px-6 py-4 rounded-2xl shadow-xl border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-pizza-red via-pizza-orange to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pizza-red to-pizza-orange bg-clip-text text-transparent">
                Traccia il tuo Ordine
              </h1>
              <p className="text-sm text-slate-600">Segui la tua pizza in tempo reale</p>
            </div>
            {isRealTimeActive && (
              <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-pizza-orange/20 border-t-pizza-orange rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="h-6 w-6 text-pizza-orange animate-pulse" />
                  </div>
                </div>
                <p className="mt-4 text-lg font-medium text-slate-700">Caricamento ordine...</p>
                <p className="text-sm text-slate-500">Stiamo cercando il tuo ordine</p>
              </div>
            ) : !order ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Nessun ordine trovato</h3>
                <p className="text-slate-500 mb-6">Effettua un ordine per vedere il tracciamento qui</p>

                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-pizza-orange/10 px-4 py-2 rounded-full text-sm text-pizza-orange">
                    <Clock className="h-4 w-4" />
                    Ordina ora per iniziare il tracciamento
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      onClick={forceRefresh}
                      className="mt-4"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Ricarica Ordini
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Modern Order Header */}
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-pizza-red to-pizza-orange rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">#</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Ordine #{order.order_number}</h2>
                      <p className="text-slate-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {order.customer_name}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-green-100 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-green-700">€{order.total_amount}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearTracking}
                      className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Premium Motorcycle Delivery Tracking */}
                <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 rounded-3xl border border-white/50 shadow-2xl mb-8 overflow-hidden">

                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-pizza-orange/20 to-pizza-red/20"></div>
                    <div className="absolute inset-0" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='40' cy='40' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      backgroundSize: '40px 40px',
                      animation: 'float 6s ease-in-out infinite'
                    }}></div>
                  </div>

                  {/* Modern Header */}
                  <div className="relative z-10 text-center mb-8">
                    <div className="inline-flex items-center gap-4 bg-white/90 backdrop-blur-lg px-6 py-3 rounded-2xl border border-white/30 shadow-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-pizza-red via-pizza-orange to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg bg-gradient-to-r from-pizza-red to-pizza-orange bg-clip-text text-transparent">
                          Tracciamento Consegna
                        </h3>
                        <p className="text-xs text-slate-600">La tua pizza è in viaggio</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-green-700">Live</span>
                      </div>
                    </div>
                  </div>

                  {/* Premium Road with Enhanced Design */}
                  <div className="relative h-32 mb-8">
                    {/* Road Base with 3D Effect */}
                    <div className="absolute inset-x-0 bottom-12 h-6 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 rounded-2xl shadow-2xl">
                      {/* Road Surface with Realistic Texture */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 rounded-2xl"></div>

                      {/* Enhanced Animated Road Markings */}
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
                        <div className="w-full h-1 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 opacity-90 relative rounded-full">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200 to-transparent animate-pulse rounded-full"></div>
                          {/* Moving dashes effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-80 rounded-full"
                               style={{
                                 backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 10px, yellow 10px, yellow 20px)',
                                 animation: 'roadDash 2s linear infinite'
                               }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Status Checkpoints */}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between items-end px-6">
                      {[
                        { key: 'confirmed', label: 'Confermato', icon: CheckCircle, color: 'emerald' },
                        { key: 'preparing', label: 'Preparazione', icon: Package, color: 'blue' },
                        { key: 'ready', label: 'Pronto', icon: Clock, color: 'amber' },
                        { key: 'arrived', label: 'Arrivato', icon: MapPin, color: 'purple' },
                        { key: 'delivered', label: 'Consegnato', icon: CheckCircle, color: 'green' }
                      ].map((statusItem, index) => {
                        const isCompleted = ['confirmed', 'preparing', 'ready', 'arrived', 'delivered'].findIndex(s => s === order.status) >= index;
                        const isCurrent = statusItem.key === order.status;
                        const StatusIcon = statusItem.icon;

                        return (
                          <div key={statusItem.key} className="flex flex-col items-center">
                            {/* Enhanced Checkpoint Pole */}
                            <div className={`w-2 h-16 mb-3 rounded-full transition-all duration-700 shadow-lg ${
                              isCompleted
                                ? 'bg-gradient-to-t from-green-600 via-green-500 to-green-400 shadow-green-200'
                                : 'bg-gradient-to-t from-slate-300 to-slate-200 shadow-slate-100'
                            }`}>
                              {isCompleted && (
                                <div className="w-full h-full bg-gradient-to-t from-transparent via-white/30 to-white/50 rounded-full"></div>
                              )}
                            </div>

                            {/* Premium Checkpoint Circle */}
                            <div className={`relative w-12 h-12 rounded-2xl border-2 transition-all duration-700 shadow-xl ${
                              isCurrent
                                ? 'bg-gradient-to-br from-pizza-orange to-pizza-red border-pizza-orange shadow-pizza-orange/50 scale-125 animate-pulse'
                                : isCompleted
                                ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-500 shadow-green-200'
                                : 'bg-gradient-to-br from-white to-slate-50 border-slate-300 shadow-slate-100'
                            }`}>
                              {/* Icon with enhanced styling */}
                              <StatusIcon className={`h-6 w-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                                isCurrent || isCompleted ? 'text-white drop-shadow-sm' : 'text-slate-400'
                              }`} />

                              {/* Glow effect for current status */}
                              {isCurrent && (
                                <div className="absolute inset-0 rounded-2xl bg-pizza-orange/30 animate-ping"></div>
                              )}

                            </div>

                            {/* Enhanced Label */}
                            <div className="mt-3 text-center">
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-all duration-500 ${
                                isCurrent
                                  ? 'bg-pizza-orange/20 text-pizza-orange border border-pizza-orange/30'
                                  : isCompleted
                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}>
                                {isCurrent && <div className="w-1.5 h-1.5 bg-pizza-orange rounded-full animate-pulse"></div>}
                                {statusItem.label}
                              </div>
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
                          : order.status === 'arrived'
                          ? 'animate-pulse scale-110'
                          : order.status === 'ready' || order.status === 'preparing'
                          ? 'animate-pulse'
                          : ''
                      }`}>
                        <svg width="64" height="40" viewBox="0 0 64 40" className="drop-shadow-lg">
                          {/* Motorcycle Shadow */}
                          <ellipse cx="32" cy="38" rx="28" ry="2" fill="rgba(0,0,0,0.2)" />

                          {/* Front Wheel */}
                          <circle cx="12" cy="30" r="8" fill="#2d3748" stroke="#4a5568" strokeWidth="1"/>
                          <circle cx="12" cy="30" r="5" fill="#e2e8f0" stroke="#cbd5e0" strokeWidth="1"/>
                          <circle cx="12" cy="30" r="2" fill="#4a5568"/>

                          {/* Rear Wheel */}
                          <circle cx="52" cy="30" r="8" fill="#2d3748" stroke="#4a5568" strokeWidth="1"/>
                          <circle cx="52" cy="30" r="5" fill="#e2e8f0" stroke="#cbd5e0" strokeWidth="1"/>
                          <circle cx="52" cy="30" r="2" fill="#4a5568"/>

                          {/* Main Frame */}
                          <path d="M20 30 L44 30 L42 20 L22 20 Z" fill="#3182ce" stroke="#2c5282" strokeWidth="1"/>

                          {/* Seat */}
                          <ellipse cx="35" cy="18" rx="8" ry="3" fill="#2d3748"/>

                          {/* Handlebars */}
                          <path d="M18 22 L8 18 M18 22 L8 26" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="8" cy="22" r="1.5" fill="#4a5568"/>

                          {/* Front Fork */}
                          <line x1="12" y1="22" x2="12" y2="30" stroke="#4a5568" strokeWidth="2"/>

                          {/* Exhaust Pipe */}
                          <path d="M44 25 Q50 25 54 28" stroke="#6b7280" strokeWidth="2" fill="none"/>

                          {/* Headlight */}
                          <circle cx="6" cy="22" r="3" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
                          <circle cx="6" cy="22" r="1.5" fill="#fef3c7"/>
                        </svg>

                        {/* Premium Delivery Box */}
                        <div className="absolute -top-1 -right-2 w-8 h-8 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-lg border-2 border-white shadow-lg flex items-center justify-center transform rotate-12">
                          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-white">🍕</span>
                          </div>
                        </div>

                        {/* Speed Lines Effect */}
                        {(order.status === 'ready' || order.status === 'preparing' || order.status === 'arrived') && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full">
                            <div className="flex space-x-1">
                              {[...Array(4)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`bg-blue-400 rounded-full animate-pulse`}
                                  style={{
                                    width: `${4 - i}px`,
                                    height: '2px',
                                    animationDelay: `${i * 0.1}s`,
                                    opacity: 1 - (i * 0.2)
                                  }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Exhaust Smoke when moving */}
                        {(order.status === 'ready' || order.status === 'preparing' || order.status === 'arrived') && (
                          <div className="absolute right-0 top-2 transform translate-x-full">
                            <div className="flex space-x-1">
                              {[...Array(3)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1 h-1 bg-gray-400 rounded-full animate-ping"
                                  style={{
                                    animationDelay: `${i * 0.2}s`,
                                    opacity: 0.6 - (i * 0.2)
                                  }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Enhanced Progress Bar */}
                  <div className="relative mb-8">
                    <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-pizza-red via-pizza-orange to-green-500 rounded-full transition-all duration-3000 ease-out relative shadow-lg"
                        style={{ width: `${getProgressPercentage(order.status)}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse rounded-full"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <span className="text-xs font-medium text-slate-600">
                        {getProgressPercentage(order.status)}% completato
                      </span>
                    </div>
                  </div>

                  {/* Premium Status Message */}
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-4 px-6 py-4 rounded-2xl text-base font-semibold backdrop-blur-lg shadow-xl border-2 transition-all duration-500 ${
                      order.status === 'delivered'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300 shadow-green-100'
                        : order.status === 'arrived'
                        ? 'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-800 border-purple-300 shadow-purple-100'
                        : order.status === 'ready'
                        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-800 border-blue-300 shadow-blue-100'
                        : order.status === 'preparing'
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 border-orange-300 shadow-orange-100'
                        : 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-800 border-slate-300 shadow-slate-100'
                    }`}>
                      <div className={`w-3 h-3 rounded-full shadow-lg ${
                        order.status === 'delivered' ? 'bg-green-500 shadow-green-200' :
                        order.status === 'arrived' ? 'bg-purple-500 animate-pulse shadow-purple-200' :
                        order.status === 'ready' ? 'bg-blue-500 animate-pulse shadow-blue-200' :
                        order.status === 'preparing' ? 'bg-orange-500 animate-pulse shadow-orange-200' :
                        'bg-slate-500 shadow-slate-200'
                      }`}></div>
                      <div>
                        <span className="font-bold text-lg">{getStatusText(order.status)}</span>
                        <div className="text-sm opacity-80 mt-1">
                          {order.status === 'ready' && '🏍️ Pronto per il ritiro'}
                          {order.status === 'preparing' && '👨‍🍳 In cucina'}
                          {order.status === 'arrived' && '🚪 Arrivato alla porta'}
                          {order.status === 'delivered' && '🍕 Buon appetito!'}
                          {order.status === 'confirmed' && '✅ Ordine confermato'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">€</span>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Totale Ordine</p>
                        <p className="text-2xl font-bold text-slate-800">€{order.total_amount}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600">Data Ordine</p>
                        <p className="text-lg font-bold text-blue-800">
                          {new Date(order.created_at).toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Order Items */}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-amber-800">I tuoi Articoli</h4>
                    </div>
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-white/70 p-3 rounded-xl border border-amber-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-pizza-orange to-pizza-red rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{item.quantity}</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{item.product_name}</p>
                              <p className="text-sm text-slate-600">€{item.product_price} cad.</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-slate-800">€{item.subtotal}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => searchOrder(order.order_number, order.customer_email)}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 text-blue-700 font-semibold"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Aggiorna Stato
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleOrderTracker;
