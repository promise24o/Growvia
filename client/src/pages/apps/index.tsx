import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { App, PLAN_LIMITS, SubscriptionPlan } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { PlanModal } from "@/components/subscription/plan-modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Link, 
  ShoppingBag, 
  BookOpen, 
  Video, 
  Briefcase, 
  LayoutGrid 
} from "lucide-react";

// Schema for app form validation
const appSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  description: z.string().optional(),
  baseUrl: z.string().url({ message: "Please enter a valid URL" }),
  commissionType: z.enum(["percentage", "fixed"]),
  commissionValue: z.coerce.number().min(0, { message: "Commission value must be positive" }),
});

type AppFormValues = z.infer<typeof appSchema>;

function getAppIcon(iconName: string | null, id: number) {
  switch (iconName) {
    case "ri-shopping-bag-line":
      return <ShoppingBag className="h-5 w-5" />;
    case "ri-book-line":
      return <BookOpen className="h-5 w-5" />;
    case "ri-video-line":
      return <Video className="h-5 w-5" />;
    case "ri-tools-line":
      return <Briefcase className="h-5 w-5" />;
    default:
      return <LayoutGrid className="h-5 w-5" />;
  }
}

export default function Apps() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  
  // Get apps
  const { data: apps, isLoading } = useQuery<App[]>({
    queryKey: ['/api/apps'],
  });
  
  // Create app mutation
  const createAppMutation = useMutation({
    mutationFn: async (app: AppFormValues) => {
      const response = await apiRequest('POST', '/api/apps', app);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/apps'] });
      setIsAppModalOpen(false);
      toast({
        title: "Success",
        description: "App created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create app",
        variant: "destructive",
      });
    },
  });
  
  // Form setup
  const form = useForm<AppFormValues>({
    resolver: zodResolver(appSchema),
    defaultValues: {
      name: "",
      description: "",
      baseUrl: "",
      commissionType: "percentage",
      commissionValue: 10,
    },
  });
  
  // Check if user can add more apps
  const canAddApp = () => {
    if (!organization) return false;
    
    const plan = organization.plan as SubscriptionPlan;
    const limits = PLAN_LIMITS[plan];
    
    return !apps || apps.length < limits.apps;
  };
  
  // Handle app creation/editing
  const onSubmit = (data: AppFormValues) => {
    createAppMutation.mutate(data);
  };
  
  // Open app modal for creation or editing
  const openAppModal = (app?: App) => {
    if (app) {
      setEditingApp(app);
      form.reset({
        name: app.name,
        description: app.description || "",
        baseUrl: app.baseUrl,
        commissionType: app.commissionType as "percentage" | "fixed",
        commissionValue: app.commissionValue,
      });
    } else {
      setEditingApp(null);
      form.reset({
        name: "",
        description: "",
        baseUrl: "",
        commissionType: "percentage",
        commissionValue: 10,
      });
    }
    
    if (canAddApp() || app) {
      setIsAppModalOpen(true);
    } else {
      setIsPlanModalOpen(true);
    }
  };
  
  // Table columns definition
  const columns = [
    {
      header: "App",
      accessorKey: "name",
      cell: (data: App) => (
        <div className="flex items-center">
          <div className="bg-primary-50 h-10 w-10 rounded-lg flex items-center justify-center text-primary-600 mr-3">
            {getAppIcon(data.icon, data.id)}
          </div>
          <div>
            <p className="font-medium text-slate-800">{data.name}</p>
            <p className="text-xs text-slate-500">{data.description}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Base URL",
      accessorKey: "baseUrl",
      cell: (data: App) => (
        <a href={data.baseUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline flex items-center">
          <span className="truncate max-w-[200px]">{data.baseUrl}</span>
          <Link className="h-4 w-4 ml-1 inline-flex" />
        </a>
      ),
    },
    {
      header: "Commission",
      accessorKey: "commissionValue",
      cell: (data: App) => (
        <span>
          {data.commissionType === "percentage" 
            ? `${data.commissionValue}%` 
            : `$${data.commissionValue.toFixed(2)}`
          }
        </span>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (data: App) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={() => openAppModal(data)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button size="sm" variant="outline" className="text-error-500 border-error-200 hover:bg-error-50">
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Apps">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">App Management</h1>
          <p className="text-slate-500">Manage your products and services for affiliate promotion</p>
        </div>
        <Button onClick={() => openAppModal()}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add New App
        </Button>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Apps</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>Your Apps</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={apps} 
                isLoading={isLoading}
                emptyState={
                  <div className="py-8 text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No apps found</h3>
                    <p className="text-slate-500 mb-4">Create your first app to start tracking affiliate conversions.</p>
                    <Button onClick={() => openAppModal()}>
                      <PlusCircle className="h-4 w-4 mr-2" /> Add New App
                    </Button>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active">
          <Card>
            <CardContent className="py-8 text-center">
              <h3 className="text-lg font-medium text-slate-800 mb-2">Active Apps</h3>
              <p className="text-slate-500">This tab will show only active apps</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="archived">
          <Card>
            <CardContent className="py-8 text-center">
              <h3 className="text-lg font-medium text-slate-800 mb-2">Archived Apps</h3>
              <p className="text-slate-500">This tab will show only archived apps</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* App Modal */}
      <Dialog open={isAppModalOpen} onOpenChange={setIsAppModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingApp ? "Edit App" : "Add New App"}</DialogTitle>
            <DialogDescription>
              {editingApp 
                ? "Update the details of your application" 
                : "Add a new product or service for affiliate marketing"
              }
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>App Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Premium Subscription" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of your product" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/product" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commissionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="commissionValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Value</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step={form.watch("commissionType") === "fixed" ? "0.01" : "1"}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAppModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAppMutation.isPending}>
                  {createAppMutation.isPending 
                    ? "Saving..." 
                    : editingApp ? "Update App" : "Create App"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
