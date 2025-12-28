# Database Seeding Scripts

## Seed Data Script

The `seedData.ts` script generates comprehensive test data for the Growvia platform, including organizations, applications, commission models, and campaigns.

### What Gets Created

- **10 Organizations** across various industries (Technology, Fashion, Health, Education, Gaming, Finance, Travel, Food, etc.)
- **2 Applications per organization** (Website and Mobile App)
- **5 Commission Models per organization** (Click, Signup, Purchase Fixed, Purchase Percentage, Premium Signup)
- **3-5 Campaigns per organization** with realistic configurations

### Running the Script

```bash
npm run seed
```

### Prerequisites

1. MongoDB must be running and accessible
2. Set the `MONGODB_URI` environment variable (defaults to `mongodb://localhost:27017/growvia`)

### What the Script Does

1. **Clears existing data** - Removes all organizations, applications, commission models, and campaigns
2. **Creates organizations** - 10 diverse organizations with different subscription plans and industries
3. **Creates applications** - 2 apps per organization (website and mobile app) with landing pages
4. **Creates commission models** - 5 different commission structures per organization:
   - Click Commission ($0.50 per click)
   - Signup Commission ($10 per signup)
   - Purchase Commission - Fixed ($25 per purchase)
   - Purchase Commission - Percentage (15% of order value)
   - Premium Signup ($50 per premium signup)
5. **Creates campaigns** - 3-5 campaigns per organization with:
   - Random commission model assignments
   - Budget calculations with safety buffers
   - Start and end dates
   - Various categories and visibility settings

### Sample Organizations

- **TechVenture Solutions** - Technology company on PRO plan
- **FashionHub Retail** - Fashion & Retail on ENTERPRISE plan
- **HealthFirst Wellness** - Health & Wellness on GROWTH plan
- **EduLearn Platform** - Education on GROWTH plan
- **GameZone Entertainment** - Gaming on ENTERPRISE plan
- **FinanceWise Advisory** - Finance on PRO plan
- **TravelExplore Agency** - Travel & Tourism on GROWTH plan
- **FoodDelight Delivery** - Food & Beverage on ENTERPRISE plan
- **SmartHome Innovations** - Technology on PRO plan
- **BeautyGlow Cosmetics** - Beauty & Personal Care on STARTER plan

### Output

The script provides detailed console output showing:
- Connection status
- Data clearing confirmation
- Each organization created
- Each application created
- Each commission model created
- Each campaign created
- Final summary with counts

### Example Output

```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB
🗑️  Clearing existing data...
✅ Existing data cleared

📊 Creating organizations...
  ✓ Created organization: TechVenture Solutions
  ✓ Created organization: FashionHub Retail
  ...

🏢 Creating applications for each organization...
  ✓ Created app: Main Website for TechVenture Solutions
  ✓ Created app: Mobile App for TechVenture Solutions
  ...

💰 Creating commission models for each organization...
  ✓ Created commission: Click Commission for TechVenture Solutions
  ...

🎯 Creating campaigns for each organization...
  ✓ Created campaign: Spring Sale Campaign - TechVenture Solutions
  ...

📈 Seed Data Summary:
  Organizations: 10
  Applications: 20
  Commission Models: 50
  Campaigns: 45

✨ Seed data created successfully!
🔌 Database connection closed
✅ Seeding completed
```

### Notes

- The script is idempotent - running it multiple times will clear and recreate all data
- All organizations have `onboardingCompleted: true` for immediate testing
- Campaigns have realistic date ranges (started in the past 30 days, ending 60-120 days from start)
- Budget calculations include safety buffers (15-30%)
- Commission models include fraud detection settings
- Applications include landing pages for websites and app store links for mobile apps

### Troubleshooting

**Connection Error**: Ensure MongoDB is running and the `MONGODB_URI` is correct
**Validation Error**: Check that all required fields match the schema definitions
**Permission Error**: Ensure the database user has write permissions
