export interface FeatureGraphNode {
  id: string;
  name: string;
  enabled: boolean;
  dependencies?: string[];
}

export interface FeatureGraph {
  features: FeatureGraphNode[];
}