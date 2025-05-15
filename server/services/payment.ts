import { PaymentGateway, SubscriptionPlan, PLAN_LIMITS } from '../../shared/schema';
import { Request, Response } from 'express';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        organizationId: number;
        role: string;
      };
    }
  }
}

interface PaymentInitParams {
  amount: number;
  email: string;
  name: string;
  organizationId: number;
  planId: SubscriptionPlan;
  gateway: PaymentGateway;
  callbackUrl: string;
}

interface PaymentSuccessResponse {
  success: boolean;
  redirectUrl?: string;
  reference?: string;
  message?: string;
}

/**
 * Initialize a payment for subscription
 */
export async function initializePayment(params: PaymentInitParams): Promise<PaymentSuccessResponse> {
  const { amount, email, name, organizationId, planId, gateway, callbackUrl } = params;
  
  try {
    // In a real implementation, this would call the actual payment gateway APIs
    switch (gateway) {
      case PaymentGateway.FLUTTERWAVE:
        return initializeFlutterwavePayment(params);
      case PaymentGateway.PAYSTACK:
        return initializePaystackPayment(params);
      default:
        throw new Error('Unsupported payment gateway');
    }
  } catch (error) {
    console.error('Payment initialization failed:', error);
    return {
      success: false,
      message: 'Failed to initialize payment. Please try again later.'
    };
  }
}

/**
 * Initialize Flutterwave payment
 */
async function initializeFlutterwavePayment(params: PaymentInitParams): Promise<PaymentSuccessResponse> {
  const { amount, email, name, organizationId, planId, callbackUrl } = params;
  
  // This would typically make an API call to Flutterwave
  // For demo purposes, we'll just return a mock response
  const mockReference = `FLW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  return {
    success: true,
    reference: mockReference,
    redirectUrl: `https://flutterwave.com/pay/${mockReference}`, // This would be a real URL in production
    message: 'Payment initiated successfully'
  };
}

/**
 * Initialize Paystack payment
 */
async function initializePaystackPayment(params: PaymentInitParams): Promise<PaymentSuccessResponse> {
  const { amount, email, name, organizationId, planId, callbackUrl } = params;
  
  // This would typically make an API call to Paystack
  // For demo purposes, we'll just return a mock response
  const mockReference = `PSK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  return {
    success: true,
    reference: mockReference,
    redirectUrl: `https://paystack.com/pay/${mockReference}`, // This would be a real URL in production
    message: 'Payment initiated successfully'
  };
}

/**
 * Verify a payment
 */
export async function verifyPayment(reference: string, gateway: PaymentGateway): Promise<boolean> {
  try {
    // In a real implementation, this would verify with the actual payment gateway
    switch (gateway) {
      case PaymentGateway.FLUTTERWAVE:
        return verifyFlutterwavePayment(reference);
      case PaymentGateway.PAYSTACK:
        return verifyPaystackPayment(reference);
      default:
        throw new Error('Unsupported payment gateway');
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    return false;
  }
}

/**
 * Verify Flutterwave payment
 */
async function verifyFlutterwavePayment(reference: string): Promise<boolean> {
  // This would typically make an API call to Flutterwave to verify the payment
  // For demo purposes, we'll assume it's successful if the reference starts with 'FLW-'
  return reference.startsWith('FLW-');
}

/**
 * Verify Paystack payment
 */
async function verifyPaystackPayment(reference: string): Promise<boolean> {
  // This would typically make an API call to Paystack to verify the payment
  // For demo purposes, we'll assume it's successful if the reference starts with 'PSK-'
  return reference.startsWith('PSK-');
}

/**
 * Calculate the price for a subscription plan
 */
export function calculatePlanPrice(planId: SubscriptionPlan): number {
  if (planId === SubscriptionPlan.FREE_TRIAL) return 0;
  
  const planLimits = PLAN_LIMITS[planId];
  return planLimits.price || 0;
}

/**
 * Create payment routes
 */
export function setupPaymentRoutes(app: any) {
  // Initialize payment
  app.post('/api/payment/initialize', async (req: Request, res: Response) => {
    try {
      const { planId, gateway, callbackUrl } = req.body;
      
      if (!planId || !gateway || !callbackUrl) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required parameters' 
        });
      }
      
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      const amount = calculatePlanPrice(planId as SubscriptionPlan);
      if (amount <= 0 && planId !== SubscriptionPlan.FREE_TRIAL) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid plan selected' 
        });
      }
      
      const params: PaymentInitParams = {
        amount,
        email: req.user.email,
        name: req.user.name,
        organizationId: req.user.organizationId,
        planId: planId as SubscriptionPlan,
        gateway: gateway as PaymentGateway,
        callbackUrl
      };
      
      const result = await initializePayment(params);
      res.json(result);
    } catch (error) {
      console.error('Payment initialization error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to initialize payment' 
      });
    }
  });

  // Verify payment
  app.get('/api/payment/verify', async (req: Request, res: Response) => {
    try {
      const { reference, gateway } = req.query;
      
      if (!reference || !gateway) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required parameters' 
        });
      }
      
      const isSuccess = await verifyPayment(
        reference as string, 
        gateway as PaymentGateway
      );
      
      res.json({ 
        success: isSuccess,
        message: isSuccess 
          ? 'Payment verified successfully' 
          : 'Payment verification failed'
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to verify payment' 
      });
    }
  });
  
  // Set up webhook endpoints for payment notifications (from payment gateways)
  app.post('/api/webhooks/flutterwave', (req: Request, res: Response) => {
    // Process Flutterwave webhook
    console.log('Flutterwave webhook received:', req.body);
    res.sendStatus(200);
  });
  
  app.post('/api/webhooks/paystack', (req: Request, res: Response) => {
    // Process Paystack webhook
    console.log('Paystack webhook received:', req.body);
    res.sendStatus(200);
  });
}