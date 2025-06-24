import { TestBed } from '@angular/core/testing';
import { NullService } from './null.service';
import { NullAuditEntry, NullAuditConfig } from '../interfaces/null-audit.interface';

describe('NullService', () => {
  let service: NullService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NullService);
    
    // Clear localStorage and audit log before each test
    localStorage.clear();
    service.clearAuditLog();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Configuration', () => {
    it('should have default configuration', () => {
      const config = service.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.maxEntries).toBe(1000);
      expect(config.persistToStorage).toBe(true);
      expect(config.storageKey).toBe('lewm-null-audit-log');
      expect(config.includedContexts).toEqual([]);
      expect(config.excludedContexts).toEqual([]);
      expect(config.logLevel).toBe('normal');
    });

    it('should update configuration', () => {
      const newConfig: Partial<NullAuditConfig> = {
        enabled: false,
        maxEntries: 500
      };

      service.updateConfig(newConfig);
      const config = service.getConfig();

      expect(config.enabled).toBe(false);
      expect(config.maxEntries).toBe(500);
      expect(config.persistToStorage).toBe(true); // Should remain unchanged
    });

    it('should set log level', () => {
      service.setLogLevel('verbose');
      const config = service.getConfig();
      expect(config.logLevel).toBe('verbose');

      service.setLogLevel('quiet');
      expect(service.getConfig().logLevel).toBe('quiet');
    });
  });

  describe('Access Recording', () => {
    it('should record null access', () => {
      service.recordAccess('TestComponent', 'node.pins', 'read', null);

      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].context).toBe('TestComponent');
      expect(entries[0].propertyPath).toBe('node.pins');
      expect(entries[0].accessType).toBe('read');
      expect(entries[0].wasNull).toBe(true);
      expect(entries[0].value).toBeUndefined();
    });

    it('should record non-null access', () => {
      const testValue = { name: 'test' };
      service.recordAccess('TestComponent', 'node.data', 'read', testValue);

      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].wasNull).toBe(false);
      expect(entries[0].value).toEqual(testValue);
    });

    it('should record undefined access', () => {
      service.recordAccess('TestComponent', 'node.pins', 'read', undefined);

      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].wasNull).toBe(true);
    });

    it('should not record when disabled', () => {
      service.updateConfig({ enabled: false });
      service.recordAccess('TestComponent', 'node.pins', 'read', null);

      const entries = service.getAuditEntries();
      expect(entries.length).toBe(0);
    });

    it('should include metadata when provided', () => {
      const metadata = {
        method: 'isPinNameDuplicate',
        line: 42,
        extra: { nodeId: 'test-node' }
      };

      service.recordAccess('GraphEditorComponent', 'node.pins', 'check', null, metadata);

      const entries = service.getAuditEntries();
      expect(entries[0].metadata).toEqual(metadata);
    });
  });

  describe('Safe Check Utility', () => {
    it('should return true for non-null values', () => {
      const value = { pins: [] };
      const result = service.safeCheck(value, 'TestComponent', 'node');

      expect(result).toBe(true);
      
      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].wasNull).toBe(false);
    });

    it('should return false for null values', () => {
      const result = service.safeCheck(null, 'TestComponent', 'node');

      expect(result).toBe(false);
      
      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].wasNull).toBe(true);
    });

    it('should return false for undefined values', () => {
      const result = service.safeCheck(undefined, 'TestComponent', 'node');

      expect(result).toBe(false);
      
      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].wasNull).toBe(true);
    });
  });

  describe('Safe Get Utility', () => {
    it('should return property value for valid objects', () => {
      const obj = { pins: [{ name: 'pin1' }] };
      const result = service.safeGet(obj, 'pins', 'TestComponent');

      expect(result).toEqual([{ name: 'pin1' }]);
      
      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].propertyPath).toBe('object.pins');
      expect(entries[0].wasNull).toBe(false);
    });

    it('should return undefined for null objects', () => {
      const result = service.safeGet(null as any, 'pins', 'TestComponent');

      expect(result).toBeUndefined();
      
      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].wasNull).toBe(true);
    });
  });

  describe('Safe Nested Get Utility', () => {
    it('should return nested property value', () => {
      const obj = { 
        node: { 
          pins: [{ name: 'pin1' }] 
        } 
      };
      const result = service.safeGetNested(obj, 'node.pins', 'TestComponent');

      expect(result).toEqual([{ name: 'pin1' }]);
      
      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].propertyPath).toBe('node.pins');
      expect(entries[0].wasNull).toBe(false);
    });

    it('should return undefined for null intermediate objects', () => {
      const obj = { node: null };
      const result = service.safeGetNested(obj, 'node.pins', 'TestComponent');

      expect(result).toBeUndefined();
      
      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].propertyPath).toBe('node.pins');
      expect(entries[0].wasNull).toBe(true);
    });
  });

  describe('Context Filtering', () => {
    it('should include only specified contexts when includedContexts is set', () => {
      service.updateConfig({ includedContexts: ['AllowedComponent'] });

      service.recordAccess('AllowedComponent', 'prop1', 'read', 'value1');
      service.recordAccess('BlockedComponent', 'prop2', 'read', 'value2');

      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].context).toBe('AllowedComponent');
    });

    it('should exclude specified contexts when excludedContexts is set', () => {
      service.updateConfig({ excludedContexts: ['BlockedComponent'] });

      service.recordAccess('AllowedComponent', 'prop1', 'read', 'value1');
      service.recordAccess('BlockedComponent', 'prop2', 'read', 'value2');

      const entries = service.getAuditEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].context).toBe('AllowedComponent');
    });
  });

  describe('Audit Summary', () => {
    beforeEach(() => {
      // Add test data
      service.recordAccess('ComponentA', 'node.pins', 'read', null);
      service.recordAccess('ComponentA', 'node.pins', 'read', []);
      service.recordAccess('ComponentB', 'edge.from', 'read', null);
      service.recordAccess('ComponentA', 'node.data', 'read', { id: '1' });
    });

    it('should calculate summary statistics correctly', () => {
      const summary = service.getAuditSummary();

      expect(summary.totalEntries).toBe(4);
      expect(summary.nullAccesses).toBe(2);
      expect(summary.successfulAccesses).toBe(2);
      expect(summary.nullPercentage).toBe(50);
    });

    it('should identify top properties', () => {
      const summary = service.getAuditSummary();

      expect(summary.topProperties.length).toBeGreaterThan(0);
      expect(summary.topProperties[0].propertyPath).toBe('node.pins');
      expect(summary.topProperties[0].count).toBe(2);
      expect(summary.topProperties[0].nullCount).toBe(1);
    });

    it('should identify top null contexts', () => {
      const summary = service.getAuditSummary();

      expect(summary.topNullContexts.length).toBeGreaterThan(0);
      expect(summary.topNullContexts[0].context).toBe('ComponentA');
      expect(summary.topNullContexts[0].count).toBe(1);
    });
  });

  describe('Export and Clear', () => {
    it('should export audit log as JSON', () => {
      service.recordAccess('TestComponent', 'node.pins', 'read', null);
      
      const exported = service.exportAuditLog();
      const parsed = JSON.parse(exported);

      expect(parsed.config).toBeDefined();
      expect(parsed.summary).toBeDefined();
      expect(parsed.entries).toBeDefined();
      expect(parsed.entries.length).toBe(1);
    });

    it('should clear audit log', () => {
      service.recordAccess('TestComponent', 'node.pins', 'read', null);
      expect(service.getAuditEntries().length).toBe(1);

      service.clearAuditLog();
      expect(service.getAuditEntries().length).toBe(0);
    });
  });

  describe('Persistence', () => {
    it('should persist to localStorage when enabled', () => {
      service.updateConfig({ persistToStorage: true });
      service.recordAccess('TestComponent', 'node.pins', 'read', null);

      const stored = localStorage.getItem('lewm-null-audit-log');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.entries.length).toBe(1);
    });

    it('should not persist when disabled', () => {
      service.updateConfig({ persistToStorage: false });
      service.recordAccess('TestComponent', 'node.pins', 'read', null);

      const stored = localStorage.getItem('lewm-null-audit-log');
      expect(stored).toBeNull();
    });

    it('should maintain max entries limit', () => {
      service.updateConfig({ maxEntries: 2 });

      service.recordAccess('TestComponent', 'prop1', 'read', null);
      service.recordAccess('TestComponent', 'prop2', 'read', null);
      service.recordAccess('TestComponent', 'prop3', 'read', null);

      const entries = service.getAuditEntries();
      expect(entries.length).toBe(2);
      expect(entries[0].propertyPath).toBe('prop2'); // First entry should be removed
      expect(entries[1].propertyPath).toBe('prop3');
    });
  });
});