// src/utils/phone.js
// Phone formatting helpers
// Display: (970) 973-8550
// Storage: 9709738550 (digits only) or +19709738550 (E.164)

export const formatPhoneDisplay = (input) => {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  // Strip leading 1 if 11 digits (US country code)
  const clean = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;

  if (clean.length === 0) return '';
  if (clean.length <= 3) return `(${clean}`;
  if (clean.length <= 6) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
  return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
};

export const formatPhoneStorage = (input) => {
  if (!input) return '';
  const digits = String(input).replace(/\D/g, '');
  // Always strip leading 1 for US storage
  const clean = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return clean.slice(0, 10);
};

export const formatPhoneE164 = (input) => {
  const digits = formatPhoneStorage(input);
  if (digits.length === 10) return `+1${digits}`;
  return digits ? `+${digits}` : '';
};

export const isValidPhone = (input) => {
  const digits = formatPhoneStorage(input);
  return digits.length === 10;
};

export const isValidEmail = (input) => {
  if (!input) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
};

export const generatePortalPin = () => {
  // 6-digit PIN, no leading zero (looks cleaner)
  const min = 100000;
  const max = 999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarColor = (name) => {
  if (!name) return '#737373';
  const colors = ['#00E5E5', '#39FF14', '#FFE500', '#FF6B35', '#8B5CF6', '#EC4899', '#06B6D4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const timeAgo = (date) => {
  if (!date) return 'never';
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now - past) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};