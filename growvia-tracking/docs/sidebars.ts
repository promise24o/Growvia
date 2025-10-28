import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/introduction',
        'getting-started/how-it-works',
        'getting-started/quick-setup-cdn',
        'getting-started/quick-setup-npm',
        'getting-started/api-authentication',
      ],
    },
    {
      type: 'category',
      label: 'Tutorial',
      items: [
        'tutorial/track-clicks-visits',
        'tutorial/track-signups-purchases',
        'tutorial/custom-events',
        'tutorial/validating-conversions',
        'tutorial/testing-locally',
      ],
    },
    {
      type: 'category',
      label: 'Create & Manage',
      items: [
        'create-manage/create-campaign',
        'create-manage/commission-models',
        'create-manage/add-affiliates',
        'create-manage/fraud-detection',
        'create-manage/budget-intelligence',
      ],
    },
    {
      type: 'category',
      label: 'Developer Integration',
      items: [
        'developer-integration/javascript-sdk',
        'developer-integration/npm-package',
        'developer-integration/webhook-events',
        'developer-integration/attribution-logic',
        'developer-integration/security-privacy',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: [
        'deployment/deploy-docs',
        'deployment/deploy-tracking-cdn',
        'deployment/versioning',
      ],
    },
    {
      type: 'category',
      label: 'Next Steps',
      items: [
        'next-steps/congratulations',
        'next-steps/advanced-topics',
        'next-steps/contribute',
        'next-steps/support',
      ],
    },
  ],
  
  apiSidebar: [
    'api/overview',
  ],
};

export default sidebars;
