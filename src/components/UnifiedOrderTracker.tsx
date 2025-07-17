import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  XCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  Eye
} from 'lucide-react';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import useUserOrders, { getOrderStatusInfo, formatPrice, formatDate } from '@/hooks/useUserOrders';
import { usePersistentOrder } from '@/hooks/use-persistent-order';
import { Order, getOrderItemPrice } from '@/types/order';

const UnifiedOrderTracker: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Hooks must be called at the top level - MEMOIZED to prevent infinite loops
  const { isAuthenticated } = useCustomerAuth();
  const { orders: userOrders, getActiveOrder, loading: userOrdersLoading } = useUserOrders();
  const { order: anonymousOrder, loading: anonymousLoading } = usePersistentOrder();

  // Memoize the active order determination to prevent unnecessary re-renders
  const activeOrderData = useMemo(() => {
    // Inline the active order logic to avoid dependency on getActiveOrder function
    let activeOrder = null;
    if (isAuthenticated && userOrders) {
      const activeStatuses = ['confirmed', 'preparing', 'ready', 'arrived'];
      activeOrder = userOrders.find(order => {
        const currentStatus = order.order_status || order.status;
        return activeStatuses.includes(currentStatus);
      }) || null;
    } else {
      activeOrder = anonymousOrder;
    }

    const loading = isAuthenticated ? userOrdersLoading : anonymousLoading;

    return {
      activeOrder,
      loading,
      orderSource: isAuthenticated ? 'user' : 'anonymous'
    };
  }, [isAuthenticated, userOrders, anonymousOrder, userOrdersLoading, anonymousLoading]);

  console.log('🎯 [ORDER-TRACKER] Render state:', {
    isAuthenticated,
    userOrdersCount: userOrders?.length || 0,
    userOrdersLoading,
    hasAnonymousOrder: !!anonymousOrder,
    anonymousLoading
  });

  console.log('🎯 [ORDER-TRACKER] Active order determination:', {
    hasActiveOrder: !!activeOrderData.activeOrder,
    orderSource: activeOrderData.orderSource,
    loading: activeOrderData.loading
  });

  // If no active order, don't show the tracker
  if (!activeOrderData.activeOrder) return null;

  // Safety checks for order data
  if (!activeOrderData.activeOrder.order_number && !activeOrderData.activeOrder.id) {
    console.warn('UnifiedOrderTracker: Invalid order data', activeOrderData.activeOrder);
    return null;
  }

  const currentStatus = activeOrderData.activeOrder.order_status || activeOrderData.activeOrder.status || 'pending';

  let statusInfo;
  try {
    statusInfo = getOrderStatusInfo(currentStatus);
  } catch (err) {
    console.error('Error getting status info:', err);
    statusInfo = { label: 'Stato sconosciuto', color: 'bg-gray-100 text-gray-800', icon: '❓' };
  }

  const handleViewAllOrders = () => {
    if (isAuthenticated) {
      window.location.href = '/my-orders';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <Card className="bg-white shadow-xl border-2 border-gray-200 hover:shadow-2xl transition-all duration-300">
        <CardHeader 
          className="pb-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${statusInfo.color.replace('text-', 'bg-').replace('100', '500')} text-white`}>
                <Package className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Ordine #{activeOrderData.activeOrder.order_number || 'N/A'}
                </CardTitle>
                <Badge className={`${statusInfo.color} text-xs`}>
                  {statusInfo.icon} {statusInfo.label}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {activeOrderData.loading && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0 space-y-4">
            {/* Order Details */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Totale:</span>
                <span className="font-semibold">{formatPrice(activeOrderData.activeOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Ordinato alle:</span>
                <span className="text-gray-800">{formatTime(activeOrderData.activeOrder.created_at)}</span>
              </div>
              {activeOrderData.activeOrder.customer_address && activeOrderData.activeOrder.customer_address.trim() && (
                <div className="text-sm">
                  <span className="text-gray-600">Indirizzo:</span>
                  <p className="text-gray-800 text-xs mt-1">{activeOrderData.activeOrder.customer_address}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            {activeOrderData.activeOrder.order_items && Array.isArray(activeOrderData.activeOrder.order_items) && activeOrderData.activeOrder.order_items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Articoli:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {activeOrderData.activeOrder.order_items.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{item.product_name}</span>
                        {item.special_requests && (
                          <p className="text-gray-500 text-xs">Note: {item.special_requests}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{item.quantity}x</span>
                        <p className="text-gray-600">{formatPrice(item.subtotal || (getOrderItemPrice(item) * item.quantity))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Progress */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Stato ordine:</h4>
              <div className="space-y-1">
                {[
                  { status: 'confirmed', label: 'Confermato', icon: CheckCircle },
                  { status: 'preparing', label: 'In preparazione', icon: Clock },
                  { status: 'ready', label: 'Pronto', icon: Package },
                  { status: 'arrived', label: 'Arrivato', icon: MapPin },
                  { status: 'delivered', label: 'Consegnato', icon: Truck },
                ].map(({ status, label, icon: Icon }) => {
                  const isActive = currentStatus === status;
                  const isPassed = ['confirmed', 'preparing', 'ready', 'arrived', 'delivered'].indexOf(currentStatus) >= 
                                   ['confirmed', 'preparing', 'ready', 'arrived', 'delivered'].indexOf(status);
                  
                  return (
                    <div key={status} className={`flex items-center space-x-2 text-xs ${
                      isActive ? 'text-blue-600 font-medium' : 
                      isPassed ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      <Icon className="h-3 w-3" />
                      <span>{label}</span>
                      {isActive && <span className="text-blue-500">← Attuale</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              {isAuthenticated && (
                <Button
                  onClick={handleViewAllOrders}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Tutti gli ordini
                </Button>
              )}
              {!isAuthenticated && (
                <div className="flex items-center space-x-1 text-xs text-gray-500 bg-blue-50 p-2 rounded">
                  <User className="h-3 w-3" />
                  <span>Accedi per vedere tutti i tuoi ordini</span>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default UnifiedOrderTracker;
