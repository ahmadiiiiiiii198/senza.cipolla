import React, { useState, useEffect } from 'react';
import { Pizza, ChefHat, Clock, Star, Camera, Phone } from 'lucide-react';

const Hero = () => {
  const [heroContent, setHeroContent] = useState({
    heading: "Pizzeria Regina 2000 Torino",
    subheading: "Autentica pizza italiana nel cuore di Torino dal 2000",
    backgroundImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
    heroImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
  });

  const [logoSettings, setLogoSettings] = useState({
    logoUrl: "/pizzeria-regina-logo.png",
    altText: "Pizzeria Regina 2000 Torino Logo",
  });

  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [logoImageLoaded, setLogoImageLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        // Try to load content from settings service with timeout
        const { settingsService } = await import('@/services/settingsService');

        // Initialize with timeout
        const initPromise = settingsService.initialize();
        const initTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Settings init timeout')), 5000);
        });

        await Promise.race([initPromise, initTimeout]);

        // Load hero content with timeout
        const heroPromise = settingsService.getSetting('heroContent', heroContent);
        const heroTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Hero content timeout')), 3000);
        });

        const loadedHeroContent = await Promise.race([heroPromise, heroTimeout]);
        setHeroContent(loadedHeroContent);

        // Load logo settings with timeout
        const logoPromise = settingsService.getSetting('logoSettings', logoSettings);
        const logoTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Logo settings timeout')), 3000);
        });

        const loadedLogoSettings = await Promise.race([logoPromise, logoTimeout]);
        setLogoSettings(loadedLogoSettings);

        console.log('✅ [Hero] Content loaded successfully');
      } catch (error) {
        console.warn('⚠️ [Hero] Failed to load content, using defaults:', error);
        // Keep default values
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to let the app initialize
    const timer = setTimeout(loadContent, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-screen overflow-x-hidden hero-container-mobile">
      {/* Pizza background video - Mobile Optimized */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        {!videoError ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }
            /* Mobile-optimized video display */
            object-cover object-center
            sm:object-cover sm:object-center
            md:object-cover md:object-center
            lg:object-cover lg:object-center
            /* Ensure video scales properly on mobile */
            min-w-full min-h-full
            /* Better mobile positioning */
            transform scale-105 sm:scale-100
            /* Apply mobile-specific CSS class */
            hero-video-mobile
            `}
            style={{
              /* Additional mobile optimizations */
              objectPosition: 'center center',
              /* Ensure video covers the entire area on mobile */
              width: '100vw',
              height: '100vh',
              minWidth: '100%',
              minHeight: '100%'
            }}
            onLoadedData={() => {
              console.log('✅ [Hero] Background video loaded successfully');
              setVideoLoaded(true);
            }}
            onError={(e) => {
              console.error('❌ [Hero] Background video failed to load:', e);
              setVideoError(true);
            }}
          >
            <source src="/20250509_211620.mp4" type="video/mp4" />
          </video>
        ) : null}

        {/* Fallback to background image if video fails or is loading - Mobile Optimized */}
        {(videoError || !videoLoaded) && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat
            /* Mobile-optimized background positioning */
            sm:bg-cover sm:bg-center
            md:bg-cover md:bg-center
            lg:bg-cover lg:bg-center
            /* Better mobile scaling */
            bg-fixed sm:bg-scroll
            /* Apply mobile-specific CSS class */
            hero-bg-mobile
            "
            style={{
              backgroundImage: `url('${heroContent.backgroundImage}')`,
              /* Mobile-specific background optimizations */
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundAttachment: window.innerWidth < 768 ? 'scroll' : 'fixed',
              /* Ensure full coverage on mobile */
              minHeight: '100vh',
              minWidth: '100vw'
            }}
          ></div>
        )}

        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>
      </div>

      {/* Pizza-themed decorative elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-pizza-tomato to-pizza-red rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-pizza-cheese to-pizza-orange rounded-full blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-pizza-red to-pizza-orange rounded-full blur-2xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating pizza icons */}
      <div className="absolute top-10 right-20 text-pizza-orange/30 animate-float">
        <Pizza size={60} />
      </div>
      <div className="absolute bottom-10 left-20 text-pizza-red/30 animate-float animation-delay-2000">
        <Pizza size={40} />
      </div>
      <div className="absolute top-1/3 right-1/4 text-pizza-green/30 animate-float animation-delay-4000">
        <ChefHat size={50} />
      </div>

      <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">

          {/* Left Column - Logo and Text */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in-left">
            <div className="flex justify-center lg:justify-start mb-8">
              <div className="relative">
                {/* Logo loading placeholder */}
                {!logoImageLoaded && (
                  <div className="h-96 md:h-[480px] w-96 bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl animate-pulse flex items-center justify-center">
                    <Pizza className="text-red-400 animate-float" size={64} />
                  </div>
                )}

                {/* Main logo image */}
                {logoSettings.logoUrl && (
                  <img
                    src={logoSettings.logoUrl}
                    alt={logoSettings.altText}
                    className={`h-96 md:h-[480px] w-auto object-contain drop-shadow-2xl transition-all duration-700 hover-scale animate-scale-in ${
                      logoImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={() => {
                      console.log('✅ [Hero] Large logo loaded successfully');
                      setLogoImageLoaded(true);
                    }}
                    onError={(e) => {
                      console.error('❌ [Hero] Large logo failed to load:', logoSettings.logoUrl);
                      setLogoImageLoaded(true);
                    }}
                  />
                )}

                {/* Fallback text if logo fails */}
                <div className="hidden text-center">
                  <Pizza className="h-24 w-24 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-800 font-playfair">Pizzeria Regina 2000</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="relative animate-fade-in-right animate-stagger-1">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white via-red-50 to-orange-50 p-8 hover-lift">
              {/* Hero image loading placeholder */}
              {!heroImageLoaded && (
                <div className="absolute inset-8 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 animate-pulse flex items-center justify-center">
                  <Pizza className="text-red-400 animate-float" size={64} />
                </div>
              )}
              <img
                src={heroContent.heroImage || heroContent.backgroundImage}
                alt="Delicious authentic Italian pizza"
                className={`w-full h-96 md:h-[500px] object-cover rounded-2xl transition-opacity duration-700 hover-scale ${
                  heroImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => {
                  setHeroImageLoaded(true);
                }}
                onError={(e) => {
                  console.error(`❌ Hero image failed to load: ${e.currentTarget.src}`);
                  // Try fallback image
                  const fallbackImage = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80';
                  if (e.currentTarget.src !== fallbackImage) {
                    e.currentTarget.src = fallbackImage;
                  } else {
                    setHeroImageLoaded(false);
                  }
                }}
              />
              <div className="absolute inset-8 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Text and Buttons */}
        <div className="text-center space-y-8 animate-fade-in-up animate-stagger-2 mt-12">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-fredoka font-bold text-white leading-tight animate-scale-in mb-4">
                <span className="text-pizza-red drop-shadow-lg">🍕 PIZZERIA</span>
              </h1>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-pacifico text-pizza-orange drop-shadow-lg animate-fade-in-up animate-stagger-1">
                Regina 2000
              </h2>
              <h3 className="text-2xl md:text-3xl font-roboto text-pizza-yellow drop-shadow-md animate-fade-in-up animate-stagger-2 mt-2">
                Torino • Autentica Pizza Italiana
              </h3>
            </div>

            <p className="text-xl md:text-2xl text-white font-roboto font-light max-w-4xl mx-auto leading-relaxed animate-fade-in-up animate-stagger-3 text-center drop-shadow-md">
              🔥 <strong>Forno a Legna Tradizionale</strong> • 🇮🇹 <strong>Ingredienti Freschi</strong> • 👨‍🍳 <strong>Ricette Autentiche</strong>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 text-pizza-cream animate-fade-in-up animate-stagger-4">
              <div className="flex items-center space-x-2 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                <Clock className="animate-wiggle text-pizza-orange" size={24} />
                <span className="font-roboto font-medium">Aperto 12:00-24:00</span>
              </div>
              <div className="flex items-center space-x-2 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                <Star className="fill-current animate-wiggle animation-delay-2000 text-pizza-yellow" size={24} />
                <span className="font-roboto font-medium">Dal 2000</span>
              </div>
              <div className="flex items-center space-x-2 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
                <Pizza className="animate-pizza-spin text-pizza-red" size={24} />
                <span className="font-roboto font-medium">Pizza Italiana</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4 animate-fade-in-up animate-stagger-2">
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => {
                  const productsSection = document.getElementById('products');
                  if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="group bg-gradient-to-r from-pizza-red via-pizza-orange to-pizza-red text-white px-8 py-4 rounded-full font-bold font-fredoka text-xl hover:from-pizza-red hover:via-pizza-tomato hover:to-pizza-red transform hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-3xl hover-lift animate-pulse-glow border-2 border-pizza-yellow/50"
              >
                <span className="flex items-center justify-center space-x-3">
                  <Pizza className="group-hover:animate-bounce" size={28} />
                  <span>🍕 ORDINA PIZZA</span>
                </span>
              </button>

              <button
                onClick={() => {
                  window.open('tel:0110769211', '_self');
                }}
                className="group bg-gradient-to-r from-pizza-green to-pizza-basil text-white px-8 py-4 rounded-full font-bold font-fredoka text-xl hover:from-pizza-green hover:to-pizza-green transform hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-3xl hover-lift animate-bounce-gentle border-2 border-pizza-cream/50"
              >
                <span className="flex items-center justify-center space-x-3">
                  <Phone className="group-hover:animate-bounce" size={28} />
                  <span>📞 CHIAMA ORA</span>
                </span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  console.log('📸 Gallery button clicked, scrolling to gallery...');
                  try {
                    const gallerySection = document.getElementById('gallery');
                    if (gallerySection) {
                      gallerySection.scrollIntoView({ behavior: 'smooth' });
                      console.log('✅ Scrolled to gallery successfully');
                    } else {
                      console.error('❌ Gallery section not found');
                    }
                  } catch (error) {
                    console.error('❌ Error scrolling to gallery:', error);
                  }
                }}
                className="group bg-gradient-to-r from-pizza-brown to-pizza-dark text-white px-8 py-4 rounded-full font-bold font-fredoka text-xl hover:from-pizza-brown hover:to-pizza-brown transform hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-3xl hover-lift border-2 border-pizza-orange/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-pizza-orange focus:ring-offset-2"
                aria-label="Vai alla galleria"
                title="Vai alla galleria"
              >
                <span className="flex items-center justify-center space-x-3">
                  <Camera className="group-hover:animate-bounce" size={28} />
                  <span>📸 GALLERIA</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
