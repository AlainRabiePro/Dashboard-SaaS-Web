export type Project = {
    id: string;
    name: string;
    domain: string;
    storageUsed: number; // in GB
    status: 'Running' | 'Stopped';
    plan: 'Starter' | 'Pro' | 'Business';
    userId: string;
    createdAt: Date;
};
  
export type Subscription = {
    plan: 'Starter' | 'Pro' | 'Business';
    monthlyCost: number;
    storageLimit: number; // in GB
    cpuCores: number; 
    ram: number; // in GB
};
  
export type UsageStats = {
    cpu: number; // percentage
    ram: number; // percentage
    storage: number; // in GB
};
