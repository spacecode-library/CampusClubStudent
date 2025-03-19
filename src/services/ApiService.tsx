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

class ApiService {

  static mapApiRedemptionToViewRedemption(apiRedemption: any): Redemption {
    // The API response contains redemption populated with discountId object
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
      // Map each API redemption to the view format
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
      // Transform the API redemption to match the component Redemption interface
      const mappedRedemption = this.mapApiRedemptionToViewRedemption(response.data);
      
      // Create a new response object with the correct type
      return {
        success: response.success,
        message: response.message,
        data: mappedRedemption
      };
    }
    
    // Create a new response object without data
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

// Inside ApiService class in ApiService.tsx
static async getStudentId(): Promise<string> {
  try {
    // First, get student data from the API
    const studentStatus = await this.getStudentStatus();
    
    if (studentStatus.success && studentStatus.data) {
      // Try to get any ID from the response
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (userJson) {
        const userData = JSON.parse(userJson);
        if (userData.id) {
          return userData.id;
        }
      }
    }
    
    // Fallback to a generic ID for testing purposes
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

  // Generic fetch method with error handling and token refresh
  private static async fetchData<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any,
    requiresAuth = true
  ): Promise<ApiResponse<T>> {
    try {
      const headers = requiresAuth 
        ? await this.getAuthHeader() 
        : { 'Content-Type': 'application/json' };
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle token refresh if 401
        if (response.status === 401 && requiresAuth) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the request
            return this.fetchData(endpoint, method, body, requiresAuth);
          }
        }
        
        return {
          success: false,
          message: Array.isArray(data.message) ? data.message[0] : data.message || 'An error occurred',
        };
      }
      
      return data as ApiResponse<T>;
    } catch (error: any) {
      console.error('API Error:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }
  
  // Auth Methods
  
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
    
    if (response.success && response.data) {
      // Store tokens
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      
      // Try to get email from local storage
      try {
        const cachedEmail = await AsyncStorage.getItem('@temp_registration_email');
        
        // Store basic user info
        const userInfo = {
          id: response.data.identityId,
          email: cachedEmail // Add email if available
        };
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userInfo));
        
        // Clean up temporary storage
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
      // Store tokens
      await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      
      // Store basic user info
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
        // No refresh token available
        await this.logout();
        return false;
      }
      
      const response = await fetch(`${API_URL}/user/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      
      const data = await response.json() as ApiResponse<AuthResponse>;
      
      if (data.success && data.data) {
        // Update stored tokens
        await AsyncStorage.setItem(TOKEN_KEY, data.data.token);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);
        return true;
      } else {
        // Refresh failed
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
      // Get refresh token for logout API
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      
      // Clear local storage
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      
      // Call logout API if we have a token
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
  
  // Check if user is logged in
  static async isLoggedIn(): Promise<boolean> {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  }
  
  // Student Onboarding Methods
  
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
          // Don't set Content-Type here, it will be set automatically for FormData
        },
        body: file,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: Array.isArray(data.message) ? data.message[0] : data.message || 'An error occurred',
        };
      }
      
      return data as ApiResponse<any>;
    } catch (error: any) {
      console.error('API Error:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }
  
  // Get student status
  static async getStudentStatus(): Promise<ApiResponse<StudentDetails>> {
    return this.fetchData<StudentDetails>(
      '/student/status',
      'GET',
      undefined,
      true
    );
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
  
  // Redeem a discount
  static async redeemDiscount(discountId: string): Promise<ApiResponse<{redeemCode: string}>> {
    return this.fetchData<{redeemCode: string}>(
      `/discounts/${discountId}/redeem`,
      'POST',
      undefined,
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



  
}

export default ApiService;