import { SubscriptionPlan } from '@shared/schema';
import { apiRequest, queryClient } from './queryClient';
import { useToast } from '@/hooks/use-toast';

export enum PaymentGateway {
  FLUTTERWAVE = 'flutterwave',
  PAYSTACK = 'paystack',
}

export interface PaymentResponse {
  success: boolean;
  redirectUrl?: string;
  reference?: string;
  message?: string;
}

export interface PaymentOptions {
  planId: SubscriptionPlan;
  gateway: PaymentGateway;
  onSuccess?: (response: PaymentResponse) => void;
  onError?: (error: any) => void;
}

/**
 * Initialize a payment for subscription
 */
export async function initializePayment(options: PaymentOptions): Promise<PaymentResponse> {
  try {
    // Get the current window location for the callback URL
    const callbackUrl = `${window.location.origin}/settings/billing/success`;
    
    // Make the API request to initialize payment
    const response = await apiRequest<PaymentResponse>('/api/payment/initialize', {
      method: 'POST',
      body: JSON.stringify({
        planId: options.planId,
        gateway: options.gateway,
        callbackUrl,
      }),
    });
    
    // Handle success callback if provided
    if (response.success && options.onSuccess) {
      options.onSuccess(response);
    }
    
    return response;
  } catch (error: any) {
    // Handle error callback if provided
    if (options.onError) {
      options.onError(error);
    }
    
    return {
      success: false,
      message: error?.message || 'Failed to initialize payment',
    };
  }
}

/**
 * Verify a payment
 */
export async function verifyPayment(reference: string, gateway: PaymentGateway): Promise<PaymentResponse> {
  try {
    // Make the API request to verify payment
    const response = await apiRequest<PaymentResponse>(`/api/payment/verify?reference=${reference}&gateway=${gateway}`);
    
    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Failed to verify payment',
    };
  }
}

/**
 * Check for pending payment verification
 * This should be called when the page loads to check if we're returning from a payment gateway
 */
export function checkPendingPayment(): { isPending: boolean; reference?: string; gateway?: PaymentGateway } {
  // Check URL query parameters for reference and gateway
  const urlParams = new URLSearchParams(window.location.search);
  const reference = urlParams.get('reference');
  const gateway = urlParams.get('gateway') as PaymentGateway;
  
  if (reference && gateway) {
    return {
      isPending: true,
      reference,
      gateway,
    };
  }
  
  return { isPending: false };
}

/**
 * Hook for handling payment operations
 */
export function usePayment() {
  const { toast } = useToast();
  
  const processPayment = async (planId: SubscriptionPlan, gateway: PaymentGateway) => {
    try {
      // Show loading toast
      toast({
        title: 'Processing Payment',
        description: 'Please wait while we redirect you to the payment page...',
      });
      
      // Initialize payment
      const response = await initializePayment({
        planId,
        gateway,
        onError: (error) => {
          toast({
            title: 'Payment Failed',
            description: error.message || 'Failed to initialize payment. Please try again.',
            variant: 'destructive',
          });
        },
      });
      
      // If successful and has redirect URL, redirect to payment page
      if (response.success && response.redirectUrl) {
        window.location.href = response.redirectUrl;
      } else {
        // Show error toast
        toast({
          title: 'Payment Failed',
          description: response.message || 'Failed to initialize payment. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return {
    processPayment,
    checkPendingPayment,
    verifyPayment,
  };
}