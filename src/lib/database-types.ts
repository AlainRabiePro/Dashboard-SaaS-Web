/**
 * Types génériques pour supporter plusieurs bases de données
 */

export type DatabaseType = 'firestore' | 'supabase' | 'mysql' | 'mariadb' | 'postgresql' | 'mongodb' | 'custom';

/**
 * Configuration Firestore
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Configuration Supabase
 */
export interface SupabaseConfig {
  projectUrl: string;
  anonKey: string;
  serviceKey?: string;
}

/**
 * Configuration MySQL/MariaDB
 */
export interface MySQLConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
}

/**
 * Configuration PostgreSQL
 */
export interface PostgreSQLConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
}

/**
 * Configuration MongoDB
 */
export interface MongoDBConfig {
  connectionString: string;
  database: string;
}

/**
 * Union de toutes les configurations
 */
export type DatabaseConfig = 
  | { type: 'firestore'; config: FirebaseConfig }
  | { type: 'supabase'; config: SupabaseConfig }
  | { type: 'mysql'; config: MySQLConfig }
  | { type: 'mariadb'; config: MySQLConfig }
  | { type: 'postgresql'; config: PostgreSQLConfig }
  | { type: 'mongodb'; config: MongoDBConfig }
  | { type: 'custom'; config: Record<string, any> };

/**
 * Structure générique pour une base de données attachée à un site
 */
export interface SiteDatabase {
  id: string;
  siteId: string;
  name: string;
  type: DatabaseType;
  config: FirebaseConfig | SupabaseConfig | MySQLConfig | PostgreSQLConfig | MongoDBConfig | Record<string, any>;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastConnectionTest?: Date;
  connectionStatus?: 'connected' | 'disconnected' | 'error';
  error?: string;
}

/**
 * Réponse générique des collections/tables
 */
export interface DatabaseCollection {
  name: string;
  count: number;
  type?: 'collection' | 'table' | 'schema';
  data?: Record<string, any>[];
}

/**
 * Métadonnées d'une base de données
 */
export interface DatabaseMetadata {
  type: DatabaseType;
  version?: string;
  collections: DatabaseCollection[];
  stats?: {
    totalTables?: number;
    totalCollections?: number;
    totalSize?: number;
    lastUpdated?: Date;
  };
}

/**
 * Configuration des types de bases disponibles
 */
export const DATABASE_TYPES: Record<DatabaseType, {
  label: string;
  description: string;
  icon?: string;
}> = {
  firestore: {
    label: 'Firebase Firestore',
    description: 'Base NoSQL en temps réel de Google',
  },
  supabase: {
    label: 'Supabase',
    description: 'PostgreSQL en tant que service',
  },
  mysql: {
    label: 'MySQL',
    description: 'Base de données MySQL',
  },
  mariadb: {
    label: 'MariaDB',
    description: 'Base de données MariaDB',
  },
  postgresql: {
    label: 'PostgreSQL',
    description: 'Base de données PostgreSQL',
  },
  mongodb: {
    label: 'MongoDB',
    description: 'Base NoSQL MongoDB',
  },
  custom: {
    label: 'Personnalisé',
    description: 'Configuration personnalisée',
  },
};
