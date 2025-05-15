import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BarChart3, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const onboardingSchema = z.object({
  position: z.string().min(1, { message: "Please select your position" }),
  positionOther: z.string().optional(),
  industry: z.string().min(1, { message: "Please enter your industry" }),
  companySize: z.string().min(1, { message: "Please select your company size" }),
  signingFrequency: z.string().min(1, { message: "Please select how often you sign documents" }),
  creationFrequency: z.string().min(1, { message: "Please select how often you create documents" }),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtherPositionField, setShowOtherPositionField] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      position: "",
      positionOther: "",
      industry: "",
      companySize: "",
      signingFrequency: "",
      creationFrequency: "",
    },
  });

  async function onSubmit(data: OnboardingFormValues) {
    setIsSubmitting(true);

    // Prepare final data
    const finalData = {
      ...data,
      position: data.position === "Others" ? data.positionOther : data.position,
    };

    try {
      const response = await fetch('/api/organizations/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save onboarding information');
      }

      toast({
        title: "Onboarding completed",
        description: "Your account setup is complete!",
      });

      // Navigate to dashboard after successful onboarding
      navigate("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Failed to save your information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle position change
  const watchPosition = form.watch("position");
  if (watchPosition === "Others" && !showOtherPositionField) {
    setShowOtherPositionField(true);
  } else if (watchPosition !== "Others" && showOtherPositionField) {
    setShowOtherPositionField(false);
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <div className="flex items-center">
            <div className="bg-primary text-white p-2 rounded">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="ml-2 text-xl font-bold text-slate-800 dark:text-white">
              Growvia
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-2xl mx-auto"
        >
          <motion.div variants={itemVariants} className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome to Growvia
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Let's get to know you better to customize your experience
            </p>
          </motion.div>

          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What is your position/level? *</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your position/level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Founder/CEO">Founder/CEO</SelectItem>
                              <SelectItem value="C-Suite">C-Suite</SelectItem>
                              <SelectItem value="Human Resources">Human Resources</SelectItem>
                              <SelectItem value="Sales">Sales</SelectItem>
                              <SelectItem value="Procurement">Procurement</SelectItem>
                              <SelectItem value="Others">Others</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {showOtherPositionField && (
                    <motion.div 
                      variants={itemVariants}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <FormField
                        control={form.control}
                        name="positionOther"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Please specify your position *</FormLabel>
                            <FormControl>
                              <Input placeholder="Type your position/level here..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What industry are you in? *</FormLabel>
                          <FormControl>
                            <Input placeholder="Eg. Administrative and Support Services" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="companySize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How many people work at your company? *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select company size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1 - 5">1 - 5</SelectItem>
                              <SelectItem value="6 - 10">6 - 10</SelectItem>
                              <SelectItem value="11 - 20">11 - 20</SelectItem>
                              <SelectItem value="21 - 50">21 - 50</SelectItem>
                              <SelectItem value="51 - 100">51 - 100</SelectItem>
                              <SelectItem value="101+">101+</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="signingFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How often do you sign documents? *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="every day">Every day</SelectItem>
                              <SelectItem value="multiple times a week">Multiple times a week</SelectItem>
                              <SelectItem value="once a week">Once a week</SelectItem>
                              <SelectItem value="multiple times a month">Multiple times a month</SelectItem>
                              <SelectItem value="once a month">Once a month</SelectItem>
                              <SelectItem value="less than once a month">Less than once a month</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <FormField
                      control={form.control}
                      name="creationFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How often do you create documents? *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="every day">Every day</SelectItem>
                              <SelectItem value="multiple times a week">Multiple times a week</SelectItem>
                              <SelectItem value="once a week">Once a week</SelectItem>
                              <SelectItem value="multiple times a month">Multiple times a month</SelectItem>
                              <SelectItem value="once a month">Once a month</SelectItem>
                              <SelectItem value="less than once a month">Less than once a month</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="pt-4">
                    <Button
                      type="submit"
                      className="w-full h-11 font-medium bg-primary hover:bg-primary-600 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : "Complete Setup"}
                      {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <motion.div variants={itemVariants} className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>
              © {new Date().getFullYear()} Growvia. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}