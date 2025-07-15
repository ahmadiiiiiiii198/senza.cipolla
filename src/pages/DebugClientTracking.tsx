import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getOrCreateClientIdentity, regenerateClientIdentity } from '@/utils/clientIdentification';
import { searchClientOrderInDatabase, getClientOrder } from '@/utils/clientSpecificOrderTracking';
import { supabase } from '@/integrations/supabase/client';

const DebugClientTracking: React.FC = () => {
  const [clientIdentity, setClientIdentity] = useState<any>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [storedOrder, setStoredOrder] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const debugClientSystem = async () => {
    setLoading(true);
    setLogs([]);

    try {
      addLog('🔍 Starting client tracking debug...');

      // Step 1: Get client identity
      addLog('📱 Getting client identity...');
      const identity = await getOrCreateClientIdentity();
      setClientIdentity(identity);
      addLog(`🆔 Client ID: ${identity.clientId}`);
      addLog(`🔧 Device Fingerprint: ${identity.deviceFingerprint}`);
      addLog(`📅 Session ID: ${identity.sessionId}`);
      addLog(`📅 Created At: ${identity.createdAt}`);
      
      // Step 2: Check stored order
      addLog('💾 Checking stored order...');
      const stored = await getClientOrder();
      setStoredOrder(stored);
      addLog(`💾 Stored order: ${stored ? stored.orderNumber : 'None'}`);
      
      // Step 3: Search database
      addLog('🔍 Searching database for client orders...');
      const search = await searchClientOrderInDatabase();
      setSearchResult(search);
      addLog(`🔍 Search result: ${search.order ? search.order.order_number : 'None'} (Source: ${search.source})`);
      
      // Step 4: Get all recent orders with client IDs
      addLog('📋 Getting all recent orders with client IDs...');
      const { data: orders, error } = await supabase
        .from('orders')
        .select('order_number, customer_name, metadata, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!error && orders) {
        setAllOrders(orders);
        addLog(`📋 Found ${orders.length} recent orders`);
        
        orders.forEach(order => {
          const clientId = order.metadata?.clientId || 'No client ID';
          const isMatch = clientId === identity.clientId;
          addLog(`📦 ${order.order_number}: ${clientId.slice(-12)} ${isMatch ? '✅ MATCH' : '❌'}`);
        });
      }
      
    } catch (error) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const regenerateIdentity = async () => {
    setLoading(true);
    try {
      addLog('🔄 Regenerating client identity...');
      const newIdentity = await regenerateClientIdentity();
      setClientIdentity(newIdentity);
      addLog(`✅ New Client ID: ${newIdentity.clientId}`);
      // Re-run the full debug after regeneration
      setTimeout(() => debugClientSystem(), 1000);
    } catch (error) {
      addLog(`❌ Error regenerating identity: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    debugClientSystem();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Client Tracking Debug System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={debugClientSystem} disabled={loading}>
              {loading ? 'Debugging...' : 'Run Debug Test'}
            </Button>
            <Button onClick={regenerateIdentity} disabled={loading} variant="outline">
              Regenerate Identity
            </Button>
          </div>
          
          {clientIdentity && (
            <div className="space-y-2">
              <h3 className="font-semibold">Client Identity:</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <p><strong>Client ID:</strong> {clientIdentity.clientId}</p>
                <p><strong>Device Fingerprint:</strong> {clientIdentity.deviceFingerprint}</p>
                <p><strong>Session ID:</strong> {clientIdentity.sessionId}</p>
                <p><strong>Created:</strong> {clientIdentity.createdAt}</p>
              </div>
            </div>
          )}
          
          {searchResult && (
            <div className="space-y-2">
              <h3 className="font-semibold">Search Result:</h3>
              <div className="bg-blue-100 p-3 rounded text-sm">
                <p><strong>Order Found:</strong> {searchResult.order ? searchResult.order.order_number : 'None'}</p>
                <p><strong>Source:</strong> {searchResult.source}</p>
                <p><strong>Client ID:</strong> {searchResult.clientId}</p>
              </div>
            </div>
          )}
          
          {allOrders.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">All Recent Orders:</h3>
              <div className="space-y-2">
                {allOrders.map(order => {
                  const clientId = order.metadata?.clientId || 'No client ID';
                  const isMatch = clientId === clientIdentity?.clientId;
                  return (
                    <div key={order.order_number} className={`p-2 rounded text-sm ${isMatch ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <div className="flex justify-between items-center">
                        <span><strong>{order.order_number}</strong> - {order.customer_name}</span>
                        <Badge variant={isMatch ? 'default' : 'secondary'}>
                          {isMatch ? '✅ MATCH' : '❌ Different Client'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">Client ID: {clientId}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="font-semibold">Debug Logs:</h3>
            <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-60 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DebugClientTracking;
