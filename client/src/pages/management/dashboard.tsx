import React from "react";
import {
  BarChart3,
  Users,
  Building2,
  Link as LinkIcon,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import ManagementLayout from "@/components/layouts/management-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  usersData,
  organizationsData,
  appsData,
  affiliateLinksData,
  revenueData,
  conversionsData,
  affiliateData,
  activityLogsData,
} from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";

export default function ManagementDashboard() {
  return (
    <ManagementLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Platform Overview</h1>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersData.userCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {usersData.usersByRole.admin.toLocaleString()} admins,{" "}
                {usersData.usersByRole.marketer.toLocaleString()} marketers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Organizations
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {organizationsData.organizationCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {organizationsData.organizationsByPlan.growth +
                  organizationsData.organizationsByPlan.pro +
                  organizationsData.organizationsByPlan.enterprise}{" "}
                on paid plans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Apps</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {appsData.appCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Affiliate Links
              </CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {affiliateLinksData.linkCount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {conversionsData.totalConversions.toLocaleString()} conversions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Finance Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{revenueData.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 text-green-500">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Up 12.5% from last month</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Recurring
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{revenueData.monthlyRecurring.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 text-green-500">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Up 8.3% from last month</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Annual Recurring
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₦{revenueData.annualRecurring.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 text-green-500">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>Up 10.2% from last month</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity and Top Affiliates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Platform Activity</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-auto">
              <div className="space-y-5">
                {activityLogsData.recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-4 items-start border-b border-gray-100 dark:border-gray-800 pb-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {log.details}
                      </p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>
                          By: {log.user} 
                          {log.organization && ` (${log.organization})`}
                        </span>
                        <span>{formatDate(new Date(log.timestamp))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Top Affiliates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {affiliateData.topAffiliates.map((affiliate) => (
                  <div
                    key={affiliate.id}
                    className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3"
                  >
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        {affiliate.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium">{affiliate.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {affiliate.organization}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₦{affiliate.commission.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {affiliate.conversions} conversions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Subscription Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Free Trial</p>
                    <div className="text-xs text-muted-foreground">
                      {organizationsData.organizationsByPlan.free_trial} organizations
                    </div>
                  </div>
                  <span className="font-medium">
                    {Math.round(
                      (organizationsData.organizationsByPlan.free_trial /
                        organizationsData.organizationCount) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-100 dark:bg-blue-900 rounded-full"
                    style={{
                      width: `${Math.round(
                        (organizationsData.organizationsByPlan.free_trial /
                          organizationsData.organizationCount) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Starter</p>
                    <div className="text-xs text-muted-foreground">
                      {organizationsData.organizationsByPlan.starter} organizations
                    </div>
                  </div>
                  <span className="font-medium">
                    {Math.round(
                      (organizationsData.organizationsByPlan.starter /
                        organizationsData.organizationCount) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-200 dark:bg-indigo-800 rounded-full"
                    style={{
                      width: `${Math.round(
                        (organizationsData.organizationsByPlan.starter /
                          organizationsData.organizationCount) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Growth</p>
                    <div className="text-xs text-muted-foreground">
                      {organizationsData.organizationsByPlan.growth} organizations
                    </div>
                  </div>
                  <span className="font-medium">
                    {Math.round(
                      (organizationsData.organizationsByPlan.growth /
                        organizationsData.organizationCount) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-200 dark:bg-purple-800 rounded-full"
                    style={{
                      width: `${Math.round(
                        (organizationsData.organizationsByPlan.growth /
                          organizationsData.organizationCount) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Pro</p>
                    <div className="text-xs text-muted-foreground">
                      {organizationsData.organizationsByPlan.pro} organizations
                    </div>
                  </div>
                  <span className="font-medium">
                    {Math.round(
                      (organizationsData.organizationsByPlan.pro /
                        organizationsData.organizationCount) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-fuchsia-200 dark:bg-fuchsia-800 rounded-full"
                    style={{
                      width: `${Math.round(
                        (organizationsData.organizationsByPlan.pro /
                          organizationsData.organizationCount) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Enterprise</p>
                    <div className="text-xs text-muted-foreground">
                      {organizationsData.organizationsByPlan.enterprise} organizations
                    </div>
                  </div>
                  <span className="font-medium">
                    {Math.round(
                      (organizationsData.organizationsByPlan.enterprise /
                        organizationsData.organizationCount) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-200 dark:bg-pink-800 rounded-full"
                    style={{
                      width: `${Math.round(
                        (organizationsData.organizationsByPlan.enterprise /
                          organizationsData.organizationCount) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Payment Method Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">Flutterwave</span>
                  </div>
                  <div className="text-2xl font-bold">64%</div>
                  <div className="text-xs text-muted-foreground">
                    Primary payment processor
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Paystack</span>
                  </div>
                  <div className="text-2xl font-bold">36%</div>
                  <div className="text-xs text-muted-foreground">
                    Secondary payment processor
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold mb-4">Payment Status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Successful</div>
                    <div className="text-xl font-bold text-green-500">
                      {(798 / 835 * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Failed</div>
                    <div className="text-xl font-bold text-red-500">
                      {(37 / 835 * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Pending</div>
                    <div className="text-xl font-bold text-yellow-500">
                      {(12 / 835 * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ManagementLayout>
  );
}