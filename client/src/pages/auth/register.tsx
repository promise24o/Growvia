import registerCharacter from "@/assets/illustrations/register-character.png";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BarChart3,
  Eye,
  EyeOff,
  Facebook,
  Github,
  Mail,
  Twitter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "wouter";
import { z } from "zod";

const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    organizationName: z
      .string()
      .min(2, { message: "Organization name must be at least 2 characters" }),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and privacy policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const resendVerificationSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type ResendVerificationFormValues = z.infer<typeof resendVerificationSchema>;

export default function Register() {
  const [ navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      organizationName: "",
      agreeToTerms: false,
    },
  });

  const resendForm = useForm<ResendVerificationFormValues>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  async function onRegisterSubmit(data: RegisterFormValues) {
    setIsLoading(true);

    try {
      await register(
        data.name,
        data.email,
        data.password,
        data.organizationName
      );
      setIsVerificationSent(true);
      resendForm.setValue("email", data.email);
      setCountdown(120); // 2 minutes
      toast({
        title: "Please verify your email",
        description:
          "A verification email has been sent. Please check your inbox and verify your email to continue.",
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onResendSubmit(data: ResendVerificationFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to resend verification email"
        );
      }

      setCountdown(120); // Reset countdown
      toast({
        title: "Verification link sent",
        description: "A new verification email has been sent to your inbox.",
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      toast({
        title: "Request failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
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
        <div className="w-full h-full flex flex-col">
          <div className="p-6">
            <Link href="/" className="flex items-center">
              <div className="bg-primary text-white p-2 rounded">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="ml-2 text-xl font-bold text-white">Growvia</span>
            </Link>
          </div>
          <div className="flex-grow flex flex-col justify-center items-center px-8">
            <div className="text-center mb-8 text-white w-full max-w-lg">
              <h2 className="text-3xl font-bold mb-4">
                Join <span className="text-primary">Growvia</span> Today
              </h2>
              <p className="text-lg mb-2">
                Boost your affiliate marketing efforts
              </p>
              <p className="text-base opacity-80">
                Create your organization, invite marketers, and track
                performance all in one powerful platform.
              </p>
            </div>
            <div className="w-[280px] mx-auto">
              <img
                src={registerCharacter}
                alt="Register"
                className="max-w-full"
              />
            </div>
          </div>
          <div className="p-6 text-center text-white opacity-70 text-sm">
            © {new Date().getFullYear()} Growvia. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Register or Resend Verification Form */}
      <div className="w-full lg:w-[40%] lg:ml-[60%] min-h-screen overflow-y-auto p-5 md:p-8 bg-white dark:bg-[#283046] flex flex-col">
        <div className="w-full max-w-[400px] mx-auto py-6 flex-1">
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

          {isVerificationSent ? (
            <div className="space-y-6">
              <div className="mb-8">
                <h3 className="text-[1.625rem] font-semibold mb-1 text-slate-900 dark:text-white">
                  Verify Your Email 📧
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We've sent a verification link to your email. Please check
                  your inbox and verify to continue.
                </p>
              </div>

              <div className="flex justify-center py-10">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="h-10 w-10" />
                </div>
              </div>

              <Form {...resendForm}>
                <form
                  onSubmit={resendForm.handleSubmit(onResendSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={resendForm.control}
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
                            disabled={isLoading || countdown > 0}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 font-medium bg-primary hover:bg-primary-600 text-white"
                    disabled={isLoading || countdown > 0}
                  >
                    {isLoading
                      ? "Sending..."
                      : countdown > 0
                      ? `Resend in ${Math.floor(countdown / 60)}:${(
                          countdown % 60
                        )
                          .toString()
                          .padStart(2, "0")}`
                      : "Resend verification link"}
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
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h3 className="text-[1.625rem] font-semibold mb-1 text-slate-900 dark:text-white">
                  Adventure starts here 🚀
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Make your affiliate marketing management easy and fun!
                </p>
              </div>

              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-slate-300">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-white"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
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

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-slate-300">
                          Password
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
                    control={registerForm.control}
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
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
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
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-slate-300">
                          Organization Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your Company"
                            className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-white"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-1"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-slate-600 dark:text-slate-400 font-normal">
                            I agree to{" "}
                            <Link
                              href="/legal/privacy-policy"
                              className="text-primary hover:text-primary-600 dark:text-primary-400"
                            >
                              privacy policy
                            </Link>{" "}
                            &{" "}
                            <Link
                              href="/legal/terms"
                              className="text-primary hover:text-primary-600 dark:text-primary-400"
                            >
                              terms
                            </Link>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11 font-medium bg-primary hover:bg-primary-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Sign up"}
                  </Button>

                  <div className="w-full text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="text-primary hover:text-primary-600 font-medium dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Sign in instead
                      </Link>
                    </p>
                  </div>

                  <div className="relative flex items-center justify-center my-4">
                    <div className="absolute w-full border-t border-slate-200 dark:border-slate-700"></div>
                    <div className="relative bg-white dark:bg-[#283046] px-4 text-sm text-slate-500 dark:text-slate-400">
                      or
                    </div>
                  </div>

                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      className="flex justify-center items-center h-10 w-10 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#3B5998]"
                    >
                      <Facebook size={18} />
                    </button>
                    <button
                      type="button"
                      className="flex justify-center items-center h-10 w-10 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#1DA1F2]"
                    >
                      <Twitter size={18} />
                    </button>
                    <button
                      type="button"
                      className="flex justify-center items-center h-10 w-10 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#24292F]"
                    >
                      <Github size={18} />
                    </button>
                    <button
                      type="button"
                      className="flex justify-center items-center h-10 w-10 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#DD4B39]"
                    >
                      <Mail size={18} />
                    </button>
                  </div>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
