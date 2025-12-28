import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Organization } from '../models/Organization';
import { Commission } from '../models/CommissionModel';
import { Campaign } from '../models/CampaignModel';
import { App } from '../models/Application';
import { SubscriptionPlan } from '../../shared/schema';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/growvia';

const organizationsData = [
  {
    name: 'TechVenture Solutions',
    email: 'admin@techventure.com',
    plan: SubscriptionPlan.PRO,
    onboardingCompleted: true,
    industry: 'Technology',
    companySize: '50-200',
    primaryGoal: 'Drive sales and increase brand awareness through affiliate partnerships',
    targetAudience: 'Tech-savvy professionals, developers, and IT decision makers aged 25-45',
    existingAffiliates: 'Yes, currently managing 50+ active affiliates',
    productsToPromote: 'Cloud hosting services, SaaS products, and enterprise software solutions',
  },
  {
    name: 'FashionHub Retail',
    email: 'contact@fashionhub.com',
    plan: SubscriptionPlan.ENTERPRISE,
    onboardingCompleted: true,
    industry: 'Fashion & Retail',
    companySize: '200-500',
    primaryGoal: 'Expand market reach and boost online sales through influencer marketing',
    targetAudience: 'Fashion-conscious millennials and Gen Z, primarily women aged 18-35',
    existingAffiliates: 'Yes, working with 100+ fashion influencers and bloggers',
    productsToPromote: 'Clothing, accessories, footwear, and seasonal collections',
  },
  {
    name: 'HealthFirst Wellness',
    email: 'info@healthfirst.com',
    plan: SubscriptionPlan.GROWTH,
    onboardingCompleted: true,
    industry: 'Health & Wellness',
    companySize: '20-50',
    primaryGoal: 'Generate qualified leads and increase customer acquisition',
    targetAudience: 'Health-conscious individuals, fitness enthusiasts, ages 25-50',
    existingAffiliates: 'Starting fresh, no existing affiliate program',
    productsToPromote: 'Nutritional supplements, fitness equipment, wellness coaching programs',
  },
  {
    name: 'EduLearn Platform',
    email: 'support@edulearn.com',
    plan: SubscriptionPlan.GROWTH,
    onboardingCompleted: true,
    industry: 'Education',
    companySize: '10-20',
    primaryGoal: 'Increase course enrollments and build brand credibility',
    targetAudience: 'Students, professionals seeking upskilling, career changers aged 20-40',
    existingAffiliates: 'Yes, 25 education bloggers and career coaches',
    productsToPromote: 'Online courses, certification programs, learning subscriptions',
  },
  {
    name: 'GameZone Entertainment',
    email: 'partnerships@gamezone.com',
    plan: SubscriptionPlan.ENTERPRISE,
    onboardingCompleted: true,
    industry: 'Gaming',
    companySize: '100-200',
    primaryGoal: 'Drive game downloads and in-app purchases',
    targetAudience: 'Gamers aged 16-35, mobile and PC gaming enthusiasts',
    existingAffiliates: 'Yes, 200+ gaming streamers and content creators',
    productsToPromote: 'Mobile games, PC games, in-game currency, premium subscriptions',
  },
  {
    name: 'FinanceWise Advisory',
    email: 'hello@financewise.com',
    plan: SubscriptionPlan.PRO,
    onboardingCompleted: true,
    industry: 'Finance',
    companySize: '50-100',
    primaryGoal: 'Generate high-quality leads for financial services',
    targetAudience: 'Young professionals, entrepreneurs, investors aged 25-55',
    existingAffiliates: 'Yes, 30 financial bloggers and advisors',
    productsToPromote: 'Investment platforms, financial planning tools, insurance products',
  },
  {
    name: 'TravelExplore Agency',
    email: 'bookings@travelexplore.com',
    plan: SubscriptionPlan.GROWTH,
    onboardingCompleted: true,
    industry: 'Travel & Tourism',
    companySize: '20-50',
    primaryGoal: 'Increase bookings and expand customer base globally',
    targetAudience: 'Travel enthusiasts, adventure seekers, luxury travelers aged 25-60',
    existingAffiliates: 'Yes, 75 travel bloggers and influencers',
    productsToPromote: 'Tour packages, hotel bookings, flight tickets, travel insurance',
  },
  {
    name: 'FoodDelight Delivery',
    email: 'partners@fooddelight.com',
    plan: SubscriptionPlan.ENTERPRISE,
    onboardingCompleted: true,
    industry: 'Food & Beverage',
    companySize: '500+',
    primaryGoal: 'Drive app downloads and increase order frequency',
    targetAudience: 'Urban professionals, families, food lovers aged 18-50',
    existingAffiliates: 'Yes, 150+ food bloggers and local influencers',
    productsToPromote: 'Food delivery services, restaurant partnerships, subscription plans',
  },
  {
    name: 'SmartHome Innovations',
    email: 'sales@smarthome.com',
    plan: SubscriptionPlan.PRO,
    onboardingCompleted: true,
    industry: 'Technology',
    companySize: '50-100',
    primaryGoal: 'Increase product sales and market penetration',
    targetAudience: 'Homeowners, tech enthusiasts, early adopters aged 30-55',
    existingAffiliates: 'Yes, 40 tech reviewers and home improvement bloggers',
    productsToPromote: 'Smart home devices, IoT products, home automation systems',
  },
  {
    name: 'BeautyGlow Cosmetics',
    email: 'info@beautyglow.com',
    plan: SubscriptionPlan.STARTER,
    onboardingCompleted: true,
    industry: 'Beauty & Personal Care',
    companySize: '20-50',
    primaryGoal: 'Build brand awareness and drive e-commerce sales',
    targetAudience: 'Women aged 18-45, beauty enthusiasts, skincare conscious consumers',
    existingAffiliates: 'Yes, 80 beauty influencers and makeup artists',
    productsToPromote: 'Skincare products, makeup, beauty tools, subscription boxes',
  },
];

const commissionModelsTemplates = [
  {
    name: 'Click Commission',
    description: 'Earn for every click generated',
    type: 'click',
    payout: { amount: 0.5, isPercentage: false, currency: 'USD' },
    validationMethod: 'auto',
    payoutDelay: 0,
    oneConversionPerUser: false,
    status: 'active' as const,
    fraudDetection: {
      ipRestriction: 'one_per_12h' as const,
      deviceFingerprintChecks: true,
      duplicateEmailPhoneBlock: false,
      conversionSpikeAlert: true,
      cookieTamperDetection: true,
      affiliateBlacklist: false,
      kycVerifiedOnly: false,
    },
  },
  {
    name: 'Signup Commission',
    description: 'Earn when users sign up',
    type: 'signup',
    payout: { amount: 10, isPercentage: false, currency: 'USD' },
    validationMethod: 'auto',
    payoutDelay: 1,
    oneConversionPerUser: true,
    status: 'active' as const,
    fraudDetection: {
      duplicateEmailPhoneBlock: true,
      deviceFingerprintChecks: true,
      conversionSpikeAlert: true,
      cookieTamperDetection: true,
      affiliateBlacklist: false,
      kycVerifiedOnly: false,
    },
  },
  {
    name: 'Purchase Commission - Fixed',
    description: 'Fixed commission per purchase',
    type: 'purchase',
    payout: { amount: 25, isPercentage: false, currency: 'USD' },
    validationMethod: 'auto',
    payoutDelay: 7,
    oneConversionPerUser: false,
    status: 'active' as const,
    fraudDetection: {
      minimumOrderValue: 50000,
      duplicateEmailPhoneBlock: true,
      deviceFingerprintChecks: true,
      conversionSpikeAlert: true,
      cookieTamperDetection: true,
      affiliateBlacklist: true,
      kycVerifiedOnly: false,
    },
  },
  {
    name: 'Purchase Commission - Percentage',
    description: 'Percentage-based commission on sales',
    type: 'purchase',
    payout: {
      amount: 15,
      isPercentage: true,
      baseField: 'orderValue',
      conversionValueEstimate: 100,
    },
    validationMethod: 'auto',
    payoutDelay: 7,
    oneConversionPerUser: false,
    status: 'active' as const,
    fraudDetection: {
      minimumOrderValue: 30000,
      duplicateEmailPhoneBlock: true,
      deviceFingerprintChecks: true,
      conversionSpikeAlert: true,
      cookieTamperDetection: true,
      affiliateBlacklist: true,
      kycVerifiedOnly: false,
    },
  },
  {
    name: 'Premium Signup',
    description: 'High-value commission for premium signups',
    type: 'signup',
    payout: { amount: 50, isPercentage: false, currency: 'USD' },
    validationMethod: 'auto',
    payoutDelay: 3,
    oneConversionPerUser: true,
    maxPerMarketer: 100,
    status: 'active' as const,
    fraudDetection: {
      duplicateEmailPhoneBlock: true,
      deviceFingerprintChecks: true,
      conversionSpikeAlert: true,
      cookieTamperDetection: true,
      affiliateBlacklist: true,
      kycVerifiedOnly: true,
    },
  },
];

const applicationTemplates = [
  {
    name: 'Main Website',
    type: 'Website',
    shortDescription: 'Primary company website',
    detailedDescription: 'Our main website featuring all products and services',
    category: 'Other',
    status: 'active',
  },
  {
    name: 'Mobile App',
    type: 'Mobile App',
    shortDescription: 'Official mobile application',
    detailedDescription: 'Download our app for exclusive deals and seamless experience',
    category: 'Other',
    status: 'active',
  },
];

const campaignTemplates = [
  {
    name: 'Spring Sale Campaign',
    category: 'e-commerce',
    description: 'Promote our spring collection with exclusive discounts for affiliates',
    affiliateRequirements: 'Active social media presence with minimum 5k followers',
    visibility: 'public' as const,
    safetyBufferPercent: 20,
    maxAffiliates: 100,
    expectedConversionsPerAffiliate: 50,
    status: 'active' as const,
  },
  {
    name: 'New Product Launch',
    category: 'technology',
    description: 'Launch campaign for our latest product line',
    affiliateRequirements: 'Tech bloggers and reviewers preferred',
    visibility: 'public' as const,
    safetyBufferPercent: 25,
    maxAffiliates: 50,
    expectedConversionsPerAffiliate: 30,
    status: 'active' as const,
  },
  {
    name: 'Holiday Special',
    category: 'e-commerce',
    description: 'Year-end holiday promotion with increased commissions',
    affiliateRequirements: 'Proven track record in affiliate marketing',
    visibility: 'invite-only' as const,
    safetyBufferPercent: 30,
    maxAffiliates: 75,
    expectedConversionsPerAffiliate: 100,
    status: 'active' as const,
  },
  {
    name: 'Subscription Drive',
    category: 'saas',
    description: 'Drive subscriptions for our premium service tier',
    affiliateRequirements: 'Experience in SaaS or B2B marketing',
    visibility: 'public' as const,
    safetyBufferPercent: 15,
    maxAffiliates: 200,
    expectedConversionsPerAffiliate: 25,
    status: 'active' as const,
  },
  {
    name: 'Back to School Campaign',
    category: 'education',
    description: 'Educational products and courses for students',
    affiliateRequirements: 'Education influencers and student communities',
    visibility: 'public' as const,
    safetyBufferPercent: 20,
    maxAffiliates: 150,
    expectedConversionsPerAffiliate: 40,
    status: 'active' as const,
  },
];

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const createdOrganizations = [];
    const createdApps = [];
    const createdCommissions = [];
    const createdCampaigns = [];

    console.log('\n📊 Creating organizations...');
    for (const orgData of organizationsData) {
      const org = await Organization.create(orgData);
      createdOrganizations.push(org);
      console.log(`  ✓ Created organization: ${org.name}`);
    }

    console.log('\n🏢 Creating applications for each organization...');
    for (const org of createdOrganizations) {
      for (const appTemplate of applicationTemplates) {
        const app = await App.create({
          ...appTemplate,
          organizationId: org._id,
          url: `https://${org.name.toLowerCase().replace(/\s+/g, '')}.com`,
          landingPages: appTemplate.type === 'Website' ? [
            {
              id: `lp-${Date.now()}-1`,
              title: 'Home Page',
              url: `https://${org.name.toLowerCase().replace(/\s+/g, '')}.com`,
              isPrimary: true,
              createdAt: new Date(),
            },
            {
              id: `lp-${Date.now()}-2`,
              title: 'Products',
              url: `https://${org.name.toLowerCase().replace(/\s+/g, '')}.com/products`,
              isPrimary: false,
              createdAt: new Date(),
            },
          ] : [],
          appStoreLink: appTemplate.type === 'Mobile App' ? 'https://apps.apple.com/app/example' : undefined,
          googlePlayLink: appTemplate.type === 'Mobile App' ? 'https://play.google.com/store/apps/details?id=com.example' : undefined,
        });
        createdApps.push({ app, organizationId: org._id });
        console.log(`  ✓ Created app: ${app.name} for ${org.name}`);
      }
    }

    console.log('\n💰 Creating commission models for each organization...');
    for (const org of createdOrganizations) {
      const orgCommissions = [];
      for (const commTemplate of commissionModelsTemplates) {
        const commission = await Commission.create({
          ...commTemplate,
          organizationId: org._id,
        });
        orgCommissions.push(commission);
        createdCommissions.push({ commission, organizationId: org._id });
        console.log(`  ✓ Created commission: ${commission.name} for ${org.name}`);
      }
    }

    console.log('\n🎯 Creating campaigns for each organization...');
    for (const org of createdOrganizations) {
      const orgApps = createdApps.filter(a => 
        (a.organizationId as mongoose.Types.ObjectId).toString() === (org._id as mongoose.Types.ObjectId).toString()
      );
      const orgCommissions = createdCommissions.filter(c => 
        (c.organizationId as mongoose.Types.ObjectId).toString() === (org._id as mongoose.Types.ObjectId).toString()
      );

      if (orgApps.length === 0 || orgCommissions.length === 0) {
        console.log(`  ⚠️  Skipping campaigns for ${org.name} - no apps or commissions`);
        continue;
      }

      const numCampaigns = Math.min(campaignTemplates.length, 3 + Math.floor(Math.random() * 3));
      
      for (let i = 0; i < numCampaigns; i++) {
        const template = campaignTemplates[i % campaignTemplates.length];
        if (!template) continue;
        
        const randomApp = orgApps[Math.floor(Math.random() * orgApps.length)];
        if (!randomApp) continue;
        
        const numCommissions = 1 + Math.floor(Math.random() * 3);
        const selectedCommissions = orgCommissions
          .sort(() => 0.5 - Math.random())
          .slice(0, numCommissions)
          .map(c => c.commission._id);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 60 + Math.floor(Math.random() * 60));

        const baseBudget = 5000 + Math.floor(Math.random() * 45000);
        const bufferAmount = baseBudget * (template.safetyBufferPercent / 100);
        const totalBudget = baseBudget + bufferAmount;

        const campaign = await Campaign.create({
          ...template,
          name: `${template.name} - ${org.name}`,
          organizationId: org._id,
          applicationId: randomApp.app._id,
          commissionModels: selectedCommissions,
          startDate,
          endDate,
          budgetCalculation: {
            baseBudget,
            bufferAmount,
            totalBudget,
            breakdown: selectedCommissions.map((commId, idx) => {
              const comm = orgCommissions.find(c => c.commission._id.toString() === commId.toString());
              const percentage = 100 / selectedCommissions.length;
              return {
                modelName: comm?.commission.name || `Model ${idx + 1}`,
                cost: totalBudget * (percentage / 100),
                percentage,
              };
            }),
          },
        });
        createdCampaigns.push(campaign);
        console.log(`  ✓ Created campaign: ${campaign.name}`);
      }
    }

    console.log('\n📈 Seed Data Summary:');
    console.log(`  Organizations: ${createdOrganizations.length}`);
    console.log(`  Applications: ${createdApps.length}`);
    console.log(`  Commission Models: ${createdCommissions.length}`);
    console.log(`  Campaigns: ${createdCampaigns.length}`);

    console.log('\n✨ Seed data created successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
