// Demo data for management dashboard when real data is not available yet

export const usersData = {
  userCount: 483,
  usersByRole: {
    admin: 125,
    marketer: 358
  },
  recentUsers: [
    {
      id: 1,
      name: "Jane Cooper",
      email: "jane@example.com",
      role: "admin",
      organizationName: "Acme Inc",
      status: "active",
      createdAt: "2025-05-01T10:00:00Z"
    },
    {
      id: 2,
      name: "Wade Warren",
      email: "wade@example.com",
      role: "marketer",
      organizationName: "Globex Corp",
      status: "active",
      createdAt: "2025-04-28T09:30:00Z"
    },
    {
      id: 3,
      name: "Esther Howard",
      email: "esther@example.com",
      role: "admin",
      organizationName: "Initech",
      status: "locked",
      createdAt: "2025-04-25T14:20:00Z"
    },
    {
      id: 4,
      name: "Cameron Williamson",
      email: "cameron@example.com",
      role: "marketer",
      organizationName: "Massive Dynamic",
      status: "active",
      createdAt: "2025-04-22T11:45:00Z"
    },
    {
      id: 5,
      name: "Brooklyn Simmons",
      email: "brooklyn@example.com",
      role: "marketer",
      organizationName: "Stark Industries",
      status: "pending",
      createdAt: "2025-04-21T08:15:00Z"
    }
  ]
};

export const organizationsData = {
  organizationCount: 125,
  organizationsByPlan: {
    free_trial: 45,
    starter: 38,
    growth: 27,
    pro: 12,
    enterprise: 3
  },
  recentOrganizations: [
    {
      id: 1,
      name: "Acme Inc",
      email: "admin@acme.com",
      plan: "growth",
      status: "active",
      createdAt: "2025-05-02T10:00:00Z",
      usersCount: 15,
      appsCount: 3
    },
    {
      id: 2,
      name: "Globex Corp",
      email: "admin@globex.com",
      plan: "pro",
      status: "active",
      createdAt: "2025-04-29T14:30:00Z",
      usersCount: 28,
      appsCount: 5
    },
    {
      id: 3,
      name: "Initech",
      email: "admin@initech.com",
      plan: "starter",
      status: "active",
      createdAt: "2025-04-27T09:15:00Z",
      usersCount: 7,
      appsCount: 1
    },
    {
      id: 4,
      name: "Massive Dynamic",
      email: "admin@massive.com",
      plan: "enterprise",
      status: "active",
      createdAt: "2025-04-25T11:45:00Z",
      usersCount: 42,
      appsCount: 8
    },
    {
      id: 5,
      name: "Stark Industries",
      email: "admin@stark.com",
      plan: "free_trial",
      status: "pending",
      createdAt: "2025-04-21T15:30:00Z",
      usersCount: 3,
      appsCount: 1
    }
  ]
};

export const appsData = {
  appCount: 287,
  recentApps: [
    {
      id: 1,
      name: "Project Alpha",
      organization: "Acme Inc",
      status: "active",
      createdAt: "2025-05-01T09:30:00Z",
      conversions: 153,
      revenue: 4625
    },
    {
      id: 2,
      name: "Customer Portal",
      organization: "Globex Corp",
      status: "active",
      createdAt: "2025-04-28T14:15:00Z",
      conversions: 87,
      revenue: 2610
    },
    {
      id: 3,
      name: "Analytics Dashboard",
      organization: "Initech",
      status: "inactive",
      createdAt: "2025-04-25T11:00:00Z",
      conversions: 0,
      revenue: 0
    },
    {
      id: 4,
      name: "Mobile App",
      organization: "Massive Dynamic",
      status: "active",
      createdAt: "2025-04-22T10:45:00Z",
      conversions: 329,
      revenue: 9870
    },
    {
      id: 5,
      name: "E-commerce Platform",
      organization: "Stark Industries",
      status: "pending",
      createdAt: "2025-04-20T13:30:00Z",
      conversions: 0,
      revenue: 0
    }
  ]
};

export const affiliateLinksData = {
  linkCount: 1428,
  recentLinks: [
    {
      id: 1,
      code: "JANE50",
      user: "Jane Cooper",
      organization: "Acme Inc",
      app: "Project Alpha",
      clicks: 387,
      conversions: 42,
      createdAt: "2025-05-01T09:30:00Z"
    },
    {
      id: 2,
      code: "WADE25",
      user: "Wade Warren",
      organization: "Globex Corp",
      app: "Customer Portal",
      clicks: 246,
      conversions: 18,
      createdAt: "2025-04-29T11:15:00Z"
    },
    {
      id: 3,
      code: "ESTHER10",
      user: "Esther Howard",
      organization: "Initech",
      app: "Analytics Dashboard",
      clicks: 103,
      conversions: 5,
      createdAt: "2025-04-27T14:45:00Z"
    },
    {
      id: 4,
      code: "CAM75",
      user: "Cameron Williamson",
      organization: "Massive Dynamic",
      app: "Mobile App",
      clicks: 529,
      conversions: 61,
      createdAt: "2025-04-24T10:30:00Z"
    },
    {
      id: 5,
      code: "BROOK20",
      user: "Brooklyn Simmons",
      organization: "Stark Industries",
      app: "E-commerce Platform",
      clicks: 78,
      conversions: 0,
      createdAt: "2025-04-20T15:15:00Z"
    }
  ]
};

export const revenueData = {
  totalRevenue: 287950,
  monthlyRecurring: 32500,
  annualRecurring: 390000,
  revenueByPlan: [
    { name: "Free Trial", value: 0 },
    { name: "Starter", value: 35720 },
    { name: "Growth", value: 86430 },
    { name: "Pro", value: 95800 },
    { name: "Enterprise", value: 70000 }
  ],
  revenueByMonth: [
    { month: "Jan", revenue: 18500 },
    { month: "Feb", revenue: 19200 },
    { month: "Mar", revenue: 21500 },
    { month: "Apr", revenue: 24800 },
    { month: "May", revenue: 29500 },
    { month: "Jun", revenue: 32500 },
    { month: "Jul", revenue: 36800 },
    { month: "Aug", revenue: 38500 },
    { month: "Sep", revenue: 42000 },
    { month: "Oct", revenue: 0 },
    { month: "Nov", revenue: 0 },
    { month: "Dec", revenue: 0 }
  ]
};

export const paymentsData = {
  totalPayments: 835,
  successfulPayments: 798,
  failedPayments: 37,
  pendingPayments: 12,
  recentPayments: [
    {
      id: 1,
      organization: "Acme Inc",
      amount: 7900,
      status: "successful",
      gateway: "flutterwave",
      date: "2025-05-03T10:15:00Z"
    },
    {
      id: 2,
      organization: "Globex Corp",
      amount: 19900,
      status: "successful",
      gateway: "paystack",
      date: "2025-05-02T14:30:00Z"
    },
    {
      id: 3,
      organization: "Initech",
      amount: 2900,
      status: "failed",
      gateway: "flutterwave",
      date: "2025-05-01T09:45:00Z"
    },
    {
      id: 4,
      organization: "Massive Dynamic",
      amount: 39900,
      status: "successful",
      gateway: "paystack",
      date: "2025-04-30T11:20:00Z"
    },
    {
      id: 5,
      organization: "Stark Industries",
      amount: 0,
      status: "pending",
      gateway: "flutterwave",
      date: "2025-04-29T15:10:00Z"
    }
  ]
};

export const activityLogsData = {
  totalLogs: 12849,
  recentLogs: [
    {
      id: 1,
      user: "Jane Cooper",
      organization: "Acme Inc",
      action: "Created new affiliate link",
      details: "Created link with code SUMMER25 for Project Alpha",
      timestamp: "2025-05-04T10:15:30Z"
    },
    {
      id: 2,
      user: "System Administrator",
      organization: null,
      action: "Updated organization plan",
      details: "Changed Globex Corp plan from 'Growth' to 'Pro'",
      timestamp: "2025-05-04T09:30:45Z"
    },
    {
      id: 3,
      user: "Wade Warren",
      organization: "Globex Corp",
      action: "Conversion recorded",
      details: "New conversion worth $99 via link WADE25",
      timestamp: "2025-05-04T08:45:20Z"
    },
    {
      id: 4,
      user: "System Administrator",
      organization: null,
      action: "Reset user password",
      details: "Reset password for Esther Howard (esther@example.com)",
      timestamp: "2025-05-03T16:20:10Z"
    },
    {
      id: 5,
      user: "Cameron Williamson",
      organization: "Massive Dynamic",
      action: "Payment processed",
      details: "Subscription renewal payment of $399 via Paystack",
      timestamp: "2025-05-03T14:55:30Z"
    }
  ]
};

export const conversionsData = {
  totalConversions: 3287,
  totalValue: 273450,
  averageValue: 83.19,
  conversionsByMonth: [
    { month: "Jan", count: 209, value: 17340 },
    { month: "Feb", count: 245, value: 20370 },
    { month: "Mar", count: 278, value: 23210 },
    { month: "Apr", count: 312, value: 25980 },
    { month: "May", count: 356, value: 29640 },
    { month: "Jun", count: 398, value: 33180 },
    { month: "Jul", count: 452, value: 37560 },
    { month: "Aug", count: 478, value: 39810 },
    { month: "Sep", count: 559, value: 46360 },
    { month: "Oct", value: 0, count: 0 },
    { month: "Nov", value: 0, count: 0 },
    { month: "Dec", value: 0, count: 0 }
  ]
};

export const affiliateData = {
  totalAffiliates: 358,
  topAffiliates: [
    {
      id: 1,
      name: "Cameron Williamson",
      organization: "Massive Dynamic",
      conversions: 61,
      revenue: 6039,
      commission: 1208
    },
    {
      id: 2,
      name: "Jane Cooper",
      organization: "Acme Inc",
      conversions: 42,
      revenue: 4158,
      commission: 832
    },
    {
      id: 3,
      name: "Wade Warren",
      organization: "Globex Corp",
      conversions: 18,
      revenue: 1782,
      commission: 356
    },
    {
      id: 4,
      name: "Brooklyn Simmons",
      organization: "Stark Industries",
      conversions: 12,
      revenue: 1188,
      commission: 238
    },
    {
      id: 5,
      name: "Esther Howard",
      organization: "Initech",
      conversions: 5,
      revenue: 495,
      commission: 99
    }
  ]
};