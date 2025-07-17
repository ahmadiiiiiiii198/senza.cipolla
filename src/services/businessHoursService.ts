import { supabase } from '@/integrations/supabase/client';

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface WeeklyHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface BusinessHoursResult {
  isOpen: boolean;
  message: string;
  nextOpenTime?: string;
  todayHours?: DayHours;
}

class BusinessHoursService {
  private static instance: BusinessHoursService;
  private cachedHours: WeeklyHours | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds for faster updates

  static getInstance(): BusinessHoursService {
    if (!BusinessHoursService.instance) {
      BusinessHoursService.instance = new BusinessHoursService();
    }
    return BusinessHoursService.instance;
  }

  /**
   * Get business hours from database with caching
   */
  async getBusinessHours(): Promise<WeeklyHours> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cachedHours && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedHours;
    }

    try {
      console.log('🕒 Fetching business hours from database...');

      // Add timeout protection
      const queryPromise = supabase
        .from('settings')
        .select('value')
        .eq('key', 'businessHours')
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Business hours query timeout')), 5000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Error fetching business hours:', error);
        // Return default hours if database fetch fails
        return this.getDefaultHours();
      }

      if (data?.value) {
        this.cachedHours = data.value as WeeklyHours;
        this.lastFetch = now;
        console.log('✅ Business hours loaded from database:', {
          monday: this.cachedHours.monday,
          currentTime: new Date().toLocaleTimeString('it-IT'),
          cacheExpiry: new Date(now + this.CACHE_DURATION).toLocaleTimeString('it-IT')
        });
        return this.cachedHours;
      }

      // Return default hours if no data found
      return this.getDefaultHours();
    } catch (error) {
      console.error('❌ Failed to fetch business hours:', error);
      return this.getDefaultHours();
    }
  }

  /**
   * Get default business hours (fallback)
   */
  private getDefaultHours(): WeeklyHours {
    const defaultDay: DayHours = { isOpen: true, openTime: '18:30', closeTime: '22:30' };

    return {
      monday: { ...defaultDay },
      tuesday: { ...defaultDay },
      wednesday: { ...defaultDay },
      thursday: { ...defaultDay },
      friday: { ...defaultDay },
      saturday: { ...defaultDay },
      sunday: { ...defaultDay }
    };
  }

  /**
   * Check if business is currently open
   */
  async isBusinessOpen(checkTime?: Date): Promise<BusinessHoursResult> {
    const hours = await this.getBusinessHours();
    const now = checkTime || new Date();
    
    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = now.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[dayOfWeek] as keyof WeeklyHours;
    
    const todayHours = hours[currentDay];
    
    // Check if business is open today
    if (!todayHours.isOpen) {
      const nextOpenTime = this.getNextOpenTime(hours, now);
      return {
        isOpen: false,
        message: 'Siamo chiusi oggi. Puoi effettuare ordini durante i nostri orari di apertura.',
        nextOpenTime,
        todayHours
      };
    }

    // Check if current time is within business hours
    const currentTime = this.formatTime(now);
    const isWithinHours = this.isTimeWithinRange(currentTime, todayHours.openTime, todayHours.closeTime);
    
    if (isWithinHours) {
      return {
        isOpen: true,
        message: 'Siamo aperti! Puoi effettuare il tuo ordine.',
        todayHours
      };
    } else {
      const nextOpenTime = this.getNextOpenTime(hours, now);
      return {
        isOpen: false,
        message: `Siamo chiusi. Orari di oggi: ${todayHours.openTime}-${todayHours.closeTime}`,
        nextOpenTime,
        todayHours
      };
    }
  }

  /**
   * Get the next time the business will be open
   */
  private getNextOpenTime(hours: WeeklyHours, fromTime: Date): string {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayNamesItalian = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    
    // Check next 7 days
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(fromTime);
      checkDate.setDate(checkDate.getDate() + i);
      
      const dayOfWeek = checkDate.getDay();
      const dayKey = dayNames[dayOfWeek] as keyof WeeklyHours;
      const dayHours = hours[dayKey];
      
      if (dayHours.isOpen) {
        const dayName = dayNamesItalian[dayOfWeek];
        return `${dayName} alle ${dayHours.openTime}`;
      }
    }
    
    return 'Controlla i nostri orari di apertura';
  }

  /**
   * Check if a time is within a range
   */
  private isTimeWithinRange(currentTime: string, openTime: string, closeTime: string): boolean {
    const current = this.timeToMinutes(currentTime);
    const open = this.timeToMinutes(openTime);
    const close = this.timeToMinutes(closeTime);
    
    // Handle overnight hours (e.g., 22:00 - 02:00)
    if (close < open) {
      return current >= open || current <= close;
    }
    
    return current >= open && current <= close;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format Date object to HH:MM string
   */
  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  /**
   * Get today's business hours
   */
  async getTodayHours(): Promise<DayHours> {
    const hours = await this.getBusinessHours();
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[dayOfWeek] as keyof WeeklyHours;
    
    return hours[currentDay];
  }

  /**
   * Get formatted hours string for display
   */
  async getFormattedHours(): Promise<string> {
    const hours = await this.getBusinessHours();
    const dayNames = {
      monday: 'Lunedì',
      tuesday: 'Martedì',
      wednesday: 'Mercoledì',
      thursday: 'Giovedì',
      friday: 'Venerdì',
      saturday: 'Sabato',
      sunday: 'Domenica'
    };

    const openDays: string[] = [];
    
    Object.entries(hours).forEach(([day, dayHours]) => {
      if (dayHours.isOpen) {
        const dayName = dayNames[day as keyof typeof dayNames];
        openDays.push(`${dayName}: ${dayHours.openTime}-${dayHours.closeTime}`);
      }
    });

    return openDays.length > 0 ? openDays.join(', ') : 'Chiuso';
  }

  /**
   * Validate if an order can be placed at a specific time
   */
  async validateOrderTime(orderTime?: Date): Promise<{ valid: boolean; message: string }> {
    const checkTime = orderTime || new Date();
    const result = await this.isBusinessOpen(checkTime);

    console.log('🕒 [BusinessHours] Order validation:', {
      checkTime: checkTime.toLocaleString('it-IT'),
      isOpen: result.isOpen,
      message: result.message,
      todayHours: result.todayHours
    });

    if (result.isOpen) {
      return {
        valid: true,
        message: 'Ordine valido - siamo aperti!'
      };
    } else {
      return {
        valid: false,
        message: result.message + (result.nextOpenTime ? ` Prossima apertura: ${result.nextOpenTime}` : '')
      };
    }
  }

  /**
   * Clear cache (useful for testing or when hours are updated)
   */
  clearCache(): void {
    this.cachedHours = null;
    this.lastFetch = 0;

    // Also clear any localStorage cache that might exist
    try {
      localStorage.removeItem('businessHours');
      localStorage.removeItem('opening_hours');
      localStorage.removeItem('business_hours_cache');
    } catch (e) {
      console.warn('Could not clear localStorage cache:', e);
    }

    // Reduced logging - only log cache clear in debug mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ Business hours cache cleared');
    }
  }

  /**
   * Force refresh business hours from database (bypasses all caching)
   */
  async forceRefresh(): Promise<WeeklyHours> {
    // Reduced logging - only log force refresh in debug mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [BusinessHours] Force refresh initiated');
    }

    // Clear all caches first
    this.clearCache();

    // Force fresh fetch from database
    this.lastFetch = 0;
    this.cachedHours = null;

    // Add cache-busting timestamp to ensure fresh data
    const timestamp = Date.now();

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value, updated_at')
        .eq('key', 'businessHours')
        .single();

      if (error) {
        console.error('❌ Force refresh failed:', error);
        throw error;
      }

      if (data?.value) {
        this.cachedHours = data.value as WeeklyHours;
        this.lastFetch = timestamp;

        // Reduced logging - only detailed logs in debug mode
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [BusinessHours] Force refresh successful');
        }

        return this.cachedHours;
      }

      throw new Error('No business hours data found');
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      return this.getDefaultHours();
    }
  }
}

// Export singleton instance
export const businessHoursService = BusinessHoursService.getInstance();
export default businessHoursService;
