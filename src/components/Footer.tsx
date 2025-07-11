
import React, { useState, useEffect } from 'react';
import { Pizza, ChefHat, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { useBusinessHours } from '@/hooks/useBusinessHours';
import { supabase } from '@/integrations/supabase/client';

const Footer = () => {
  const { formattedHours } = useBusinessHours();
  const [contactHours, setContactHours] = useState<string>('');

  // Load contact hours from database
  useEffect(() => {
    const loadContactHours = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'contactContent')
          .single();

        if (data?.value?.hours) {
          setContactHours(data.value.hours);
        }
      } catch (error) {
        console.error('Failed to load contact hours:', error);
      }
    };

    loadContactHours();
  }, []);

  return (
    <footer className="bg-gradient-to-br from-pizza-dark via-gray-800 to-pizza-dark text-white py-16 relative overflow-hidden">
      {/* Pizza-themed background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-pizza-red to-pizza-orange rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-pizza-orange to-pizza-yellow rounded-full blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-pizza-green/20 to-pizza-basil/20 rounded-full blur-2xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating pizza icons */}
      <div className="absolute top-20 right-20 text-pizza-orange/20 animate-float">
        <Pizza size={50} />
      </div>
      <div className="absolute bottom-20 left-20 text-pizza-red/20 animate-float animation-delay-2000">
        <ChefHat size={40} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-pizza-red to-pizza-orange p-3 rounded-full">
                <Pizza className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="font-fredoka font-bold text-xl text-pizza-cream">Pizzeria Regina 2000</h3>
                <p className="font-pacifico text-pizza-orange">Torino</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 max-w-md font-roboto">
              Autentica pizza italiana nel cuore di Torino dal 2000.
              Tradizione, qualità e passione in ogni morso.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-pizza-orange" />
                <p>Corso Regina Margherita, 53, 10152 Torino TO</p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-pizza-orange" />
                <p>Tel: 0110769211</p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-pizza-orange" />
                <p>Email: anilamyzyri@gmail.com</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#home" className="hover:text-yellow-400 transition-colors">Home</a></li>
              <li><a href="#flowers" className="hover:text-yellow-400 transition-colors">Flowers</a></li>
              <li><a href="#plants" className="hover:text-yellow-400 transition-colors">Plants</a></li>
              <li><a href="#bouquets" className="hover:text-yellow-400 transition-colors">Bouquets</a></li>
              <li><a href="#about" className="hover:text-yellow-400 transition-colors">About</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-gray-300">
              <li>Wedding Arrangements</li>
              <li>Corporate Events</li>
              <li>Funeral Flowers</li>
              <li>Plant Care Services</li>
              <li>Custom Bouquets</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Orari di Apertura</h3>
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
              {contactHours || formattedHours || 'Lun-Dom: 08:00 - 19:00'}
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Francesco Fiori & Piante. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
