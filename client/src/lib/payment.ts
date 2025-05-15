import { SubscriptionPlan } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

// Define payment gateway enum
export enum PaymentGateway {
  FLUTTERWAVE = 'flutterwave',
  PAYSTACK = 'paystack',
}

// Define payment response interface
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
  const { planId, gateway, onSuccess, onError } = options;
  
  // Get the current domain for callback URL
  const callbackUrl = `${window.location.origin}/settings?payment=verify`;
  
  try {
    const response = await fetch('/api/payment/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId,
        gateway,
        callbackUrl
      })
    });
    
    const data = await response.json() as PaymentResponse;
    
    if (data.success && data.redirectUrl) {
      // Store payment info in session for verification later
      sessionStorage.setItem('paymentRef', data.reference || '');
      sessionStorage.setItem('paymentGateway', gateway);
      sessionStorage.setItem('paymentPlan', planId);
      
      // Redirect to payment page
      if (onSuccess) {
        onSuccess(data);
      } else {
        window.location.href = data.redirectUrl;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Payment initialization failed:', error);
    if (onError) {
      onError(error);
    }
    return {
      success: false,
      message: 'Payment initialization failed. Please try again later.'
    };
  }
}

/**
 * Verify a payment
 */
export async function verifyPayment(reference: string, gateway: PaymentGateway): Promise<PaymentResponse> {
  try {
    const response = await fetch(`/api/payment/verify?reference=${reference}&gateway=${gateway}`, {
      method: 'GET',
    });
    
    const data = await response.json() as PaymentResponse;
    
    if (data.success) {
      // Clear payment session data
      sessionStorage.removeItem('paymentRef');
      sessionStorage.removeItem('paymentGateway');
      sessionStorage.removeItem('paymentPlan');
    }
    
    return data;
  } catch (error) {
    console.error('Payment verification failed:', error);
    return {
      success: false,
      message: 'Payment verification failed. Please contact support.'
    };
  }
}

/**
 * Check for pending payment verification
 * This should be called when the page loads to check if we're returning from a payment gateway
 */
export function checkPendingPayment(): { isPending: boolean; reference?: string; gateway?: PaymentGateway } {
  const searchParams = new URLSearchParams(window.location.search);
  const paymentStatus = searchParams.get('payment');
  
  if (paymentStatus === 'verify') {
    const reference = sessionStorage.getItem('paymentRef');
    const gateway = sessionStorage.getItem('paymentGateway') as PaymentGateway;
    
    if (reference && gateway) {
      return { isPending: true, reference, gateway };
    }
  }
  
  return { isPending: false };
}

/**
 * Hook for handling payment operations
 */
export function usePayment() {
  const { toast } = useToast();
  
  const processPayment = async (planId: SubscriptionPlan, gateway: PaymentGateway) => {
    toast({
      title: "Initializing payment...",
      description: "Please wait while we prepare your payment."
    });
    
    const response = await initializePayment({
      planId,
      gateway,
      onSuccess: (res) => {
        toast({
          title: "Payment initialized",
          description: "You will be redirected to complete your payment."
        });
      },
      onError: (error) => {
        toast({
          title: "Payment failed",
          description: "There was an error initializing your payment. Please try again.",
          variant: "destructive"
        });
      }
    });
    
    return response;
  };
  
  const verifyPendingPayment = async () => {
    const { isPending, reference, gateway } = checkPendingPayment();
    
    if (isPending && reference && gateway) {
      toast({
        title: "Verifying payment...",
        description: "Please wait while we verify your payment."
      });
      
      const result = await verifyPayment(reference, gateway);
      
      if (result.success) {
        toast({
          title: "Payment successful",
          description: "Your subscription has been updated successfully."
        });
        // Reload user data to get updated subscription info
        window.location.href = '/settings';
      } else {
        toast({
          title: "Payment verification failed",
          description: result.message || "We couldn't verify your payment. Please contact support.",
          variant: "destructive"
        });
      }
    }
    
    return isPending;
  };
  
  return {
    processPayment,
    verifyPendingPayment
  };
}