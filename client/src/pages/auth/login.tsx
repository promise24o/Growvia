import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
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
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Eye, EyeOff, Facebook, Twitter, Github, Mail } from "lucide-react";
import loginCharacter from "@/assets/illustrations/login-character.png";

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
  const [showPassword, setShowPassword] = useState(false);
  
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
    <div className="min-h-screen flex authentication-wrapper">
      {/* Logo for mobile */}
      <div className="absolute top-6 left-6 md:flex items-center z-50 hidden md:visible">
        <Link href="/" className="flex items-center">
          <div className="bg-primary text-white p-2 rounded">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="ml-2 text-xl font-bold text-white">Growvia</span>
        </Link>
      </div>
      
      {/* Left Panel with Illustration - hidden on mobile */}
      <div className="d-none d-xl-flex hidden lg:flex lg:w-[60%] relative bg-cover bg-center overflow-hidden" 
           style={{ backgroundColor: '#161D31' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-xl mx-auto p-8 flex flex-col items-center">
            {/* Text above the illustration */}
            <div className="text-center mb-6 text-white">
              <h2 className="text-3xl font-bold mb-4">Welcome to Growvia</h2>
              <p className="text-lg mb-2">The complete affiliate marketing platform</p>
              <p className="text-base opacity-80">Manage marketers, track conversions, and process commissions with our powerful SaaS solution.</p>
            </div>
            
            {/* Reduced size character image */}
            <div className="w-[75%] mx-auto">
              <img src={loginCharacter} alt="Login" className="max-w-full z-10" />
            </div>
            
            {/* Copyright text at the bottom */}
            <div className="absolute bottom-4 left-0 right-0 text-center text-white opacity-70 text-sm">
              © {new Date().getFullYear()} Growvia. All rights reserved.
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-5 md:p-8 bg-white dark:bg-[#283046]">
        <div className="w-full max-w-[400px] mx-auto">
          {/* Mobile logo */}
          <div className="flex justify-center md:hidden mb-8">
            <Link href="/" className="flex items-center">
              <div className="bg-primary text-white p-2 rounded">
                <BarChart3 className="h-5 w-5" />
              </div>
              <span className="ml-2 text-xl font-bold text-slate-800 dark:text-white">Growvia</span>
            </Link>
          </div>
          
          <div className="mb-8">
            <h3 className="text-[1.625rem] font-semibold mb-1 text-slate-900 dark:text-white">Welcome to Growvia! 👋</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Please sign in to your account and start the adventure
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">Email</FormLabel>
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
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-slate-700 dark:text-slate-300">Password</FormLabel>
                      <button
                        type="button"
                        className="text-xs text-primary hover:text-primary-600 font-medium dark:text-primary-400 dark:hover:text-primary-300"
                        onClick={() => console.log('Forgot password clicked')}
                      >
                        Forgot Password?
                      </button>
                    </div>
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
                name="rememberMe"
                render={({ field }) => (
                  <div className="flex items-center">
                    <Checkbox
                      id="remember-me"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label 
                      htmlFor="remember-me" 
                      className="ml-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                      onClick={() => form.setValue('rememberMe', !form.getValues('rememberMe'))}
                    >
                      Remember Me
                    </label>
                  </div>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full h-11 font-medium bg-primary hover:bg-primary-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="w-full text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  New on our platform?{" "}
                  <Link href="/register" className="text-primary hover:text-primary-600 font-medium dark:text-primary-400 dark:hover:text-primary-300">
                    Create an account
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
                <button type="button" className="flex justify-center items-center h-10 w-10 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#3B5998]">
                  <Facebook size={18} />
                </button>
                <button type="button" className="flex justify-center items-center h-10 w-10 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#1DA1F2]">
                  <Twitter size={18} />
                </button>
                <button type="button" className="flex justify-center items-center h-10 w-10 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#24292F]">
                  <Github size={18} />
                </button>
                <button type="button" className="flex justify-center items-center h-10 w-10 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#DD4B39]">
                  <Mail size={18} />
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
