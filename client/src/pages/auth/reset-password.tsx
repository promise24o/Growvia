import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import loginCharacter from "@/assets/illustrations/login-character.png";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Get query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const userId = searchParams.get('id');
  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Validate the token when the component mounts
  useEffect(() => {
    async function validateToken() {
      if (!userId || !token) {
        setIsTokenValid(false);
        setTokenError("Invalid password reset link. Please request a new one.");
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, token }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          setIsTokenValid(false);
          setTokenError(data.message || "Invalid or expired token. Please request a new password reset link.");
          return;
        }

        setIsTokenValid(true);
      } catch (error) {
        console.error("Token validation error:", error);
        setIsTokenValid(false);
        setTokenError("An error occurred while validating your reset link. Please try again.");
      }
    }

    validateToken();
  }, [userId, token]);

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!userId || !token) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token,
          newPassword: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset password');
      }

      setIsSuccess(true);
      toast({
        title: "Password reset successful",
        description: "Your password has been updated successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row authentication-wrapper">
      {/* Left Panel with Illustration - hidden on mobile */}
      <div
        className="hidden lg:block lg:w-[60%] h-screen overflow-y-auto fixed top-0 left-0"
        style={{ backgroundColor: "#161D31" }}
      >
        {/* Left side content wrapper */}
        <div className="w-full h-full flex flex-col">
          {/* Logo for large screens - always at top */}
          <div className="p-6">
            <Link href="/" className="flex items-center">
              <div className="bg-primary text-white p-2 rounded">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="ml-2 text-xl font-bold text-white">Growvia</span>
            </Link>
          </div>

          {/* Main content section - centered vertically */}
          <div className="flex-grow flex flex-col justify-center items-center px-8">
            {/* Text above the illustration */}
            <div className="text-center mb-8 text-white w-full max-w-lg">
              <h2 className="text-3xl font-bold mb-4">
                Welcome to <span className="text-primary">Growvia</span>
              </h2>
              <p className="text-lg mb-2">
                The complete affiliate marketing platform
              </p>
              <p className="text-base opacity-80">
                Manage marketers, track conversions, and process commissions
                with our powerful SaaS solution.
              </p>
            </div>

            {/* Character image */}
            <div className="w-[280px] mx-auto">
              <img src={loginCharacter} alt="Login" className="max-w-full" />
            </div>
          </div>

          {/* Copyright text at the bottom - always at bottom */}
          <div className="p-6 text-center text-white opacity-70 text-sm">
            © {new Date().getFullYear()} Growvia. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Reset Password Form */}
      <div className="w-full lg:w-[40%] lg:ml-[60%] min-h-screen overflow-y-auto p-5 md:p-8 bg-white dark:bg-[#283046] flex flex-col">
        <div className="w-full max-w-[400px] mx-auto py-6 flex-1">
          {/* Mobile logo */}
          <div className="flex justify-center md:hidden mb-8">
            <Link href="/" className="flex items-center">
              <div className="bg-primary text-white p-2 rounded">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="ml-2 text-xl font-bold text-slate-800 dark:text-white">
                Growvia
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <h3 className="text-[1.625rem] font-semibold mb-1 text-slate-900 dark:text-white">
              Reset Password 🔒
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isSuccess 
                ? "Your password has been reset successfully" 
                : "Enter your new password below"}
            </p>
          </div>

          {isTokenValid === null ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isTokenValid === false ? (
            <div className="space-y-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid Reset Link</AlertTitle>
                <AlertDescription>
                  {tokenError || "This password reset link is invalid or has expired. Please request a new one."}
                </AlertDescription>
              </Alert>
              
              <div className="w-full text-center mt-6">
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center justify-center w-full text-white bg-primary hover:bg-primary-600 h-11 px-4 font-medium rounded-md"
                >
                  Request new password reset
                </Link>
                
                <Link
                  href="/login"
                  className="inline-flex items-center mt-4 text-primary hover:text-primary-600 font-medium dark:text-primary-400 dark:hover:text-primary-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="space-y-6">
              <div className="flex justify-center py-10">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-500">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              </div>
              
              <p className="text-center text-slate-600 dark:text-slate-400">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              
              <Button
                className="w-full h-11 font-medium bg-primary hover:bg-primary-600 text-white"
                onClick={() => navigate("/login")}
              >
                Go to login
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        New Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="············"
                            className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-white pr-10"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        Confirm Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="············"
                            className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-white pr-10"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Password must have at least 8 characters, one uppercase letter, one lowercase letter, and one number.
                      </p>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 font-medium bg-primary hover:bg-primary-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>

                <div className="w-full text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-primary hover:text-primary-600 font-medium dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}