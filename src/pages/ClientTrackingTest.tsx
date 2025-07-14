import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  saveClientOrder, 
  getClientOrder, 
  clearClientOrder, 
  searchClientOrderInDatabase 
} from '@/utils/clientSpecificOrderTracking';
import { 
  getOrCreateClientIdentity, 
  clearClientIdentity 
} from '@/utils/clientIdentification';

const ClientTrackingTest = () => {
  const [clientIdentity, setClientIdentity] = useState<any>(null);
  const [storedOrder, setStoredOrder] = useState<any>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    const identity = await getOrCreateClientIdentity();
    setClientIdentity(identity);

    const order = await getClientOrder();
    setStoredOrder(order);
    
    addLog(`Client ID: ${identity.clientId.slice(-12)}`);
    addLog(`Device Fingerprint: ${identity.deviceFingerprint}`);
    if (order) {
      addLog(`Stored Order: ${order.orderNumber}`);
    } else {
      addLog('No stored order found');
    }
  };

  const simulateClientA = async () => {
    // Simulate saving order for Client A
    const success = await saveClientOrder({
      id: 'ba35ba00-18b3-4f8a-8477-18ca73ce3bda',
      order_number: 'ORD-CLIENT-TEST-001',
      customer_email: 'client-a@test.com',
      customer_name: 'Test Client A',
      total_amount: 15.00,
      created_at: new Date().toISOString()
    });
    
    if (success) {
      addLog('✅ Saved order for Client A');
      await loadClientData();
    } else {
      addLog('❌ Failed to save order for Client A');
    }
  };

  const simulateClientB = async () => {
    // Simulate saving order for Client B
    const success = await saveClientOrder({
      id: 'f1d29cd2-43c9-4ce4-a7e6-bff07f071c13',
      order_number: 'ORD-CLIENT-TEST-002',
      customer_email: 'client-b@test.com',
      customer_name: 'Test Client B',
      total_amount: 22.50,
      created_at: new Date().toISOString()
    });
    
    if (success) {
      addLog('✅ Saved order for Client B');
      await loadClientData();
    } else {
      addLog('❌ Failed to save order for Client B');
    }
  };

  const searchDatabase = async () => {
    addLog('🔍 Searching database for client order...');
    const result = await searchClientOrderInDatabase();
    setSearchResult(result);
    
    if (result.order) {
      addLog(`✅ Found order: ${result.order.order_number} (${result.source})`);
    } else {
      addLog('❌ No order found in database');
    }
  };

  const clearData = async () => {
    await clearClientOrder();
    clearClientIdentity();
    setClientIdentity(null);
    setStoredOrder(null);
    setSearchResult(null);
    addLog('🗑️ All client data cleared');
    setTimeout(loadClientData, 100);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Client-Specific Order Tracking Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Identity */}
        <Card>
          <CardHeader>
            <CardTitle>Client Identity</CardTitle>
          </CardHeader>
          <CardContent>
            {clientIdentity ? (
              <div className="space-y-2 text-sm">
                <p><strong>Client ID:</strong> {clientIdentity.clientId.slice(-20)}</p>
                <p><strong>Fingerprint:</strong> {clientIdentity.deviceFingerprint}</p>
                <p><strong>Session:</strong> {clientIdentity.sessionId.slice(-15)}</p>
                <p><strong>Created:</strong> {new Date(clientIdentity.createdAt).toLocaleTimeString()}</p>
              </div>
            ) : (
              <p>No client identity</p>
            )}
          </CardContent>
        </Card>

        {/* Stored Order */}
        <Card>
          <CardHeader>
            <CardTitle>Stored Order</CardTitle>
          </CardHeader>
          <CardContent>
            {storedOrder ? (
              <div className="space-y-2 text-sm">
                <p><strong>Order:</strong> {storedOrder.orderNumber}</p>
                <p><strong>Customer:</strong> {storedOrder.customerName}</p>
                <p><strong>Email:</strong> {storedOrder.customerEmail}</p>
                <p><strong>Amount:</strong> €{storedOrder.totalAmount}</p>
                <Badge variant="outline">{storedOrder.clientId.slice(-12)}</Badge>
              </div>
            ) : (
              <p>No stored order</p>
            )}
          </CardContent>
        </Card>

        {/* Database Search Result */}
        <Card>
          <CardHeader>
            <CardTitle>Database Search Result</CardTitle>
          </CardHeader>
          <CardContent>
            {searchResult ? (
              searchResult.order ? (
                <div className="space-y-2 text-sm">
                  <p><strong>Order:</strong> {searchResult.order.order_number}</p>
                  <p><strong>Customer:</strong> {searchResult.order.customer_name}</p>
                  <p><strong>Status:</strong> {searchResult.order.status}</p>
                  <p><strong>Amount:</strong> €{searchResult.order.total_amount}</p>
                  <Badge variant="secondary">{searchResult.source}</Badge>
                </div>
              ) : (
                <p>No order found</p>
              )
            ) : (
              <p>No search performed</p>
            )}
          </CardContent>
        </Card>

        {/* Action Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Action Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs font-mono max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-slate-600">{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={simulateClientA} variant="outline">
          Save Client A Order
        </Button>
        <Button onClick={simulateClientB} variant="outline">
          Save Client B Order
        </Button>
        <Button onClick={searchDatabase} variant="default">
          Search Database
        </Button>
        <Button onClick={loadClientData} variant="secondary">
          Refresh Data
        </Button>
        <Button onClick={clearData} variant="destructive">
          Clear All Data
        </Button>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Save Client A Order" to simulate saving an order for this device</li>
            <li>Open this page in a different browser/incognito to simulate a different client</li>
            <li>Click "Save Client B Order" in the other browser</li>
            <li>Notice how each client only sees their own order</li>
            <li>Use "Search Database" to verify the client-specific lookup works</li>
            <li>Use "Clear All Data" to reset and test again</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientTrackingTest;
