// Client-specific order tracking system for pizzeria

import { supabase } from '@/integrations/supabase/client';
import { getOrCreateClientIdentity } from './clientIdentification';

interface ClientOrderData {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  clientId: string;
  deviceFingerprint: string;
  lastUpdated: string;
}

interface OrderSearchResult {
  order: any | null;
  source: 'database' | 'cookie' | 'localStorage' | 'none';
  clientId: string;
}

// Cookie utilities
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

// Save order for specific client
export const saveClientOrder = (orderData: {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
}): boolean => {
  try {
    const clientIdentity = getOrCreateClientIdentity();
    
    const clientOrderData: ClientOrderData = {
      orderId: orderData.id,
      orderNumber: orderData.order_number,
      customerEmail: orderData.customer_email,
      customerName: orderData.customer_name,
      totalAmount: orderData.total_amount,
      createdAt: orderData.created_at,
      clientId: clientIdentity.clientId,
      deviceFingerprint: clientIdentity.deviceFingerprint,
      lastUpdated: new Date().toISOString()
    };

    // Save to multiple storage methods for redundancy
    const storageKey = `pizzeria_order_${clientIdentity.clientId}`;
    const cookieKey = `pizzeria_order_${clientIdentity.deviceFingerprint.slice(-8)}`;
    
    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(clientOrderData));
    
    // Save to cookie (shorter data for cookie size limits)
    const cookieData = {
      orderNumber: orderData.order_number,
      customerEmail: orderData.customer_email,
      clientId: clientIdentity.clientId
    };
    setCookie(cookieKey, JSON.stringify(cookieData), 7);
    
    console.log('✅ Order saved for client:', clientIdentity.clientId, 'Order:', orderData.order_number);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to save client order:', error);
    return false;
  }
};

// Get order for current client
export const getClientOrder = (): ClientOrderData | null => {
  try {
    const clientIdentity = getOrCreateClientIdentity();
    const storageKey = `pizzeria_order_${clientIdentity.clientId}`;
    
    // Try localStorage first
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const orderData = JSON.parse(stored);
      console.log('📖 Found client order in localStorage:', orderData.orderNumber);
      return orderData;
    }
    
    // Try cookie fallback
    const cookieKey = `pizzeria_order_${clientIdentity.deviceFingerprint.slice(-8)}`;
    const cookieData = getCookie(cookieKey);
    if (cookieData) {
      const parsed = JSON.parse(cookieData);
      console.log('📖 Found client order in cookie:', parsed.orderNumber);
      return {
        orderId: '',
        orderNumber: parsed.orderNumber,
        customerEmail: parsed.customerEmail,
        customerName: '',
        totalAmount: 0,
        createdAt: '',
        clientId: parsed.clientId,
        deviceFingerprint: clientIdentity.deviceFingerprint,
        lastUpdated: new Date().toISOString()
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error getting client order:', error);
    return null;
  }
};

// Search for client-specific order in database
export const searchClientOrderInDatabase = async (): Promise<OrderSearchResult> => {
  try {
    const clientIdentity = getOrCreateClientIdentity();
    
    // First, try to get stored order data
    const storedOrder = getClientOrder();
    if (storedOrder && storedOrder.orderNumber) {
      // Search database for this specific order
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          total_amount,
          status,
          order_status,
          created_at,
          order_items (
            id,
            product_name,
            quantity,
            product_price,
            subtotal
          )
        `)
        .eq('order_number', storedOrder.orderNumber)
        .eq('customer_email', storedOrder.customerEmail)
        .single();

      if (!error && order) {
        console.log('✅ Found client-specific order in database:', order.order_number);
        return {
          order,
          source: 'database',
          clientId: clientIdentity.clientId
        };
      }
    }
    
    // If no stored order or database lookup failed, search recent orders for this client's email
    // This is a fallback for when client data might be lost
    const recentStoredOrders = getAllStoredClientOrders();
    for (const storedOrderData of recentStoredOrders) {
      if (storedOrderData.clientId === clientIdentity.clientId) {
        const { data: order, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            customer_name,
            customer_email,
            customer_phone,
            customer_address,
            total_amount,
            status,
            order_status,
            created_at,
            order_items (
              id,
              product_name,
              quantity,
              product_price,
              subtotal
            )
          `)
          .eq('order_number', storedOrderData.orderNumber)
          .single();

        if (!error && order) {
          console.log('✅ Found client order via fallback search:', order.order_number);
          return {
            order,
            source: 'database',
            clientId: clientIdentity.clientId
          };
        }
      }
    }
    
    return {
      order: null,
      source: 'none',
      clientId: clientIdentity.clientId
    };
    
  } catch (error) {
    console.error('❌ Error searching client order in database:', error);
    const clientIdentity = getOrCreateClientIdentity();
    return {
      order: null,
      source: 'none',
      clientId: clientIdentity.clientId
    };
  }
};

// Get all stored client orders (for debugging/fallback)
const getAllStoredClientOrders = (): ClientOrderData[] => {
  const orders: ClientOrderData[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pizzeria_order_')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const orderData = JSON.parse(data);
            orders.push(orderData);
          } catch (e) {
            // Invalid data, skip
          }
        }
      }
    }
  } catch (error) {
    console.error('Error getting all stored orders:', error);
  }
  
  return orders;
};

// Clear client-specific order data
export const clearClientOrder = (): boolean => {
  try {
    const clientIdentity = getOrCreateClientIdentity();
    const storageKey = `pizzeria_order_${clientIdentity.clientId}`;
    const cookieKey = `pizzeria_order_${clientIdentity.deviceFingerprint.slice(-8)}`;
    
    localStorage.removeItem(storageKey);
    deleteCookie(cookieKey);
    
    console.log('✅ Client order data cleared for:', clientIdentity.clientId);
    return true;
    
  } catch (error) {
    console.error('❌ Failed to clear client order:', error);
    return false;
  }
};

// Clear all order tracking data
export const clearAllOrderTracking = (): boolean => {
  try {
    // Clear all pizzeria order data from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pizzeria_order_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear all pizzeria order cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name] = cookie.trim().split('=');
      if (name && name.startsWith('pizzeria_order_')) {
        deleteCookie(name);
      }
    }
    
    console.log('✅ All order tracking data cleared');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to clear all order tracking:', error);
    return false;
  }
};
