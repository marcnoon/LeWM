import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureFlagToggleComponent } from './feature-flag-toggle.component';
import { FeatureGraphService } from '../../services/feature-graph.service';
import { of } from 'rxjs';

describe('FeatureFlagToggleComponent', () => {
  let component: FeatureFlagToggleComponent;
  let fixture: ComponentFixture<FeatureFlagToggleComponent>;
  let mockFeatureGraphService: jasmine.SpyObj<FeatureGraphService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('FeatureGraphService', ['toggleFeature', 'isFeatureEnabled'], {
      featureGraphObservable: of({
        features: [
          { id: 'test-feature', name: 'test-feature', enabled: true }
        ]
      })
    });

    await TestBed.configureTestingModule({
      imports: [FeatureFlagToggleComponent],
      providers: [
        { provide: FeatureGraphService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureFlagToggleComponent);
    component = fixture.componentInstance;
    mockFeatureGraphService = TestBed.inject(FeatureGraphService) as jasmine.SpyObj<FeatureGraphService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call toggleFeature when toggle is clicked', () => {
    component.toggleFeature('test-feature');
    expect(mockFeatureGraphService.toggleFeature).toHaveBeenCalledWith('test-feature');
  });

  it('should format feature display name correctly', () => {
    const feature = { id: 'graph.node', name: 'graph.node', enabled: true };
    const displayName = component.getFeatureDisplayName(feature);
    expect(displayName).toBe('Graph Node');
  });
});