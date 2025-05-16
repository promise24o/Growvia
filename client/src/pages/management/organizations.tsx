import React, { useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  X,
  MoreHorizontal,
  RefreshCw,
  Search,
  PenLine,
  Power,
  Shield,
} from "lucide-react";
import ManagementLayout from "@/components/layouts/management-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { organizationsData } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";

export default function OrganizationsManagement() {
  const [organizations, setOrganizations] = useState(
    organizationsData.recentOrganizations
  );
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch =
      searchQuery === "" ||
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = filterPlan === "all" || org.plan === filterPlan;
    const matchesStatus = filterStatus === "all" || org.status === filterStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "free_trial":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "starter":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      case "growth":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "pro":
        return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300";
      case "enterprise":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <ManagementLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Organizations</h1>
            <p className="text-muted-foreground">
              Manage client companies using Growvia
            </p>
          </div>
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        {/* Organizations Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {organizationsData.organizationCount}
              </div>
              <p className="text-xs text-muted-foreground">
                On the platform
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Free Trial
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {organizationsData.organizationsByPlan.free_trial}
              </div>
              <p className="text-xs text-muted-foreground">
                Trial accounts
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Paid Plans
              </CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {organizationsData.organizationsByPlan.starter + 
                 organizationsData.organizationsByPlan.growth + 
                 organizationsData.organizationsByPlan.pro + 
                 organizationsData.organizationsByPlan.enterprise}
              </div>
              <p className="text-xs text-muted-foreground">
                Paying customers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Enterprise
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {organizationsData.organizationsByPlan.enterprise}
              </div>
              <p className="text-xs text-muted-foreground">
                Premium accounts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={filterPlan}
            onValueChange={setFilterPlan}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free_trial">Free Trial</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Organizations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Apps</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{org.name}</div>
                        <div className="text-sm text-muted-foreground">{org.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getPlanBadgeColor(org.plan)} font-normal`}
                      >
                        {org.plan.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusBadgeColor(org.status)} font-normal`}
                      >
                        {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{org.usersCount}</TableCell>
                    <TableCell>{org.appsCount}</TableCell>
                    <TableCell>
                      {formatDate(new Date(org.createdAt))}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <PenLine className="mr-2 h-4 w-4" />
                            <span>Edit Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Change Plan</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Power className="mr-2 h-4 w-4" />
                            <span>{org.status === "active" ? "Suspend" : "Activate"}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
}