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
import { useToast } from '@/hooks/use-toast';
import { Loader2Icon, CheckCircle, XCircle } from 'lucide-react';
import { PaymentGateway, checkPendingPayment, verifyPayment } from '@/lib/payment';

export default function PaymentSuccessPage() {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying your payment...');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const verifyPaymentStatus = async () => {
      try {
        const { isPending, reference, gateway } = checkPendingPayment();
        
        if (!isPending || !reference || !gateway) {
          setVerificationStatus('error');
          setMessage('No payment details found. Please try again or contact support.');
          return;
        }
        
        // Verify the payment
        const response = await verifyPayment(reference, gateway as PaymentGateway);
        
        if (response.success) {
          setVerificationStatus('success');
          setMessage('Your payment was successful! Your subscription has been updated.');
          
          // Invalidate relevant queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/organization'] });
          
          toast({
            title: 'Payment Successful',
            description: 'Your subscription has been updated successfully.',
          });
        } else {
          setVerificationStatus('error');
          setMessage(response.message || 'Payment verification failed. Please contact support.');
          
          toast({
            title: 'Payment Verification Failed',
            description: response.message || 'Please contact support for assistance.',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        setVerificationStatus('error');
        setMessage(error?.message || 'An error occurred while verifying your payment.');
        
        toast({
          title: 'Payment Verification Error',
          description: error?.message || 'An error occurred while verifying your payment.',
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
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {verificationStatus === 'loading' && 'Processing Payment'}
            {verificationStatus === 'success' && 'Payment Successful'}
            {verificationStatus === 'error' && 'Payment Failed'}
          </CardTitle>
          <CardDescription className="text-center">
            {verificationStatus === 'loading' && 'Please wait while we verify your payment...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {verificationStatus === 'loading' && (
            <Loader2Icon className="h-16 w-16 text-primary animate-spin mb-4" />
          )}
          {verificationStatus === 'success' && (
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          )}
          {verificationStatus === 'error' && (
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
          )}
          
          <p className="text-center mb-4">{message}</p>
          
          {verificationStatus === 'success' && (
            <p className="text-center text-muted-foreground">
              Your subscription has been activated and you now have access to all the features of your chosen plan.
            </p>
          )}
          
          {verificationStatus === 'error' && (
            <p className="text-center text-muted-foreground">
              If you believe this is an error, please contact our support team or try again.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {verificationStatus !== 'loading' && (
            <Button onClick={handleBackToDashboard}>
              Back to Dashboard
            </Button>
          )}
          
          {verificationStatus === 'error' && (
            <Link href="/settings/billing">
              <Button variant="outline" className="ml-2">
                Try Again
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}