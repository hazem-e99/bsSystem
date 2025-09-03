// Subscription Plan Types based on Swagger Schema

export interface SubscriptionPlanViewModel {
  id: number;
  name: string | null;
  description: string | null;
  price: number;
  maxNumberOfRides: number;
  durationInDays: number;
  isActive: boolean;
}

export interface CreateSubscriptionPlanDTO {
  name: string; // 3-100 chars, required
  description?: string | null; // 0-500 chars, optional
  price: number; // 0.01 - 10000
  maxNumberOfRides: number; // 1 - 1000
  durationInDays: number; // 1 - 365
  isActive: boolean; // required
}

export interface UpdateSubscriptionPlanDTO {
  name?: string | null;
  description?: string | null;
  price?: number | null; // 0.01 - 10000
  maxNumberOfRides?: number | null; // 1 - 1000
  durationInDays?: number | null; // 1 - 365
  isActive?: boolean | null;
}

// API Response Types
export interface SubscriptionPlanViewModelApiResponse {
  data: SubscriptionPlanViewModel;
  count?: number | null;
  message?: string | null;
  success: boolean;
  timestamp: string;
  errorCode?: any;
  requestId?: string | null;
}

export interface SubscriptionPlanViewModelIEnumerableApiResponse {
  data: SubscriptionPlanViewModel[] | null;
  count?: number | null;
  message?: string | null;
  success: boolean;
  timestamp: string;
  errorCode?: any;
  requestId?: string | null;
}

export interface BooleanApiResponse {
  data: boolean;
  count?: number | null;
  message?: string | null;
  success: boolean;
  timestamp: string;
  errorCode?: any;
  requestId?: string | null;
}
