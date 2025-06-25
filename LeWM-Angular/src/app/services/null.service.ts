import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { NullAuditEntry, NullAuditConfig, NullAuditSummary } from '../interfaces/null-audit.interface';

/**
 * Experimental service for tracking and auditing null/undefined usage across the application
 */
@Injectable({
  providedIn: 'root'
})
export class NullService {
  private readonly defaultConfig: NullAuditConfig = {
    enabled: true,
    maxEntries: 1000,
    persistToStorage: true,
    storageKey: 'lewm-null-audit-log',
    includedContexts: [],
    excludedContexts: [],
    logLevel: 'normal'
  };

  private config: NullAuditConfig;
  private auditEntries: NullAuditEntry[] = [];
  private auditSubject = new BehaviorSubject<NullAuditEntry[]>([]);

  constructor() {
    this.config = { ...this.defaultConfig };
    this.loadAuditLog();
    console.log(`🔍 NullService initialized - experimental null/undefined tracking enabled (log level: ${this.config.logLevel})`);
  }

  /**
   * Get observable stream of audit entries
   */
  getAuditStream(): Observable<NullAuditEntry[]> {
    return this.auditSubject.asObservable();
  }

  /**
   * Get current audit configuration
   */
  getConfig(): NullAuditConfig {
    return { ...this.config };
  }

  /**
   * Update audit configuration
   */
  updateConfig(newConfig: Partial<NullAuditConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔍 NullService config updated:', this.config);
  }

  /**
   * Set logging level for console output
   */
  setLogLevel(level: 'quiet' | 'normal' | 'verbose'): void {
    this.updateConfig({ logLevel: level });
    if (level !== 'quiet') {
      console.log(`🔍 NullService: Logging level set to '${level}'`);
    }
  }

  /**
   * Record a null/undefined access for audit tracking
   */
  recordAccess(
    context: string,
    propertyPath: string,
    accessType: 'read' | 'write' | 'check',
    value: any,
    metadata?: NullAuditEntry['metadata']
  ): void {
    if (!this.config.enabled) {
      return;
    }

    // Check if context should be included/excluded
    if (this.shouldSkipContext(context)) {
      return;
    }

    const isNull = value === null || value === undefined;
    
    // Console logging based on log level
    try {
      this.logAccess(context, propertyPath, accessType, isNull, value, metadata);
    } catch (error) {
      // Handle logging errors gracefully
      if (this.config.logLevel !== 'quiet') {
        console.error('🔍 NullService: Error during logging:', error);
      }
    }

    const entry: NullAuditEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      context,
      propertyPath,
      accessType,
      wasNull: isNull,
      value: isNull ? undefined : value,
      metadata
    };

    this.addAuditEntry(entry);
  }

  /**
   * Safe null check utility that records the access
   */
  safeCheck<T>(
    value: T | null | undefined,
    context: string,
    propertyPath: string,
    metadata?: NullAuditEntry['metadata']
  ): value is T {
    try {
      // Log the check operation before performing it
      if (this.config.logLevel === 'verbose') {
        console.log(`🔍 NullService: Checking ${propertyPath} in ${context}`, 
          { value: value === null ? 'null' : value === undefined ? 'undefined' : 'defined', metadata });
      }

      this.recordAccess(context, propertyPath, 'check', value, metadata);
      const result = value !== null && value !== undefined;
      
      // Log the result in verbose mode
      if (this.config.logLevel === 'verbose') {
        console.log(`🔍 NullService: Check result for ${propertyPath}: ${result ? 'SAFE' : 'NULL/UNDEFINED'}`);
      }
      
      return result;
    } catch (error) {
      // Handle and log any errors that occur during safe check
      if (this.config.logLevel !== 'quiet') {
        console.error(`🔍 NullService: Error during safeCheck for ${propertyPath} in ${context}:`, error);
      }
      // Return false for safety if an error occurs
      return false;
    }
  }

  /**
   * Safe property access with null tracking
   */
  safeGet<T, K extends keyof T>(
    obj: T | null | undefined,
    key: K,
    context: string,
    metadata?: NullAuditEntry['metadata']
  ): T[K] | undefined {
    const propertyPath = `${typeof obj}.${String(key)}`;
    
    try {
      if (this.config.logLevel === 'verbose') {
        console.log(`🔍 NullService: Getting property ${String(key)} from object in ${context}`);
      }
      
      if (obj === null || obj === undefined) {
        this.recordAccess(context, propertyPath, 'read', undefined, metadata);
        if (this.config.logLevel === 'verbose') {
          console.log(`🔍 NullService: Object is ${obj === null ? 'null' : 'undefined'}, returning undefined`);
        }
        return undefined;
      }

      const value = obj[key];
      this.recordAccess(context, propertyPath, 'read', value, metadata);
      
      if (this.config.logLevel === 'verbose') {
        console.log(`🔍 NullService: Retrieved property ${String(key)}:`, 
          value === null ? 'null' : value === undefined ? 'undefined' : 'defined');
      }
      
      return value;
    } catch (error) {
      if (this.config.logLevel !== 'quiet') {
        console.error(`🔍 NullService: Error during safeGet for ${propertyPath} in ${context}:`, error);
      }
      return undefined;
    }
  }

  /**
   * Safe nested property access with dot notation
   */
  safeGetNested<T>(
    obj: any,
    path: string,
    context: string,
    metadata?: NullAuditEntry['metadata']
  ): T | undefined {
    const keys = path.split('.');
    let current = obj;
    let currentPath = '';

    try {
      if (this.config.logLevel === 'verbose') {
        console.log(`🔍 NullService: Getting nested property '${path}' in ${context}`);
      }

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        currentPath = currentPath ? `${currentPath}.${key}` : key;

        if (current === null || current === undefined) {
          this.recordAccess(context, currentPath, 'read', undefined, metadata);
          if (this.config.logLevel === 'verbose') {
            console.log(`🔍 NullService: Path ${currentPath} is ${current === null ? 'null' : 'undefined'}`);
          }
          return undefined;
        }

        current = current[key];
      }

      this.recordAccess(context, path, 'read', current, metadata);
      
      if (this.config.logLevel === 'verbose') {
        console.log(`🔍 NullService: Successfully retrieved nested property '${path}':`, 
          current === null ? 'null' : current === undefined ? 'undefined' : 'defined');
      }
      
      return current;
    } catch (error) {
      if (this.config.logLevel !== 'quiet') {
        console.error(`🔍 NullService: Error during safeGetNested for '${path}' in ${context}:`, error);
      }
      return undefined;
    }
  }

  /**
   * Get audit summary statistics
   */
  getAuditSummary(): NullAuditSummary {
    const entries = this.auditEntries;
    const nullAccesses = entries.filter(e => e.wasNull).length;
    const successfulAccesses = entries.length - nullAccesses;

    // Calculate top properties
    const propertyStats = new Map<string, { count: number; nullCount: number }>();
    entries.forEach(entry => {
      const current = propertyStats.get(entry.propertyPath) || { count: 0, nullCount: 0 };
      current.count++;
      if (entry.wasNull) {
        current.nullCount++;
      }
      propertyStats.set(entry.propertyPath, current);
    });

    const topProperties = Array.from(propertyStats.entries())
      .map(([propertyPath, stats]) => ({ propertyPath, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate top null contexts
    const contextStats = new Map<string, number>();
    entries.filter(e => e.wasNull).forEach(entry => {
      contextStats.set(entry.context, (contextStats.get(entry.context) || 0) + 1);
    });

    const topNullContexts = Array.from(contextStats.entries())
      .map(([context, count]) => ({ context, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate time range
    const timestamps = entries.map(e => e.timestamp);
    const timeRange = timestamps.length > 0 ? {
      start: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      end: new Date(Math.max(...timestamps.map(t => t.getTime())))
    } : {
      start: new Date(),
      end: new Date()
    };

    return {
      totalEntries: entries.length,
      nullAccesses,
      successfulAccesses,
      nullPercentage: entries.length > 0 ? (nullAccesses / entries.length) * 100 : 0,
      topProperties,
      topNullContexts,
      timeRange
    };
  }

  /**
   * Export audit log as JSON
   */
  exportAuditLog(): string {
    return JSON.stringify({
      config: this.config,
      summary: this.getAuditSummary(),
      entries: this.auditEntries
    }, null, 2);
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditEntries = [];
    this.auditSubject.next([]);
    this.saveAuditLog();
    console.log('🔍 NullService audit log cleared');
  }

  /**
   * Get all audit entries
   */
  getAuditEntries(): NullAuditEntry[] {
    return [...this.auditEntries];
  }

  private shouldSkipContext(context: string): boolean {
    // If includedContexts is specified and not empty, only include those contexts
    if (this.config.includedContexts.length > 0) {
      return !this.config.includedContexts.includes(context);
    }

    // Skip if context is in excludedContexts
    return this.config.excludedContexts.includes(context);
  }

  private addAuditEntry(entry: NullAuditEntry): void {
    this.auditEntries.push(entry);

    // Maintain max entries limit
    if (this.auditEntries.length > this.config.maxEntries) {
      this.auditEntries = this.auditEntries.slice(-this.config.maxEntries);
    }

    this.auditSubject.next([...this.auditEntries]);

    if (this.config.persistToStorage) {
      this.saveAuditLog();
    }
  }

  private saveAuditLog(): void {
    if (!this.config.persistToStorage) {
      return;
    }

    try {
      const data = {
        config: this.config,
        entries: this.auditEntries
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('🔍 NullService: Failed to save audit log to localStorage:', error);
    }
  }

  private loadAuditLog(): void {
    if (!this.config.persistToStorage) {
      return;
    }

    try {
      const saved = localStorage.getItem(this.config.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        
        // Load configuration (merge with defaults)
        if (data.config) {
          this.config = { ...this.defaultConfig, ...data.config };
        }

        // Load entries and convert timestamps back to Date objects
        if (data.entries && Array.isArray(data.entries)) {
          this.auditEntries = data.entries.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
          this.auditSubject.next([...this.auditEntries]);
        }

        console.log(`🔍 NullService: Loaded ${this.auditEntries.length} audit entries from localStorage`);
      }
    } catch (error) {
      console.warn('🔍 NullService: Failed to load audit log from localStorage:', error);
    }
  }

  private generateId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log access operations based on configured log level
   */
  private logAccess(
    context: string,
    propertyPath: string,
    accessType: 'read' | 'write' | 'check',
    isNull: boolean,
    value: any,
    metadata?: NullAuditEntry['metadata']
  ): void {
    if (this.config.logLevel === 'quiet') {
      return;
    }

    const logData = {
      context,
      propertyPath,
      accessType,
      isNull,
      value: isNull ? (value === null ? 'null' : 'undefined') : 'defined',
      metadata
    };

    if (this.config.logLevel === 'verbose') {
      if (isNull) {
        console.warn(`🔍 NullService [${accessType.toUpperCase()}]: NULL/UNDEFINED access detected`, logData);
      } else {
        console.log(`🔍 NullService [${accessType.toUpperCase()}]: Safe access`, logData);
      }
    } else if (this.config.logLevel === 'normal' && isNull) {
      // In normal mode, only log null/undefined accesses
      console.warn(`🔍 NullService: ${propertyPath} in ${context} is ${value === null ? 'null' : 'undefined'}`);
    }
  }
}