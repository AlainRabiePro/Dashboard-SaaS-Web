export type Project = {
    id: string;
    name: string;
    domain: string;
    storageUsed: number; // in GB
    status: 'Running' | 'Stopped';
    plan: 'Starter' | 'Professional' | 'Enterprise';
    userId: string;
    createdAt: any; // Firestore Timestamp
};
  
export type Subscription = {
    plan: 'Starter' | 'Professional' | 'Enterprise';
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
