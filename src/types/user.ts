export type UserRole = 'admin' | 'student' | 'supervisor' | 'movement-manager' | 'driver' | 'conductor';

export interface User {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string; // Keep for backward compatibility
  fullName?: string;
  email?: string;
  password?: string;
  role: UserRole;
  phoneNumber?: string;
  phone?: string; // Keep for backward compatibility
  nationalId?: string;
  status?: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  profilePictureUrl?: string; // API field
  createdAt?: string;
  updatedAt?: string;
  // New fields from LoginViewModel
  token?: string;
  expiration?: string;
}

export interface Student extends User {
  role: 'student';
  studentId?: string;
  department: string;
  academicYear: string;
  subscriptionStatus: 'active' | 'expired' | 'none';
  subscriptionExpiry?: string;
  paymentMethod?: 'cash' | 'bank';
  pickupPoint?: string;
  // Additional fields for compatibility
  yearOfStudy?: string;
}

export interface Driver extends User {
  role: 'driver';
  licenseNumber: string;
  experience?: number;
  assignedBusId?: string;
  currentRouteId?: string;
}

export interface Supervisor extends User {
  role: 'supervisor';
  assignedBusId?: string;
  assignedRouteId?: string;
}

export interface MovementManager extends User {
  role: 'movement-manager';
  permissions?: string[];
}

export interface Admin extends User {
  role: 'admin';
  permissions?: string[];
}
