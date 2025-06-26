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
});