import applicationImage from "@/assets/illustrations/application.webp";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart3, CheckCircle, Loader2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "wouter";
import { z } from "zod";

const applicationSchema = z.object({
  experience: z
    .string()
    .min(10, { message: "Experience must be at least 10 characters" })
    .max(1000, { message: "Experience cannot exceed 1000 characters" }),
  skills: z
    .string()
    .min(1, { message: "At least one skill is required" })
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s)
    ),
  twitter: z
    .string()
    .url({ message: "Invalid Twitter URL" })
    .optional()
    .or(z.literal("")),
  instagram: z
    .string()
    .url({ message: "Invalid Instagram URL" })
    .optional()
    .or(z.literal("")),
  linkedin: z
    .string()
    .url({ message: "Invalid LinkedIn URL" })
    .optional()
    .or(z.literal("")),
  facebook: z
    .string()
    .url({ message: "Invalid Facebook URL" })
    .optional()
    .or(z.literal("")),
  resume: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "Resume must be less than 5MB"
    )
    .refine(
      (file) => ["application/pdf"].includes(file.type),
      "Resume must be a PDF"
    ),
  kycDocument: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "KYC document must be less than 5MB"
    )
    .refine(
      (file) =>
        ["application/pdf", "image/jpeg", "image/png"].includes(file.type),
      "KYC document must be PDF, JPEG, or PNG"
    ),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function MarketerApplication() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const { verifyMarketerApplication, submitMarketerApplication } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationData, setApplicationData] = useState<{
    name: string;
    email: string;
    organization: { name: string; id: string };
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      experience: "",
      skills: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      facebook: "",
      resume: undefined,
      kycDocument: undefined,
    },
  });

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setError("Invalid or missing application token");
        setIsVerifying(false);
        return;
      }

      try {
        const application = await verifyMarketerApplication(token);
        setApplicationData(application);
        setIsVerifying(false);
        if (application.status === "pending") {
          setIsSubmitted(true);
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Failed to verify invitation");
        setIsVerifying(false);
      }
    }

    verifyToken();
  }, [token, verifyMarketerApplication]);

  async function onSubmit(data: ApplicationFormValues) {
    setIsLoading(true);

    try {
      await submitMarketerApplication(token!, {
        experience: data.experience,
        skills: data.skills,
        twitter: data.twitter || undefined,
        instagram: data.instagram || undefined,
        linkedin: data.linkedin || undefined,
        facebook: data.facebook || undefined,
        resume: data.resume,
        kycDocument: data.kycDocument,
      });

      setIsSubmitted(true);
      toast({
        title: "Application Submitted",
        description:
          "Your application has been successfully submitted. You'll hear from us soon!",
      });
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !applicationData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <Link href="/" className="flex items-center mb-6 space-x-2">
          <div className="bg-primary text-white p-2 rounded-full shadow">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="text-2xl font-extrabold text-primary tracking-tight">
            Growvia
          </span>
        </Link>
        <div className="w-full max-w-md text-center space-y-5 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Invalid Invitation
          </h3>
          <p className="text-base text-slate-600 dark:text-slate-400">
            {error || "The invitation link is invalid or has expired."}
          </p>
          <Link href="/" className="inline-block">
            <Button className="mt-2 w-full">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <Link href="/" className="flex items-center mb-6 space-x-2">
          <div className="bg-primary text-white p-2 rounded-full shadow">
            <BarChart3 className="h-5 w-5" />
          </div>
          <span className="text-2xl font-extrabold text-primary tracking-tight">
            Growvia
          </span>
        </Link>
        <div className="w-full max-w-md text-center space-y-5 p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Application Submitted
          </h3>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Thank you, {applicationData.name}! Your application to join{" "}
            {applicationData.organization.name}'s affiliate marketing program
            has been successfully submitted.
          </p>
          <p className="text-base text-slate-600 dark:text-slate-400">
            We'll review your application and get back to you soon.
          </p>
          <Link href="/" className="inline-block">
            <Button className="mt-2 w-full">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100 dark:bg-slate-900">
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
            <div className="w-[380px] mx-auto mb-10">
              <img
                src={applicationImage}
                alt="Application"
                className="max-w-full"
              />
            </div>
            <div className="text-white max-w-lg text-center space-y-4">
              <h2 className="text-3xl font-bold">
                Join{" "}
                <span className="text-primary">
                  {applicationData.organization.name}
                </span>
              </h2>
              <p className="text-lg">Become a marketer with Growvia</p>
              <p className="text-base opacity-80">
                Submit your application to join{" "}
                {applicationData.organization.name}'s affiliate marketing
                program.
              </p>
            </div>
          </div>
          <div className="p-6 text-white text-center opacity-60 text-sm">
            © {new Date().getFullYear()} Growvia. All rights reserved.
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[40%] lg:ml-[60%] p-5 md:p-8 bg-white dark:bg-[#283046] min-h-screen flex flex-col">
        <div className="w-full max-w-[600px] mx-auto py-6 flex-1">
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
            <h3 className="text-[1.625rem] font-semibold text-slate-900 dark:text-white">
              Marketer Application
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Complete the form below to apply as a marketer for{" "}
              {applicationData.organization.name}.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Applicant: {applicationData.name} ({applicationData.email})
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">
                      Marketing Experience
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your experience in affiliate marketing or related fields..."
                        className="h-32 border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-white"
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
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">
                      Skills
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter skills (comma-separated, e.g., SEO, Content Marketing, PPC)"
                        className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-white"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        Twitter URL (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://x.com/username"
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
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        Instagram URL (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://instagram.com/username"
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
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        LinkedIn URL (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://linkedin.com/in/username"
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
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">
                        Facebook URL (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://facebook.com/username"
                          className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-white"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="resume"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">
                      Resume (PDF only)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="file"
                          accept="application/pdf"
                          className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-white"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onChange(file);
                          }}
                          disabled={isLoading}
                          {...field}
                        />
                        <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      </div>
                    </FormControl>
                    {value && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Selected: {value.name}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kycDocument"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 dark:text-slate-300">
                      KYC Document (Any Govt. Issued Identification
                      PDF/JPEG/PNG)
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png"
                          className="h-11 border-slate-300 dark:border-slate-700 dark:bg-slate-800/40 dark:text-white"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onChange(file);
                          }}
                          disabled={isLoading}
                          {...field}
                        />
                        <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      </div>
                    </FormControl>
                    {value && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Selected: {value.name}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 font-medium bg-primary hover:bg-primary-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
