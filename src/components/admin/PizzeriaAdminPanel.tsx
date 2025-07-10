import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Pizza,
  Settings,
  Image,
  Video,
  MessageSquare,
  Bell,
  Users,
  ShoppingCart,
  BarChart3,
  MapPin,
  Palette,
  Globe,
  Menu as MenuIcon,
  Wrench,
  Database,
  Plus,
  Eye,
  Clock,
  CreditCard
} from 'lucide-react';
import OrderNotificationSystem from '../OrderNotificationSystem';

// Import admin components (we'll create these)
import ProductsAdmin from './ProductsAdmin';
import OrdersAdmin from './OrdersAdmin';
import ContentEditor from './ContentEditor';
import HeroContentEditor from './HeroContentEditor';
import LogoEditor from './LogoEditor';
import GalleryManager from './GalleryManager';
import YouTubeManager from './YouTubeManager';
import CommentsManager from './CommentsManager';
import PopupManager from './PopupManager';
import SettingsManager from './SettingsManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import WeOfferManager from './WeOfferManager';
import SystemTest from './SystemTest';
import DatabaseTest from './DatabaseTest';
import SystemConnectionTest from '../SystemConnectionTest';
import YouTubeConnectionTest from '../YouTubeConnectionTest';
import BusinessHoursManager from './BusinessHoursManager';
import ShippingZoneManager from './ShippingZoneManager';
import StripeSettings from './StripeSettings';
import NotificationSettings from './NotificationSettings';
import DatabaseSchemaUpdater from './DatabaseSchemaUpdater';
import ProductsDebugger from '../ProductsDebugger';
import MenuProductsConnectionTest from '../MenuProductsConnectionTest';
import ProductsSchemaFixer from '../ProductsSchemaFixer';
import FrontendConnectionTester from '../FrontendConnectionTester';

const PizzeriaAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Organized admin sections in logical groups
  const adminSections = [
    // === CORE BUSINESS ===
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Panoramica generale e statistiche',
      category: 'core'
    },
    {
      id: 'orders',
      label: 'Ordini',
      icon: ShoppingCart,
      description: 'Gestione ordini e notifiche',
      category: 'core'
    },
    {
      id: 'products',
      label: 'Menu & Prodotti',
      icon: Pizza,
      description: 'Gestione menu, pizze e prodotti',
      category: 'core'
    },

    // === CONTENT MANAGEMENT ===
    {
      id: 'content',
      label: 'Contenuti',
      icon: Globe,
      description: 'Gestione testi e contenuti del sito',
      category: 'content'
    },
    {
      id: 'gallery',
      label: 'Galleria',
      icon: Image,
      description: 'Gestione immagini e galleria',
      category: 'content'
    },
    {
      id: 'youtube',
      label: 'Video YouTube',
      icon: Video,
      description: 'Gestione video e contenuti YouTube',
      category: 'content'
    },

    // === CUSTOMER INTERACTION ===
    {
      id: 'comments',
      label: 'Commenti',
      icon: MessageSquare,
      description: 'Gestione commenti e recensioni',
      category: 'interaction'
    },
    {
      id: 'popups',
      label: 'Popup & Annunci',
      icon: Bell,
      description: 'Gestione popup e annunci speciali',
      category: 'interaction'
    },

    // === SYSTEM SETTINGS ===
    {
      id: 'settings',
      label: 'Impostazioni',
      icon: Settings,
      description: 'Configurazioni generali del sito',
      category: 'system'
    },

    // === TESTING & DEBUGGING ===
    {
      id: 'youtube-test',
      label: 'YouTube Test',
      icon: Video,
      description: 'Test connessione YouTube',
      category: 'testing'
    },
    {
      id: 'menu-products-test',
      label: 'Menu Connection',
      icon: MenuIcon,
      description: 'Test connessione menu e prodotti',
      category: 'testing'
    },
    {
      id: 'database-test',
      label: 'Database Test',
      icon: Database,
      description: 'Test connessione database',
      category: 'testing'
    },
    {
      id: 'system-test',
      label: 'System Test',
      icon: Wrench,
      description: 'Test completo del sistema',
      category: 'testing'
    },
    {
      id: 'frontend-test',
      label: 'Frontend Test',
      icon: Globe,
      description: 'Test connessioni frontend',
      category: 'testing'
    },

    // === ADVANCED TOOLS ===
    {
      id: 'products-debug',
      label: 'Products Debug',
      icon: Pizza,
      description: 'Debug prodotti e database',
      category: 'advanced'
    },
    {
      id: 'schema-updater',
      label: 'Schema Update',
      icon: Wrench,
      description: 'Aggiorna schema database',
      category: 'advanced'
    },
    {
      id: 'schema-fixer',
      label: 'Schema Fix',
      icon: Wrench,
      description: 'Risolvi problemi schema database',
      category: 'advanced'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Order Notification System */}
      <OrderNotificationSystem />

      {/* Modern Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl shadow-lg">
                <Pizza className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Pannello Admin
                </h1>
                <p className="text-lg text-gray-600 font-medium">Pizzeria Regina 2000</p>
                <p className="text-sm text-gray-500">Gestisci tutti gli aspetti del tuo sito web</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {new Date().toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date().toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                A
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Modern Navigation */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Sezioni di Gestione</h2>
              <p className="text-gray-600">Seleziona una sezione per iniziare a gestire il tuo sito</p>
            </div>

            {/* Core Business Section */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                Gestione Principale
              </h3>
              <TabsList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-transparent h-auto">
                {adminSections.filter(s => s.category === 'core').map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex items-center p-4 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg hover:border-red-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-50 data-[state=active]:to-red-100 data-[state=active]:border-red-400 data-[state=active]:shadow-lg transition-all duration-200 h-auto"
                  >
                    <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-lg mr-4">
                      <section.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{section.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{section.description}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Content Management Section */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Gestione Contenuti
              </h3>
              <TabsList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-transparent h-auto">
                {adminSections.filter(s => s.category === 'content').map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex items-center p-4 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-blue-100 data-[state=active]:border-blue-400 data-[state=active]:shadow-lg transition-all duration-200 h-auto"
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-lg mr-4">
                      <section.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{section.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{section.description}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Customer Interaction Section */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Interazione Clienti
              </h3>
              <TabsList className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-transparent h-auto">
                {adminSections.filter(s => s.category === 'interaction').map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex items-center p-4 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg hover:border-green-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-50 data-[state=active]:to-green-100 data-[state=active]:border-green-400 data-[state=active]:shadow-lg transition-all duration-200 h-auto"
                  >
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-lg mr-4">
                      <section.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{section.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{section.description}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* System Settings */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Impostazioni Sistema
              </h3>
              <TabsList className="grid grid-cols-1 gap-4 bg-transparent h-auto">
                {adminSections.filter(s => s.category === 'system').map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex items-center p-4 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg hover:border-purple-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-50 data-[state=active]:to-purple-100 data-[state=active]:border-purple-400 data-[state=active]:shadow-lg transition-all duration-200 h-auto"
                  >
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-lg mr-4">
                      <section.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{section.label}</div>
                      <div className="text-sm text-gray-500 mt-1">{section.description}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Advanced Tools - Collapsible */}
            <details className="group">
              <summary className="cursor-pointer flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Strumenti Avanzati & Test
                  </h3>
                </div>
                <div className="text-xs text-gray-500 group-open:hidden">Clicca per espandere</div>
              </summary>
              <div className="mt-4">
                <TabsList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-transparent h-auto">
                  {adminSections.filter(s => s.category === 'testing' || s.category === 'advanced').map((section) => (
                    <TabsTrigger
                      key={section.id}
                      value={section.id}
                      className="flex items-center p-3 text-left bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg hover:shadow-md hover:border-orange-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-50 data-[state=active]:to-orange-100 data-[state=active]:border-orange-400 data-[state=active]:shadow-md transition-all duration-200 h-auto"
                    >
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 rounded-lg mr-3">
                        <section.icon size={20} className="text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 text-sm">{section.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{section.description}</div>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </details>
          </div>

          {/* Tab Contents */}
          <div className="space-y-6">
            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-blue-800">Ordini Oggi</CardTitle>
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-900">12</div>
                    <p className="text-sm text-blue-600 flex items-center mt-2">
                      <span className="text-green-600 font-medium">+20%</span>
                      <span className="ml-1">da ieri</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-green-800">Fatturato Oggi</CardTitle>
                    <div className="bg-green-500 p-2 rounded-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-900">€245.50</div>
                    <p className="text-sm text-green-600 flex items-center mt-2">
                      <span className="text-green-600 font-medium">+15%</span>
                      <span className="ml-1">da ieri</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-orange-800">Prodotti Attivi</CardTitle>
                    <div className="bg-orange-500 p-2 rounded-lg">
                      <Pizza className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-900">24</div>
                    <p className="text-sm text-orange-600 mt-2">Menu completo</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-purple-800">Nuovi Commenti</CardTitle>
                    <div className="bg-purple-500 p-2 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-900">3</div>
                    <p className="text-sm text-purple-600 mt-2">Da moderare</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Azioni Rapide</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="flex items-center p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
                    <Plus className="h-5 w-5 mr-3" />
                    Nuovo Prodotto
                  </button>
                  <button className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
                    <Eye className="h-5 w-5 mr-3" />
                    Visualizza Ordini
                  </button>
                  <button className="flex items-center p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
                    <Settings className="h-5 w-5 mr-3" />
                    Impostazioni
                  </button>
                </div>
              </div>

              <AnalyticsDashboard />
            </TabsContent>

            {/* Orders Management */}
            <TabsContent value="orders">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center text-blue-800">
                        <div className="bg-blue-500 p-2 rounded-lg mr-3">
                          <ShoppingCart className="h-6 w-6 text-white" />
                        </div>
                        Gestione Ordini
                      </CardTitle>
                      <CardDescription className="text-blue-600">
                        Visualizza e gestisci tutti gli ordini ricevuti
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => window.open('/ordini', '_blank')}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Apri Sezione Ordini Separata
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-yellow-800">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">💡 Suggerimento:</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Per una migliore esperienza di gestione ordini, utilizza la <strong>Sezione Ordini Separata</strong> che si apre in una nuova scheda.
                      Questa pagina dedicata offre più spazio e funzionalità avanzate per la gestione degli ordini.
                    </p>
                  </div>
                  <OrdersAdmin />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Management */}
            <TabsContent value="products">
              <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 rounded-t-2xl border-b border-red-200">
                  <CardTitle className="flex items-center text-red-800">
                    <div className="bg-red-500 p-2 rounded-lg mr-3">
                      <Pizza className="h-6 w-6 text-white" />
                    </div>
                    Gestione Menu e Prodotti
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    Aggiungi, modifica o rimuovi pizze e prodotti dal menu
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <ProductsAdmin />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Management */}
            <TabsContent value="content">
              <div className="space-y-8">
                {/* Logo Management */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-2xl border-b border-purple-200">
                    <CardTitle className="flex items-center text-purple-800">
                      <div className="bg-purple-500 p-2 rounded-lg mr-3">
                        <Image className="h-6 w-6 text-white" />
                      </div>
                      Gestione Logo
                    </CardTitle>
                    <CardDescription className="text-purple-600">
                      Carica e modifica il logo della pizzeria (immagine sinistra)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <LogoEditor />
                  </CardContent>
                </Card>

                {/* Hero Content Management */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-t-2xl border-b border-indigo-200">
                    <CardTitle className="flex items-center text-indigo-800">
                      <div className="bg-indigo-500 p-2 rounded-lg mr-3">
                        <Globe className="h-6 w-6 text-white" />
                      </div>
                      Gestione Hero Section
                    </CardTitle>
                    <CardDescription className="text-indigo-600">
                      Modifica il contenuto e l'immagine hero (immagine destra)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <HeroContentEditor />
                  </CardContent>
                </Card>

                {/* We Offer Section Management */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl border-b border-orange-200">
                    <CardTitle className="flex items-center text-orange-800">
                      <div className="bg-orange-500 p-2 rounded-lg mr-3">
                        <Pizza className="h-6 w-6 text-white" />
                      </div>
                      Gestione "We Offer" Section
                    </CardTitle>
                    <CardDescription className="text-orange-600">
                      Modifica la sezione "We Offer" con 3 offerte personalizzabili
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <WeOfferManager />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Gallery Management */}
            <TabsContent value="gallery">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="mr-2" />
                    Gestione Galleria
                  </CardTitle>
                  <CardDescription>
                    Carica e organizza le immagini della pizzeria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GalleryManager />
                </CardContent>
              </Card>
            </TabsContent>

            {/* YouTube Management */}
            <TabsContent value="youtube">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="mr-2" />
                    Gestione Video YouTube
                  </CardTitle>
                  <CardDescription>
                    Gestisci i video YouTube mostrati sul sito
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <YouTubeManager />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comments Management */}
            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2" />
                    Gestione Commenti
                  </CardTitle>
                  <CardDescription>
                    Modera commenti e recensioni dei clienti
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CommentsManager />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Popup Management */}
            <TabsContent value="popups">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2" />
                    Gestione Popup e Annunci
                  </CardTitle>
                  <CardDescription>
                    Crea e gestisci popup per occasioni speciali
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PopupManager />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings">
              <div className="space-y-8">
                {/* General Settings */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-2xl border-b border-gray-200">
                    <CardTitle className="flex items-center text-gray-800">
                      <div className="bg-gray-500 p-2 rounded-lg mr-3">
                        <Settings className="h-6 w-6 text-white" />
                      </div>
                      Impostazioni Generali
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Configura le impostazioni principali del ristorante
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <SettingsManager />
                  </CardContent>
                </Card>

                {/* Business Hours Settings */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl border-b border-blue-200">
                    <CardTitle className="flex items-center text-blue-800">
                      <div className="bg-blue-500 p-2 rounded-lg mr-3">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      Orari di Apertura
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      Gestisci gli orari di apertura per ogni giorno della settimana
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <BusinessHoursManager />
                  </CardContent>
                </Card>

                {/* Delivery & Payment Settings */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-2xl border-b border-green-200">
                    <CardTitle className="flex items-center text-green-800">
                      <div className="bg-green-500 p-2 rounded-lg mr-3">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      Consegne e Pagamenti
                    </CardTitle>
                    <CardDescription className="text-green-600">
                      Configura zone di consegna, tariffe e metodi di pagamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ShippingZoneManager />
                  </CardContent>
                </Card>

                {/* Stripe Payment Settings */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-2xl border-b border-purple-200">
                    <CardTitle className="flex items-center text-purple-800">
                      <div className="bg-purple-500 p-2 rounded-lg mr-3">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      Configurazione Stripe
                    </CardTitle>
                    <CardDescription className="text-purple-600">
                      Gestisci le impostazioni di pagamento Stripe
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <StripeSettings />
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl border-b border-orange-200">
                    <CardTitle className="flex items-center text-orange-800">
                      <div className="bg-orange-500 p-2 rounded-lg mr-3">
                        <Bell className="h-6 w-6 text-white" />
                      </div>
                      Impostazioni Notifiche
                    </CardTitle>
                    <CardDescription className="text-orange-600">
                      Configura suoni e notifiche per nuovi ordini
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <NotificationSettings />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Database Test */}
            <TabsContent value="database-test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2" />
                    Database Connection Test
                  </CardTitle>
                  <CardDescription>
                    Test database connectivity and gallery data loading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DatabaseTest />
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Connection Test */}
            <TabsContent value="system-test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2" />
                    System Connection Test
                  </CardTitle>
                  <CardDescription>
                    Test complete system: Products ↔ Admin, Orders → Notifications, Real-time Updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SystemConnectionTest />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Debugger */}
            <TabsContent value="products-debug">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Pizza className="mr-2" />
                    Products Database Debugger
                  </CardTitle>
                  <CardDescription>
                    Debug products database, check data, and create sample products
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductsDebugger />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Menu Products Connection Test */}
            <TabsContent value="menu-products-test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MenuIcon className="mr-2" />
                    Menu & Products Connection Test
                  </CardTitle>
                  <CardDescription>
                    Test how menu and products sections connect to the database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MenuProductsConnectionTest />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schema Fixer */}
            <TabsContent value="schema-fixer">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wrench className="mr-2" />
                    Products Schema Fixer
                  </CardTitle>
                  <CardDescription>
                    Fix database schema issues and missing columns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductsSchemaFixer />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schema Updater */}
            <TabsContent value="schema-updater">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wrench className="mr-2" />
                    Database Schema Updater
                  </CardTitle>
                  <CardDescription>
                    Add advanced features to products table including stock management, SEO fields, and more
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DatabaseSchemaUpdater />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Frontend Connection Tester */}
            <TabsContent value="frontend-test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="mr-2" />
                    Frontend Database Connection Tester
                  </CardTitle>
                  <CardDescription>
                    Test how frontend components connect to the database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FrontendConnectionTester />
                </CardContent>
              </Card>
            </TabsContent>

            {/* YouTube Connection Test */}
            <TabsContent value="youtube-test">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="mr-2" />
                    Test Connessione YouTube
                  </CardTitle>
                  <CardDescription>
                    Verifica la connessione tra admin panel e frontend per i video YouTube
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <YouTubeConnectionTest />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default PizzeriaAdminPanel;
