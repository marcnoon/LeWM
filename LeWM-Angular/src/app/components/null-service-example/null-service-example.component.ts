import { Component, OnInit } from '@angular/core';
import { NullService } from '../../services/null.service';
import { NullAuditSummary } from '../../interfaces/null-audit.interface';

/**
 * Example component demonstrating NullService usage patterns
 * This component shows how to use NullService for null tracking and audit display
 */
@Component({
  selector: 'app-null-service-example',
  template: `
    <div class="null-service-example">
      <h3>NullService Audit Dashboard</h3>
      
      <div class="controls">
        <button (click)="clearAuditLog()">Clear Audit Log</button>
        <button (click)="exportAuditLog()">Export Audit Log</button>
        <button (click)="toggleTracking()">
          {{ auditConfig.enabled ? 'Disable' : 'Enable' }} Tracking
        </button>
      </div>
      
      <div class="log-level-controls">
        <h4>Logging Level: {{ auditConfig.logLevel || 'normal' }}</h4>
        <button (click)="setLogLevel('quiet')" [class.active]="auditConfig.logLevel === 'quiet'">Quiet</button>
        <button (click)="setLogLevel('normal')" [class.active]="auditConfig.logLevel === 'normal'">Normal</button>
        <button (click)="setLogLevel('verbose')" [class.active]="auditConfig.logLevel === 'verbose'">Verbose</button>
        <p class="log-level-description">
          <strong>Quiet:</strong> No console output | 
          <strong>Normal:</strong> Log null/undefined accesses | 
          <strong>Verbose:</strong> Log all operations with details
        </p>
      </div>
      
      <div class="summary" *ngIf="auditSummary">
        <h4>Audit Summary</h4>
        <p>Total Entries: {{ auditSummary!.totalEntries }}</p>
        <p>Null Accesses: {{ auditSummary!.nullAccesses }}</p>
        <p>Null Percentage: {{ auditSummary!.nullPercentage.toFixed(2) }}%</p>
        
        <h5>Top Null Properties</h5>
        <ul>
          <li *ngFor="let prop of auditSummary!.topProperties.slice(0, 5)">
            {{ prop.propertyPath }}: {{ prop.nullCount }}/{{ prop.count }} 
            ({{ ((prop.nullCount/prop.count)*100).toFixed(1) }}% null)
          </li>
        </ul>
        
        <h5>Top Null Contexts</h5>
        <ul>
          <li *ngFor="let context of auditSummary!.topNullContexts.slice(0, 5)">
            {{ context.context }}: {{ context.count }} null accesses
          </li>
        </ul>
      </div>
      
      <div class="test-area">
        <h4>Test Null Access Patterns</h4>
        <button (click)="testNullAccess()">Test Null Access</button>
        <button (click)="testSafeAccess()">Test Safe Access</button>
        <button (click)="testNestedAccess()">Test Nested Access</button>
      </div>
    </div>
  `,
  styles: [`
    .null-service-example {
      padding: 20px;
      border: 1px solid #ccc;
      margin: 10px;
      border-radius: 5px;
    }
    .controls button {
      margin: 5px;
      padding: 8px 16px;
      border: 1px solid #007bff;
      background: #007bff;
      color: white;
      border-radius: 3px;
      cursor: pointer;
    }
    .controls button:hover {
      background: #0056b3;
    }
    .log-level-controls {
      margin: 15px 0;
      padding: 15px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 5px;
    }
    .log-level-controls button {
      margin: 5px;
      padding: 5px 12px;
      border: 1px solid #6c757d;
      background: #6c757d;
      color: white;
      border-radius: 3px;
      cursor: pointer;
    }
    .log-level-controls button.active {
      background: #28a745;
      border-color: #28a745;
    }
    .log-level-controls button:hover {
      background: #5a6268;
    }
    .log-level-controls button.active:hover {
      background: #218838;
    }
    .log-level-description {
      font-size: 0.9em;
      color: #6c757d;
      margin-top: 10px;
    }
    .summary {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 5px;
    }
    .test-area {
      margin-top: 20px;
      padding: 15px;
      background: #e9ecef;
      border-radius: 5px;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      padding: 5px 0;
      border-bottom: 1px solid #dee2e6;
    }
  `]
})
export class NullServiceExampleComponent implements OnInit {
  auditSummary: NullAuditSummary | null = null;
  auditConfig: any = {};

  constructor(private nullService: NullService) {}

  ngOnInit(): void {
    this.updateSummary();
    this.auditConfig = this.nullService.getConfig();
    
    // Subscribe to audit changes
    this.nullService.getAuditStream().subscribe(() => {
      this.updateSummary();
    });
  }

  clearAuditLog(): void {
    this.nullService.clearAuditLog();
    console.log('🔍 Audit log cleared from example component');
  }

  exportAuditLog(): void {
    const exportData = this.nullService.exportAuditLog();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'null-audit-log.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    console.log('🔍 Audit log exported from example component');
  }

  toggleTracking(): void {
    const currentConfig = this.nullService.getConfig();
    this.nullService.updateConfig({ enabled: !currentConfig.enabled });
    this.auditConfig = this.nullService.getConfig();
    console.log('🔍 Tracking toggled:', this.auditConfig.enabled);
  }

  setLogLevel(level: 'quiet' | 'normal' | 'verbose'): void {
    this.nullService.setLogLevel(level);
    this.auditConfig = this.nullService.getConfig();
    console.log(`🔍 Log level changed to: ${level}`);
  }

  testNullAccess(): void {
    // Simulate accessing null properties to generate audit entries
    const testData: any = {
      user: null,
      settings: { theme: 'dark', notifications: null },
      items: []
    };

    // Test various null access patterns
    this.nullService.safeCheck(testData.user, 'NullServiceExampleComponent', 'user', {
      method: 'testNullAccess',
      extra: { testType: 'direct null' }
    });

    this.nullService.safeGet(testData, 'user', 'NullServiceExampleComponent', {
      method: 'testNullAccess',
      extra: { testType: 'property access' }
    });

    this.nullService.safeGetNested(testData, 'user.profile.name', 'NullServiceExampleComponent', {
      method: 'testNullAccess',
      extra: { testType: 'nested null' }
    });

    this.nullService.safeGetNested(testData, 'settings.notifications', 'NullServiceExampleComponent', {
      method: 'testNullAccess',
      extra: { testType: 'nested null property' }
    });

    console.log('🔍 Generated test null access entries');
  }

  testSafeAccess(): void {
    // Simulate accessing valid properties
    const testData = {
      user: { id: '123', name: 'Test User' },
      settings: { theme: 'dark', notifications: { email: true } },
      items: [{ id: 1, name: 'Item 1' }]
    };

    this.nullService.safeCheck(testData.user, 'NullServiceExampleComponent', 'user', {
      method: 'testSafeAccess',
      extra: { testType: 'valid object' }
    });

    this.nullService.safeGet(testData, 'user', 'NullServiceExampleComponent', {
      method: 'testSafeAccess',
      extra: { testType: 'valid property' }
    });

    this.nullService.safeGetNested(testData, 'user.name', 'NullServiceExampleComponent', {
      method: 'testSafeAccess',
      extra: { testType: 'valid nested' }
    });

    console.log('🔍 Generated test safe access entries');
  }

  testNestedAccess(): void {
    // Test deeply nested property access patterns
    const complexData = {
      app: {
        modules: {
          graph: {
            nodes: [
              { id: '1', pins: [{ name: 'input' }, { name: 'output' }] },
              { id: '2', pins: null }
            ],
            edges: null
          },
          ui: null
        }
      }
    };

    // Test various nesting levels
    this.nullService.safeGetNested(complexData, 'app.modules.graph.nodes', 'NullServiceExampleComponent', {
      method: 'testNestedAccess',
      extra: { testType: 'deep valid path' }
    });

    this.nullService.safeGetNested(complexData, 'app.modules.graph.edges', 'NullServiceExampleComponent', {
      method: 'testNestedAccess',
      extra: { testType: 'deep null path' }
    });

    this.nullService.safeGetNested(complexData, 'app.modules.ui.settings', 'NullServiceExampleComponent', {
      method: 'testNestedAccess',
      extra: { testType: 'null intermediate' }
    });

    this.nullService.safeGetNested(complexData, 'app.nonexistent.path', 'NullServiceExampleComponent', {
      method: 'testNestedAccess',
      extra: { testType: 'undefined intermediate' }
    });

    console.log('🔍 Generated test nested access entries');
  }

  private updateSummary(): void {
    this.auditSummary = this.nullService.getAuditSummary();
  }
}