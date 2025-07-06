import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FeatureGraphService } from './feature-graph.service';
import { FeatureGraph } from '../interfaces/feature-graph.interface';

describe('FeatureGraphService', () => {
  let service: FeatureGraphService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FeatureGraphService]
    });
    service = TestBed.inject(FeatureGraphService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load empty feature graph and return false for any feature', async () => {
    const emptyGraph: FeatureGraph = { features: [] };
    
    const loadPromise = service.loadFeatures();
    
    const req = httpMock.expectOne('assets/features/public/dev.graph.json');
    expect(req.request.method).toBe('GET');
    req.flush(emptyGraph);
    
    await loadPromise;
    
    expect(service.isFeatureEnabled('any-feature')).toBe(false);
    expect(service.getEnabledFeatures()).toEqual([]);
  });

  it('should handle HTTP errors gracefully', async () => {
    const loadPromise = service.loadFeatures();
    
    const req = httpMock.expectOne('assets/features/public/dev.graph.json');
    req.error(new ErrorEvent('Network error'));
    
    await loadPromise;
    
    expect(service.isFeatureEnabled('any-feature')).toBe(false);
    expect(service.getEnabledFeatures()).toEqual([]);
  });

  it('should correctly identify enabled features without dependencies', async () => {
    const testGraph: FeatureGraph = {
      features: [
        { id: 'feature1', name: 'basic-feature', enabled: true },
        { id: 'feature2', name: 'disabled-feature', enabled: false }
      ]
    };
    
    const loadPromise = service.loadFeatures();
    
    const req = httpMock.expectOne('assets/features/public/dev.graph.json');
    req.flush(testGraph);
    
    await loadPromise;
    
    expect(service.isFeatureEnabled('basic-feature')).toBe(true);
    expect(service.isFeatureEnabled('disabled-feature')).toBe(false);
    expect(service.isFeatureEnabled('non-existent-feature')).toBe(false);
    expect(service.getEnabledFeatures()).toEqual(['basic-feature']);
  });

  it('should correctly handle feature dependencies', async () => {
    const testGraph: FeatureGraph = {
      features: [
        { id: 'base', name: 'base-feature', enabled: true },
        { id: 'advanced', name: 'advanced-feature', enabled: true, dependencies: ['base-feature'] },
        { id: 'disabled-base', name: 'disabled-base', enabled: false },
        { id: 'dependent-on-disabled', name: 'dependent-feature', enabled: true, dependencies: ['disabled-base'] }
      ]
    };
    
    const loadPromise = service.loadFeatures();
    
    const req = httpMock.expectOne('assets/features/public/dev.graph.json');
    req.flush(testGraph);
    
    await loadPromise;
    
    expect(service.isFeatureEnabled('base-feature')).toBe(true);
    expect(service.isFeatureEnabled('advanced-feature')).toBe(true);
    expect(service.isFeatureEnabled('dependent-feature')).toBe(false);
    expect(service.getEnabledFeatures()).toEqual(['base-feature', 'advanced-feature']);
  });

  it('should detect circular dependencies', async () => {
    const testGraph: FeatureGraph = {
      features: [
        { id: 'a', name: 'feature-a', enabled: true, dependencies: ['feature-b'] },
        { id: 'b', name: 'feature-b', enabled: true, dependencies: ['feature-a'] }
      ]
    };
    
    const loadPromise = service.loadFeatures();
    
    const req = httpMock.expectOne('assets/features/public/dev.graph.json');
    req.flush(testGraph);
    
    await loadPromise;
    
    expect(service.isFeatureEnabled('feature-a')).toBe(false);
    expect(service.isFeatureEnabled('feature-b')).toBe(false);
    expect(service.getEnabledFeatures()).toEqual([]);
  });

  it('should return empty array when features not loaded', () => {
    expect(service.getEnabledFeatures()).toEqual([]);
    expect(service.isFeatureEnabled('any-feature')).toBe(false);
  });

  // Test new observable methods
  it('should provide observable for feature enabled state', async () => {
    const testGraph: FeatureGraph = {
      features: [
        { id: 'feature1', name: 'basic-feature', enabled: true },
        { id: 'feature2', name: 'disabled-feature', enabled: false }
      ]
    };
    
    const loadPromise = service.loadFeatures();
    
    const req = httpMock.expectOne('assets/features/public/dev.graph.json');
    req.flush(testGraph);
    
    await loadPromise;
    
    service.isFeatureEnabled$('basic-feature').subscribe(enabled => {
      expect(enabled).toBe(true);
    });
    
    service.isFeatureEnabled$('disabled-feature').subscribe(enabled => {
      expect(enabled).toBe(false);
    });
    
    service.isFeatureEnabled$('non-existent-feature').subscribe(enabled => {
      expect(enabled).toBe(false);
    });
  });

  it('should provide observable for enabled features list', async () => {
    const testGraph: FeatureGraph = {
      features: [
        { id: 'feature1', name: 'basic-feature', enabled: true },
        { id: 'feature2', name: 'disabled-feature', enabled: false }
      ]
    };
    
    const loadPromise = service.loadFeatures();
    
    const req = httpMock.expectOne('assets/features/public/dev.graph.json');
    req.flush(testGraph);
    
    await loadPromise;
    
    service.getEnabledFeatures$().subscribe(features => {
      expect(features).toEqual(['basic-feature']);
    });
  });

  it('should provide observable for all features', async () => {
    const testGraph: FeatureGraph = {
      features: [
        { id: 'feature1', name: 'basic-feature', enabled: true },
        { id: 'feature2', name: 'disabled-feature', enabled: false }
      ]
    };
    
    const loadPromise = service.loadFeatures();
    
    const req = httpMock.expectOne('assets/features/public/dev.graph.json');
    req.flush(testGraph);
    
    await loadPromise;
    
    service.getAllFeatures$().subscribe(features => {
      expect(features).toEqual(testGraph.features);
    });
  });

  it('should update observables when features are modified', (done) => {
    const testGraph: FeatureGraph = {
      features: [
        { id: 'feature1', name: 'basic-feature', enabled: false }
      ]
    };
    
    service.loadFeatures().then(() => {
      let checkCount = 0;
      
      // Subscribe to the observable to monitor changes
      service.isFeatureEnabled$('basic-feature').subscribe(enabled => {
        checkCount++;
        
        if (checkCount === 1) {
          // First emission should be false (initial state)
          expect(enabled).toBe(false);
          
          // Enable the feature to trigger the second emission
          service.setFeatureEnabled('basic-feature', true);
        } else if (checkCount === 2) {
          // Second emission should be true (after enabling)
          expect(enabled).toBe(true);
          done();
        }
      });
    });
    
    const req = httpMock.expectOne('assets/features/public/dev.graph.json');
    req.flush(testGraph);
  });
});