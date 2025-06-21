import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app.component';
import { GraphEditorComponent } from './components/graph-editor/graph-editor.component';

@NgModule({
  declarations: [
    AppComponent,
    GraphEditorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
