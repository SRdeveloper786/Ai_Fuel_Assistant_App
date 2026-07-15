import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Safely trigger haptic feedback.
 * Designed to work only in mobile environments where Capacitor is active.
 */
export const triggerHaptic = async (style: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    // Check if running in a native environment where Capacitor is available
    if (typeof window !== 'undefined' && 'Capacitor' in window) {
      await Haptics.impact({
        style: style === 'light' ? ImpactStyle.Light : style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Heavy,
      });
    }
  } catch (error) {
    // Silently fail if haptics aren't available (e.g. desktop browser)
    console.debug('Haptic feedback not supported or available:', error);
  }
};
