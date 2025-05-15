import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Eye, EyeOff } from "lucide-react";
import loginIllustration from "@/assets/illustrations/login-illustration.svg";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });
  
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#1e2130]">
      {/* Left Panel - Illustration */}
      <div className="hidden md:flex md:w-1/2 bg-primary-50 dark:bg-slate-900 flex-col items-center justify-center p-12">
        <div className="flex items-center mb-8">
          <div className="bg-primary text-white p-3 rounded-lg">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h1 className="ml-3 text-2xl font-bold text-slate-800 dark:text-white">Growvia</h1>
        </div>
        <div className="max-w-md">
          <img src={loginIllustration} alt="Login Illustration" className="w-full h-auto" />
        </div>
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Boost your revenue with affiliate marketing</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Track conversions, manage marketers, and grow your business with our powerful affiliate marketing platform.
          </p>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="md:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="bg-primary text-white p-3 rounded-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h1 className="ml-3 text-2xl font-bold text-slate-800 dark:text-white">Growvia</h1>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Welcome back!</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to your account to continue</p>
          </div>
          
          <Card className="border-0 shadow-lg dark:bg-[#25293c] dark:border-slate-700/30">
            <CardContent className="px-6 py-6 pt-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-slate-300">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            className="border-slate-300 dark:border-slate-600 dark:bg-slate-800/40 dark:text-white"
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => {
                      const [showPassword, setShowPassword] = useState(false);
                      return (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300">Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input 
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••" 
                                className="border-slate-300 dark:border-slate-600 dark:bg-slate-800/40 dark:text-white pr-10"
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
                      );
                    }}
                  />
                  
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="remember-me"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <label 
                            htmlFor="remember-me" 
                            className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                            onClick={() => form.setValue('rememberMe', !form.getValues('rememberMe'))}
                          >
                            Remember Me
                          </label>
                        </div>
                      )}
                    />
                    <button
                      type="button"
                      className="text-sm text-primary hover:text-primary-600 font-medium dark:text-primary-400 dark:hover:text-primary-300"
                      onClick={() => console.log('Forgot password clicked')}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full py-2 font-medium bg-primary hover:bg-primary-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  <div className="w-full text-center mt-6">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      New on our platform?{" "}
                      <Link href="/register" className="text-primary hover:text-primary-600 font-medium dark:text-primary-400 dark:hover:text-primary-300">
                        Create an account
                      </Link>
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
