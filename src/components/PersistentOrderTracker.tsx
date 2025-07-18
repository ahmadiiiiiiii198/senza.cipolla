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
  Loader2,
  MapPin,
  ChefHat,
  DoorOpen,
  Home
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

// Ultra-Modern Beautiful Pizza Delivery Motorcycle Animation Component
const ModernMotorcycleDelivery: React.FC<{
  className?: string;
  isAnimated?: boolean;
  status?: string;
}> = ({ className = "h-16 w-16", isAnimated = true, status = "preparing" }) => {
  const getMotorcycleSpeed = () => {
    switch (status) {
      case 'preparing': return '3s';
      case 'ready': return '2s';
      case 'arrived': return '1.5s';
      case 'delivered': return '4s';
      default: return '2.5s';
    }
  };

  return (
    <div className={`${className} relative overflow-hidden`}>
      <style jsx>{`
        @keyframes motorcycle-ride {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(1.5deg); }
          50% { transform: translateY(-1px) rotate(0deg); }
          75% { transform: translateY(-2px) rotate(-1deg); }
        }

        @keyframes wheel-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes exhaust-puff {
          0% { opacity: 0.8; transform: scale(1) translateX(0px); }
          50% { opacity: 0.4; transform: scale(1.5) translateX(-8px); }
          100% { opacity: 0; transform: scale(2) translateX(-15px); }
        }

        @keyframes pizza-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6)); }
          50% { filter: drop-shadow(0 0 20px rgba(251, 191, 36, 1)); }
        }

        @keyframes headlight-beam {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes speed-lines {
          0% { transform: translateX(0px); opacity: 0.8; }
          100% { transform: translateX(-25px); opacity: 0; }
        }

        .motorcycle-body {
          animation: ${isAnimated ? `motorcycle-ride ${getMotorcycleSpeed()} ease-in-out infinite` : 'none'};
        }

        .wheel-rotation {
          animation: ${isAnimated ? `wheel-spin 0.4s linear infinite` : 'none'};
          transform-origin: center;
        }

        .exhaust-smoke {
          animation: ${isAnimated ? 'exhaust-puff 2.5s ease-out infinite' : 'none'};
        }

        .pizza-box {
          animation: ${isAnimated ? 'pizza-glow 3s ease-in-out infinite' : 'none'};
        }

        .headlight {
          animation: ${isAnimated ? 'headlight-beam 2s ease-in-out infinite' : 'none'};
        }

        .speed-lines {
          animation: ${isAnimated ? 'speed-lines 1.5s linear infinite' : 'none'};
        }
      `}</style>

      <svg
        viewBox="0 0 140 90"
        className="w-full h-full drop-shadow-2xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Enhanced Gradients and Filters */}
        <defs>
          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="50%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>

          <linearGradient id="motorcycleBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="30%" stopColor="#ef4444" />
            <stop offset="70%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          <linearGradient id="motorcycleChromeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e0" />
          </linearGradient>

          <linearGradient id="pizzaBoxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>

          <radialGradient id="headlightGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Enhanced Animated Road */}
        <rect x="0" y="70" width="140" height="15" fill="url(#roadGradient)" rx="3" filter="url(#shadow)" />

        {/* Road markings with enhanced animation */}
        <g className="speed-lines">
          <rect x="15" y="75" width="15" height="3" fill="#fbbf24" opacity="0.9" rx="1.5" />
          <rect x="40" y="75" width="15" height="3" fill="#fbbf24" opacity="0.7" rx="1.5" />
          <rect x="65" y="75" width="15" height="3" fill="#fbbf24" opacity="0.9" rx="1.5" />
          <rect x="90" y="75" width="15" height="3" fill="#fbbf24" opacity="0.7" rx="1.5" />
          <rect x="115" y="75" width="15" height="3" fill="#fbbf24" opacity="0.9" rx="1.5" />
        </g>

        {/* Beautiful Enhanced Motorcycle */}
        <g className="motorcycle-body" filter="url(#shadow)">
          {/* Main motorcycle frame - sleek sport bike design */}
          <path
            d="M45 55 Q60 45 85 55 Q85 60 75 65 Q60 65 45 60 Z"
            fill="url(#motorcycleBodyGradient)"
            filter="url(#glow)"
          />

          {/* Fuel tank */}
          <ellipse cx="65" cy="50" rx="12" ry="6" fill="url(#motorcycleBodyGradient)" />
          <ellipse cx="65" cy="48" rx="8" ry="3" fill="url(#motorcycleChromeGradient)" opacity="0.8" />

          {/* Engine block */}
          <rect x="58" y="55" width="14" height="8" fill="url(#motorcycleChromeGradient)" rx="2" />
          <rect x="60" y="57" width="10" height="4" fill="#374151" rx="1" />

          {/* Front wheel - enhanced with detailed spokes */}
          <g className="wheel-rotation">
            <circle cx="45" cy="68" r="8" fill="url(#wheelGradient)" stroke="#111827" strokeWidth="2" />
            <circle cx="45" cy="68" r="6" fill="#4b5563" />
            <circle cx="45" cy="68" r="4" fill="#6b7280" />
            {/* Spokes */}
            <line x1="37" y1="68" x2="53" y2="68" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="45" y1="60" x2="45" y2="76" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="39.3" y1="61.9" x2="50.7" y2="74.1" stroke="#e5e7eb" strokeWidth="0.8" />
            <line x1="50.7" y1="61.9" x2="39.3" y2="74.1" stroke="#e5e7eb" strokeWidth="0.8" />
            <circle cx="45" cy="68" r="2" fill="#f3f4f6" />
          </g>

          {/* Rear wheel - enhanced with detailed spokes */}
          <g className="wheel-rotation">
            <circle cx="85" cy="68" r="8" fill="url(#wheelGradient)" stroke="#111827" strokeWidth="2" />
            <circle cx="85" cy="68" r="6" fill="#4b5563" />
            <circle cx="85" cy="68" r="4" fill="#6b7280" />
            {/* Spokes */}
            <line x1="77" y1="68" x2="93" y2="68" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="85" y1="60" x2="85" y2="76" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="79.3" y1="61.9" x2="90.7" y2="74.1" stroke="#e5e7eb" strokeWidth="0.8" />
            <line x1="90.7" y1="61.9" x2="79.3" y2="74.1" stroke="#e5e7eb" strokeWidth="0.8" />
            <circle cx="85" cy="68" r="2" fill="#f3f4f6" />
          </g>

          {/* Front suspension and forks */}
          <line x1="45" y1="55" x2="45" y2="68" stroke="url(#motorcycleChromeGradient)" strokeWidth="3" />
          <line x1="43" y1="55" x2="43" y2="68" stroke="#6b7280" strokeWidth="1" />
          <line x1="47" y1="55" x2="47" y2="68" stroke="#6b7280" strokeWidth="1" />

          {/* Handlebars - sport bike style */}
          <path d="M40 45 Q45 42 50 45" stroke="url(#motorcycleChromeGradient)" strokeWidth="3" fill="none" />
          <circle cx="38" cy="46" r="1.5" fill="#374151" />
          <circle cx="52" cy="46" r="1.5" fill="#374151" />

          {/* Rider with detailed helmet and gear */}
          <ellipse cx="65" cy="35" rx="6" ry="7" fill="#1e40af" /> {/* Body */}
          <circle cx="65" cy="28" r="5" fill="#fbbf24" /> {/* Helmet */}
          <rect x="62" y="25" width="6" height="4" fill="#1f2937" rx="2" /> {/* Visor */}
          <ellipse cx="65" cy="26" rx="2" ry="1" fill="#ef4444" opacity="0.8" /> {/* Helmet stripe */}

          {/* Premium Pizza delivery box with enhanced glow */}
          <rect
            x="75"
            y="45"
            width="15"
            height="10"
            fill="url(#pizzaBoxGradient)"
            rx="3"
            stroke="#d97706"
            strokeWidth="1.5"
            className="pizza-box"
            filter="url(#glow)"
          />
          <text x="82.5" y="51" fontSize="5" fill="white" textAnchor="middle">🍕</text>
          <text x="82.5" y="56" fontSize="2.5" fill="white" textAnchor="middle">REGINA</text>

          {/* Delivery company flag */}
          <rect x="90" y="42" width="8" height="5" fill="#ef4444" rx="1" />
          <line x1="90" y1="42" x2="90" y2="55" stroke="#374151" strokeWidth="1.5" />
          <text x="94" y="45.5" fontSize="2.5" fill="white" textAnchor="middle">🏁</text>

          {/* Headlight with beam effect */}
          <circle cx="35" cy="50" r="4" fill="url(#headlightGradient)" className="headlight" filter="url(#glow)" />
          <circle cx="35" cy="50" r="2" fill="#fef3c7" />

          {/* Exhaust pipe */}
          <path d="M85 60 Q95 62 100 65" stroke="#6b7280" strokeWidth="3" fill="none" />
          <ellipse cx="100" cy="65" rx="2" ry="1" fill="#374151" />
        </g>

        {/* Enhanced speed lines for dynamic movement */}
        <g className="speed-lines" opacity="0.8">
          <line x1="25" y1="45" x2="15" y2="45" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="28" y1="50" x2="18" y2="50" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="23" y1="55" x2="13" y2="55" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="30" y1="60" x2="20" y2="60" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Beautiful exhaust smoke with realistic effects */}
        <g className="exhaust-smoke">
          <ellipse cx="102" cy="65" rx="2" ry="1.5" fill="#9ca3af" opacity="0.7" />
          <ellipse cx="105" cy="63" rx="2.5" ry="2" fill="#9ca3af" opacity="0.5" />
          <ellipse cx="108" cy="61" rx="3" ry="2.5" fill="#d1d5db" opacity="0.3" />
        </g>

        {/* Multiple exhaust puffs with staggered animation */}
        {isAnimated && (
          <>
            <g className="exhaust-smoke" style={{ animationDelay: '0.8s' }}>
              <ellipse cx="104" cy="66" rx="2.2" ry="1.8" fill="#d1d5db" opacity="0.6" />
              <ellipse cx="107" cy="64" rx="2.8" ry="2.2" fill="#e5e7eb" opacity="0.4" />
            </g>
            <g className="exhaust-smoke" style={{ animationDelay: '1.6s' }}>
              <ellipse cx="103" cy="67" rx="1.8" ry="1.4" fill="#e5e7eb" opacity="0.5" />
              <ellipse cx="106" cy="65" rx="2.4" ry="1.9" fill="#f3f4f6" opacity="0.3" />
            </g>
            <g className="exhaust-smoke" style={{ animationDelay: '2.4s' }}>
              <ellipse cx="105" cy="68" rx="2" ry="1.6" fill="#f3f4f6" opacity="0.4" />
            </g>
          </>
        )}

        {/* Headlight beam effect */}
        {isAnimated && (
          <path
            d="M35 50 L10 45 L10 55 Z"
            fill="url(#headlightGradient)"
            opacity="0.3"
            className="headlight"
          />
        )}

        {/* Ground shadow */}
        <ellipse cx="65" cy="85" rx="35" ry="3" fill="#000000" opacity="0.2" />

        {/* Tire tracks */}
        <g opacity="0.3">
          <rect x="37" y="76" width="16" height="1" fill="#374151" rx="0.5" />
          <rect x="77" y="76" width="16" height="1" fill="#374151" rx="0.5" />
        </g>
      </svg>
    </div>
  );
};

// Modern Status Progress Component
const ModernStatusProgress: React.FC<{
  currentStatus: string;
  orderTime: string;
}> = ({ currentStatus, orderTime }) => {
  const statusSteps = [
    {
      key: 'confirmed',
      label: 'Confermato',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Il tuo ordine è stato confermato'
    },
    {
      key: 'preparing',
      label: 'In Preparazione',
      icon: ChefHat,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'I nostri chef stanno preparando la tua pizza'
    },
    {
      key: 'ready',
      label: 'Pronto',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'La tua pizza è pronta per la consegna'
    },
    {
      key: 'arrived',
      label: 'Arrivato',
      icon: DoorOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Il rider è arrivato alla tua porta'
    },
    {
      key: 'delivered',
      label: 'Consegnato',
      icon: Home,
      color: 'text-green-700',
      bgColor: 'bg-green-200',
      description: 'Ordine consegnato con successo!'
    }
  ];

  const getCurrentStepIndex = () => {
    return statusSteps.findIndex(step => step.key === currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const IconComponent = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 transform
                    ${isCompleted
                      ? `${step.bgColor} ${step.color} scale-110 shadow-lg`
                      : 'bg-gray-200 text-gray-400 scale-100'
                    }
                    ${isCurrent ? 'animate-pulse ring-4 ring-opacity-50 ring-current' : ''}
                  `}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${isCompleted ? step.color : 'text-gray-400'}`}>
                    {step.label}
                  </div>
                  {isCurrent && (
                    <div className="text-xs text-gray-600 mt-1 max-w-24 leading-tight">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 -z-10">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-1000 ease-out"
            style={{
              width: `${currentStepIndex >= 0 ? (currentStepIndex / (statusSteps.length - 1)) * 100 : 0}%`
            }}
          />
        </div>
      </div>

      {/* Current Status Card */}
      {currentStepIndex >= 0 && (
        <Card className="border-l-4 border-l-pizza-orange bg-gradient-to-r from-orange-50 to-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ModernMotorcycleDelivery
                className="h-12 w-12"
                isAnimated={true}
                status={currentStatus}
              />
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {statusSteps[currentStepIndex].label}
                </h3>
                <p className="text-gray-600 text-sm">
                  {statusSteps[currentStepIndex].description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ordinato: {new Date(orderTime).toLocaleString('it-IT')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

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

  // Order status configuration - NO PENDING STATES
  const orderStatuses = [
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
      value: 'arrived',
      label: 'Arrivato',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: MapPin,
      description: 'Il tuo ordine è arrivato alla porta'
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
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'arrived', 'delivered'];
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

  // Cookie-based client identification and order tracking
  const getCookieValue = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue || null;
    }
    return null;
  };

  const setCookie = (name: string, value: string, days: number = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  };

  const getOrCreateClientId = (): string => {
    // Try to get existing client ID from cookie
    let clientId = getCookieValue('pizzeria_client_id');
    if (!clientId) {
      // Create unique client ID
      clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCookie('pizzeria_client_id', clientId, 30); // 30 days
      console.log('🆔 Created new client ID cookie:', clientId);
    } else {
      console.log('🆔 Found existing client ID cookie:', clientId);
    }
    return clientId;
  };

  // Cookie-based order detection system
  const cookieBasedOrderDetection = async () => {
    console.log('🍪 Starting cookie-based order detection...');

    // Get client ID from cookie
    const clientId = getOrCreateClientId();

    // Method 1: Check for active order cookie for this client
    const activeOrderCookie = getCookieValue(`pizzeria_order_${clientId}`);
    if (activeOrderCookie) {
      try {
        const orderData = JSON.parse(decodeURIComponent(activeOrderCookie));
        console.log('✅ Found active order cookie for client:', orderData.orderNumber);
        return orderData;
      } catch (error) {
        console.error('❌ Error parsing order cookie:', error);
      }
    }

    // Method 2: Check existing tracking data (fallback)
    const trackedOrder = getTrackedOrder();
    if (trackedOrder) {
      console.log('✅ Found tracked order in localStorage:', trackedOrder.orderNumber);
      // Save to client-specific cookie for future
      setCookie(`pizzeria_order_${clientId}`, encodeURIComponent(JSON.stringify(trackedOrder)), 7);
      return trackedOrder;
    }

    console.log('❌ No orders found for client ID:', clientId);
    return null;
  };

  // Save order to client-specific cookie
  const saveOrderToCookie = (orderData: any) => {
    const clientId = getOrCreateClientId();
    const trackingData = {
      orderId: orderData.id,
      orderNumber: orderData.order_number,
      customerName: orderData.customer_name,
      customerEmail: orderData.customer_email,
      totalAmount: orderData.total_amount,
      createdAt: orderData.created_at,
      clientId: clientId
    };

    // Save to client-specific cookie (7 days for active orders)
    setCookie(`pizzeria_order_${clientId}`, encodeURIComponent(JSON.stringify(trackingData)), 7);
    console.log('🍪 Order saved to client-specific cookie:', orderData.order_number, 'for client:', clientId);

    return trackingData;
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

      const detectedOrder = await cookieBasedOrderDetection();

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

    // Generate unique channel name with timestamp to prevent reuse
    const timestamp = Date.now();
    const channelName = `homepage-order-${order.id}-${timestamp}`;
    const channel = supabase
      .channel(channelName)
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
      console.log('📋 [PERSISTENT-ORDER-TRACKER] Cleaning up subscription for:', channelName);
      // Unsubscribe first, then remove channel
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [order, autoRefresh]); // REMOVED toast dependency to prevent multiple subscriptions

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
            /* Modern Order Status Display */
            <div className="space-y-8">
              {/* Modern Order Header */}
              <Card className="shadow-xl border-0 bg-gradient-to-r from-white to-orange-50 overflow-hidden">
                <CardHeader className="pb-4 bg-gradient-to-r from-pizza-orange to-red-500 text-white">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-full">
                        <Pizza className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold">
                          Ordine #{order.order_number}
                        </CardTitle>
                        <p className="text-white/90 mt-1">
                          Ordinato il {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                          {formatPrice(order.total_amount)}
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30 mt-1">
                          {currentStatusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAutoRefresh(!autoRefresh)}
                          className={`border-white/30 text-white hover:bg-white/20 ${autoRefresh ? 'bg-white/20' : ''}`}
                        >
                          <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsExpanded(!isExpanded)}
                          className="border-white/30 text-white hover:bg-white/20"
                        >
                          {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearStoredOrderInfo}
                          className="border-red-300 text-red-100 hover:bg-red-500/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Modern Status Progress */}
                  <ModernStatusProgress
                    currentStatus={currentStatus}
                    orderTime={order.created_at}
                  />

                  {/* Modern Pizza Delivery Tracking */}
                  <Card className="mt-6 bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-xl overflow-hidden">
                    <CardHeader className="text-center pb-4">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="bg-gradient-to-r from-pizza-orange to-red-500 p-3 rounded-full shadow-lg">
                          <Truck className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Tracciamento Live</h3>
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                      </div>
                      <p className="text-gray-600">Segui il tuo rider in tempo reale</p>
                    </CardHeader>

                    <CardContent className="p-6">
                      {/* Animated Motorcycle Display */}
                      <div className="flex justify-center mb-6">
                        <ModernMotorcycleDelivery
                          className="h-24 w-32"
                          isAnimated={true}
                          status={currentStatus}
                        />
                      </div>

                      {/* Delivery Status Info */}
                      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-green-400 to-blue-500 p-2 rounded-full">
                              <MapPin className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">Posizione Rider</h4>
                              <p className="text-sm text-gray-600">
                                {currentStatus === 'preparing' && 'In cucina - Preparazione in corso'}
                                {currentStatus === 'ready' && 'Pronto per il ritiro'}
                                {currentStatus === 'arrived' && 'Arrivato alla tua porta'}
                                {currentStatus === 'delivered' && 'Consegnato con successo!'}
                                {!['preparing', 'ready', 'arrived', 'delivered'].includes(currentStatus) && 'In attesa di aggiornamenti'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-700">Tempo stimato</div>
                            <div className="text-lg font-bold text-pizza-orange">
                              {currentStatus === 'preparing' && '15-20 min'}
                              {currentStatus === 'ready' && '5-10 min'}
                              {currentStatus === 'arrived' && '2-3 min'}
                              {currentStatus === 'delivered' && 'Completato'}
                              {!['preparing', 'ready', 'arrived', 'delivered'].includes(currentStatus) && '--'}
                            </div>
                          </div>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
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
            /* Modern Search Form */
            <Card className="shadow-2xl max-w-2xl mx-auto border-0 bg-gradient-to-br from-white to-orange-50 overflow-hidden">
              <CardHeader className="text-center pb-6 bg-gradient-to-r from-pizza-orange to-red-500 text-white">
                <div className="flex justify-center mb-4">
                  <div className="bg-white/20 p-4 rounded-full">
                    <Search className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">
                  Cerca il tuo Ordine
                </CardTitle>
                <p className="text-white/90 mt-2">
                  Inserisci i tuoi dati per seguire lo stato del tuo ordine
                </p>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {/* Modern Form Inputs */}
                <div className="space-y-6">
                  <div className="relative">
                    <label className="block text-sm font-semibold mb-3 text-gray-700">
                      🎫 Numero Ordine
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="es. ORD-996366156"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        className="w-full h-12 pl-12 text-lg border-2 border-gray-200 focus:border-pizza-orange rounded-xl shadow-sm transition-all duration-200"
                      />
                      <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-semibold mb-3 text-gray-700">
                      📧 Email di Conferma
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="la-tua-email@esempio.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full h-12 pl-12 text-lg border-2 border-gray-200 focus:border-pizza-orange rounded-xl shadow-sm transition-all duration-200"
                      />
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg text-red-700 animate-pulse">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                <Button
                  onClick={() => searchOrder()}
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-pizza-orange to-red-500 hover:from-red-500 hover:to-pizza-orange text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Ricerca in corso...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-3" />
                      Traccia il tuo Ordine
                    </>
                  )}
                </Button>

                {/* Info Card */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-2 rounded-full">
                      <Pizza className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        I tuoi dati vengono salvati in sicurezza
                      </p>
                      <p className="text-xs text-gray-500">
                        Non dovrai reinserirli la prossima volta
                      </p>
                    </div>
                  </div>
                </div>

                {/* Temporary Debug Section */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 text-blue-800">Debug Info:</h4>
                  <div className="text-xs space-y-1 text-blue-700">
                    <p>localStorage: {localStorage.getItem('pizzeria_active_order') ? '✅ Has data' : '❌ Empty'}</p>
                    <p>Client ID: {getCookieValue('pizzeria_client_id') || '❌ None'}</p>
                    <p>Order Cookie: {getCookieValue(`pizzeria_order_${getOrCreateClientId()}`) ? '✅ Has order' : '❌ No order'}</p>
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

                          // Save using both methods
                          const result = saveOrderForTracking(testOrder);
                          const cookieResult = saveOrderToCookie(testOrder);

                          console.log('🧪 Save result:', result);
                          console.log('🍪 Cookie save result:', cookieResult);
                          console.log('🧪 localStorage after save:', localStorage.getItem('pizzeria_active_order'));
                          console.log('🍪 Client cookies:', document.cookie);

                          // Immediately trigger auto-load to test
                          setTimeout(() => {
                            console.log('🔄 Auto-triggering reload after test order...');
                            window.location.reload();
                          }, 500);

                          alert('Test order created with cookie! Page will refresh to test auto-load.');
                        }}
                        className="text-xs"
                      >
                        Test & Reload
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Clear localStorage
                          localStorage.removeItem('pizzeria_active_order');
                          clearOrderTracking();

                          // Clear client-specific cookies
                          const clientId = getOrCreateClientId();
                          document.cookie = `pizzeria_order_${clientId}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                          document.cookie = `pizzeria_client_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

                          setOrder(null);
                          console.log('🗑️ All tracking data and cookies cleared');
                          alert('All tracking data and cookies cleared!');
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
