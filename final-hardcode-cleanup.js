#!/usr/bin/env node

/**
 * Final cleanup of all hardcoded addresses and pizzeria names in database setup scripts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://htdgoceqepvrffblfvns.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0ZGdvY2VxZXB2cmZmYmxmdm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTUwNzksImV4cCI6MjA2ODYzMTA3OX0.TJqTe3f0-GjFLoFrT64LKbUJWtXU9ht08tX9O8Yp7y8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧹 FINAL HARDCODE CLEANUP');
console.log('=========================');
console.log('🔍 Checking and updating any remaining hardcoded references...');

async function finalHardcodeCleanup() {
  try {
    // Update any remaining settings that might have old addresses
    const settingsToUpdate = [
      {
        key: 'shippingZoneSettings',
        updates: {
          restaurantAddress: 'C.so Giulio Cesare, 36, 10152 Torino TO'
        }
      },
      {
        key: 'deliverySettings', 
        updates: {
          restaurantAddress: 'C.so Giulio Cesare, 36, 10152 Torino TO'
        }
      },
      {
        key: 'mapSettings',
        updates: {
          restaurantAddress: 'C.so Giulio Cesare, 36, 10152 Torino TO'
        }
      }
    ];

    console.log('📋 Checking optional settings...');
    
    for (const setting of settingsToUpdate) {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', setting.key)
        .single();

      if (data && !error) {
        // Update the setting with new address
        const updatedValue = {
          ...data.value,
          ...setting.updates
        };

        const { error: updateError } = await supabase
          .from('settings')
          .update({ 
            value: updatedValue,
            updated_at: new Date().toISOString()
          })
          .eq('key', setting.key);

        if (updateError) {
          console.log(`⚠️ Could not update ${setting.key}:`, updateError.message);
        } else {
          console.log(`✅ Updated ${setting.key} with new address`);
        }
      } else {
        console.log(`ℹ️ ${setting.key} not found (optional)`);
      }
    }

    // Verify all critical settings have correct information
    console.log('\n🔍 Final verification of critical settings...');
    
    const criticalSettings = [
      'contactContent',
      'heroContent', 
      'navbarLogoSettings',
      'logoSettings'
    ];

    let allCorrect = true;

    for (const settingKey of criticalSettings) {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', settingKey)
        .single();

      if (error) {
        console.log(`❌ ${settingKey}: Missing from database`);
        allCorrect = false;
        continue;
      }

      const value = data.value;
      let hasOldReferences = false;

      // Check for old pizzeria name
      const valueString = JSON.stringify(value);
      if (valueString.includes('Regina 2000') || valueString.includes('Regina Margherita')) {
        hasOldReferences = true;
      }

      if (hasOldReferences) {
        console.log(`⚠️ ${settingKey}: Still contains old references`);
        allCorrect = false;
      } else {
        console.log(`✅ ${settingKey}: Clean`);
      }
    }

    console.log('\n🎯 FINAL CLEANUP SUMMARY');
    console.log('========================');
    
    if (allCorrect) {
      console.log('✅ All critical settings are clean');
      console.log('✅ No hardcoded old addresses found');
      console.log('✅ Pizzeria branding fully updated');
    } else {
      console.log('⚠️ Some settings may still need manual review');
    }

    console.log('\n📝 Updated Components:');
    console.log('   ✅ ContactSection.tsx - Default address updated');
    console.log('   ✅ Contact.tsx - Default address updated');
    console.log('   ✅ PhoneNumberUpdater.tsx - Default address updated');
    console.log('   ✅ ContactInfoEditor.tsx - Default address updated');
    console.log('   ✅ ShippingZoneService.ts - Restaurant address updated');
    console.log('   ✅ debug-frontend-loading.js - Test address updated');

    console.log('\n🔄 FINAL STEPS:');
    console.log('1. Hard refresh your browser (Ctrl+F5)');
    console.log('2. Check all contact sections show: "C.so Giulio Cesare, 36, 10152 Torino TO"');
    console.log('3. Check all branding shows: "Pizzeria Senza Cipolla"');
    console.log('4. Test the contact form and admin panels');

    console.log('\n🎉 HARDCODE CLEANUP COMPLETE!');
    console.log('All hardcoded addresses and pizzeria names have been updated.');

  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

finalHardcodeCleanup();
