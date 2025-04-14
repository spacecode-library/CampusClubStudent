import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL
const API_URL = 'https://unicoup.onrender.com/api'; // Replace with your actual API URL

// Storage keys
const TOKEN_KEY = '@campusclub:token';
const REFRESH_TOKEN_KEY = '@campusclub:refreshToken';
const USER_KEY = '@campusclub:user';

// Response types
export interface ApiResponse<T = any> {  
  success: boolean;
  message: string[] | string;
  data?: T;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Auth response
export interface AuthResponse {
  identityId: string;
  token: string;
  tokenExpiredAt: number;
  refreshToken: string;
  refreshTokenExpiredAt: number;
}

// Student details
export interface StudentDetails {
  email: string;
  university: string;
  universityDomain?: string;
  major: string;
  StartYear: number;
  GraduationYear: number;
  StudentID: string;
  StudentCardDocument?: string;
  StudentCity: string;
  StudentState: string;
  StudentCountry: string;
  isVerified: boolean;
  status: string;
}

export interface ApiRedemption {
  _id: string;
  discountId: string;
  discountTitle?: string;
  discountMerchant?: string;
  discountMerchantLogo?: string;
  redeemCode?: string;
  redeemedAt?: string;
  studentId?: string;
  redemptionCode?: string;
  redemptionDate?: string;
  isRedeemed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Discount types
export interface Discount {
  _id: string;
  merchantId: string;
  merchantName?: string;
  merchantLogo?: string;
  merchantCity: string;
  merchantCountry: string;
  title: string;
  description: string;
  discountType: string;
  discountpercentage: number;
  startprice?: number;
  endDate: string;
  isOpenAll: boolean;
  status: string;
  storeLink?: string;
  backgroundImage?: string;
  remainingUses: number;
}

export interface Redemption {
  _id: string;
  studentId: string;
  discountId: {
    _id: string;
    title: string;
    description: string;
    discountType: string;
    merchantName?: string;
    merchantLogo?: string;
    discountpercentage: number;
    storeLink?: string;
    backgroundImage?: string;
  };
  redemptionCode: string;
  redemptionDate: string;
  isRedeemed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  userId: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  backgroundImage: string;
  termsCondition: string;
  venue: string;
  eventScope: 'UNIVERSITY' | 'PUBLIC';
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  timeZone?: string;
  eventType?: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
  onlineLink?: string;
}

export interface RegisteredEvent {
  _id: string;
  userId: string;
  eventId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisteredStudent {
  _id: string;
  name: string;
  email: string;
}

export interface RedeemDiscountResponse {
  redemptionCode: string;
  redemptionDate: string;
}

class ApiService {
  static mapApiRedemptionToViewRedemption(apiRedemption: any): Redemption {
    return {
      _id: apiRedemption._id,
      studentId: apiRedemption.studentId,
      discountId: {
        _id: typeof apiRedemption.discountId === 'object' ? apiRedemption.discountId._id : apiRedemption.discountId,
        title: typeof apiRedemption.discountId === 'object' ? apiRedemption.discountId.title : apiRedemption.discountTitle || '',
        description: typeof apiRedemption.discountId === 'object' ? apiRedemption.discountId.description : '',
        discountType: typeof apiRedemption.discountId === 'object' ? apiRedemption.discountId.discountType : 'ONLINE',
        merchantName: typeof apiRedemption.discountId === 'object' ? apiRedemption.discountId.merchantName : apiRedemption.discountMerchant || '',
        merchantLogo: typeof apiRedemption.discountId === 'object' ? apiRedemption.discountId.merchantLogo : apiRedemption.discountMerchantLogo || '',
        discountpercentage: typeof apiRedemption.discountId === 'object' ? apiRedemption.discountId.discountpercentage : 0,
        storeLink: typeof apiRedemption.discountId === 'object' ? apiRedemption.discountId.storeLink : '',
        backgroundImage: typeof apiRedemption.discountId === 'object' ? apiRedemption.discountId.backgroundImage : '',
      },
      redemptionCode: apiRedemption.redemptionCode || apiRedemption.redeemCode || '',
      redemptionDate: apiRedemption.redemptionDate || apiRedemption.redeemedAt || new Date().toISOString(),
      isRedeemed: typeof apiRedemption.isRedeemed === 'boolean' ? apiRedemption.isRedeemed : true,
      createdAt: apiRedemption.createdAt || apiRedemption.redemptionDate || apiRedemption.redeemedAt || new Date().toISOString(),
      updatedAt: apiRedemption.updatedAt || apiRedemption.redemptionDate || apiRedemption.redeemedAt || new Date().toISOString(),
    };
  }

  // Get redemption history for a student
  static async getRedemptionHistory(studentId: string): Promise<ApiResponse<Redemption[]>> {
    try {
      const response = await this.fetchData<ApiRedemption[]>(
        `/student/redemptions/${studentId}`,
        'GET',
        undefined,
        true
      );
      
      if (response.success && response.data) {
        const mappedRedemptions = response.data.map(item => 
          this.mapApiRedemptionToViewRedemption(item)
        );
        
        return {
          success: response.success,
          message: response.message,
          data: mappedRedemptions
        };
      }
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      console.error('Error fetching redemption history:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred'
      };
    }
  }

  // Get specific redemption by ID
  static async getRedemptionById(redemptionId: string): Promise<ApiResponse<Redemption>> {
    try {
      const response = await this.fetchData<ApiRedemption>(
        `/student/redemptions/details/${redemptionId}`,
        'GET',
        undefined,
        true
      );
      
      if (response.success && response.data) {
        const mappedRedemption = this.mapApiRedemptionToViewRedemption(response.data);
        
        return {
          success: response.success,
          message: response.message,
          data: mappedRedemption
        };
      }
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      console.error('Error fetching redemption details:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred'
      };
    }
  }

  // Get student ID from storage or API
  static async getStudentId(): Promise<string> {
    try {
      const studentStatus = await this.getStudentStatus();
      
      if (studentStatus.success && studentStatus.data) {
        const userJson = await AsyncStorage.getItem(USER_KEY);
        if (userJson) {
          const userData = JSON.parse(userJson);
          if (userData.id) {
            return userData.id;
          }
        }
      }
      
      return 'default-student-id';
    } catch (error) {
      console.error('Error getting student ID:', error);
      return 'default-student-id';
    }
  }

  // Helper to get auth header
  private static async getAuthHeader(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private static async fetchData<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    requiresAuth = true
  ): Promise<ApiResponse<T>> {
    console.log('Starting fetchData:', { endpoint, method, body, requiresAuth });
  
    try {
      const headers = requiresAuth 
        ? await this.getAuthHeader() 
        : { 'Content-Type': 'application/json' };
      
      console.log('Headers:', headers);
  
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
  
      console.log('Fetch Response Status:', response.status);
      console.log('Fetch Response Headers:', Object.fromEntries(response.headers.entries()));
  
      if (response.status === 301) {
        const redirectUrl = response.headers.get('location');
        console.log('Redirect URL:', redirectUrl);
        if (redirectUrl?.includes('/subscription')) {
          return {
            success: false,
            message: 'Premium subscription required to redeem this discount',
            data: { redirectTo: 'subscription' } as any,
          };
        }
      }
  
      const data = await response.json();
      console.log('Fetch Response Data:', data);
  
      if (!response.ok) {
        console.log('Fetch Failed with Status:', response.status);
        if (response.status === 401 && requiresAuth) {
          console.log('Attempting token refresh due to 401');
          const refreshed = await this.refreshToken();
          if (refreshed) {
            console.log('Token refreshed successfully, retrying request');
            return this.fetchData(endpoint, method, body, requiresAuth);
          } else {
            console.log('Token refresh failed');
          }
        }
  
        return {
          success: false,
          message: Array.isArray(data.message) ? data.message[0] : data.message || 'An error occurred',
        };
      }
  
      return data as ApiResponse<T>;
    } catch (error: any) {
      console.error('API Error in fetchData:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Auth Methods

  // Check if user is logged in
  static async isLoggedIn(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) return false;
      
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (!userJson) return false;
      
      return true;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Register a new user
  static async register(name: string, email: string, password: string): Promise<ApiResponse<{id: string}>> {
    return this.fetchData<{id: string}>(
      '/user/register',
      'POST',
      { name, email, password, role: 'STUDENT' },
      false
    );
  }

  // Verify OTP for registration
  static async verifyRegistrationOtp(requestId: string, otp: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.fetchData<AuthResponse>(
      '/user/verify-otp',
      'POST',
      { requestId, otp },
      false
    );

    if (response.data) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      
      try {
        const cachedEmail = await AsyncStorage.getItem('@temp_registration_email');
        
        const userInfo = {
          id: response.data.identityId,
          email: cachedEmail
        };
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userInfo));
        
        await AsyncStorage.removeItem('@temp_registration_email');
      } catch (error) {
        console.warn('Could not store email during registration', error);
      }
    }
    
    return response;
  }

  // Resend OTP for registration
  static async resendRegistrationOtp(requestId: string): Promise<ApiResponse<{requestId: string}>> {
    return this.fetchData<{requestId: string}>(
      '/user/resend-otp',
      'POST',
      { requestId },
      false
    );
  }

  // Login
  static async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.fetchData<AuthResponse>(
      '/student/login',
      'POST',
      { email, password, role: 'STUDENT' },
      false
    );
    
    if (response.success && response.data) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      
      const userInfo = {
        id: response.data.identityId,
        email
      };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    }
    
    return response;
  }

  // Refresh token
  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        await this.logout();
        return false;
      }
      
      const response = await fetch(`${API_URL}/user/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        console.error('Token refresh failed with status:', response.status);
        await this.logout();
        return false;
      }
      
      const data = await response.json() as ApiResponse<AuthResponse>;
      
      if (data.success && data.data) {
        await AsyncStorage.setItem(TOKEN_KEY, data.data.token);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);
        return true;
      } else {
        await this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return false;
    }
  }

  // Logout
  static async logout(): Promise<ApiResponse<null>> {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      
      if (refreshToken) {
        return this.fetchData<null>(
          '/user/logout',
          'POST',
          { refreshToken },
          false
        );
      }
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Error during logout' };
    }
  }

  // Student Onboarding Methods

  // Get student status
  static async getStudentStatus(): Promise<ApiResponse<StudentDetails>> {
    try {
      return await this.fetchData<StudentDetails>(
        '/student/status',
        'GET',
        undefined,
        true
      );
    } catch (error: any) {
      console.error('Error getting student status:', error);
      return {
        success: false,
        message: error.message || 'Failed to get student status',
      };
    }
  }

  // Initiate email verification
  static async initiateVerification(
    email: string,
    studentDetails: Omit<StudentDetails, 'isVerified' | 'status' | 'StudentCardDocument' | 'universityDomain'>
  ): Promise<ApiResponse<{requestId: string}>> {
    return this.fetchData<{requestId: string}>(
      '/student/initiate-verification',
      'POST',
      {
        ...studentDetails,
        email
      },
      true
    );
  }

  // Verify OTP for student verification
  static async verifyStudentOtp(requestId: string, otp: string): Promise<ApiResponse<any>> {
    return this.fetchData<any>(
      '/student/verify-otp',
      'POST',
      { requestId, otp },
      true
    );
  }

  // Resend OTP for student verification
  static async resendStudentOtp(requestId: string): Promise<ApiResponse<{
    requestId: string,
    expiredAt: number,
    resendRemains: number
  }>> {
    return this.fetchData<{
      requestId: string,
      expiredAt: number,
      resendRemains: number
    }>(
      '/student/resend-otp',
      'POST',
      { requestId },
      true
    );
  }

  // Upload student ID document
  static async uploadStudentID(file: FormData): Promise<ApiResponse<any>> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      
      const response = await fetch(`${API_URL}/student/upload-id`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: file,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: Array.isArray(errorData.message) ? errorData.message[0] : errorData.message || 'An error occurred',
        };
      }
      
      const data = await response.json();
      return data as ApiResponse<any>;
    } catch (error: any) {
      console.error('API Error:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Discount related methods

  // Get all discounts
  static async getDiscounts(): Promise<ApiResponse<Discount[]>> {
    return this.fetchData<Discount[]>(
      '/discounts',
      'GET',
      undefined,
      true
    );
  }

  // Get featured discounts
  static async getFeaturedDiscounts(): Promise<ApiResponse<Discount[]>> {
    return this.fetchData<Discount[]>(
      '/discounts/featured',
      'GET',
      undefined,
      true
    );
  }

  // Get discount by ID
  static async getDiscountById(id: string): Promise<ApiResponse<Discount>> {
    return this.fetchData<Discount>(
      `/discounts/${id}`,
      'GET',
      undefined,
      true
    );
  }

  // Get discounts by category
  static async getDiscountsByCategory(category: string): Promise<ApiResponse<Discount[]>> {
    return this.fetchData<Discount[]>(
      `/discounts/category/${category}`,
      'GET',
      undefined,
      true
    );
  }

  // Get nearby discounts based on location
  static async getNearbyDiscounts(latitude: number, longitude: number, radius: number = 10): Promise<ApiResponse<Discount[]>> {
    return this.fetchData<Discount[]>(
      `/discounts/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`,
      'GET',
      undefined,
      true
    );
  }

  static async redeemDiscount(discountId: string): Promise<ApiResponse<RedeemDiscountResponse>> {
    const studentId = await this.getStudentId();

    return this.fetchData<RedeemDiscountResponse>(
      '/redeem-discount',
      'POST',
      { studentId, discountId },
      true
    );
  }

  // Get user's redeemed discounts
  static async getRedeemedDiscounts(): Promise<ApiResponse<Discount[]>> {
    return this.fetchData<Discount[]>(
      '/student/discounts/redeemed',
      'GET',
      undefined,
      true
    );
  }

  // Create a payment order
  static async createPaymentOrder(): Promise<ApiResponse<{ order: any }>> {
    return this.fetchData<{ order: any }>(
      '/payment/checkout',
      'POST',
      undefined,
      true
    );
  }

  // Verify the payment
  static async verifyPayment(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<ApiResponse<any>> {
    return this.fetchData<any>(
      '/payment/verify',
      'POST',
      paymentData,
      true
    );
  }

  /**
 * Creates a new event
 * @param eventData - The event data to create
 * @returns Promise<ApiResponse<Event>> - The created event
 */
static async createEvent(eventData: {
  title: string;
  description?: string;
  venue?: string;
  startTime: string;
  endTime: string;
  eventScope: 'UNIVERSITY' | 'PUBLIC';
  timeZone: string;
  eventType: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
  onlineLink?: string;
  termsCondition?: string;
  backgroundImage?: string;
}): Promise<ApiResponse<Event>> {
  return this.fetchData<Event>(
    '/event/create',
    'POST',
    eventData,
    true
  );
}

/**
 * Fetches events based on eventScope
 * @param eventScope - The scope of events to fetch ('UNIVERSITY' or 'PUBLIC')
 * @returns Promise<ApiResponse<Event[]>> - List of events
 */
static async getEvents(eventScope: 'UNIVERSITY' | 'PUBLIC'): Promise<ApiResponse<Event[]>> {
  try {
    // Get the token and decode it to display the identityId
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        // Split the JWT and decode the payload
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('Token payload:', payload);
          console.log('Identity ID from token:', payload.identityId);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    console.log('Fetching events with scope:', eventScope);
    
    // Check student status before making events request
    const studentStatus = await this.getStudentStatus();
    console.log('Student status response:', studentStatus);
    
    const response = await this.fetchData<Event[]>(
      `/event/events?eventScope=${eventScope}`,
      'GET',
      undefined,
      true
    );
    
    console.log('Events response:', response);
    return response;
  } catch (error: any) {
    console.error('Error in getEvents:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch events',
    };
  }
}

/**
 * Registers a student for an event
 * @param eventId - The ID of the event to register for
 * @returns Promise<ApiResponse<RegisteredEvent>> - Registration confirmation
 */
static async registerForEvent(eventId: string): Promise<ApiResponse<RegisteredEvent>> {
  return this.fetchData<RegisteredEvent>(
    '/event/register',
    'POST',
    { eventId },
    true
  );
}

/**
 * Fetches registered students for an event
 * @param eventId - The ID of the event
 * @returns Promise<ApiResponse<RegisteredStudent[]>> - List of registered students
 */
static async getRegisteredStudents(eventId: string): Promise<ApiResponse<RegisteredStudent[]>> {
  return this.fetchData<RegisteredStudent[]>(
    `/event/registered?id=${eventId}`,
    'GET',
    undefined,
    true
  );
}

/**
 * Deletes an event
 * @param eventId - The ID of the event to delete
 * @returns Promise<ApiResponse<{ eventId: string }>> - Deletion confirmation
 */
static async deleteEvent(eventId: string): Promise<ApiResponse<{ eventId: string }>> {
  return this.fetchData<{ eventId: string }>(
    `/event/${eventId}`,
    'DELETE',
    undefined,
    true
  );
}

/**
 * Updates an event
 * @param eventId - The ID of the event to update
 * @param eventData - The event data to update
 * @returns Promise<ApiResponse<Event>> - The updated event
 */
static async editEvent(
  eventId: string,
  eventData: Partial<{
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    eventScope: 'UNIVERSITY' | 'PUBLIC';
    timeZone: string;
    eventType: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
    onlineLink: string;
    backgroundImage: string;
    termsCondition: string;
    venue: string;
  }>
): Promise<ApiResponse<Event>> {
  return this.fetchData<Event>(
    `/event/${eventId}`,
    'PUT',
    eventData,
    true
  );
}

/**
 * Fetches event by ID
 * @param eventId - The ID of the event
 * @returns Promise<ApiResponse<Event>> - Event details
 */
static async getEventById(eventId: string): Promise<ApiResponse<Event>> {
  return this.fetchData<Event>(
    `/event/${eventId}`,
    'GET',
    undefined,
    true
  );
}

/**
 * Cancels a user's registration for an event
 * @param eventId - The ID of the event
 * @returns Promise<ApiResponse<{ eventId: string }>> - Cancellation confirmation
 */
static async cancelEventRegistration(eventId: string): Promise<ApiResponse<{ eventId: string }>> {
  return this.fetchData<{ eventId: string }>(
    `/event/register/${eventId}`,
    'DELETE',
    undefined,
    true
  );
}
  // User Profile Management

  /**
   * Fetches the current user's profile information
   * @returns Promise<ApiResponse<User>> - The user's profile data
   */
  static async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await this.fetchData<User>(
        '/user/profile',
        'GET',
        undefined,
        true
      );
      if (response.success && response.data) {
        // Update stored user info
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      }
      return response;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch user profile',
      };
    }
  }

  /**
   * Updates the current user's profile information
   * @param userData - Partial user data to update
   * @returns Promise<ApiResponse<User>> - Updated user profile
   */
  static async updateUserProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await this.fetchData<User>(
        '/user/profile',
        'PUT',
        userData,
        true
      );
      if (response.success && response.data) {
        // Update stored user info
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
      }
      return response;
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        message: error.message || 'Failed to update user profile',
      };
    }
  }

  // Event Attendance Tracking

  /**
   * Marks attendance for an event
   * @param eventId - The ID of the event
   * @param userId - The ID of the user attending
   * @returns Promise<ApiResponse<{ eventId: string, userId: string }>> - Attendance confirmation
   */
  static async markEventAttendance(eventId: string, userId: string): Promise<ApiResponse<{ eventId: string, userId: string }>> {
    return this.fetchData<{ eventId: string, userId: string }>(
      '/event/attendance',
      'POST',
      { eventId, userId },
      true
    );
  }

  /**
   * Gets the list of events the user has registered for
   * @param userId - The ID of the user
   * @returns Promise<ApiResponse<RegisteredEvent[]>> - List of registered events
   */
  static async getUserRegisteredEvents(userId: string): Promise<ApiResponse<RegisteredEvent[]>> {
    return this.fetchData<RegisteredEvent[]>(
      `/event/registered/${userId}`,
      'GET',
      undefined,
      true
    );
  }

  /**
   * Gets the list of events the user has attended
   * @param userId - The ID of the user
   * @returns Promise<ApiResponse<Event[]>> - List of attended events
   */
  static async getUserAttendedEvents(userId: string): Promise<ApiResponse<Event[]>> {
    return this.fetchData<Event[]>(
      `/event/attended/${userId}`,
      'GET',
      undefined,
      true
    );
  }

  // Utility Methods

  /**
   * Checks if the user has a premium subscription
   * @returns Promise<ApiResponse<{ isPremium: boolean }>> - Premium status
   */
  static async checkPremiumStatus(): Promise<ApiResponse<{ isPremium: boolean }>> {
    return this.fetchData<{ isPremium: boolean }>(
      '/user/premium-status',
      'GET',
      undefined,
      true
    );
  }

}

export default ApiService;