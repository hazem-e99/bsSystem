import { getApiConfig } from "./config";
import {
  LoginDTO,
  VerificationDTO,
  StudentRegistrationDTO,
  ResetPasswordDTO,
  ForgotPasswordDTO,
  StaffRegistrationDTO,
} from "@/types/auth";
import { Bus, BusApiResponse, BusRequest, BusListParams } from "@/types/bus";
import {
  CreateTripDTO,
  UpdateTripDTO,
  Trip,
  TripViewModel,
} from "@/types/trip";

const apiConfig = getApiConfig();

// Generic API functions
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  let url = apiConfig.buildUrl(endpoint);
  console.log("🌐 Making request to:", url);
  console.log("📋 Request options:", options);
  console.log("📤 Request body:", options?.body);

  // Prevent GET/HEAD requests from having a body. Convert JSON body to query params if provided.
  if (
    options &&
    options.method &&
    /^(GET|HEAD)$/i.test(options.method) &&
    options.body
  ) {
    try {
      const raw = typeof options.body === "string" ? options.body : "";
      const obj = raw ? JSON.parse(raw) : {};
      const params = new URLSearchParams();
      Object.entries(obj || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        params.append(key, String(value));
      });
      const hasQuery = url.includes("?");
      const qs = params.toString();
      if (qs) {
        url = `${url}${hasQuery ? "&" : "?"}${qs}`;
      }
    } catch (e) {
      console.warn("Failed to convert GET body to query params:", e);
    } finally {
      // Remove body to satisfy fetch constraints for GET/HEAD
      delete (options as RequestInit & { body?: BodyInit | null }).body;
    }
  }

  try {
    // Inject Authorization header from stored user token for global endpoints
    const authHeaders: Record<string, string> = {};
    try {
      const isLocalApi =
        typeof url === "string" &&
        (url.startsWith("/api/") || url.startsWith("/api"));
      if (!isLocalApi) {
        // Prefer token from localStorage (client) or cookie (server)
        let token: string | undefined;
        if (typeof window !== "undefined") {
          const raw = window.localStorage.getItem("user");
          if (raw) {
            const parsed = JSON.parse(raw);
            token = parsed?.token || parsed?.accessToken;
          }
        } else {
          // Best-effort cookie parse for server-side calls
          const cookie =
            (options as RequestInit & { headers?: { cookie?: string } })
              ?.headers?.cookie || "";
          const match = /user=([^;]+)/.exec(cookie);
          if (match) {
            try {
              const parsed = JSON.parse(decodeURIComponent(match[1]));
              token = parsed?.token || parsed?.accessToken;
            } catch {}
          }
        }
        if (token) {
          authHeaders["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch {}

    const isGet = (options?.method || "GET").toUpperCase() === "GET";

    // For GET requests with body, we need to convert to POST or use query parameters
    const finalUrl = url;
    const finalOptions = { ...options };

    if (isGet && options?.body) {
      // Convert GET with body to POST for compatibility
      finalOptions.method = "POST";
      console.log(
        "🔄 Converting GET request with body to POST for compatibility"
      );
    }

    const response = await fetch(finalUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(finalOptions.method === "GET"
          ? { "Cache-Control": "no-cache", Pragma: "no-cache" }
          : {}),
        ...authHeaders,
        ...finalOptions?.headers,
      },
      ...finalOptions,
    });

    console.log("📥 Response status:", response.status, response.statusText);

    if (!response.ok) {
      // Attempt to read error body for better diagnostics, including validation details
      let errorMessage: string | undefined;
      try {
        const ct = response.headers.get("content-type") || "";
        if (ct.toLowerCase().includes("application/json")) {
          const j = await response.clone().json();
          // Common patterns: { message }, { title }, ValidationProblemDetails: { errors: { field: [..] } }
          if (typeof j?.message === "string" && j.message.trim()) {
            errorMessage = j.message;
          } else if (typeof j?.title === "string" && j.title.trim()) {
            errorMessage = j.title;
          } else if (j?.errors && typeof j.errors === "object") {
            const parts: string[] = [];
            for (const [field, arr] of Object.entries(j.errors)) {
              const msgs = Array.isArray(arr) ? arr.join("; ") : String(arr);
              parts.push(`${field}: ${msgs}`);
            }
            if (parts.length) errorMessage = parts.join(" | ");
          } else {
            errorMessage = JSON.stringify(j);
          }
        } else {
          const txt = await response.clone().text();
          if (txt && txt.trim()) errorMessage = txt;
        }
      } catch {}
      // Handle specific error cases
      if (response.status === 404 || response.status === 401) {
        console.warn(
          `⚠️ Endpoint not found or unauthorized: ${endpoint}. Verify against Swagger and adjust.`
        );
      }

      if (response.status === 401) {
        console.warn(
          `⚠️ Unauthorized access to: ${endpoint} - This endpoint may require authentication`
        );
        // For critical endpoints, surface the error to the caller instead of returning empty
        if (
          endpoint.includes("/TripRoutes") ||
          endpoint.includes("/Buses") ||
          endpoint.includes("/Trips") ||
          endpoint.includes("/Trip")
        ) {
          throw new Error("Unauthorized");
        }
        return [] as T;
      }

      const baseMsg = `API request failed: ${response.status} ${response.statusText}`;
      const withBody = errorMessage ? `${baseMsg} - ${errorMessage}` : baseMsg;
      throw new Error(withBody);
    }

    // Try to parse JSON safely; handle 204/empty bodies and servers that return JSON with wrong content-type
    const contentType = response.headers.get("content-type") || "";
    const contentLengthHeader = response.headers.get("content-length");
    const contentLength = contentLengthHeader
      ? parseInt(contentLengthHeader, 10)
      : undefined;
    if (response.status === 204 || contentLength === 0) {
      return {} as unknown as T;
    }

    // Read body as text first, then try to JSON.parse. This handles servers that return JSON but set
    // the Content-Type to text/plain or omit it.
    const rawText = await response.text();
    if (!rawText) {
      return {} as unknown as T;
    }
    try {
      const parsed = JSON.parse(rawText);
      console.log("📥 Response data (parsed):", parsed);
      console.log("📥 Response success:", parsed?.success);
      console.log("📥 Response message:", parsed?.message);
      return parsed as T;
    } catch (e) {
      // Not JSON — return raw text to caller (caller may handle text). This is more robust than
      // silently returning an empty object when servers mis-label JSON responses.
      console.warn("⚠️ Response was not JSON, returning raw text");
      return rawText as unknown as T;
    }
  } catch (error) {
    console.error(`❌ API request failed for ${endpoint}:`, error);

    // For critical endpoints, re-throw the error
    if (
      endpoint.includes("/Users") ||
      endpoint.includes("/Buses") ||
      endpoint.includes("/Routes") ||
      endpoint.includes("/Trips") ||
      endpoint.includes("/TripRoutes") ||
      endpoint.includes("/Trip")
    ) {
      throw error;
    }

    // For non-critical endpoints, return empty data
    console.log("🔄 Returning empty data for failed non-critical endpoint");
    if (Array.isArray([] as T)) {
      return [] as T;
    }
    return null as T;
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body: unknown, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};

// Authentication API calls
export const authAPI = {
  // Student registration
  registerStudent: (studentData: StudentRegistrationDTO) => {
    console.log("🔗 Using endpoint:", apiConfig.AUTH.REGISTRATION_STUDENT);
    console.log(
      "🔗 Full URL:",
      apiConfig.buildUrl(apiConfig.AUTH.REGISTRATION_STUDENT)
    );
    console.log("📤 Sending data:", studentData);
    return apiRequest<any>(apiConfig.AUTH.REGISTRATION_STUDENT, {
      method: "POST",
      body: JSON.stringify(studentData),
    });
  },

  // Staff registration (Admin, Driver, Movement Manager, Supervisor)
  registerStaff: (staffData: StaffRegistrationDTO) => {
    console.log("🔗 Using endpoint:", apiConfig.AUTH.REGISTRATION_STAFF);
    console.log(
      "🔗 Full URL:",
      apiConfig.buildUrl(apiConfig.AUTH.REGISTRATION_STAFF)
    );
    console.log("📤 Sending data:", staffData);
    return apiRequest<any>(apiConfig.AUTH.REGISTRATION_STAFF, {
      method: "POST",
      body: JSON.stringify(staffData),
    });
  },

  // User login
  login: (credentials: LoginDTO) => {
    console.log("🔗 Using endpoint:", apiConfig.AUTH.LOGIN);
    console.log("🔗 Full URL:", apiConfig.buildUrl(apiConfig.AUTH.LOGIN));
    return apiRequest<any>(apiConfig.AUTH.LOGIN, {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  // Email verification
  verifyEmail: (verificationData: VerificationDTO) => {
    console.log("🔗 Using endpoint:", apiConfig.AUTH.VERIFICATION);
    return apiRequest<any>(apiConfig.AUTH.VERIFICATION, {
      method: "POST",
      body: JSON.stringify({
        email: (verificationData as any).email,
        verificationCode: (verificationData as any).code,
      }),
    });
  },

  // Forgot password
  forgotPassword: (emailData: ForgotPasswordDTO) => {
    console.log("🔗 Using endpoint:", apiConfig.AUTH.FORGOT_PASSWORD);
    console.log(
      "🔗 Full URL:",
      apiConfig.buildUrl(apiConfig.AUTH.FORGOT_PASSWORD)
    );
    return apiRequest<any>(apiConfig.AUTH.FORGOT_PASSWORD, {
      method: "POST",
      body: JSON.stringify(emailData),
    });
  },

  // Reset password
  resetPassword: (resetData: ResetPasswordDTO) => {
    console.log("🔗 Using endpoint:", apiConfig.AUTH.RESET_PASSWORD);
    console.log(
      "🔗 Full URL:",
      apiConfig.buildUrl(apiConfig.AUTH.RESET_PASSWORD)
    );
    return apiRequest<any>(apiConfig.AUTH.RESET_PASSWORD, {
      method: "POST",
      body: JSON.stringify(resetData),
    });
  },

  // Verify reset token
  verifyResetToken: (verificationData: {
    email: string;
    resetToken: string;
  }) => {
    console.log(
      "🔗 Using endpoint for reset verification:",
      apiConfig.AUTH.RESET_PASSWORD_VERIFICATION
    );
    console.log(
      "🔗 Full URL:",
      apiConfig.buildUrl(apiConfig.AUTH.RESET_PASSWORD_VERIFICATION)
    );
    console.log("📤 Sending reset verification data:", verificationData);
    return apiRequest<any>(apiConfig.AUTH.RESET_PASSWORD_VERIFICATION, {
      method: "POST",
      body: JSON.stringify({
        email: verificationData.email,
        resetToken: verificationData.resetToken,
        action: "verify", // Add action to distinguish from forgot password
      }),
    });
  },
};

// User-related API calls - use global endpoints
const mapGlobalStatus = (status: string | undefined) => {
  if (!status) return "active";
  const s = status.toLowerCase();
  if (s === "inactive") return "inactive";
  if (s === "suspended") return "suspended";
  return "active";
};

const mapGlobalRole = (role: string | undefined) => {
  if (!role) return "student";
  const r = role.toLowerCase();
  // Backend uses MovementManager, Conductor; app uses 'movement-manager' and may not use 'conductor'
  if (r === "movementmanager" || r === "movement manager")
    return "movement-manager";
  return r as any;
};

const mapGlobalUserToApp = (u: any) => {
  if (!u) return null;
  const first = u.firstName || "";
  const last = u.lastName || "";
  const fullName = `${first} ${last}`.trim();
  return {
    id: String(u.id ?? u.userId ?? ""),
    profileId: String(u.profileId ?? ""),
    name: fullName || u.name || u.email || "Unknown",
    fullName: fullName || undefined,
    email: u.email || "",
    role: mapGlobalRole(u.role),
    phone: u.phoneNumber || u.phone || "",
    nationalId: u.nationalId || "",
    status: mapGlobalStatus(u.status) as any,
    avatar: u.profilePictureUrl || u.avatar || undefined,
    createdAt: u.createdAt || new Date().toISOString(),
    updatedAt: u.updatedAt || new Date().toISOString(),
  } as any;
};

export const userAPI = {
  // Get all users (unwraps { data })
  getAll: async () => {
    const resp = await apiRequest<any>("/Users");
    const list = resp?.data ?? resp ?? [];
    return Array.isArray(list) ? list.map(mapGlobalUserToApp) : [];
  },

  // Get users by role
  getByRole: async (role: string) => {
    const resp = await apiRequest<any>(
      `/Users/by-role/${encodeURIComponent(role)}`
    );
    const list = resp?.data ?? resp ?? [];
    return Array.isArray(list) ? list.map(mapGlobalUserToApp) : [];
  },

  // Get user by ID
  getById: async (id: string) => {
    const resp = await apiRequest<any>(`/Users/${id}`);
    const item = resp?.data ?? resp ?? null;
    return item ? mapGlobalUserToApp(item) : null;
  },

  // Get user by email (fallback to filtering all if endpoint unsupported)
  getByEmail: async (email: string) => {
    try {
      const resp = await apiRequest<any>(
        `/Users?email=${encodeURIComponent(email)}`
      );
      const list = resp?.data ?? resp ?? [];
      return Array.isArray(list) ? list.map(mapGlobalUserToApp) : [];
    } catch {
      const all = await userAPI.getAll();
      return (all || []).filter(
        (u: any) => (u.email || "").toLowerCase() === email.toLowerCase()
      );
    }
  },

  // Change password
  changePassword: (payload: {
    currentPassword: string;
    password: string;
    confirmPassword: string;
  }) =>
    apiRequest<any>("/Users/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Get profile
  getProfile: async () => {
    const resp = await apiRequest<any>("/Users/profile");
    const item = resp?.data ?? resp ?? null;
    return item ? mapGlobalUserToApp(item) : null;
  },

  // Delete user
  delete: (id: string) =>
    apiRequest<any>(`/Users/${id}`, {
      method: "DELETE",
    }),

  // Update user (partial)
  update: (id: string, payload: any) =>
    apiRequest<any>(`/Users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

// Bus-related API calls - use global endpoints
export const busAPI = {
  // Get all buses with filters & pagination (GET with JSON body as per API)
  getAll: (params?: Partial<BusListParams>) => {
    const defaultParams: BusListParams = {
      page: 0,
      pageSize: 1000, // Default to get all buses
      busNumber: "",
      status: "",
      minSpeed: 0,
      maxSpeed: 0,
      minCapacity: 0,
      maxCapacity: 0,
    };
    const body = {
      ...defaultParams,
      ...(params || {}),
      _ts: Date.now(),
    } as any;
    return apiRequest<BusApiResponse<Bus[]>>("/Buses", {
      method: "GET",
      body: JSON.stringify(body),
    });
  },

  // Get bus by ID
  getById: (id: number) => apiRequest<BusApiResponse<Bus>>(`/Buses/${id}`),

  // Create new bus
  create: (busData: BusRequest) =>
    apiRequest<BusApiResponse<Bus>>("/Buses", {
      method: "POST",
      body: JSON.stringify(busData),
    }),

  // Update bus
  update: (id: number, busData: BusRequest) =>
    apiRequest<BusApiResponse<Bus>>(`/Buses/${id}`, {
      method: "PUT",
      body: JSON.stringify(busData),
    }),

  // Delete bus
  delete: (id: number) =>
    apiRequest<BusApiResponse<null>>(`/Buses/${id}`, {
      method: "DELETE",
    }),
};

// Trip-related API calls - use global endpoints
/* Legacy Trip API removed – new Trip module will use dedicated tripService per backend spec */
export const tripAPI = {
  // Get all trips
  getAll: async (): Promise<TripViewModel[]> => {
    const resp = await apiRequest<TripViewModel[] | { data: TripViewModel[] }>(
      "/Trip"
    );
    const list =
      (resp as { data: TripViewModel[] })?.data ??
      (resp as TripViewModel[]) ??
      [];
    return Array.isArray(list) ? list : [];
  },

  // Get trip by ID
  getById: async (id: string | number): Promise<TripViewModel | null> => {
    const resp = await apiRequest<TripViewModel | { data: TripViewModel }>(
      `/Trip/${id}`
    );
    const item =
      (resp as { data: TripViewModel })?.data ??
      (resp as TripViewModel) ??
      null;
    return item ?? null;
  },

  // Get trip view model by ID (includes booking info)
  getViewModelById: async (
    id: string | number
  ): Promise<TripViewModel | null> => {
    const resp = await apiRequest<TripViewModel | { data: TripViewModel }>(
      `/Trip/${id}`
    );
    const item =
      (resp as { data: TripViewModel })?.data ??
      (resp as TripViewModel) ??
      null;
    return item ?? null;
  },

  // Get all trips as view models (includes booking info)
  getAllViewModels: async (): Promise<TripViewModel[]> => {
    const resp = await apiRequest<TripViewModel[] | { data: TripViewModel[] }>(
      "/Trip"
    );
    const list =
      (resp as { data: TripViewModel[] })?.data ??
      (resp as TripViewModel[]) ??
      [];
    return Array.isArray(list) ? list : [];
  },

  // Get trips by date (YYYY-MM-DD format)
  getByDate: async (date: string): Promise<Trip[]> => {
    const resp = await apiRequest<Trip[] | { data: Trip[] }>(
      `/Trip/by-date/${encodeURIComponent(date)}`
    );
    const list = (resp as { data: Trip[] })?.data ?? (resp as Trip[]) ?? [];
    return Array.isArray(list) ? list : [];
  },

  // Get trips by driver ID
  getByDriver: async (driverId: string | number): Promise<Trip[]> => {
    const resp = await apiRequest<Trip[] | { data: Trip[] }>(
      `/Trip/by-driver/${driverId}`
    );
    const list = (resp as { data: Trip[] })?.data ?? (resp as Trip[]) ?? [];
    return Array.isArray(list) ? list : [];
  },

  // Get trips by bus ID
  getByBus: async (busId: string | number): Promise<Trip[]> => {
    const resp = await apiRequest<Trip[] | { data: Trip[] }>(
      `/Trip/by-bus/${busId}`
    );
    const list = (resp as { data: Trip[] })?.data ?? (resp as Trip[]) ?? [];
    return Array.isArray(list) ? list : [];
  },

  // Create new trip using CreateTripDTO (camelCase as per spec)
  create: (tripData: CreateTripDTO): Promise<Trip> => {
    const payload: CreateTripDTO = {
      busId: Number(tripData.busId),
      driverId: Number(tripData.driverId),
      conductorId: Number(tripData.conductorId),
      startLocation: (tripData.startLocation || "").trim(),
      endLocation: (tripData.endLocation || "").trim(),
      tripDate: tripData.tripDate,
      departureTimeOnly: tripData.departureTimeOnly,
      arrivalTimeOnly: tripData.arrivalTimeOnly,
      stopLocations: Array.isArray(tripData.stopLocations)
        ? tripData.stopLocations.map((s) => ({
            address: (s.address || "").trim(),
            arrivalTimeOnly: s.arrivalTimeOnly,
            departureTimeOnly: s.departureTimeOnly,
          }))
        : [],
    };

    return apiRequest<Trip>("/Trip", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Update existing trip using CreateTripDTO shape (backend expects same DTO)
  update: (id: string | number, tripData: CreateTripDTO): Promise<Trip> => {
    const payload: CreateTripDTO = {
      busId: Number(tripData.busId),
      driverId: Number(tripData.driverId),
      conductorId: Number(tripData.conductorId),
      startLocation: (tripData.startLocation || "").trim(),
      endLocation: (tripData.endLocation || "").trim(),
      tripDate: tripData.tripDate,
      departureTimeOnly: tripData.departureTimeOnly,
      arrivalTimeOnly: tripData.arrivalTimeOnly,
      stopLocations: Array.isArray(tripData.stopLocations)
        ? tripData.stopLocations.map((s) => ({
            address: (s.address || "").trim(),
            arrivalTimeOnly: s.arrivalTimeOnly,
            departureTimeOnly: s.departureTimeOnly,
          }))
        : [],
    };

    return apiRequest<Trip>(`/Trip/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // Delete trip
  delete: (id: string | number): Promise<{ success: boolean }> =>
    apiRequest<{ success: boolean }>(`/Trip/${id}`, {
      method: "DELETE",
    }),
};

// Payment-related API calls - use global endpoints
export const paymentAPI = {
  // Get all payments
  getAll: () => apiRequest<any[]>("/Payments"),

  // Get payment by ID
  getById: (id: string) => apiRequest<any>(`/Payments/${id}`),

  // Get payments by student
  getByStudent: (studentId: string) =>
    apiRequest<any[]>(`/Payments?studentId=${studentId}`),

  // Get payments by status
  getByStatus: (status: string) =>
    apiRequest<any[]>(`/Payments?status=${status}`),

  // Get payments by date range
  getByDateRange: (startDate: string, endDate: string) =>
    apiRequest<any[]>(`/Payments?date_gte=${startDate}&date_lte=${endDate}`),

  // Get payments by trip
  getByTrip: (tripId: string) =>
    apiRequest<any[]>(`/Payments?tripId=${tripId}`),

  // Get payments by method
  getByMethod: (method: string) =>
    apiRequest<any[]>(`/Payments?method=${method}`),

  // Create new payment
  create: (paymentData: any) =>
    apiRequest<any>("/Payments", {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),

  // Update payment
  update: (id: string, paymentData: any) =>
    apiRequest<any>(`/Payments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(paymentData),
    }),

  // Delete payment
  delete: (id: string) =>
    apiRequest<any>(`/Payments/${id}`, {
      method: "DELETE",
    }),
};

// Notification-related API calls - use global endpoints
export const notificationAPI = {
  // Get all notifications
  getAll: () => apiRequest<any[]>("/Notifications"),

  // Get notification by ID
  getById: (id: string) => apiRequest<any>(`/Notifications/${id}`),

  // Get notifications by user
  getByUser: (userId: string) =>
    apiRequest<any[]>(`/Notifications?userId=${userId}`),

  // Get notifications by type
  getByType: (type: string) => apiRequest<any[]>(`/Notifications?type=${type}`),

  // Get notifications by status
  getByStatus: (status: string) =>
    apiRequest<any[]>(`/Notifications?status=${status}`),

  // Create new notification
  create: (notificationData: any) =>
    apiRequest<any>("/Notifications", {
      method: "POST",
      body: JSON.stringify(notificationData),
    }),

  // Update notification
  update: (id: string, notificationData: any) =>
    apiRequest<any>(`/Notifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(notificationData),
    }),

  // Delete notification
  delete: (id: string) =>
    apiRequest<any>(`/Notifications/${id}`, {
      method: "DELETE",
    }),

  // Mark notification as read
  markAsRead: (id: string) =>
    apiRequest<any>(`/Notifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ read: true }),
    }),

  // Mark all notifications as read for a user
  markAllAsRead: (userId: string) =>
    apiRequest<any>(`/Notifications/mark-all-read`, {
      method: "PATCH",
      body: JSON.stringify({ userId }),
    }),

  // Clear read notifications for a user
  clearReadNotifications: (userId: string) =>
    apiRequest<any>(`/Notifications/clear-read`, {
      method: "DELETE",
      body: JSON.stringify({ userId }),
    }),
};

// Forms API - use global endpoints
export const formsAPI = {
  get: () => apiRequest<any>("/Forms"),
};

// Subscription plans API - use global endpoints
export const subscriptionPlansAPI = {
  // GET /api/SubscriptionPlan → returns { data: SubscriptionPlanViewModel[] }
  getAll: async () => {
    const resp = await apiRequest<any>("/SubscriptionPlan");
    return resp?.data ?? resp ?? [];
  },
  // GET /api/SubscriptionPlan/active
  getActive: async () => {
    const resp = await apiRequest<any>("/SubscriptionPlan/active");
    return resp?.data ?? resp ?? [];
  },
  // GET /api/SubscriptionPlan/{id}
  getById: async (id: number | string) => {
    const resp = await apiRequest<any>(`/SubscriptionPlan/${id}`);
    return resp?.data ?? resp ?? null;
  },
  // POST /api/SubscriptionPlan with CreateSubscriptionPlanDTO
  create: (planData: {
    name: string;
    description?: string | null;
    price: number;
    maxNumberOfRides: number;
    durationInDays: number;
    isActive: boolean;
  }) =>
    apiRequest<any>("/SubscriptionPlan", {
      method: "POST",
      body: JSON.stringify(planData),
    }),
  // PUT /api/SubscriptionPlan/{id} with UpdateSubscriptionPlanDTO
  update: (
    id: number | string,
    planData: Partial<{
      name: string;
      description: string | null;
      price: number;
      maxNumberOfRides: number;
      durationInDays: number;
      isActive: boolean;
    }>
  ) =>
    apiRequest<any>(`/SubscriptionPlan/${id}`, {
      method: "PUT",
      body: JSON.stringify(planData),
    }),
  // DELETE /api/SubscriptionPlan/{id}
  delete: (id: number | string) =>
    apiRequest<any>(`/SubscriptionPlan/${id}`, {
      method: "DELETE",
    }),
  // PUT /api/SubscriptionPlan/{id}/activate
  activate: (id: number | string) =>
    apiRequest<any>(`/SubscriptionPlan/${id}/activate`, {
      method: "PUT",
    }),
  // PUT /api/SubscriptionPlan/{id}/deactivate
  deactivate: (id: number | string) =>
    apiRequest<any>(`/SubscriptionPlan/${id}/deactivate`, {
      method: "PUT",
    }),
  // GET /api/SubscriptionPlan/by-price-range?minPrice=&maxPrice=
  getByPriceRange: async (minPrice?: number, maxPrice?: number) => {
    const params = new URLSearchParams();
    if (minPrice !== undefined) params.append("minPrice", String(minPrice));
    if (maxPrice !== undefined) params.append("maxPrice", String(maxPrice));
    const resp = await apiRequest<any>(
      `/SubscriptionPlan/by-price-range?${params.toString()}`
    );
    return resp?.data ?? resp ?? [];
  },
  // GET /api/SubscriptionPlan/by-duration?durationInDays=
  getByDuration: async (durationInDays?: number) => {
    const params = new URLSearchParams();
    if (durationInDays !== undefined)
      params.append("durationInDays", String(durationInDays));
    const resp = await apiRequest<any>(
      `/SubscriptionPlan/by-duration?${params.toString()}`
    );
    return resp?.data ?? resp ?? [];
  },
};

// Booking API - use global endpoints
export const bookingAPI = {
  getAll: () => apiRequest<any[]>("/Bookings"),
  getById: (id: string) => apiRequest<any>(`/Bookings/${id}`),
  getByStudent: (studentId: string) =>
    apiRequest<any[]>(`/Bookings?studentId=${studentId}`),
  getByTrip: (tripId: string) =>
    apiRequest<any[]>(`/Bookings?tripId=${tripId}`),
  create: (bookingData: any) =>
    apiRequest<any>("/Bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    }),
  update: (id: string, bookingData: any) =>
    apiRequest<any>(`/Bookings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(bookingData),
    }),
  delete: (id: string) =>
    apiRequest<any>(`/Bookings/${id}`, {
      method: "DELETE",
    }),
};

// Attendance API - use global endpoints
export const attendanceAPI = {
  getAll: () => apiRequest<any[]>("/Attendance"),
  getById: (id: string) => apiRequest<any>(`/Attendance/${id}`),
  getByTrip: (tripId: string) =>
    apiRequest<any[]>(`/Attendance?tripId=${tripId}`),
  getByStudent: (studentId: string) =>
    apiRequest<any[]>(`/Attendance?studentId=${studentId}`),
  create: (attendanceData: any) =>
    apiRequest<any>("/Attendance", {
      method: "POST",
      body: JSON.stringify(attendanceData),
    }),
  update: (id: string, attendanceData: any) =>
    apiRequest<any>(`/Attendance/${id}`, {
      method: "PATCH",
      body: JSON.stringify(attendanceData),
    }),
  delete: (id: string) =>
    apiRequest<any>(`/Attendance/${id}`, {
      method: "DELETE",
    }),
};

// Settings API - use global endpoints
export const settingsAPI = {
  get: () => apiRequest<any>("/Settings"),
  update: (settingsData: any) =>
    apiRequest<any>("/Settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    }),
  getMaintenanceMode: () => apiRequest<any>("/Settings/maintenance-mode"),
};

// Student Profile API - use global endpoints
export const studentProfileAPI = {
  get: (studentId: string) => apiRequest<any>(`/StudentProfiles/${studentId}`),
  getProfile: (studentId: string) =>
    apiRequest<any>(`/StudentProfiles/${studentId}`),
  updateProfile: (studentId: string, profileData: any) =>
    apiRequest<any>(`/StudentProfiles/${studentId}`, {
      method: "PATCH",
      body: JSON.stringify(profileData),
    }),
  create: (profileData: any) =>
    apiRequest<any>("/StudentProfiles", {
      method: "POST",
      body: JSON.stringify(profileData),
    }),
};

// Student Dashboard API - use global endpoints
export const studentDashboardAPI = {
  getStats: (studentId: string) =>
    apiRequest<any>(`/StudentDashboard/${studentId}/stats`),
  getRecentTrips: (studentId: string) =>
    apiRequest<any[]>(`/StudentDashboard/${studentId}/recent-trips`),
  getUpcomingTrips: (studentId: string) =>
    apiRequest<any[]>(`/StudentDashboard/${studentId}/upcoming-trips`),
  getPaymentHistory: (studentId: string) =>
    apiRequest<any[]>(`/StudentDashboard/${studentId}/payments`),
};

// Student Avatar API - use global endpoints
export const studentAvatarAPI = {
  uploadAvatar: (studentId: string, avatarData: File) =>
    apiRequest<any>(`/StudentAvatars/${studentId}`, {
      method: "POST",
      body: avatarData,
    }),
  get: (studentId: string) => apiRequest<any>(`/StudentAvatars/${studentId}`),
  removeAvatar: (studentId: string) =>
    apiRequest<any>(`/StudentAvatars/${studentId}`, {
      method: "DELETE",
    }),
};
