import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pizza, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  XCircle,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw
} from 'lucide-react';
import { usePersistentOrder, getOrderStatusInfo, getOrderProgress } from '@/hooks/use-persistent-order';
import { clearOrderTracking } from '@/utils/orderTracking';

const OrderStatusWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { order, loading, refreshOrder } = usePersistentOrder();

  const handleClearOrder = () => {
    clearOrderTracking();
    window.location.reload(); // Refresh to update all components
  };

  if (!order) return null;

  const currentStatus = order.order_status || order.status || 'pending';
  const statusInfo = getOrderStatusInfo(currentStatus);
  const progress = getOrderProgress(currentStatus);

  const formatPrice = (price: number) => `€${price.toFixed(2)}`;
  
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'confirmed': return CheckCircle;
      case 'preparing': return Package;
      case 'ready': return CheckCircle;
      case 'delivered': return Truck;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const StatusIcon = getStatusIcon(currentStatus);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-xl border-l-4 border-pizza-orange bg-white">
        {/* Compact Header */}
        <div 
          className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pizza-orange/10 rounded-full">
                <Pizza className="h-4 w-4 text-pizza-orange" />
              </div>
              <div>
                <p className="font-semibold text-sm">#{order.order_number}</p>
                <div className="flex items-center gap-2">
                  <StatusIcon className="h-3 w-3 text-gray-600" />
                  <Badge className={`${statusInfo.color} text-xs px-1 py-0.5`}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-pizza-orange">
                {formatPrice(order.total_amount)}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
          
          {/* Mini Progress Bar */}
          {currentStatus !== 'cancelled' && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-pizza-orange to-pizza-red h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <CardContent className="pt-0 pb-3 px-3">
            <div className="border-t pt-3 space-y-3">
              {/* Status Description */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {statusInfo.description}
                </p>
                <p className="text-xs text-gray-500">
                  Aggiornato: {formatTime(order.updated_at)}
                </p>
              </div>

              {/* Quick Status Timeline */}
              <div className="flex justify-between">
                {['pending', 'confirmed', 'preparing', 'ready', 'delivered'].map((status, index) => {
                  const isCompleted = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'].findIndex(s => s === currentStatus) >= index;
                  const isCurrent = status === currentStatus;
                  const StepIcon = getStatusIcon(status);

                  return (
                    <div 
                      key={status}
                      className={`flex flex-col items-center ${
                        isCurrent 
                          ? 'text-pizza-orange' 
                          : isCompleted 
                          ? 'text-green-600' 
                          : 'text-gray-400'
                      }`}
                    >
                      <div className={`p-1 rounded-full ${
                        isCurrent 
                          ? 'bg-pizza-orange text-white' 
                          : isCompleted 
                          ? 'bg-green-100' 
                          : 'bg-gray-100'
                      }`}>
                        <StepIcon className="h-3 w-3" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">Cliente:</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-gray-600">Ordinato:</span>
                  <span>{formatTime(order.created_at)}</span>
                </div>
                {order.order_items && order.order_items.length > 0 && (
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-gray-600">Articoli:</span>
                    <span>{order.order_items.length}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshOrder}
                  disabled={loading}
                  className="flex-1 text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Aggiorna
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearOrder}
                  className="text-red-600 hover:text-red-700 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Rimuovi
                </Button>
              </div>

              {/* Payment Status */}
              <div className="text-center">
                <Badge 
                  className={`text-xs ${
                    order.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  Pagamento: {order.payment_status === 'paid' ? 'Completato' : 'In attesa'}
                </Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default OrderStatusWidget;
