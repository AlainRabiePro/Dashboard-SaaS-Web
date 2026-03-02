export type Project = {
    id: string;
    name: string;
    domain: string;
    storageUsed: number; // in GB
    status: 'Running' | 'Stopped';
    plan: 'Personal' | 'Starter' | 'Pro';
    userId: string;
    createdAt: any; // Firestore Timestamp
};
  
export type Subscription = {
    plan: 'Personal' | 'Starter' | 'Pro';
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
