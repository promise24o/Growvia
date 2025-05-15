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
import { BarChart3, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#1e2130] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-full mb-6">
            <div className="bg-primary text-white p-3 rounded-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h1 className="ml-3 text-2xl font-bold text-slate-800 dark:text-white font-heading">Growvia</h1>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white font-heading">Welcome back</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to your account to continue</p>
        </div>
        
        <Card className="border-0 shadow-lg dark:bg-[#25293c] dark:border-slate-700/30">
          <CardHeader className="space-y-1 px-6 py-4">
            <CardTitle className="text-xl font-bold text-center text-slate-800 dark:text-white">Sign In</CardTitle>
            <CardDescription className="text-center text-slate-500 dark:text-slate-400">Enter your email and password to access your account</CardDescription>
          </CardHeader>
          <CardContent className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember-me"
                      className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800/40 text-primary focus:ring-primary"
                    />
                    <label htmlFor="remember-me" className="text-sm text-slate-600 dark:text-slate-400">
                      Remember Me
                    </label>
                  </div>
                  <Link href="#">
                    <a className="text-sm text-primary hover:text-primary-600 font-medium dark:text-primary-400 dark:hover:text-primary-300">
                      Forgot Password?
                    </a>
                  </Link>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full py-2 font-medium bg-primary hover:bg-primary-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t px-6 py-4 dark:border-slate-700/30">
            <div className="w-full text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                New on our platform?{" "}
                <Link href="/register">
                  <a className="text-primary hover:text-primary-600 font-medium dark:text-primary-400 dark:hover:text-primary-300">
                    Create an account
                  </a>
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
