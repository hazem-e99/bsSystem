export const APP_NAME = 'University Bus Management System';

export const ROLES = {
  ADMIN: 'admin',
  STUDENT: 'student',
  SUPERVISOR: 'supervisor',
  MOVEMENT_MANAGER: 'movement-manager',
  DRIVER: 'driver',
} as const;

export const STATUS_COLORS = {
  active: 'bg-[#E8F5E8] text-[#2E7D32]',
  inactive: 'bg-[#F5F5F5] text-[#757575]',
  suspended: 'bg-[#FFEBEE] text-[#C62828]',
  maintenance: 'bg-[#FFF3E0] text-[#E65100]',
  'out-of-service': 'bg-[#FFEBEE] text-[#C62828]',
  scheduled: 'bg-[#E3F2FD] text-[#1565C0]',
  'in-progress': 'bg-[#E8F5E8] text-[#2E7D32]',
  completed: 'bg-[#F5F5F5] text-[#757575]',
  cancelled: 'bg-[#FFEBEE] text-[#C62828]',
  pending: 'bg-[#FFF3E0] text-[#E65100]',
  failed: 'bg-[#FFEBEE] text-[#C62828]',
  refunded: 'bg-[#F5F5F5] text-[#757575]',
  present: 'bg-[#E8F5E8] text-[#2E7D32]',
  absent: 'bg-[#FFEBEE] text-[#C62828]',
  late: 'bg-[#FFF3E0] text-[#E65100]',
} as const;

export const PAYMENT_METHODS = {
  card: 'Credit Card',
  'bank-transfer': 'Bank Transfer',
  cash: 'Cash',
} as const;

export const NOTIFICATION_TYPES = {
  info: 'bg-[#E3F2FD] text-[#1565C0]',
  success: 'bg-[#E8F5E8] text-[#2E7D32]',
  warning: 'bg-[#FFF3E0] text-[#E65100]',
  error: 'bg-[#FFEBEE] text-[#C62828]',
} as const;

export const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export const DEFAULT_MAP_CENTER = {
  lat: 40.7128,
  lng: -74.0060,
} as const;

export const CHART_COLORS = [
  '#2196F3', '#4CAF50', '#FF9800', '#FF5722', '#9C27B0', '#00BCD4', '#FF9800', '#8BC34A',
] as const;

// API Configuration Constants
export const API_CONSTANTS = {
  // Global API base URL
  GLOBAL_BASE_URL: 'http://busmanagementsystem.runasp.net/api',
  
  // Authentication endpoints
  ENDPOINTS: {
    // Global endpoints
    GLOBAL: {
      REGISTRATION_STUDENT: '/Authentication/registration-student',
      REGISTRATION_STAFF: '/Authentication/registration-staff',
      LOGIN: '/Authentication/login',
      VERIFICATION: '/Authentication/verification',
      FORGOT_PASSWORD: '/Authentication/forgot-password',
      RESET_PASSWORD: '/Authentication/reset-password',
      RESET_PASSWORD_VERIFICATION: '/Authentication/forgot-password', // Use forgot-password endpoint for verification
    },
  },
  
  // Bus API endpoints
  BUS_ENDPOINTS: {
    GET_ALL: '/Buses',
    GET_BY_ID: '/Buses/{id}',
    CREATE: '/Buses',
    UPDATE: '/Buses/{id}',
    DELETE: '/Buses/{id}',
  },
  
  // Student registration schema
  STUDENT_REGISTRATION_SCHEMA: {
    firstName: 'string',
    lastName: 'string',
    nationalId: 'string',
    email: 'string',
    phoneNumber: 'string',
    department: 'string',
    yearOfStudy: 'string',
    password: 'string',
    confirmPassword: 'string'
  },
  
  // Staff registration schema
  STAFF_REGISTRATION_SCHEMA: {
    firstName: 'string',
    lastName: 'string',
    nationalId: 'string',
    email: 'string',
    phoneNumber: 'string',
    role: 'Admin' | 'Driver' | 'Staff'
  }
};

// Helper function to get current configuration
export const getCurrentConfig = () => {
  return {
    baseUrl: API_CONSTANTS.GLOBAL_BASE_URL,
    endpoints: API_CONSTANTS.ENDPOINTS.GLOBAL
  };
};
