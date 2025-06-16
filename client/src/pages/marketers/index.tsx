import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PlanModal } from "@/components/subscription/plan-modal";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { PLAN_LIMITS, SubscriptionPlan, User } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Copy, FileText, Lock, Mail, PlusCircle, Search, Send, UserCircleIcon, Users } from "lucide-react";
import moment from "moment";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { z } from "zod";


// Schema for marketer invite form
const inviteSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z
    .string()
    .min(7, { message: "Phone number must be at least 7 digits" }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function Marketers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization, token } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Organization invite link
const orgInviteLink =
  organization && organization.length > 0
    ? `${window.location.origin}/marketer-invitation/${organization[0].id}`
    : "";

  // Get marketers
  const { data: marketers, isLoading } = useQuery<
    (User & { source: string })[]
  >({
    queryKey: ["/api/marketers"],
    enabled: !!token,
  });

  // Filter marketers based on search query
  const filteredMarketers = marketers?.filter((marketer) =>
    [marketer.name, marketer.email].some((field) =>
      field?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Invite marketer mutation
  const inviteMarketerMutation = useMutation({
    mutationFn: async (marketer: InviteFormValues) => {
      const response = await apiRequest<{ inviteLink: string }>(
        "/api/marketers/invite",
        {
          method: "POST",
          body: JSON.stringify(marketer),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: "include",
        }
      );
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketers"] });
      setInviteLink(data.inviteLink);
      toast({
        title: "Success",
        description: "Marketer invited successfully",
      });
      setIsInviteModalOpen(false);
    },
    onError: (error) => {
      console.error("Invite error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to invite marketer",
        variant: "destructive",
      });
    },
  });

  // Resend invite mutation
  const resendInviteMutation = useMutation({
   
    mutationFn: async ({ email }: { email: string }) => {
      const response = await apiRequest<{ inviteLink: string }>(
        "/api/marketers/resend-invite",
        {
          method: "POST",
          body: JSON.stringify({ email }),
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          credentials: "include",
        }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketers"] });
      toast({
        title: "Success",
        description: "Invitation resent successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("Resend invite error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to resend invitation",
        variant: "destructive",
      });
    },
  });
  

  // Form setup
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  // Check if user can add more marketers
  const canAddMarketer = () => {
    if (!organization) return false;

    const plan = organization.plan as SubscriptionPlan;
    const limits = PLAN_LIMITS[plan];

    return !marketers || marketers.length < limits.marketers;
  };

  // Handle invite submission
  const onSubmit = (data: InviteFormValues) => {
    inviteMarketerMutation.mutate(data);
  };

  // Open invite modal
  const openInviteModal = () => {
    if (canAddMarketer()) {
      setInviteLink(null);
      setIsInviteModalOpen(true);
    } else {
      setIsPlanModalOpen(true);
    }
  };

  // Copy invite link to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The invite link has been copied to your clipboard",
    });
  };

  // Send invite email (simulated)
  const sendInviteEmail = () => {
    toast({
      title: "Invite sent",
      description: "An invitation email has been sent to the marketer",
    });
  };

  // Table columns definition
  const columns = [
    {
      header: "Marketer",
      accessorKey: "name",
      cell: (data: User & { source: string }) => (
        <AvatarWithStatus user={data} />
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (data: User & { source: string }) => {
        const status = data.status;
    
        const statusVariantMap: Record<string, BadgeProps["variant"]> = {
          active: "success",
          approved: "success",
          pending: "warning",
          rejected: "danger",
          invited: "info",
        };
    
        const labelMap: Record<string, string> = {
          active: "Active",
          approved: "Approved",
          pending: "Pending",
          rejected: "Rejected",
          invited: "Invited",
        };
    
        return (
          <Badge variant={statusVariantMap[status] || "default"}>
            {labelMap[status] || "Unknown"}
          </Badge>
        );
      },
    },    
    {
      header: "Registration Date",
      accessorKey: "createdAt",
      cell: (data: User & { source: string }) => (
        <span className="text-slate-600">
          {moment(data.createdAt).format("Do MMM, YYYY h:mmA")}
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (data: User & { source: string; status: string }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              Actions
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Link
                href={`/profile/${data.id}`}
                className="flex items-center w-full"
              >
                <UserCircleIcon className="h-4 w-4 mr-2" />
                View Profile
              </Link>
            </DropdownMenuItem>
            {data.source === "user" && data.status !== "pending" && (
              <DropdownMenuItem>
                <Lock className="h-4 w-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
            )}
            {data.source === "application" && data.status === "pending" && (
              <DropdownMenuItem>
                <Link
                  href={`/marketers/${data.id}/application`}
                  className="flex items-center w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Application
                </Link>
              </DropdownMenuItem>
            )}
            {data.source === "application" && data.status === "invited" && (
              <DropdownMenuItem
                onClick={() =>
                  resendInviteMutation.mutate({ email: data.email })
                }
                disabled={resendInviteMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                Resend Invite
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DashboardLayout title="Marketers">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Marketer Management
          </h1>
          <p className="text-slate-500">
            Manage your affiliate marketers and track their performance
          </p>
        </div>
        <Button onClick={openInviteModal}>
          <PlusCircle className="h-4 w-4 mr-2" /> Invite Marketer
        </Button>
      </div>
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6 bg-primary text-white rounded-lg">
            <Label htmlFor="org-invite-link">Organization Invite Link</Label>
            <p className="text-sm mb-4">
              Share this link with marketers to invite them to register for your
              affiliate program.
            </p>
            <div className="flex items-center">
              <div
                id="org-invite-link"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-l-md px-3 py-2 text-md text-slate-600 truncate"
              >
                {orgInviteLink}
              </div>
              <Button
                type="button"
                variant="default"
                className="rounded-l-none shadow-lg"
                onClick={() => copyToClipboard(orgInviteLink)}
                disabled={!orgInviteLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="pt-6 text-white rounded-lg">
          <div className="mb-4 flex items-center justify-between">
            <Tabs defaultValue="all" className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
                <TabsList>
                  <TabsTrigger value="all">All Marketers</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                </TabsList>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>

              <TabsContent value="all" className="w-full mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Marketers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      columns={columns}
                      data={filteredMarketers}
                      isLoading={isLoading}
                      emptyState={
                        <div className="py-8 text-center">
                          <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                          <h3 className="text-lg font-medium text-slate-800 mb-2">
                            No marketers found
                          </h3>
                          <p className="text-slate-500 mb-4">
                            Invite your first marketer to start growing your
                            affiliate network.
                          </p>
                          <Button onClick={openInviteModal}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Invite
                            Marketer
                          </Button>
                        </div>
                      }
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="active">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Marketers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      columns={columns}
                      data={filteredMarketers?.filter(
                        (m) => m.status === "active"
                      )}
                      isLoading={isLoading}
                      emptyState={
                        <div className="py-8 text-center">
                          <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                          <h3 className="text-lg font-medium text-slate-800 mb-2">
                            No active marketers found
                          </h3>
                          <p className="text-slate-500 mb-4">
                            Invite marketers to grow your affiliate network.
                          </p>
                          <Button onClick={openInviteModal}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Invite
                            Marketer
                          </Button>
                        </div>
                      }
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pending">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Marketers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      columns={columns}
                      data={filteredMarketers?.filter(
                        (m) => m.status === "pending" || m.status === "invited"
                      )}
                      isLoading={isLoading}
                      emptyState={
                        <div className="py-8 text-center">
                          <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                          <h3 className="text-lg font-medium text-slate-800 mb-2">
                            No pending marketers found
                          </h3>
                          <p className="text-slate-500 mb-4">
                            Invite marketers to grow your affiliate network.
                          </p>
                          <Button onClick={openInviteModal}>
                            <PlusCircle className="h-4 w-4 mr-2" /> Invite
                            Marketer
                          </Button>
                        </div>
                      }
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Marketer</DialogTitle>
            <DialogDescription>
              Send an invitation to a new marketer to join your affiliate
              program
            </DialogDescription>
          </DialogHeader>

          {inviteLink ? (
            <>
              <div className="bg-success-50 p-4 rounded-lg border border-success-200 mb-4">
                <h4 className="text-success-600 font-medium mb-1">
                  Invitation Created Successfully!
                </h4>
                <p className="text-slate-600 text-sm">
                  You can share this link with your marketer or send them an
                  email invitation.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-link">Invite Link</Label>
                  <div className="flex mt-1.5">
                    <Input
                      id="invite-link"
                      value={inviteLink}
                      readOnly
                      className="flex-1 rounded-r-none"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-l-none"
                      onClick={() => copyToClipboard(inviteLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="sm:order-1"
                    >
                      Close
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    onClick={sendInviteEmail}
                    className="sm:order-2"
                  >
                    <Mail className="h-4 w-4 mr-2" /> Send Email Invitation
                  </Button>
                </DialogFooter>
              </div>
            </>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="jane@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={inviteMarketerMutation.isPending}
                  >
                    {inviteMarketerMutation.isPending
                      ? "Sending..."
                      : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Plan Modal */}
      <PlanModal
        open={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        currentPlan={organization?.plan as SubscriptionPlan}
      />
    </DashboardLayout>
  );
}
