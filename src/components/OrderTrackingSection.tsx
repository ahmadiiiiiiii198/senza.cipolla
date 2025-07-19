import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import useUserOrders, { getOrderStatusInfo, formatPrice } from '@/hooks/useUserOrders';
import { getOrderItemPrice } from '@/types/order';
import { MapPin } from 'lucide-react';

// Modern Motorcycle Delivery Animation Component
const MotorcycleAnimation: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <div className={`relative w-16 h-16 ${isActive ? 'animate-bounce' : ''}`}>
    <svg viewBox="0 0 100 60" className="w-full h-full">
      {/* Motorcycle Body */}
      <g className={isActive ? 'animate-pulse' : ''}>
        {/* Main frame */}
        <rect x="25" y="35" width="40" height="8" rx="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1"/>
        {/* Seat */}
        <ellipse cx="40" cy="32" rx="8" ry="3" fill="#374151"/>
        {/* Handlebars */}
        <line x1="20" y1="30" x2="30" y2="35" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
        {/* Rider */}
        <circle cx="35" cy="25" r="4" fill="#FCD34D"/>
        <ellipse cx="35" cy="32" rx="3" ry="6" fill="#3B82F6"/>
        {/* Helmet */}
        <circle cx="35" cy="25" r="5" fill="#DC2626" stroke="#991B1B" strokeWidth="1"/>
      </g>

      {/* Wheels with rotation animation */}
      <g className={isActive ? 'animate-spin' : ''} style={{ transformOrigin: '20px 45px' }}>
        <circle cx="20" cy="45" r="8" fill="#1F2937" stroke="#374151" strokeWidth="2"/>
        <circle cx="20" cy="45" r="5" fill="#4B5563"/>
        <line x1="20" y1="37" x2="20" y2="53" stroke="#6B7280" strokeWidth="1"/>
        <line x1="12" y1="45" x2="28" y2="45" stroke="#6B7280" strokeWidth="1"/>
      </g>

      <g className={isActive ? 'animate-spin' : ''} style={{ transformOrigin: '65px 45px' }}>
        <circle cx="65" cy="45" r="8" fill="#1F2937" stroke="#374151" strokeWidth="2"/>
        <circle cx="65" cy="45" r="5" fill="#4B5563"/>
        <line x1="65" y1="37" x2="65" y2="53" stroke="#6B7280" strokeWidth="1"/>
        <line x1="57" y1="45" x2="73" y2="45" stroke="#6B7280" strokeWidth="1"/>
      </g>

      {/* Exhaust smoke when active */}
      {isActive && (
        <g className="animate-pulse">
          <circle cx="25" cy="50" r="1" fill="#9CA3AF" opacity="0.6"/>
          <circle cx="23" cy="48" r="0.8" fill="#9CA3AF" opacity="0.4"/>
          <circle cx="21" cy="46" r="0.6" fill="#9CA3AF" opacity="0.2"/>
        </g>
      )}
    </svg>
  </div>
);

function OrderTrackingSection(): JSX.Element | null {
  const { isAuthenticated } = useCustomerAuth();
  const { orders: userOrders, loading } = useUserOrders();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const activeOrders = useMemo(() => {
    if (!isAuthenticated || !userOrders) return [];
    return userOrders.filter(order =>
      order.status !== 'delivered' &&
      order.status !== 'cancelled'
    );
  }, [isAuthenticated, userOrders]);

  if (!isAuthenticated || !activeOrders.length || loading) {
    return null;
  }

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'pending': return 15;
      case 'confirmed': return 30;
      case 'preparing': return 50;
      case 'ready': return 70;
      case 'delivering': case 'out_for_delivery': return 85;
      case 'arrived': return 95;
      case 'delivered': return 100;
      default: return 10;
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'preparing': return '👨‍🍳';
      case 'ready': return '📦';
      case 'delivering': case 'out_for_delivery': return '🏍️';
      case 'arrived': return '🚪';
      case 'delivered': return '🎉';
      default: return '📋';
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 relative overflow-hidden">
      {/* Clean Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-pizza-orange/10 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-red-500/10 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-yellow-500/10 rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-green-500/10 rounded-full animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Clean Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-pizza-orange to-red-500 p-6 rounded-full shadow-2xl animate-pulse">
              <span className="text-4xl">🍕</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pizza-orange via-red-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Traccia i Tuoi Ordini
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Segui in tempo reale lo stato dei tuoi ordini dalla preparazione alla consegna
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {activeOrders.map((order) => {
              const currentStatus = order.status || order.order_status || 'pending';
              let statusInfo;
              try {
                statusInfo = getOrderStatusInfo(currentStatus);
              } catch (error) {
                console.error('Error getting status info:', error);
                statusInfo = { label: 'In elaborazione', color: 'bg-yellow-500' };
              }

              return (
                <Card key={order.id} className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white rounded-2xl overflow-hidden">
                  {/* Clean Card Header */}
                  <CardHeader className="bg-gradient-to-r from-pizza-orange to-red-500 text-white p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🍕</span>
                        <div>
                          <CardTitle className="text-xl font-bold">
                            Ordine #{order.order_number || order.id?.slice(-8)}
                          </CardTitle>
                          <p className="text-white/90 text-sm">
                            {formatTime(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold">
                          €{formatPrice(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Status Section with Motorcycle Animation */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-4 mb-4">
                        {/* Motorcycle Animation for Delivery Status */}
                        {(currentStatus === 'delivering' || currentStatus === 'out_for_delivery') ? (
                          <MotorcycleAnimation isActive={true} />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pizza-orange to-red-500 flex items-center justify-center text-white text-xl">
                            {getStatusEmoji(currentStatus)}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-1">
                            {statusInfo.label}
                          </h3>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-pizza-orange to-red-500 h-3 rounded-full transition-all duration-1000"
                              style={{ width: `${getProgressPercentage(currentStatus)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                          <span className="text-xl">🍕</span>
                          I Tuoi Prodotti
                        </h4>
                        <div className="space-y-3">
                          {order.order_items.slice(0, 2).map((item, index) => (
                            <div key={item.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <span className="bg-pizza-orange text-white font-bold text-sm px-2 py-1 rounded-full">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-medium text-gray-800">
                                    {item.product_name}
                                  </span>
                                </div>
                                <span className="font-bold text-pizza-orange">
                                  €{formatPrice(getOrderItemPrice(item))}
                                </span>
                              </div>
                            </div>
                          ))}
                          {order.order_items.length > 2 && (
                            <p className="text-sm text-gray-600 text-center">
                              +{order.order_items.length - 2} altri prodotti
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Address Section */}
                    {order.customer_address && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-green-600 mt-1" />
                          <div>
                            <h5 className="font-bold text-gray-800 mb-1">Indirizzo di Consegna</h5>
                            <p className="text-gray-700">{order.customer_address}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default OrderTrackingSection;
