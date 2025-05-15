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
import registerCharacter from "@/assets/illustrations/register-character.png";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  organizationName: z.string().min(2, { message: "Organization name must be at least 2 characters" }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and privacy policy"
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      organizationName: "",
      agreeToTerms: false,
    },
  });
  
  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    
    try {
      await register(data.name, data.email, data.password, data.organizationName);
      toast({
        title: "Registration successful",
        description: "Your account has been created. Redirecting to dashboard...",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen flex authentication-wrapper max-h-screen overflow-hidden">
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
      <div className="d-none d-xl-flex hidden lg:flex lg:w-[60%] relative bg-cover bg-center overflow-hidden fixed top-0 left-0 h-screen" 
           style={{ backgroundColor: '#161D31' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-xl mx-auto p-8 flex flex-col items-center">
            {/* Text above the illustration */}
            <div className="text-center mb-12 text-white">
              <h2 className="text-3xl font-bold mb-4">Join <span className="text-primary">Growvia</span> Today</h2>
              <p className="text-lg mb-2">Boost your affiliate marketing efforts</p>
              <p className="text-base opacity-80">Create your organization, invite marketers, and track performance all in one powerful platform.</p>
            </div>
            
            {/* Reduced size character image */}
            <div className="w-[70%] mx-auto mt-6">
              <img src={registerCharacter} alt="Register" className="max-w-full z-10" />
            </div>
            
            {/* Copyright text at the bottom */}
            <div className="fixed bottom-4 left-0 w-[60%] text-center text-white opacity-70 text-sm">
              © {new Date().getFullYear()} Growvia. All rights reserved.
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-[40%] lg:ml-[60%] h-screen overflow-y-auto p-5 md:p-8 bg-white dark:bg-[#283046]">
        <div className="w-full max-w-[400px] mx-auto py-6">
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
            <h3 className="text-[1.625rem] font-semibold mb-1 text-slate-900 dark:text-white">Adventure starts here 🚀</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Make your affiliate marketing management easy and fun!
            </p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">Full Name</FormLabel>
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
                    <FormLabel className="text-slate-700 dark:text-slate-300">Password</FormLabel>
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
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">Organization Name</FormLabel>
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
                control={form.control}
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
                        I agree to <Link href="/legal/privacy-policy" className="text-primary hover:text-primary-600 dark:text-primary-400">privacy policy</Link> & <Link href="/legal/terms" className="text-primary hover:text-primary-600 dark:text-primary-400">terms</Link>
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
                  <Link href="/login" className="text-primary hover:text-primary-600 font-medium dark:text-primary-400 dark:hover:text-primary-300">
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
