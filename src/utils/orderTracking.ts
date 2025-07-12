// Simple order tracking for pizzeria clients

interface OrderTrackingData {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
}

// Simple cookie utilities
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

/**
 * Save order for client-specific tracking
 */
export const saveOrderForTracking = (orderData: {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
}) => {
  const trackingData: OrderTrackingData = {
    orderId: orderData.id,
    orderNumber: orderData.order_number,
    customerEmail: orderData.customer_email,
    customerName: orderData.customer_name,
    totalAmount: orderData.total_amount,
    createdAt: orderData.created_at,
  };

  try {
    // Create unique cookie name based on customer email (hashed for privacy)
    const emailHash = btoa(orderData.customer_email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const cookieName = `pizzeria_order_${emailHash}`;

    // Save to cookie (7 days)
    setCookie(cookieName, JSON.stringify(trackingData), 7);

    console.log('✅ Order saved for tracking:', orderData.order_number, 'Cookie:', cookieName);
    return true;
  } catch (error) {
    console.error('❌ Failed to save order for tracking:', error);
    return false;
  }
};

/**
 * Get tracked order for current client
 */
export const getTrackedOrder = (): OrderTrackingData | null => {
  try {
    // Check all pizzeria order cookies to find one for this client
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name && name.startsWith('pizzeria_order_') && value) {
        try {
          const orderData = JSON.parse(decodeURIComponent(value));
          console.log('📖 Found tracked order:', orderData.orderNumber);
          return orderData;
        } catch (e) {
          // Invalid cookie data, skip
        }
      }
    }
  } catch (error) {
    console.error('Error getting tracked order:', error);
  }

  return null;
};

/**
 * Clear all order tracking data
 */
export const clearOrderTracking = () => {
  try {
    // Clear all pizzeria order cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=');
      if (name && name.startsWith('pizzeria_order_')) {
        deleteCookie(name);
      }
    }

    console.log('✅ All order tracking cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear order tracking:', error);
    return false;
  }
};


