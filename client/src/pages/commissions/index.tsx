import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Conversion, Payout } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Download, 
  CreditCard, 
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowUpRight
} from "lucide-react";

export default function Commissions() {
  const { toast } = useToast();
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("flutterwave");
  
  // Get conversions
  const { data: conversions, isLoading: isLoadingConversions } = useQuery<Conversion[]>({
    queryKey: ['/api/conversions'],
  });
  
  // Get payouts
  const { data: payouts, isLoading: isLoadingPayouts } = useQuery<Payout[]>({
    queryKey: ['/api/payouts'],
  });
  
  // Get user stats
  const { data: userStats } = useQuery({
    queryKey: ['/api/analytics/user'],
  });
  
  const handleRequestPayout = async () => {
    try {
      await apiRequest('POST', '/api/payouts/request', {
        amount: payoutAmount,
        paymentMethod
      });
      
      toast({
        title: "Payout requested",
        description: "Your payout request has been submitted successfully",
      });
      
      setIsPayoutModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request payout",
        variant: "destructive",
      });
    }
  };
  
  // Conversion status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-success-50 text-success-600 border-success-200">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-error-50 text-error-600 border-error-200">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="bg-primary-50 text-primary-600 border-primary-200">
            <DollarSign className="h-3 w-3 mr-1" /> Paid
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-warning-50 text-warning-600 border-warning-200">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
    }
  };
  
  // Payout status badge
  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-success-50 text-success-600 border-success-200">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-error-50 text-error-600 border-error-200">
            <XCircle className="h-3 w-3 mr-1" /> Failed
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="bg-primary-50 text-primary-600 border-primary-200">
            <ArrowUpRight className="h-3 w-3 mr-1" /> Processing
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-warning-50 text-warning-600 border-warning-200">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
    }
  };
  
  // Conversion table columns
  const conversionColumns = [
    {
      header: "Transaction ID",
      accessorKey: "transactionId",
      cell: (data: Conversion) => (
        <span className="font-medium text-slate-800">{data.transactionId}</span>
      ),
    },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: (data: Conversion) => (
        <span>{new Date(data.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (data: Conversion) => (
        <span className="font-medium">${data.amount.toFixed(2)}</span>
      ),
    },
    {
      header: "Commission",
      accessorKey: "commission",
      cell: (data: Conversion) => (
        <span className="font-medium text-primary-600">${data.commission.toFixed(2)}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (data: Conversion) => getStatusBadge(data.status),
    },
  ];
  
  // Payout table columns
  const payoutColumns = [
    {
      header: "ID",
      accessorKey: "id",
      cell: (data: Payout) => (
        <span className="font-medium text-slate-800">#{data.id}</span>
      ),
    },
    {
      header: "Date",
      accessorKey: "createdAt",
      cell: (data: Payout) => (
        <span>{new Date(data.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      header: "Amount",
      accessorKey: "amount",
      cell: (data: Payout) => (
        <span className="font-medium">${data.amount.toFixed(2)}</span>
      ),
    },
    {
      header: "Payment Method",
      accessorKey: "paymentMethod",
      cell: (data: Payout) => (
        <span className="capitalize">{data.paymentMethod}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (data: Payout) => getPayoutStatusBadge(data.status),
    },
    {
      header: "Reference",
      accessorKey: "paymentReference",
      cell: (data: Payout) => (
        <span className="text-sm text-slate-600">
          {data.paymentReference || "—"}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout title="Commissions">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Commissions & Payouts</h1>
          <p className="text-slate-500">Manage your earnings and request payouts</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={() => setIsPayoutModalOpen(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500">Pending Commission</p>
                <h3 className="text-2xl font-semibold text-slate-800 mt-1">
                  ${userStats?.pendingCommission?.toFixed(2) || "0.00"}
                </h3>
              </div>
              <div className="bg-warning-50 p-3 rounded-full text-warning-500">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500">Total Paid</p>
                <h3 className="text-2xl font-semibold text-slate-800 mt-1">
                  ${userStats?.totalCommission?.toFixed(2) || "0.00"}
                </h3>
              </div>
              <div className="bg-success-50 p-3 rounded-full text-success-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-500">Available for Payout</p>
                <h3 className="text-2xl font-semibold text-slate-800 mt-1">
                  ${(userStats?.pendingCommission || 0).toFixed(2)}
                </h3>
              </div>
              <div className="bg-primary-50 p-3 rounded-full text-primary-600">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="conversions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="conversions" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>Conversion History</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={conversionColumns} 
                data={conversions} 
                isLoading={isLoadingConversions}
                emptyState={
                  <div className="py-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No conversions yet</h3>
                    <p className="text-slate-500">
                      Once you start generating sales, your conversions will appear here.
                    </p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payouts" className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={payoutColumns} 
                data={payouts} 
                isLoading={isLoadingPayouts}
                emptyState={
                  <div className="py-8 text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No payouts yet</h3>
                    <p className="text-slate-500 mb-4">
                      Once you have commission available, you can request a payout.
                    </p>
                    <Button onClick={() => setIsPayoutModalOpen(true)}>
                      Request Payout
                    </Button>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Payout Modal */}
      <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Enter the amount you want to withdraw and select your preferred payment method.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                <Input
                  id="amount"
                  type="number"
                  min="10"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value))}
                />
              </div>
              <p className="text-xs text-slate-500">
                Available: ${(userStats?.pendingCommission || 0).toFixed(2)}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Select a payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flutterwave">Flutterwave</SelectItem>
                  <SelectItem value="paystack">Paystack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayoutModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestPayout}
              disabled={payoutAmount <= 0 || !paymentMethod}
            >
              Request Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
