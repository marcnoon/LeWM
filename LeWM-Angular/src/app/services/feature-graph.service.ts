import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { FeatureGraph } from '../interfaces/feature-graph.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeatureGraphService {
  private featureGraph: FeatureGraph | null = null;
  private readonly featuresLoaded$ = new BehaviorSubject<boolean>(false);
  private readonly featureGraph$ = new BehaviorSubject<FeatureGraph | null>(null);

  private http = inject(HttpClient);

  /**
   * Loads the feature graph based on the current environment configuration
   * This should be called during app initialization
   */
  async loadFeatures(): Promise<void> {
    try {
      const graphPath = this.constructGraphPath();
      console.log(`Loading feature graph from: ${graphPath}`);
      
      const graph = await this.http.get<FeatureGraph>(graphPath).toPromise();
      this.featureGraph = graph || { features: [] };
      
      console.log(`Loaded ${this.featureGraph.features.length} features`);
      this.featureGraph$.next(this.featureGraph);
      this.featuresLoaded$.next(true);
    } catch (error) {
      console.warn('Failed to load feature graph, falling back to empty feature set', error);
      this.featureGraph = { features: [] };
      this.featureGraph$.next(this.featureGraph);
      this.featuresLoaded$.next(true);
    }
  }

  /**
   * Checks if a feature is enabled, including recursive dependency validation
   * @param featureName The name of the feature to check
   * @returns true if the feature is enabled and all dependencies are satisfied
   */
  isFeatureEnabled(featureName: string): boolean {
    if (!this.featureGraph) {
      console.warn('Feature graph not loaded yet');
      return false;
    }

    return this.checkFeatureEnabled(featureName, new Set());
  }

  /**
   * Observable that emits whether a feature is enabled
   * @param featureName The name of the feature to check
   * @returns Observable<boolean> that emits true if the feature is enabled
   */
  isFeatureEnabled$(featureName: string): Observable<boolean> {
    return this.featureGraph$.pipe(
      map(graph => {
        if (!graph) return false;
        this.featureGraph = graph;
        return this.checkFeatureEnabled(featureName, new Set());
      })
    );
  }

  /**
   * Toggle a feature at runtime
   * @param featureName The name of the feature to toggle
   */
  toggleFeature(featureName: string): void {
    if (!this.featureGraph) {
      console.warn('Feature graph not loaded yet');
      return;
    }

    const feature = this.featureGraph.features.find(f => f.name === featureName);
    if (feature) {
      feature.enabled = !feature.enabled;
      this.featureGraph$.next(this.featureGraph);
      console.log(`Feature ${featureName} toggled to ${feature.enabled}`);
    }
  }

  /**
   * Gets all enabled features
   * @returns Array of enabled feature names
   */
  getEnabledFeatures(): string[] {
    if (!this.featureGraph) {
      return [];
    }

    return this.featureGraph.features
      .filter(feature => this.isFeatureEnabled(feature.name))
      .map(feature => feature.name);
  }

  /**
   * Observable to check if features have been loaded
   */
  get featuresLoaded(): Observable<boolean> {
    return this.featuresLoaded$.asObservable();
  }

  /**
   * Observable for the complete feature graph
   */
  get featureGraphObservable(): Observable<FeatureGraph | null> {
    return this.featureGraph$.asObservable();
  }

  /**
   * Constructs the path to the feature graph JSON file based on environment
   */
  private constructGraphPath(): string {
    const tier = environment.tier || 'public';
    const envName = environment.envName || 'dev';
    return `assets/features/${tier}/${envName}.graph.json`;
  }

  /**
   * Recursively checks if a feature is enabled, including dependency validation
   * @param featureName The feature name to check
   * @param visited Set of visited features to prevent circular dependencies
   */
  private checkFeatureEnabled(featureName: string, visited: Set<string>): boolean {
    if (visited.has(featureName)) {
      console.warn(`Circular dependency detected for feature: ${featureName}`);
      return false;
    }

    const feature = this.featureGraph?.features.find(f => f.name === featureName);
    if (!feature) {
      console.warn(`Feature not found: ${featureName}`);
      return false;
    }

    if (!feature.enabled) {
      return false;
    }

    // Check dependencies
    if (feature.dependencies && feature.dependencies.length > 0) {
      visited.add(featureName);
      
      for (const dependency of feature.dependencies) {
        if (!this.checkFeatureEnabled(dependency, visited)) {
          visited.delete(featureName);
          return false;
        }
      }
      
      visited.delete(featureName);
    }

    return true;
  }
}