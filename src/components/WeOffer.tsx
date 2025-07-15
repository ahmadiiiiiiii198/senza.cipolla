import React, { useState, useEffect } from 'react';
import { Pizza, ChefHat, Star, Utensils } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

const WeOffer = () => {
  const { t } = useLanguage();

  // Dynamic content based on translations
  const getOfferContent = () => ({
    heading: t('weOffer') || 'Le Nostre Specialità',
    subheading: t('weOfferSubtitle') || 'Scopri le nostre pizze tradizionali preparate con ingredienti freschi e di qualità',
    offers: [
      {
        id: 1,
        title: t('pizzaMetroTitle') || 'Pizza al Metro',
        description: t('pizzaMetroDesc') || 'Pizza al metro per 4-5 persone, perfetta per condividere',
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: t('specialtyBadge') || 'Specialità'
      },
      {
        id: 2,
        title: t('flourQualityTitle') || 'Ingredienti Freschi',
        description: t('flourQualityDesc') || 'Solo ingredienti freschi e di qualità per le nostre pizze',
        image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: t('qualityBadge') || 'Qualità'
      },
      {
        id: 3,
        title: t('italianPizzaTitle') || 'Pizza Italiana',
        description: t('italianPizzaDesc') || 'Autentica pizza italiana preparata con forno a legna',
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: t('authenticBadge') || 'Autentica'
      }
    ]
  });

  const [offerContent, setOfferContent] = useState(getOfferContent());

  // Update content when language changes
  useEffect(() => {
    setOfferContent(getOfferContent());
  }, [t]);

  const [imagesLoaded, setImagesLoaded] = useState({
    1: false,
    2: false,
    3: false
  });

  useEffect(() => {
    const loadContent = async () => {
      try {
        // Initialize We Offer content in database if it doesn't exist
        const { initializeWeOfferContent } = await import('@/utils/initializeWeOfferContent');
        const loadedContent = await initializeWeOfferContent();

        setOfferContent(loadedContent);
        console.log('✅ [WeOffer] Content loaded successfully');
      } catch (error) {
        console.warn('⚠️ [WeOffer] Failed to load content, using defaults:', error);
        // Fallback to default content if database fails
      }
    };

    loadContent();
  }, []);

  const handleImageLoad = (offerId: number) => {
    setImagesLoaded(prev => ({ ...prev, [offerId]: true }));
  };

  return (
    <section className="py-20 bg-gradient-to-br from-pizza-cream via-white to-pizza-orange/10 relative overflow-hidden">
      {/* Pizza-themed background decorations */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-pizza-red rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-pizza-orange rounded-full blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-pizza-green rounded-full blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating pizza icons */}
      <div className="absolute top-20 right-20 text-pizza-orange/20 animate-float">
        <Pizza size={60} />
      </div>
      <div className="absolute bottom-20 left-20 text-pizza-red/20 animate-float animation-delay-2000">
        <ChefHat size={50} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Pizza className="text-pizza-red animate-pizza-spin" size={48} />
            <Utensils className="text-pizza-orange animate-tomato-bounce" size={48} />
            <Pizza className="text-pizza-green animate-pizza-spin animation-delay-2000" size={48} />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-pizza-dark mb-6 font-fredoka">
            🍕 {offerContent.heading}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-roboto">
            {offerContent.subheading}
          </p>
        </div>

        {/* Offers Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {(offerContent.offers || []).map((offer, index) => (
            <div 
              key={offer.id}
              className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden hover-lift animate-fade-in-up`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden">
                {!imagesLoaded[offer.id] && (
                  <div className="absolute inset-0 bg-gradient-to-br from-pizza-orange/20 to-pizza-red/20 animate-pulse flex items-center justify-center">
                    <Pizza className="text-pizza-orange animate-pizza-spin" size={48} />
                  </div>
                )}
                
                <img
                  src={offer.image}
                  alt={offer.title}
                  className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                    imagesLoaded[offer.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImageLoad(offer.id)}
                  onError={(e) => {
                    console.error(`❌ [WeOffer] Image failed to load for offer ${offer.id}`);
                    handleImageLoad(offer.id);
                  }}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                
                {/* Badge */}
                <div className="absolute top-4 left-4 bg-pizza-red text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg animate-bounce-gentle">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3" />
                    <span>{offer.badge}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-pizza-dark mb-3 font-pacifico group-hover:text-pizza-red transition-colors duration-300">
                  {offer.title}
                </h3>
                <p className="text-gray-600 leading-relaxed font-roboto">
                  {offer.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WeOffer;
