import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app.component';
import { GraphEditorComponent } from './components/graph-editor/graph-editor.component';
import { PinNameDialogComponent } from './components/pin-name-dialog/pin-name-dialog.component';
import { NodeNameDialogComponent } from './components/node-name-dialog/node-name-dialog.component';
import { ConnectionPropertiesDialogComponent } from './components/connection-properties-dialog/connection-properties-dialog.component';
import { ConnectionBulkEditDialogComponent } from './components/connection-bulk-edit-dialog/connection-bulk-edit-dialog.component';
import { NodeBatchEditDialogComponent } from './components/node-batch-edit-dialog/node-batch-edit-dialog.component';
import { PinModeToolbarComponent } from './components/pin-mode-toolbar/pin-mode-toolbar.component';
import { PinLayoutEditorComponent } from './components/pin-layout-editor/pin-layout-editor.component';
import { PinStateService } from './services/pin-state.service';
import { HandleComponent } from './components/handle/handle';

@NgModule({
  declarations: [
    AppComponent,
    GraphEditorComponent,
    PinNameDialogComponent,
    NodeNameDialogComponent,
    ConnectionPropertiesDialogComponent,
    ConnectionBulkEditDialogComponent,
    NodeBatchEditDialogComponent,
    PinModeToolbarComponent,
    PinLayoutEditorComponent,
    HandleComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule
  ],
  providers: [
    PinStateService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
