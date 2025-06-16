import loginCharacter from "@/assets/illustrations/login-character.png";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    BarChart3,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "wouter";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ResendFormValues = z.infer<typeof resendSchema>;

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const { loginWithToken } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<
    "verifying" | "success" | "error" | "already_verified" | "resend"
  >("verifying");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const resendForm = useForm<ResendFormValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    if (status === "resend") {
      resendForm.setValue("email", resendEmail);
    }
  }, [status, resendEmail, resendForm]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyToken = urlParams.get("token");

    async function verifyEmail() {
      if (!verifyToken) {
        setStatus("error");
        toast({
          title: "Verification Failed",
          description: "Invalid or missing verification token",
          variant: "destructive",
        });
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify-email?token=${verifyToken}`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.message === "Email already verified") {
            setStatus("already_verified");
            toast({
              title: "Already Verified",
              description: "This email is already verified. You can sign in.",
            });
            return;
          }

        if (
          data.message === "Invalid verification token" ||
          data.message === "User not found"
        ) {
          setStatus("error");
          toast({
            title: "Verification Failed",
            description: "The verification link is invalid or has expired.",
            variant: "destructive",
          });
          return;
        }

          throw new Error(data.message || "Verification failed");
        }

        if (data.user && data.token) {
          loginWithToken(data.token, data.user);
          setStatus("success");
          toast({
            title: "Email Verified",
            description: "Redirecting you to your dashboard...",
          });
          setTimeout(() => navigate("/dashboard"), 2000);
        } else {
          setStatus("success");
          toast({
            title: "Email Verified",
            description: "You can now log in.",
          });
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus("error");
        toast({
          title: "Verification Failed",
          description: err.message || "Something went wrong",
          variant: "destructive",
        });
      }
    }

    verifyEmail();
  }, [loginWithToken, navigate, toast]);

  async function onResendSubmit(data: ResendFormValues) {
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) throw new Error("Failed to resend verification email");

      await res.json();
      setResendCooldown(60);

      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox.",
      });
    } catch (error: any) {
      toast({
        title: "Resend Failed",
        description: error.message || "Unable to resend verification email",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  }

  const statusConfig = {
    verifying: {
      icon: <Loader2 className="h-10 w-10 animate-spin text-primary" />,
      title: "Verifying your email",
      description: "Please hold on while we complete the verification...",
    },
    success: {
      icon: <CheckCircle2 className="h-10 w-10 text-green-500" />,
      title: "Email Verified!",
      description: "Your email has been successfully verified.",
    },
    already_verified: {
      icon: <ShieldCheck className="h-10 w-10 text-blue-500" />,
      title: "Already Verified",
      description: "This email is already verified. You can sign in.",
    },
    error: {
      icon: <XCircle className="h-10 w-10 text-red-500" />,
      title: "Verification Failed",
      description: "The verification link is invalid or has expired.",
    },
    resend: {
      icon: <XCircle className="h-10 w-10 text-red-500" />,
      title: "Verification Required",
      description: `We sent a verification link to ${resendEmail}.`,
    },
  };

  const { icon, title, description } = statusConfig[status];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div
        className="hidden lg:block lg:w-[60%] h-screen fixed top-0 left-0"
        style={{ backgroundColor: "#161D31" }}
      >
        <div className="h-full flex flex-col">
          <div className="p-6">
            <Link href="/" className="flex items-center">
              <div className="bg-primary text-white p-2 rounded">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="ml-2 text-xl font-bold text-white">Growvia</span>
            </Link>
          </div>
          <div className="flex-grow flex flex-col justify-center items-center px-8">
            <div className="text-white max-w-lg text-center space-y-4">
              <h2 className="text-3xl font-bold">
                Welcome to <span className="text-primary">Growvia</span>
              </h2>
              <p className="text-lg">
                The complete affiliate marketing platform.
              </p>
              <p className="text-base opacity-80">
                Manage marketers, track conversions, and process commissions
                effortlessly.
              </p>
            </div>
            <img
              src={loginCharacter}
              alt="Verification"
              className="mt-8 max-w-[280px]"
            />
          </div>
          <div className="p-6 text-white text-center opacity-60 text-sm">
            © {new Date().getFullYear()} Growvia. All rights reserved.
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[40%] lg:ml-[60%] p-5 md:p-8 bg-white dark:bg-[#283046] min-h-screen flex flex-col">
        <div className="w-full max-w-[400px] mx-auto py-6 flex-1 animate-fade-in-down">
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

          {status !== "resend" ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">{icon}</div>
              <h3 className="text-[1.625rem] font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {description}
              </p>

              {status === "error" && (
                <div className="mt-6 space-y-4 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Please{" "}
                    <Link
                      href="/login"
                      className="text-primary font-medium hover:underline"
                    >
                      log in
                    </Link>{" "}
                    or{" "}
                    <Link
                      href="/register"
                      className="text-primary font-medium hover:underline"
                    >
                      create an account
                    </Link>{" "}
                    to get a new verification link.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link
                      href="/login"
                      className="w-full sm:w-auto px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-600"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="w-full sm:w-auto px-6 py-2 border border-primary text-primary rounded-md hover:bg-primary/10"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="flex justify-center">{icon}</div>
                <h3 className="text-[1.625rem] font-semibold mt-4 mb-1 text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {description}
                </p>
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-11 font-medium bg-primary hover:bg-primary-600 text-white"
                    disabled={resendLoading || resendCooldown > 0}
                  >
                    {resendLoading
                      ? "Sending..."
                      : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend Verification Email"}
                  </Button>

                  <div className="w-full text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Already verified?{" "}
                      <Link
                        href="/login"
                        className="text-primary font-medium hover:underline"
                      >
                        Sign in
                      </Link>
                    </p>
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
