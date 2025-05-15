import { useState } from "react";
import { Link } from "wouter";
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
import { BarChart3, ArrowLeft, Mail } from "lucide-react";
import loginCharacter from "@/assets/illustrations/login-character.png";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send password reset request');
      }

      setIsEmailSent(true);
      toast({
        title: "Reset link sent",
        description: "If your email exists in our system, you will receive a password reset link shortly",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Request failed",
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

      {/* Right Panel - Forgot Password Form */}
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
              Forgot Password? 🔒
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isEmailSent 
                ? "We've sent a password reset link to your email address. Please check your inbox." 
                : "Enter your email and we'll send you instructions to reset your password"}
            </p>
          </div>

          {isEmailSent ? (
            <div className="space-y-6">
              <div className="flex justify-center py-10">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="h-10 w-10" />
                </div>
              </div>
              
              <p className="text-center text-slate-600 dark:text-slate-400">
                If you don't receive an email within a few minutes, check your spam folder or try again with a different email address.
              </p>
              
              <Button
                className="w-full h-11 font-medium bg-primary hover:bg-primary-600 text-white"
                onClick={() => setIsEmailSent(false)}
              >
                Try again
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
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-white"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 font-medium bg-primary hover:bg-primary-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send reset link"}
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