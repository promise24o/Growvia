import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2Icon, XCircleIcon, RefreshCwIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function PaymentSuccessPage() {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying your payment...');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const verifyPaymentStatus = async () => {
      try {
        // Get reference and gateway from URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const reference = urlParams.get('reference') || urlParams.get('tx_ref');
        const gateway = urlParams.get('gateway') || 'flutterwave'; // Default to flutterwave if not specified
        
        if (!reference) {
          setVerificationStatus('error');
          setMessage('Payment reference not found. Please contact support.');
          return;
        }
        
        // Call API to verify payment
        const response = await apiRequest(`/api/payment/verify?reference=${reference}&gateway=${gateway}`);
        
        if (response.success) {
          setVerificationStatus('success');
          setMessage('Your payment was successful! Your subscription has been updated.');
          
          // Invalidate organization query to refresh subscription data
          queryClient.invalidateQueries({ queryKey: ['/api/organization'] });
          
          // Show success toast
          toast({
            title: 'Payment Successful',
            description: 'Your subscription has been updated successfully.',
            variant: 'default',
          });
        } else {
          setVerificationStatus('error');
          setMessage(response.message || 'Payment verification failed. Please contact support.');
          
          // Show error toast
          toast({
            title: 'Payment Verification Failed',
            description: response.message || 'Please try again or contact support.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        setVerificationStatus('error');
        setMessage('An error occurred during payment verification. Please contact support.');
        
        // Show error toast
        toast({
          title: 'Error',
          description: 'An error occurred during payment verification. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    verifyPaymentStatus();
  }, [toast, queryClient]);
  
  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };
  
  return (
    <div className="container max-w-md py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {verificationStatus === 'loading' && (
              <RefreshCwIcon className="h-16 w-16 text-primary animate-spin" />
            )}
            {verificationStatus === 'success' && (
              <CheckCircle2Icon className="h-16 w-16 text-green-500" />
            )}
            {verificationStatus === 'error' && (
              <XCircleIcon className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verificationStatus === 'loading' && 'Processing Payment'}
            {verificationStatus === 'success' && 'Payment Successful'}
            {verificationStatus === 'error' && 'Payment Failed'}
          </CardTitle>
          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationStatus === 'success' && (
            <div className="bg-green-50 border border-green-100 p-4 rounded-lg mb-4">
              <p className="text-sm text-green-800">
                Your subscription has been updated successfully. Your new plan is now active.
              </p>
            </div>
          )}
          {verificationStatus === 'error' && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-lg mb-4">
              <p className="text-sm text-red-800">
                We couldn't verify your payment. If you believe this is an error, please contact our support team.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {verificationStatus === 'loading' ? (
            <Button disabled>
              <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </Button>
          ) : (
            <Button onClick={handleBackToDashboard}>
              Back to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Show support info if there's an error */}
      {verificationStatus === 'error' && (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need help? Contact support at <Link href="mailto:support@growvia.com" className="text-primary hover:underline">support@growvia.com</Link>
          </p>
        </div>
      )}
    </div>
  );
}