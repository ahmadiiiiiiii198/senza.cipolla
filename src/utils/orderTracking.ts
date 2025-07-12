// Utility functions for automatic order tracking

interface OrderTrackingData {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  autoTrack: boolean;
}

// Storage keys
const ORDER_TRACKING_KEY = 'pizzeria_active_order';
const ORDER_HISTORY_KEY = 'pizzeria_order_history';

/**
 * Save order for automatic tracking after successful order creation
 */
// Cookie utility functions
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookieValue = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
};

const getOrCreateClientId = (): string => {
  // Try to get existing client ID from cookie
  let clientId = getCookieValue('pizzeria_client_id');
  if (!clientId) {
    // Create unique client ID
    clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCookie('pizzeria_client_id', clientId, 30); // 30 days
    console.log('🆔 Created new client ID cookie:', clientId);
  }
  return clientId;
};

export const saveOrderForTracking = (orderData: {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
}) => {
  // Get or create client ID
  const clientId = getOrCreateClientId();

  const trackingData: OrderTrackingData = {
    orderId: orderData.id,
    orderNumber: orderData.order_number,
    customerEmail: orderData.customer_email,
    customerName: orderData.customer_name,
    totalAmount: orderData.total_amount,
    createdAt: orderData.created_at,
    autoTrack: true
  };

  try {
    // Save to localStorage for immediate access
    localStorage.setItem(ORDER_TRACKING_KEY, JSON.stringify(trackingData));

    // Save to client-specific cookie (7 days for active orders)
    setCookie(`pizzeria_order_${clientId}`, encodeURIComponent(JSON.stringify(trackingData)), 7);

    // Also save general tracking cookie for fallback
    setCookie(ORDER_TRACKING_KEY, encodeURIComponent(JSON.stringify(trackingData)), 7);

    // Add to order history
    addToOrderHistory(trackingData);

    console.log('✅ Order saved with client-specific cookie tracking:', orderData.order_number, 'Client ID:', clientId);
    return true;
  } catch (error) {
    console.error('❌ Failed to save order for tracking:', error);
    return false;
  }
};

/**
 * Get currently tracked order
 */
export const getTrackedOrder = (): OrderTrackingData | null => {
  try {
    // Get client ID
    const clientId = getOrCreateClientId();

    // First try client-specific cookie
    const clientOrderCookie = getCookieValue(`pizzeria_order_${clientId}`);
    if (clientOrderCookie) {
      const parsed = JSON.parse(decodeURIComponent(clientOrderCookie));
      console.log('📖 Retrieved order from client-specific cookie:', parsed.orderNumber);
      return parsed;
    }

    // Then try localStorage
    const localData = localStorage.getItem(ORDER_TRACKING_KEY);
    if (localData) {
      const parsed = JSON.parse(localData);
      // Save to client-specific cookie for future
      setCookie(`pizzeria_order_${clientId}`, encodeURIComponent(JSON.stringify(parsed)), 7);
      return parsed;
    }

    // Fallback to general tracking cookie
    const cookieData = getCookieValue(ORDER_TRACKING_KEY);
    if (cookieData) {
      const parsed = JSON.parse(decodeURIComponent(cookieData));
      // Restore to localStorage and client cookie
      localStorage.setItem(ORDER_TRACKING_KEY, JSON.stringify(parsed));
      setCookie(`pizzeria_order_${clientId}`, encodeURIComponent(JSON.stringify(parsed)), 7);
      return parsed;
    }
  } catch (error) {
    console.error('Error getting tracked order:', error);
  }

  return null;
};

/**
 * Check if there's an active order being tracked
 */
export const hasActiveOrder = (): boolean => {
  return getTrackedOrder() !== null;
};

/**
 * Clear current order tracking
 */
export const clearOrderTracking = () => {
  try {
    // Get client ID before clearing
    const clientId = getCookieValue('pizzeria_client_id');

    // Clear localStorage
    localStorage.removeItem(ORDER_TRACKING_KEY);

    // Clear general tracking cookie
    document.cookie = `${ORDER_TRACKING_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

    // Clear client-specific order cookie
    if (clientId) {
      document.cookie = `pizzeria_order_${clientId}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    // Clear client ID cookie (optional - uncomment if you want to reset client completely)
    // document.cookie = `pizzeria_client_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

    console.log('✅ Order tracking cleared (including client-specific cookies)');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear order tracking:', error);
    return false;
  }
};

/**
 * Add order to history for future reference
 */
const addToOrderHistory = (orderData: OrderTrackingData) => {
  try {
    const historyJson = localStorage.getItem(ORDER_HISTORY_KEY);
    const history: OrderTrackingData[] = historyJson ? JSON.parse(historyJson) : [];
    
    // Add new order to beginning of array
    history.unshift(orderData);
    
    // Keep only last 10 orders
    const trimmedHistory = history.slice(0, 10);
    
    localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error adding to order history:', error);
  }
};

/**
 * Get order history
 */
export const getOrderHistory = (): OrderTrackingData[] => {
  try {
    const historyJson = localStorage.getItem(ORDER_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error getting order history:', error);
    return [];
  }
};

/**
 * Helper function to get cookie value
 */
const getCookieValue = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue || null;
  }
  return null;
};

/**
 * Set order as delivered/completed to stop auto-tracking
 */
export const markOrderCompleted = (orderId: string) => {
  const trackedOrder = getTrackedOrder();
  if (trackedOrder && trackedOrder.orderId === orderId) {
    // Move to history and clear active tracking
    clearOrderTracking();
    console.log('✅ Order marked as completed and moved to history');
  }
};

/**
 * Check if order should auto-track based on status
 */
export const shouldAutoTrack = (status: string): boolean => {
  const trackingStatuses = ['pending', 'confirmed', 'preparing', 'ready'];
  return trackingStatuses.includes(status);
};

/**
 * Update tracked order data (for real-time updates)
 */
export const updateTrackedOrder = (updates: Partial<OrderTrackingData>) => {
  const current = getTrackedOrder();
  if (current) {
    const updated = { ...current, ...updates };
    localStorage.setItem(ORDER_TRACKING_KEY, JSON.stringify(updated));
    
    // Update cookie as well
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    document.cookie = `${ORDER_TRACKING_KEY}=${encodeURIComponent(JSON.stringify(updated))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }
};

/**
 * Get user's IP address for fallback tracking (if needed)
 */
export const getUserIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get user IP:', error);
    return null;
  }
};

/**
 * Create a session-based tracking ID
 */
export const createTrackingSession = (): string => {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('pizzeria_session_id', sessionId);
  return sessionId;
};

/**
 * Get current session ID
 */
export const getTrackingSession = (): string | null => {
  return sessionStorage.getItem('pizzeria_session_id');
};

/**
 * Check if order was created in current session
 */
export const isOrderFromCurrentSession = (orderCreatedAt: string): boolean => {
  const sessionStart = sessionStorage.getItem('pizzeria_session_start');
  if (!sessionStart) {
    // Set session start time if not exists
    sessionStorage.setItem('pizzeria_session_start', new Date().toISOString());
    return false;
  }
  
  const orderTime = new Date(orderCreatedAt).getTime();
  const sessionTime = new Date(sessionStart).getTime();
  
  // Order is from current session if created after session start
  return orderTime >= sessionTime;
};

/**
 * Initialize tracking session
 */
export const initializeTrackingSession = () => {
  if (!sessionStorage.getItem('pizzeria_session_start')) {
    sessionStorage.setItem('pizzeria_session_start', new Date().toISOString());
  }
  
  if (!sessionStorage.getItem('pizzeria_session_id')) {
    createTrackingSession();
  }
};
