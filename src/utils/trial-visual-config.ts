import { FiGift, FiStar, FiClock, FiAlertTriangle, FiAlertCircle, FiXCircle } from 'react-icons/fi';
import type { IconType } from 'react-icons';

export type TrialVisualState =
  | 'eligible'
  | 'active_safe'
  | 'active_warning'
  | 'active_critical'
  | 'active_last_day'
  | 'expired'
  | 'has_subscription'
  | 'none';

export interface TrialVisualConfig {
  colorPalette: string;
  icon: IconType;
  showBanner: boolean;
  showBadge: boolean;
  showDialog: boolean;
  animate: boolean;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
}

export const TRIAL_VISUAL_CONFIG: Record<string, TrialVisualConfig> = {
  eligible: {
    colorPalette: 'blue',
    icon: FiGift,
    showBanner: true,
    showBadge: false,
    showDialog: false,
    animate: false,
    bgLight: 'blue.50',
    bgDark: 'rgba(59, 130, 246, 0.1)',
    borderLight: 'blue.200',
    borderDark: 'blue.800',
    textLight: 'blue.700',
    textDark: 'blue.300',
  },
  active_safe: {
    colorPalette: 'purple',
    icon: FiStar,
    showBanner: true,
    showBadge: true,
    showDialog: false,
    animate: false,
    bgLight: 'purple.50',
    bgDark: 'rgba(147, 51, 234, 0.1)',
    borderLight: 'purple.200',
    borderDark: 'purple.800',
    textLight: 'purple.700',
    textDark: 'purple.300',
  },
  active_warning: {
    colorPalette: 'yellow',
    icon: FiClock,
    showBanner: true,
    showBadge: true,
    showDialog: false,
    animate: false,
    bgLight: 'yellow.50',
    bgDark: 'rgba(234, 179, 8, 0.1)',
    borderLight: 'yellow.300',
    borderDark: 'yellow.800',
    textLight: 'yellow.800',
    textDark: 'yellow.300',
  },
  active_critical: {
    colorPalette: 'orange',
    icon: FiAlertTriangle,
    showBanner: true,
    showBadge: true,
    showDialog: true,
    animate: false,
    bgLight: 'orange.50',
    bgDark: 'rgba(249, 115, 22, 0.1)',
    borderLight: 'orange.300',
    borderDark: 'orange.800',
    textLight: 'orange.800',
    textDark: 'orange.300',
  },
  active_last_day: {
    colorPalette: 'red',
    icon: FiAlertCircle,
    showBanner: true,
    showBadge: true,
    showDialog: true,
    animate: true,
    bgLight: 'red.50',
    bgDark: 'rgba(239, 68, 68, 0.1)',
    borderLight: 'red.300',
    borderDark: 'red.800',
    textLight: 'red.800',
    textDark: 'red.300',
  },
  expired: {
    colorPalette: 'gray',
    icon: FiXCircle,
    showBanner: false,
    showBadge: false,
    showDialog: false,
    animate: false,
    bgLight: 'gray.50',
    bgDark: 'rgba(107, 114, 128, 0.1)',
    borderLight: 'gray.200',
    borderDark: 'gray.700',
    textLight: 'gray.600',
    textDark: 'gray.400',
  },
  has_subscription: {
    colorPalette: 'gray',
    icon: FiXCircle,
    showBanner: false,
    showBadge: false,
    showDialog: false,
    animate: false,
    bgLight: 'gray.50',
    bgDark: 'rgba(107, 114, 128, 0.1)',
    borderLight: 'gray.200',
    borderDark: 'gray.700',
    textLight: 'gray.600',
    textDark: 'gray.400',
  },
  none: {
    colorPalette: 'gray',
    icon: FiXCircle,
    showBanner: false,
    showBadge: false,
    showDialog: false,
    animate: false,
    bgLight: 'gray.50',
    bgDark: 'rgba(107, 114, 128, 0.1)',
    borderLight: 'gray.200',
    borderDark: 'gray.700',
    textLight: 'gray.600',
    textDark: 'gray.400',
  },
};
