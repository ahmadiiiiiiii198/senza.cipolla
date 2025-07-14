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
export const saveClientOrder = async (orderData: {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
}): Promise<boolean> => {
  try {
    const clientIdentity = await getOrCreateClientIdentity();
    
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
export const getClientOrder = async (): Promise<ClientOrderData | null> => {
  try {
    const clientIdentity = await getOrCreateClientIdentity();
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

// Search for client-specific order in database with enhanced fallback mechanisms
export const searchClientOrderInDatabase = async (): Promise<OrderSearchResult> => {
  try {
    const clientIdentity = await getOrCreateClientIdentity();
    console.log('🔍 Searching for orders with client ID:', clientIdentity.clientId.slice(-12));

    // STEP 1: Try to get stored order data (most reliable)
    const storedOrder = await getClientOrder();
    if (storedOrder && storedOrder.orderNumber) {
      console.log('📖 Found stored order:', storedOrder.orderNumber);
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
      } else {
        console.log('⚠️ Stored order not found in database:', error?.message);
      }
    }

    // STEP 2: Search database for orders with matching client ID in metadata
    console.log('🔍 DATABASE SEARCH: Looking for orders with client ID in metadata...');
    const { data: clientOrders, error: clientError } = await supabase
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
        metadata,
        order_items (
          id,
          product_name,
          quantity,
          product_price,
          subtotal
        )
      `)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .in('status', ['confirmed', 'preparing', 'ready', 'arrived', 'delivered'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (!clientError && clientOrders && clientOrders.length > 0) {
      console.log(`📋 Found ${clientOrders.length} recent orders, checking for client ID matches...`);

      // Look for orders with matching client ID in metadata
      const matchingOrder = clientOrders.find(order => {
        if (order.metadata && typeof order.metadata === 'object') {
          const metadata = order.metadata as any;
          return metadata.clientId === clientIdentity.clientId;
        }
        return false;
      });

      if (matchingOrder) {
        console.log('✅ Found order with matching client ID:', matchingOrder.order_number);

        // Save this order for future quick access
        await saveClientOrder({
          id: matchingOrder.id,
          order_number: matchingOrder.order_number,
          customer_email: matchingOrder.customer_email,
          customer_name: matchingOrder.customer_name,
          total_amount: matchingOrder.total_amount,
          created_at: matchingOrder.created_at
        });

        return {
          order: matchingOrder,
          source: 'database',
          clientId: clientIdentity.clientId
        };
      }
    }

    // STEP 3: Search recent orders from last 24 hours (fallback for new orders)
    console.log('🔍 FALLBACK: Searching recent orders from last 24 hours...');
    const { data: recentOrders, error: recentError } = await supabase
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
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .in('status', ['confirmed', 'preparing', 'ready', 'arrived', 'delivered'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (!recentError && recentOrders && recentOrders.length > 0) {
      console.log(`📋 Found ${recentOrders.length} recent orders, checking for matches...`);

      // Try to find an order that matches stored client data
      const recentStoredOrders = getAllStoredClientOrders();
      for (const storedOrderData of recentStoredOrders) {
        if (storedOrderData.clientId === clientIdentity.clientId) {
          const matchingOrder = recentOrders.find(order => order.order_number === storedOrderData.orderNumber);
          if (matchingOrder) {
            console.log('✅ Found client order via stored data match:', matchingOrder.order_number);
            return {
              order: matchingOrder,
              source: 'database',
              clientId: clientIdentity.clientId
            };
          }
        }
      }

      // STEP 4: Smart matching - try to find the most recent order that could belong to this client
      // This helps when orders were created but client tracking failed
      console.log('🤖 SMART MATCHING: Analyzing recent orders for potential matches...');

      // Get the most recent order (likely the user's if they just created one)
      const mostRecentOrder = recentOrders[0];
      console.log('🎯 Most recent order found:', mostRecentOrder.order_number, 'from', mostRecentOrder.customer_name);

      // Auto-associate this order with the current client if no other client has claimed it
      const isOrderAlreadyClaimed = recentStoredOrders.some(stored => stored.orderNumber === mostRecentOrder.order_number);

      if (!isOrderAlreadyClaimed) {
        console.log('💡 Auto-associating recent order with current client:', mostRecentOrder.order_number);

        // Save this order for the current client
        const saved = await saveClientOrder({
          id: mostRecentOrder.id,
          order_number: mostRecentOrder.order_number,
          customer_email: mostRecentOrder.customer_email,
          customer_name: mostRecentOrder.customer_name,
          total_amount: mostRecentOrder.total_amount,
          created_at: mostRecentOrder.created_at
        });

        if (saved) {
          console.log('✅ Successfully associated order with client');
          return {
            order: mostRecentOrder,
            source: 'database',
            clientId: clientIdentity.clientId
          };
        }
      } else {
        console.log('⚠️ Most recent order already claimed by another client');
      }
    } else {
      console.log('❌ No recent orders found in database');
    }
    
    return {
      order: null,
      source: 'none',
      clientId: clientIdentity.clientId
    };
    
  } catch (error) {
    console.error('❌ Error searching client order in database:', error);
    const clientIdentity = await getOrCreateClientIdentity();
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
export const clearClientOrder = async (): Promise<boolean> => {
  try {
    const clientIdentity = await getOrCreateClientIdentity();
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
