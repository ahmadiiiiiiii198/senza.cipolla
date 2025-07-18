import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePersistentOrder, getOrderStatusInfo, getOrderProgress } from '@/hooks/use-persistent-order';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import useUserOrders from '@/hooks/useUserOrders';
import { 
  Pizza, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle,
  ChefHat,
  DoorOpen,
  Home,
  MapPin,
  RefreshCw,
  Eye,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomeOrderTracker: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useCustomerAuth();
  const { orders: userOrders, loading: userOrdersLoading, hasActiveOrders } = useUserOrders();

  // 🔒 SECURITY: Only show order tracking for authenticated users
  console.log('🔍 [HomeOrderTracker] Authentication state:', { isAuthenticated, userEmail: user?.email });

  if (!isAuthenticated || !user) {
    return null;
  }

  // Find active order for the authenticated user only
  const activeOrder = userOrders?.find(order => {
    const activeStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'arrived'];
    const currentStatus = order.status || order.order_status;
    return activeStatuses.includes(currentStatus);
  });

  // Don't render if no active order or still loading
  if (userOrdersLoading || !hasActiveOrders || !activeOrder) {
    return null;
  }

  const currentStatus = activeOrder.status || activeOrder.order_status || 'confirmed';
  const statusInfo = getOrderStatusInfo(currentStatus);
  const progress = getOrderProgress(currentStatus);

  const formatPrice = (price: number) => `€${price.toFixed(2)}`;
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Order status configuration with beautiful motorcycle delivery tracking
  const orderStatuses = [
    {
      value: 'confirmed',
      label: 'Confermato',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: CheckCircle,
      description: 'Il tuo ordine è stato confermato',
      motorcyclePosition: 0
    },
    {
      value: 'preparing',
      label: 'In preparazione',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: ChefHat,
      description: 'I nostri chef stanno preparando il tuo ordine',
      motorcyclePosition: 25
    },
    {
      value: 'ready',
      label: 'Pronto',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: Package,
      description: 'Il tuo ordine è pronto per la consegna',
      motorcyclePosition: 50
    },
    {
      value: 'out_for_delivery',
      label: 'In consegna',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Truck,
      description: 'Il tuo ordine è in viaggio verso di te',
      motorcyclePosition: 75
    },
    {
      value: 'arrived',
      label: 'Arrivato alla porta',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: DoorOpen,
      description: 'Il nostro rider è arrivato alla tua porta',
      motorcyclePosition: 90
    },
    {
      value: 'delivered',
      label: 'Consegnato',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: Home,
      description: 'Il tuo ordine è stato consegnato con successo',
      motorcyclePosition: 100
    }
  ];

  const getCurrentStatusInfo = (status: string) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0];
  };

  const getStatusProgress = (currentStatus: string) => {
    const statusOrder = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'arrived', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    if (currentStatus === 'cancelled') {
      return { current: -1, total: statusOrder.length, percentage: 0 };
    }

    // Use motorcycle position from status configuration for more accurate positioning
    const statusInfo = getCurrentStatusInfo(currentStatus);
    const percentage = statusInfo.motorcyclePosition || ((currentIndex + 1) / statusOrder.length) * 100;
    
    return {
      current: currentIndex + 1,
      total: statusOrder.length,
      percentage: percentage
    };
  };

  const handleViewFullTracking = () => {
    navigate(`/track-order?order=${activeOrder.order_number}&email=${activeOrder.customer_email}`);
  };

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 via-red-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-pizza-orange to-red-500 p-4 rounded-full shadow-xl">
                <Pizza className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-pizza-orange to-red-500 bg-clip-text text-transparent">
              Il tuo Ordine in Corso
            </h2>
            <p className="text-gray-600">
              Segui lo stato del tuo ordine in tempo reale
            </p>
          </div>

          {/* Order Tracking Card */}
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-orange-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-pizza-orange to-red-500 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">
                    Ordine #{activeOrder.order_number}
                  </CardTitle>
                  <p className="text-white/90 mt-1">
                    Ordinato alle {formatTime(activeOrder.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {formatPrice(activeOrder.total_amount)}
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {getCurrentStatusInfo(currentStatus).label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              {/* Current Status */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                {React.createElement(getCurrentStatusInfo(currentStatus).icon, {
                  className: "h-8 w-8 text-pizza-orange"
                })}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {getCurrentStatusInfo(currentStatus).label}
                  </h3>
                  <p className="text-gray-600">
                    {getCurrentStatusInfo(currentStatus).description}
                  </p>
                </div>
              </div>

              {/* Motorcycle Delivery Tracking */}
              <div className="relative bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border-2 border-dashed border-blue-200 mb-6">
                {/* Road Background */}
                <div className="absolute inset-x-0 bottom-8 h-2 bg-gray-800 rounded-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full"></div>
                  {/* Road markings */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-yellow-400 opacity-80 animate-pulse"></div>
                  </div>
                </div>

                {/* Animated Motorcycle */}
                <div
                  className="absolute bottom-6 transition-all duration-1000 ease-in-out z-20"
                  style={{
                    left: `${Math.max(0, Math.min(95, getStatusProgress(currentStatus).percentage))}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  <div className="relative">
                    {/* Beautiful Delivery Motorcycle SVG */}
                    <div className={`transition-transform duration-300 ${
                      currentStatus === 'delivered' ? 'animate-bounce' : 'animate-pulse'
                    }`}>
                      <svg width="48" height="30" viewBox="0 0 64 40" className="drop-shadow-lg">
                        {/* Motorcycle Shadow */}
                        <ellipse cx="32" cy="38" rx="28" ry="2" fill="rgba(0,0,0,0.2)" />

                        {/* Front Wheel */}
                        <circle cx="12" cy="30" r="6" fill="#2d3748" stroke="#4a5568" strokeWidth="1"/>
                        <circle cx="12" cy="30" r="4" fill="#e2e8f0" stroke="#cbd5e0" strokeWidth="1"/>
                        <circle cx="12" cy="30" r="1.5" fill="#4a5568"/>

                        {/* Rear Wheel */}
                        <circle cx="52" cy="30" r="6" fill="#2d3748" stroke="#4a5568" strokeWidth="1"/>
                        <circle cx="52" cy="30" r="4" fill="#e2e8f0" stroke="#cbd5e0" strokeWidth="1"/>
                        <circle cx="52" cy="30" r="1.5" fill="#4a5568"/>

                        {/* Main Frame */}
                        <path d="M20 30 L44 30 L42 20 L22 20 Z" fill="#3182ce" stroke="#2c5282" strokeWidth="1"/>

                        {/* Seat */}
                        <ellipse cx="35" cy="18" rx="6" ry="2" fill="#2d3748"/>

                        {/* Handlebars */}
                        <path d="M18 22 L8 18 M18 22 L8 26" stroke="#4a5568" strokeWidth="2" strokeLinecap="round"/>

                        {/* Headlight */}
                        <circle cx="6" cy="22" r="2" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"/>
                      </svg>

                      {/* Premium Delivery Box */}
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-red-700 rounded border border-white shadow-lg flex items-center justify-center">
                        <span className="text-xs">🍕</span>
                      </div>
                    </div>

                    {/* Speed lines when in transit */}
                    {(currentStatus === 'out_for_delivery' || currentStatus === 'preparing') && (
                      <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-0.5 bg-blue-400 animate-pulse"></div>
                          <div className="w-1 h-0.5 bg-blue-300 animate-pulse delay-75"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="absolute inset-x-6 bottom-4 h-1 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pizza-orange via-yellow-400 to-green-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${getStatusProgress(currentStatus).percentage}%` }}
                  ></div>
                </div>

                {/* Progress percentage */}
                <div className="text-center mt-8">
                  <div className="text-sm text-gray-600 mb-2">
                    Progresso: {getStatusProgress(currentStatus).percentage.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleViewFullTracking}
                  className="flex-1 bg-gradient-to-r from-pizza-orange to-red-500 hover:from-red-500 hover:to-pizza-orange text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizza Tracking Completo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HomeOrderTracker;
