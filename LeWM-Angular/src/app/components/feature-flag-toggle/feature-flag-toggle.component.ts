import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeatureGraphService } from '../../services/feature-graph.service';
import { FeatureGraph, FeatureGraphNode } from '../../interfaces/feature-graph.interface';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-feature-flag-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feature-flag-toggle.component.html',
  styleUrl: './feature-flag-toggle.component.scss'
})
export class FeatureFlagToggleComponent implements OnInit, OnDestroy {
  featureGraph$: Observable<FeatureGraph | null>;
  private subscription?: Subscription;

  private featureGraphService = inject(FeatureGraphService);

  constructor() {
    this.featureGraph$ = this.featureGraphService.featureGraphObservable;
  }

  ngOnInit(): void {
    // Load features on init
    this.featureGraphService.loadFeatures();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Toggle a feature flag
   * @param featureName The name of the feature to toggle
   */
  toggleFeature(featureName: string): void {
    this.featureGraphService.toggleFeature(featureName);
  }

  /**
   * Check if a feature is enabled
   * @param featureName The name of the feature to check
   * @returns true if the feature is enabled
   */
  isFeatureEnabled(featureName: string): boolean {
    return this.featureGraphService.isFeatureEnabled(featureName);
  }

  /**
   * Get display name for a feature
   * @param feature The feature node
   * @returns Display name for the feature
   */
  getFeatureDisplayName(feature: FeatureGraphNode): string {
    return feature.name.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Check if all dependencies for a feature are satisfied
   * @param feature The feature to check
   * @returns true if all dependencies are enabled
   */
  areDependenciesSatisfied(feature: FeatureGraphNode): boolean {
    if (!feature.dependencies || feature.dependencies.length === 0) {
      return true;
    }
    return feature.dependencies.every(dep => this.featureGraphService.isFeatureEnabled(dep));
  }
}