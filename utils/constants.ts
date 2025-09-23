// utils/constants.ts
export const CATEGORIES = [
  'a4',
  'a5', 
  'a3',
  'diary',
  'roughNotebook',
] as const;

export const ORDER_STATUS = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
] as const;

export const PAYMENT_STATUS = [
  'pending',
  'completed',
  'failed',
  'refunded'
] as const;

export const USER_ROLES = ['customer', 'admin'] as const;