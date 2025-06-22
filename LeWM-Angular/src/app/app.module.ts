import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app.component';
import { GraphEditorComponent } from './components/graph-editor/graph-editor.component';
import { PinNameDialogComponent } from './components/pin-name-dialog/pin-name-dialog.component';
import { BulkPinDialogComponent } from './components/bulk-pin-dialog/bulk-pin-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    GraphEditorComponent,
    PinNameDialogComponent,
    BulkPinDialogComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
