import { settingsService } from '@/services/settingsService';

export const initializeWeOfferContent = async () => {
  try {
    console.log('🍕 [WeOffer] Initializing We Offer content in database...');
    
    // Initialize the settings service
    await settingsService.initialize();
    
    // Check if weOfferContent already exists
    const existingContent = await settingsService.getSetting('weOfferContent', null);
    
    if (existingContent) {
      console.log('✅ [WeOffer] We Offer content already exists in database');
      return existingContent;
    }
    
    // Create the default We Offer content
    const defaultWeOfferContent = {
      heading: "We Offer",
      subheading: "Discover our authentic Italian specialties",
      offers: [
        {
          id: 1,
          title: "Pizza Metro Finchi 5 Gusti",
          description: "Experience our signature meter-long pizza with up to 5 different flavors in one amazing creation. Perfect for sharing with family and friends.",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          badge: "Specialty"
        },
        {
          id: 2,
          title: "Usiamo la Farina 5 Stagioni Gusti, Alta Qualità",
          description: "We use premium 5 Stagioni flour, the finest quality ingredients that make our pizza dough light, digestible and incredibly flavorful.",
          image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          badge: "Quality"
        },
        {
          id: 3,
          title: "We Make All Kinds of Italian Pizza with High Quality and Very Delicious",
          description: "From classic Margherita to gourmet specialties, we craft every pizza with passion, using traditional techniques and the finest ingredients for an authentic Italian experience.",
          image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          badge: "Authentic"
        }
      ]
    };
    
    // Save to database
    await settingsService.setSetting('weOfferContent', defaultWeOfferContent);
    
    console.log('✅ [WeOffer] We Offer content successfully initialized in database');
    return defaultWeOfferContent;
    
  } catch (error) {
    console.error('❌ [WeOffer] Failed to initialize We Offer content:', error);
    throw error;
  }
};
