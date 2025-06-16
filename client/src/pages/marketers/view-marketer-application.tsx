import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BadgeCheck,
    CircleX,
    Download,
    Facebook,
    Globe,
    Instagram,
    Linkedin,
    Loader2,
    Twitter,
} from "lucide-react";
import moment from "moment";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "wouter";
import { z } from "zod";

type MarketerApplication = User & {
  source: string;
  status: string;
  resumeUrl?: string;
  kycDocUrl?: string;
  socialMedia?: Record<string, string>;
  experience?: string;
  skills?: string[];
  reviewedAt?: string;
  reviewNotes?: string;
};

const reviewSchema = z
  .object({
    reviewNotes: z.string().min(1, { message: "Review notes are required" }),
    applyCoolOff: z.boolean().optional(),
    coolOffDays: z
      .number()
      .min(7, { message: "Cool-off period must be at least 7 days" })
      .max(30, { message: "Cool-off period cannot exceed 30 days" })
      .optional(),
  })
  .refine(
    (data) =>
      !data.applyCoolOff ||
      (data.applyCoolOff && data.coolOffDays !== undefined),
    {
      message: "Cool-off days are required when cool-off period is enabled",
      path: ["coolOffDays"],
    }
  );

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function ViewMarketerApplication() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewNotes: "",
      applyCoolOff: false,
      coolOffDays: 7,
    },
  });

  const { data: application, isLoading } = useQuery<MarketerApplication>({
    queryKey: [`/api/marketers/${id}`],
    queryFn: async () => {
      const response = await apiRequest(`/api/marketers/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return {
        ...response,
        source: "application",
        createdAt: response.applicationDate,
      };
    },
    enabled: !!token && !!id,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ reviewNotes }: { reviewNotes: string }) => {
      await apiRequest(`/api/marketers/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ reviewNotes }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/marketers/${id}`] });
      toast({
        title: "Success",
        description: "Application approved successfully",
      });
      setIsApproveModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to approve application",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      reviewNotes,
      applyCoolOff,
      coolOffDays,
    }: ReviewFormValues) => {
      await apiRequest(`/api/marketers/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reviewNotes, applyCoolOff, coolOffDays }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/marketers/${id}`] });
      toast({
        title: "Success",
        description: "Application rejected successfully",
        variant: "success",
      });
      setIsRejectModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reject application",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout title="Error">Application not found</DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Marketer Application">
      <div className="p-6 bg-white dark:bg-[#1a2035] rounded-lg shadow-md dark:shadow-none border dark:border-slate-800">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Marketer Application
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review the application details below
          </p>
        </div>
        <Card className="border-none shadow-none p-5">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <AvatarWithStatus user={application} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  {application.name}
                </h3>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <Form {...form}>
                    <FormItem>
                      <FormLabel className="text-gray-600 dark:text-gray-400">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          value={application.email}
                          readOnly
                          className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-md"
                        />
                      </FormControl>
                    </FormItem>
                  </Form>
                  <Form {...form}>
                    <FormItem>
                      <FormLabel className="text-gray-600 dark:text-gray-400">
                        Phone Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          value={application.phone}
                          readOnly
                          className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-md"
                        />
                      </FormControl>
                    </FormItem>
                  </Form>
                  <Form {...form}>
                    <FormItem>
                      <FormLabel className="text-gray-600 dark:text-gray-400">
                        Application Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          value={moment(application.createdAt).format(
                            "Do MMM, YYYY h:mmA"
                          )}
                          readOnly
                          className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-md"
                        />
                      </FormControl>
                    </FormItem>
                  </Form>
                  <Form {...form}>
                    <FormItem>
                      <FormLabel className="text-gray-600 dark:text-gray-400">
                        Status
                      </FormLabel>
                      <FormControl>
                        <div className="w-full text-center">
                          <Badge
                            variant="outline"
                            className={`w-full py-2 rounded-md capitalize border 
                            ${
                              application.status === "pending"
                                ? "bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 border-yellow-400 dark:border-yellow-700"
                                : application.status === "approved"
                                ? "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300 border-green-400 dark:border-green-700"
                                : application.status === "rejected"
                                ? "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-300 border-red-400 dark:border-red-700"
                                : application.status === "invited"
                                ? "bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-300 border-blue-400 dark:border-blue-700"
                                : ""
                            }`}
                          >
                            {application.status}
                          </Badge>
                        </div>
                      </FormControl>
                    </FormItem>
                  </Form>

                  {application.reviewedAt && (
                    <Form {...form}>
                      <FormItem>
                        <FormLabel className="text-gray-600 dark:text-gray-400">
                          Reviewed At
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={moment(application.reviewedAt).format(
                              "Do MMM, YYYY h:mmA"
                            )}
                            readOnly
                            className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-md"
                          />
                        </FormControl>
                      </FormItem>
                    </Form>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Documents
                </h3>
                <div className="space-y-4">
                  {application.resumeUrl && (
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download Resume
                    </a>
                  )}
                  {application.kycDocUrl && (
                    <a
                      href={application.kycDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download KYC
                      Document
                    </a>
                  )}
                </div>
              </div>
            </div>

            {application.socialMedia &&
              Object.keys(application.socialMedia).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                    Social Media
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(application.socialMedia).map(
                      ([platform, url]) => {
                        if (!url) return null;

                        const iconMap: Record<string, JSX.Element> = {
                          twitter: (
                            <Twitter className="h-4 w-4 mr-1 text-blue-400 dark:text-blue-400" />
                          ),
                          instagram: (
                            <Instagram className="h-4 w-4 mr-1 text-pink-500 dark:text-pink-400" />
                          ),
                          linkedin: (
                            <Linkedin className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                          ),
                          facebook: (
                            <Facebook className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                          ),
                        };

                        const icon = iconMap[platform.toLowerCase()] || (
                          <Globe className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                        );

                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-black dark:text-white"
                            >
                              {icon}
                              {platform}
                            </Badge>
                          </a>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            {application.skills && application.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {application.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="py-1 px-2 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {application.experience && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Experience
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {application.experience}
                </p>
              </div>
            )}

            {application.reviewNotes && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">
                  Review Notes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {application.reviewNotes}
                </p>
              </div>
            )}

            {application.status === "pending" && (
              <div className="flex gap-4 mt-6">
                <Button
                  onClick={() => setIsApproveModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
                >
                  <BadgeCheck className="h-4 w-4 mr-2" /> Approve
                </Button>
                <Button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
                >
                  <CircleX className="h-4 w-4 mr-2" /> Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-black dark:text-white">
              Approve Application
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to approve {application.name}'s application?
              They will be granted access to your affiliate program.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                approveMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="reviewNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">
                      Review Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your review notes..."
                        className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-md"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="flex justify-end gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={approveMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
                >
                  {approveMutation.isPending ? "Approving..." : "Confirm"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 rounded-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-black dark:text-white">
              Reject Application
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to reject {application.name}'s application?
              They will be notified of the rejection.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                rejectMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="reviewNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">
                      Review Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your review notes..."
                        className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-md"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applyCoolOff"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-gray-700 dark:text-gray-300">
                      Apply cool-off period before reapplication
                    </FormLabel>
                  </FormItem>
                )}
              />
              {form.watch("applyCoolOff") && (
                <FormField
                  control={form.control}
                  name="coolOffDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">
                        Cool-off Period (days)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={7}
                          max={30}
                          placeholder="Enter number of days (7-30)"
                          className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white rounded-md"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter className="flex justify-end gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={rejectMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Confirm"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
