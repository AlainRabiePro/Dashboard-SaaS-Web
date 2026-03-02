import type { Project, Subscription, UsageStats } from './types';

export const MOCK_USER_ID = 'user-123';

export const MOCK_SUBSCRIPTION: Subscription = {
  plan: 'Pro',
  monthlyCost: 25,
  storageLimit: 100,
  cpuCores: 4,
  ram: 8,
};

export const MOCK_USAGE: UsageStats = {
  cpu: 45,
  ram: 60,
  storage: 35.5,
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    name: 'QuantumLeap',
    domain: 'quantumleap.io',
    storageUsed: 15.2,
    status: 'Running',
    plan: 'Pro',
    userId: MOCK_USER_ID,
    createdAt: new Date('2023-10-26'),
  },
  {
    id: 'proj-002',
    name: 'StellarCRM',
    domain: 'stellarcrm.app',
    storageUsed: 8.5,
    status: 'Running',
    plan: 'Pro',
    userId: MOCK_USER_ID,
    createdAt: new Date('2023-08-15'),
  },
  {
    id: 'proj-003',
    name: 'Portfolio V2',
    domain: 'janedoe.dev',
    storageUsed: 1.8,
    status: 'Stopped',
    plan: 'Starter',
    userId: MOCK_USER_ID,
    createdAt: new Date('2023-05-01'),
  },
  {
    id: 'proj-004',
    name: 'Zenith E-commerce',
    domain: 'zenith-store.com',
    storageUsed: 10.0,
    status: 'Running',
    plan: 'Business',
    userId: MOCK_USER_ID,
    createdAt: new Date('2024-01-20'),
  },
];
