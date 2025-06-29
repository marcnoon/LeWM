import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { PinStateService } from './services/pin-state.service';
import { FeatureGraphService } from './services/feature-graph.service';

/**
 * Factory function to initialize feature flags before app startup
 */
export function initializeFeatures(featureGraphService: FeatureGraphService) {
  return () => featureGraphService.loadFeatures();
}

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    PinStateService,
    FeatureGraphService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeFeatures,
      deps: [FeatureGraphService],
      multi: true
    }
  ],
  bootstrap: []
})
export class AppModule { }
