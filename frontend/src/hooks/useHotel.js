import useStore from '../store/useStore';

/**
 * useHotel — Returns hotel identity constants.
 * Primary source: Zustand store (fetched from backend API)
 * Secondary source: import.meta.env (VITE_ prefixed)
 */
export function useHotel() {
  const { hotelConfig } = useStore();
  
  return {
    name:    hotelConfig?.hotelName || import.meta.env.VITE_HOTEL_NAME || "Lelite",
    tagline: hotelConfig?.tagline   || import.meta.env.VITE_HOTEL_TAGLINE || 'Exquisite Dining Experience',
    phone:   hotelConfig?.phone     || import.meta.env.VITE_HOTEL_PHONE || '+91 98765 43210',
    year:    hotelConfig?.year      || import.meta.env.VITE_HOTEL_YEAR || '2012',
  };
}
