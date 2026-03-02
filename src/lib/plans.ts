export const PLANS = [
  {
    name: 'Starter' as const,
    price: 4.99,
    storageLimit: 10,
    cpuCores: 2,
    ram: 2,
    features: [
      '10 GB SSD Storage',
      'Deploy up to 3 projects',
      'Basic Analytics',
      'Email Support',
    ],
    hasToolAccess: false,
  },
  {
    name: 'Pro' as const,
    price: 13.99,
    storageLimit: 50,
    cpuCores: 4,
    ram: 8,
    features: [
      '50 GB SSD Storage',
      'Deploy unlimited projects',
      'Advanced Analytics',
      'Priority Support',
      'Access to "Deplora" and other tools',
    ],
    hasToolAccess: true,
  },
];
