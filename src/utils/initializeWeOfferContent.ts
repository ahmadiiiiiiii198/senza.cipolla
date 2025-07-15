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
      heading: "Le Nostre Specialità",
      subheading: "Scopri le nostre autentiche specialità italiane",
      offers: [
        {
          id: 1,
          title: "Pizza Metro Finchi 5 Gusti",
          description: "Prova la nostra pizza metro caratteristica con fino a 5 gusti diversi in un'unica creazione straordinaria. Perfetta da condividere con famiglia e amici.",
          image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          badge: "Specialità"
        },
        {
          id: 2,
          title: "Usiamo la Farina 5 Stagioni, Alta Qualità",
          description: "Utilizziamo farina premium 5 Stagioni, ingredienti della migliore qualità che rendono il nostro impasto leggero, digeribile e incredibilmente saporito.",
          image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          badge: "Qualità"
        },
        {
          id: 3,
          title: "Creiamo Tutti i Tipi di Pizza Italiana di Alta Qualità",
          description: "Dalla classica Margherita alle specialità gourmet, prepariamo ogni pizza con passione, utilizzando tecniche tradizionali e i migliori ingredienti per un'autentica esperienza italiana.",
          image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          badge: "Autentica"
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
