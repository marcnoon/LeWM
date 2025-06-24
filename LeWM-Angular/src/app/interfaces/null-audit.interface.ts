/**
 * Interface for tracking null/undefined property access patterns
 */
export interface NullAuditEntry {
  /** Unique identifier for this audit entry */
  id: string;
  /** Timestamp when the access occurred */
  timestamp: Date;
  /** Component or service where the access occurred */
  context: string;
  /** Property path that was accessed (e.g., 'node.pins', 'edge.from') */
  propertyPath: string;
  /** Type of access: 'read', 'write', 'check' */
  accessType: 'read' | 'write' | 'check';
  /** Whether the value was null/undefined at time of access */
  wasNull: boolean;
  /** The actual value (if not null/undefined) */
  value?: any;
  /** Additional metadata about the access */
  metadata?: {
    /** Method or function where access occurred */
    method?: string;
    /** Line number if available */
    line?: number;
    /** Additional context-specific data */
    extra?: Record<string, any>;
  };
}

/**
 * Configuration for null audit tracking
 */
export interface NullAuditConfig {
  /** Whether audit tracking is enabled */
  enabled: boolean;
  /** Maximum number of entries to keep in memory */
  maxEntries: number;
  /** Whether to persist audit log to localStorage */
  persistToStorage: boolean;
  /** Storage key for localStorage persistence */
  storageKey: string;
  /** Contexts to include in auditing (empty array = all) */
  includedContexts: string[];
  /** Contexts to exclude from auditing */
  excludedContexts: string[];
}

/**
 * Summary statistics for null audit tracking
 */
export interface NullAuditSummary {
  /** Total number of audit entries */
  totalEntries: number;
  /** Number of null/undefined accesses */
  nullAccesses: number;
  /** Number of successful (non-null) accesses */
  successfulAccesses: number;
  /** Percentage of null accesses */
  nullPercentage: number;
  /** Most frequently accessed properties */
  topProperties: Array<{ propertyPath: string; count: number; nullCount: number }>;
  /** Contexts with most null accesses */
  topNullContexts: Array<{ context: string; count: number }>;
  /** Time range of audit data */
  timeRange: { start: Date; end: Date };
}