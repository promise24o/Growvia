import { PaymentGateway, PLAN_LIMITS, SubscriptionPlan } from "@shared/schema";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { MongoStorage } from "server/mongoStorage";
import { IStorage } from "server/storage";
import { log } from "../vite";

// Explicitly declare storage
const storage: IStorage = new MongoStorage();

// Add type for request with user info (updated for MongoDB string IDs)
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        organizationId: string;
        role: string;
      };
    }
  }
}

// Payment initialization parameters
interface PaymentInitParams {
  amount: number;
  email: string;
  name: string;
  organizationId: string;
  planId: SubscriptionPlan;
  gateway: PaymentGateway;
  callbackUrl: string;
}

// Payment response structure
interface PaymentSuccessResponse {
  success: boolean;
  redirectUrl?: string;
  reference?: string;
  message?: string;
}

/**
 * Initialize a payment for subscription
 */
export async function initializePayment(
  params: PaymentInitParams
): Promise<PaymentSuccessResponse> {
  try {
    const { gateway, planId } = params;

    // Calculate price based on plan
    const amount = calculatePlanPrice(planId);
    params.amount = amount;

    // Initialize payment with the selected gateway
    if (gateway === PaymentGateway.FLUTTERWAVE) {
      return await initializeFlutterwavePayment(params);
    } else if (gateway === PaymentGateway.PAYSTACK) {
      return await initializePaystackPayment(params);
    } else {
      return {
        success: false,
        message: "Invalid payment gateway selected",
      };
    }
  } catch (error) {
    log(`Payment initialization error: ${error}`, "payment");
    return {
      success: false,
      message: "Failed to initialize payment",
    };
  }
}

/**
 * Initialize Flutterwave payment
 */
async function initializeFlutterwavePayment(
  params: PaymentInitParams
): Promise<PaymentSuccessResponse> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Generate a unique reference for this transaction
    const reference = `FLW-${Date.now()}-${Math.floor(
      Math.random() * 1000000
    )}`;

    // In a real implementation, we would make an API call to Flutterwave's API
    // For this simulation, we'll just create a mock response with a redirect URL

    // Track the pending payment in activity log
    await storage.createActivity(
      {
        organizationId: params.organizationId,
        type: "payment_initiated",
        description: `Payment initiated for ${params.planId} plan via Flutterwave`,
        metadata: {
          reference,
          amount: params.amount,
          plan: params.planId,
          gateway: PaymentGateway.FLUTTERWAVE,
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Return success with redirect URL
    // In production, this would be the URL provided by the Flutterwave API
    return {
      success: true,
      redirectUrl: `${params.callbackUrl}?reference=${reference}&gateway=${PaymentGateway.FLUTTERWAVE}`,
      reference,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    log(`Flutterwave payment error: ${error}`, "payment");
    return {
      success: false,
      message: "Failed to initialize Flutterwave payment",
    };
  }
}

/**
 * Initialize Paystack payment
 */
async function initializePaystackPayment(
  params: PaymentInitParams
): Promise<PaymentSuccessResponse> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Generate a unique reference for this transaction
    const reference = `PSK-${Date.now()}-${Math.floor(
      Math.random() * 1000000
    )}`;

    // In a real implementation, we would make an API call to Paystack's API
    // For this simulation, we'll just create a mock response with a redirect URL

    // Track the pending payment in activity log
    await storage.createActivity(
      {
        organizationId: params.organizationId,
        type: "payment_initiated",
        description: `Payment initiated for ${params.planId} plan via Paystack`,
        metadata: {
          reference,
          amount: params.amount,
          plan: params.planId,
          gateway: PaymentGateway.PAYSTACK,
        },
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Return success with redirect URL
    // In production, this would be the URL provided by the Paystack API
    return {
      success: true,
      redirectUrl: `${params.callbackUrl}?reference=${reference}&gateway=${PaymentGateway.PAYSTACK}`,
      reference,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    log(`Paystack payment error: ${error}`, "payment");
    return {
      success: false,
      message: "Failed to initialize Paystack payment",
    };
  }
}

/**
 * Verify a payment
 */
export async function verifyPayment(
  reference: string,
  gateway: PaymentGateway
): Promise<boolean> {
  try {
    if (gateway === PaymentGateway.FLUTTERWAVE) {
      return await verifyFlutterwavePayment(reference);
    } else if (gateway === PaymentGateway.PAYSTACK) {
      return await verifyPaystackPayment(reference);
    } else {
      return false;
    }
  } catch (error) {
    log(`Payment verification error: ${error}`, "payment");
    return false;
  }
}

/**
 * Verify Flutterwave payment
 */
async function verifyFlutterwavePayment(reference: string): Promise<boolean> {
  try {
    // In a real implementation, we would make an API call to Flutterwave's API
    // For this simulation, we'll just return true
    return true;
  } catch (error) {
    log(`Flutterwave verification error: ${error}`, "payment");
    return false;
  }
}

/**
 * Verify Paystack payment
 */
async function verifyPaystackPayment(reference: string): Promise<boolean> {
  try {
    // In a real implementation, we would make an API call to Paystack's API
    // For this simulation, we'll just return true
    return true;
  } catch (error) {
    log(`Paystack verification error: ${error}`, "payment");
    return false;
  }
}

/**
 * Calculate the price for a subscription plan
 */
export function calculatePlanPrice(planId: SubscriptionPlan): number {
  const planLimit = PLAN_LIMITS[planId];
  if (planLimit && "price" in planLimit && planLimit.price !== null) {
    return planLimit.price * 100; // Convert to cents
  }
  return 0; // Default to 0 for FREE_TRIAL or ENTERPRISE (null price)
}

/**
 * Create payment routes
 */
export function setupPaymentRoutes(app: any) {
  // Initialize payment route
  app.post("/api/payment/initialize", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.organizationId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { planId, gateway, callbackUrl } = req.body;

      if (!planId || !gateway || !callbackUrl) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // Get organization
      const organization = await storage.getOrganization(
        req.user.organizationId
      );
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }

      // Get user
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prepare payment parameters
      const params: PaymentInitParams = {
        amount: 0, // Will be calculated in initializePayment
        email: organization.email,
        name: organization.name,
        organizationId: organization.id,
        planId,
        gateway,
        callbackUrl,
      };

      // Initialize payment
      const result = await initializePayment(params);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      log(`Payment initialization route error: ${error}`, "payment");
      res.status(500).json({ message: "Failed to initialize payment" });
    }
  });

  // Verify payment route
  app.get("/api/payment/verify", async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { reference, gateway } = req.query;

      if (!reference || !gateway) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // Verify payment
      const isVerified = await verifyPayment(
        reference as string,
        gateway as PaymentGateway
      );

      if (isVerified) {
        // Update organization plan based on the reference
        const activities = await storage.getActivitiesByOrganization(
          req.user?.organizationId || ""
        );
        const paymentActivity = activities.find(
          (a) =>
            a.type === "payment_initiated" &&
            a.metadata &&
            (a.metadata as any).reference === reference
        );

        if (paymentActivity && paymentActivity.metadata) {
          const metadata = paymentActivity.metadata as any;
          const planId = metadata.plan;

          // Update organization plan
          if (req.user?.organizationId) {
            await storage.updateOrganization(
              req.user.organizationId,
              {
                plan: planId,
                trialEndsAt: null, // Clear trial end date if upgrading
              },
              { session }
            );

            // Log successful payment
            await storage.createActivity(
              {
                organizationId: req.user.organizationId,
                type: "payment_success",
                description: `Payment successful for ${planId} plan`,
                metadata: {
                  reference,
                  gateway,
                  plan: planId,
                },
              },
              { session }
            );
          }
        }

        await session.commitTransaction();
        session.endSession();
        res
          .status(200)
          .json({ success: true, message: "Payment verified successfully" });
      } else {
        await session.abortTransaction();
        session.endSession();
        res
          .status(400)
          .json({ success: false, message: "Payment verification failed" });
      }
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      log(`Payment verification route error: ${error}`, "payment");
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  // Webhooks for payment providers
  app.post("/api/webhooks/flutterwave", (req: Request, res: Response) => {
    // In a real implementation, we would validate the webhook signature
    // and process the webhook payload
    res.status(200).send("Webhook received");
  });

  app.post("/api/webhooks/paystack", (req: Request, res: Response) => {
    // In a real implementation, we would validate the webhook signature
    // and process the webhook payload
    res.status(200).send("Webhook received");
  });
}
