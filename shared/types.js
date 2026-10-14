// shared/types.ts — Shared TypeScript types used by both client and server.
export const DEFAULT_PRICE_PER_KM = {
    bike: 5,
    auto: 12,
    cab: 14,
};
export const TN_BOUNDS = {
    south: 8.0,
    north: 13.6,
    west: 76.2,
    east: 80.4,
    center: { lat: 11.0, lng: 78.6 },
};
export const TN_PLATE_REGEX = /^TN\s?\d{2}\s?[A-Z]{1,2}\s?\d{4}$/i;
export const PHONE_REGEX = /^\+91[6-9]\d{9}$/;
