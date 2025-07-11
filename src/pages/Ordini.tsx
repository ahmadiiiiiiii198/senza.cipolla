import React, { Suspense } from 'react';
import { Pizza, Loader2 } from 'lucide-react';
import OrdersAdmin from '@/components/admin/OrdersAdmin';
import OrderNotificationSystem from '@/components/OrderNotificationSystem';
import OrdiniHeader from '@/components/OrdiniHeader';

const Ordini = () => {
  const handleBackToAdmin = () => {
    window.location.href = '/admin';
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl shadow-lg">
                <Pizza className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Gestione Ordini
                </h1>
                <p className="text-lg text-gray-600 font-medium">Pizzeria Regina 2000</p>
                <p className="text-sm text-gray-500">Visualizza e gestisci tutti gli ordini ricevuti</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Notification Controls - Integrated into Header */}
              <div id="header-notification-controls" className="flex items-center space-x-2 mr-4">
                {/* This will be populated by OrderNotificationSystem */}
              </div>

              <Button
                onClick={handleBackToAdmin}
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Pannello Admin
              </Button>
              <Button
                onClick={handleBackToHome}
                variant="outline"
                className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Torna al Sito
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <OrdersAdmin />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Pizza className="h-4 w-4 text-red-500" />
              <span>Pizzeria Regina 2000 - Sistema di Gestione Ordini</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>🔄 Aggiornamento automatico attivo</span>
              <span>🔔 Notifiche in tempo reale</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Notification System - Only in Ordini Section */}
      <Suspense fallback={
        <div className="fixed top-4 right-4 z-50">
          <div className="p-3 bg-gray-100 text-gray-600 rounded-full shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </div>
      }>
        <OrderNotificationSystem />
      </Suspense>
    </div>
  );
};

export default Ordini;
