import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatureGraphService } from '../../services/feature-graph.service';
import { FeatureGraphNode } from '../../interfaces/feature-graph.interface';

@Component({
  selector: 'app-feature-flag-toggle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="feature-toggle" *ngIf="features.length">
      <div *ngFor="let feature of features" class="feature-row">
        <label>
          <input type="checkbox" [checked]="feature.enabled"
                 (change)="toggle(feature, $event.target.checked)" />
          {{ feature.name }}
        </label>
      </div>
    </div>
  `,
  styles: [`
    .feature-toggle { padding: 0.5rem; }
    .feature-row { margin-bottom: 0.25rem; }
  `]
})
export class FeatureFlagToggleComponent implements OnInit {
  features: FeatureGraphNode[] = [];
  private featureService = inject(FeatureGraphService);

  ngOnInit(): void {
    this.featureService.featuresLoaded.subscribe(() => {
      this.features = this.featureService.getAllFeatures();
    });
  }

  toggle(feature: FeatureGraphNode, state: boolean): void {
    this.featureService.setFeatureEnabled(feature.name, state);
  }
}
