import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AvatarWithStatus } from "@/components/ui/avatar-with-status";
import { PlanModal } from "@/components/subscription/plan-modal";
import { useAuth } from "@/lib/auth";
import { SubscriptionPlan, PLAN_NAMES, PLAN_LIMITS } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Building, 
  Bell, 
  Settings, 
  CreditCard, 
  Shield 
} from "lucide-react";

export default function SettingsPage() {
  const { user, organization } = useAuth();
  const { toast } = useToast();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  
  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully",
    });
  };
  
  const handleSaveOrganization = () => {
    toast({
      title: "Organization updated",
      description: "Your organization information has been updated successfully",
    });
  };
  
  const handleSavePassword = () => {
    toast({
      title: "Password updated",
      description: "Your password has been updated successfully",
    });
  };
  
  const handleSaveNotifications = () => {
    toast({
      title: "Notification preferences updated",
      description: "Your notification preferences have been updated successfully",
    });
  };
  
  const handleSaveWebhook = () => {
    toast({
      title: "Webhook settings updated",
      description: "Your webhook settings have been updated successfully",
    });
  };

  return (
    <DashboardLayout title="Settings">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
        <p className="text-slate-500">Manage your account, organization, and preferences</p>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization">
            <Building className="h-4 w-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="subscription">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integration">
            <Settings className="h-4 w-4 mr-2" />
            Integration
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and how others see you on the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-shrink-0">
                    {user && <AvatarWithStatus user={user} size="lg" showStatus={false} showDetails={false} />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Profile Picture</Label>
                    <div className="flex flex-wrap gap-4">
                      <Button variant="outline" size="sm">Upload New Image</Button>
                      <Button variant="ghost" size="sm" className="text-slate-500">Remove</Button>
                    </div>
                    <p className="text-xs text-slate-500">Recommended: Square image, at least 300x300px</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user?.name} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <Button variant="ghost">Cancel</Button>
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Update your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor">Two-factor Authentication</Label>
                      <p className="text-sm text-slate-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch id="two-factor" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <Button variant="ghost">Cancel</Button>
                <Button onClick={handleSavePassword}>Update Password</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Organization Tab */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Update your organization's information and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-md bg-primary-50 flex items-center justify-center text-primary-600 border border-primary-200">
                    <Building className="w-10 h-10" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Organization Logo</Label>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="outline" size="sm">Upload Logo</Button>
                    <Button variant="ghost" size="sm" className="text-slate-500">Remove</Button>
                  </div>
                  <p className="text-xs text-slate-500">Recommended: Square image, at least 300x300px</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" defaultValue={organization?.name} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="org-email">Organization Email</Label>
                  <Input id="org-email" type="email" defaultValue={organization?.email} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="org-website">Website (Optional)</Label>
                  <Input id="org-website" type="url" placeholder="https://example.com" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button variant="ghost">Cancel</Button>
              <Button onClick={handleSaveOrganization}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>Manage your subscription and billing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {organization ? PLAN_NAMES[organization.plan as SubscriptionPlan] : "Starter"} Plan
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Your current plan and usage limits
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setIsPlanModalOpen(true)}>
                    Upgrade Plan
                  </Button>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Apps</span>
                    <span className="font-medium">
                      {organization 
                        ? `${PLAN_LIMITS[organization.plan as SubscriptionPlan].apps === 999999 
                          ? "Unlimited" 
                          : PLAN_LIMITS[organization.plan as SubscriptionPlan].apps} apps`
                        : "1 app"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Marketers</span>
                    <span className="font-medium">
                      {organization 
                        ? `${PLAN_LIMITS[organization.plan as SubscriptionPlan].marketers === 999999 
                          ? "Unlimited" 
                          : PLAN_LIMITS[organization.plan as SubscriptionPlan].marketers} marketers`
                        : "10 marketers"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Billing Cycle</span>
                    <span className="font-medium">Monthly</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Next Billing Date</span>
                    <span className="font-medium">July 15, 2023</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Payment Method</h3>
                  <div className="flex items-center p-4 border rounded-lg">
                    <div className="bg-slate-100 p-2 rounded-md mr-4">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-slate-500">Expires 04/2024</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      Update
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Billing Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billing-name">Name</Label>
                      <Input id="billing-name" defaultValue={user?.name} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-email">Email</Label>
                      <Input id="billing-email" type="email" defaultValue={user?.email} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-address">Address</Label>
                      <Input id="billing-address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-city">City</Label>
                      <Input id="billing-city" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-state">State/Province</Label>
                      <Input id="billing-state" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-zip">Postal Code</Label>
                      <Input id="billing-zip" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button variant="outline" className="text-error-500 border-error-200 hover:bg-error-50">
                Cancel Subscription
              </Button>
              <Button>Update Billing Info</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-slate-500">
                      Receive email notifications from our platform
                    </p>
                  </div>
                  <Switch defaultChecked id="email-notifications" />
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Activity Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="conversion-alerts" className="flex-1">
                        Conversion alerts
                        <p className="text-xs text-slate-500">
                          Get notified when a new conversion is recorded
                        </p>
                      </Label>
                      <Switch defaultChecked id="conversion-alerts" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="payout-alerts" className="flex-1">
                        Payout notifications
                        <p className="text-xs text-slate-500">
                          Get notified about payout status changes
                        </p>
                      </Label>
                      <Switch defaultChecked id="payout-alerts" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="marketer-alerts" className="flex-1">
                        Marketer updates
                        <p className="text-xs text-slate-500">
                          Get notified when marketers join or update their profiles
                        </p>
                      </Label>
                      <Switch id="marketer-alerts" />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Marketing & Tips</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="marketing-tips" className="flex-1">
                        Marketing tips & best practices
                        <p className="text-xs text-slate-500">
                          Receive helpful tips to improve your affiliate marketing
                        </p>
                      </Label>
                      <Switch defaultChecked id="marketing-tips" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="product-updates" className="flex-1">
                        Product updates & news
                        <p className="text-xs text-slate-500">
                          Stay informed about new features and platform updates
                        </p>
                      </Label>
                      <Switch defaultChecked id="product-updates" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button variant="ghost">Cancel</Button>
              <Button onClick={handleSaveNotifications}>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Integration Tab */}
        <TabsContent value="integration">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Settings</CardTitle>
                <CardDescription>Configure webhook endpoints to receive real-time event notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input 
                    id="webhook-url" 
                    placeholder="https://example.com/webhook" 
                    defaultValue={organization?.webhookUrl || ""}
                  />
                  <p className="text-xs text-slate-500">
                    We'll send POST requests to this URL when events occur
                  </p>
                </div>
                
                <div className="border p-4 rounded-lg bg-slate-50">
                  <h3 className="text-sm font-medium mb-2">Events</h3>
                  <p className="text-sm text-slate-500 mb-3">
                    Select which events you want to receive webhook notifications for:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="event-conversion" defaultChecked />
                      <Label htmlFor="event-conversion">Conversions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="event-marketer" defaultChecked />
                      <Label htmlFor="event-marketer">Marketer sign-ups</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="event-payout" defaultChecked />
                      <Label htmlFor="event-payout">Payout status changes</Label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center p-4 border rounded-lg bg-primary-50 border-primary-100">
                  <Shield className="h-10 w-10 text-primary-500 mr-4" />
                  <div>
                    <h3 className="font-medium">Webhook Security</h3>
                    <p className="text-sm text-slate-600">
                      We sign all webhook requests with a secret key to verify authenticity.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto">
                    Regenerate Secret
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                <Button variant="ghost">Cancel</Button>
                <Button onClick={handleSaveWebhook}>Save Webhook Settings</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Manage API keys for programmatic access to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Production API Key</p>
                      <p className="text-sm text-slate-500">Last used: 3 days ago</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Reveal Key
                      </Button>
                      <Button variant="outline" size="sm" className="text-error-500 border-error-200 hover:bg-error-50">
                        Revoke
                      </Button>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    Generate New API Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Plan Modal */}
      <PlanModal
        open={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        currentPlan={organization?.plan as SubscriptionPlan}
      />
    </DashboardLayout>
  );
}
