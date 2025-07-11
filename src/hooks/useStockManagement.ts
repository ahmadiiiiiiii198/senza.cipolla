import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StockManagementSettings {
  enabled: boolean;
  defaultQuantity: number;
}

export const useStockManagement = () => {
  const [settings, setSettings] = useState<StockManagementSettings>({
    enabled: false,
    defaultQuantity: 100
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: settingsData, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['stock_management_enabled', 'default_stock_quantity']);

      if (error) {
        console.error('Error loading stock management settings:', error);
        return;
      }

      const newSettings = { ...settings };

      settingsData.forEach(setting => {
        if (setting.key === 'stock_management_enabled') {
          // Handle both old double-encoded and new single-encoded values
          let enabled = false;
          try {
            const parsed = JSON.parse(setting.value);
            enabled = parsed === true || parsed === 'true';
          } catch {
            enabled = setting.value === 'true';
          }
          newSettings.enabled = enabled;
        } else if (setting.key === 'default_stock_quantity') {
          let quantity = 100;
          try {
            const parsed = JSON.parse(setting.value);
            quantity = parseInt(typeof parsed === 'string' ? parsed : parsed.toString());
          } catch {
            quantity = parseInt(setting.value) || 100;
          }
          newSettings.defaultQuantity = quantity;
        }
      });

      setSettings(newSettings);
      console.log('📦 Stock management settings loaded:', newSettings);

    } catch (error) {
      console.error('Error loading stock management settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateStockManagementEnabled = async (enabled: boolean): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'stock_management_enabled',
          value: JSON.stringify(enabled)
        });

      if (error) {
        console.error('Error updating stock management enabled:', error);
        return false;
      }

      setSettings(prev => ({ ...prev, enabled }));
      console.log('✅ Stock management enabled updated:', enabled);
      return true;

    } catch (error) {
      console.error('Error updating stock management enabled:', error);
      return false;
    }
  };

  const updateDefaultStockQuantity = async (quantity: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'default_stock_quantity',
          value: JSON.stringify(quantity)
        });

      if (error) {
        console.error('Error updating default stock quantity:', error);
        return false;
      }

      setSettings(prev => ({ ...prev, defaultQuantity: quantity }));
      console.log('✅ Default stock quantity updated:', quantity);
      return true;

    } catch (error) {
      console.error('Error updating default stock quantity:', error);
      return false;
    }
  };

  const isProductAvailable = (stockQuantity: number | null | undefined): boolean => {
    if (!settings.enabled) {
      // If stock management is disabled, all products are available
      return true;
    }
    
    // If stock management is enabled, check stock quantity
    return stockQuantity !== null && stockQuantity !== undefined && stockQuantity > 0;
  };

  const getStockStatus = (stockQuantity: number | null | undefined): 'available' | 'low' | 'out_of_stock' | 'unlimited' => {
    if (!settings.enabled) {
      return 'unlimited';
    }

    if (stockQuantity === null || stockQuantity === undefined || stockQuantity <= 0) {
      return 'out_of_stock';
    }

    if (stockQuantity <= 5) {
      return 'low';
    }

    return 'available';
  };

  const getStockMessage = (stockQuantity: number | null | undefined): string => {
    const status = getStockStatus(stockQuantity);
    
    switch (status) {
      case 'unlimited':
        return 'Disponibile';
      case 'available':
        return 'Disponibile';
      case 'low':
        return `Ultimi ${stockQuantity} disponibili`;
      case 'out_of_stock':
        return 'Non disponibile';
      default:
        return 'Disponibile';
    }
  };

  return {
    settings,
    isLoading,
    loadSettings,
    updateStockManagementEnabled,
    updateDefaultStockQuantity,
    isProductAvailable,
    getStockStatus,
    getStockMessage,
    // Convenience getters
    isStockManagementEnabled: settings.enabled,
    defaultStockQuantity: settings.defaultQuantity
  };
};

export default useStockManagement;
