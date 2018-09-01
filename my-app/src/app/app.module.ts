import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatInputModule, MatToolbarModule, MatGridListModule, MatExpansionModule, MatButtonModule, MatCheckboxModule, MatTreeModule, MatIconModule, MatFormFieldModule} from '@angular/material';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { forOwn } from 'lodash';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MatButtonModule,
    MatToolbarModule,
    MatTreeModule,
    MatExpansionModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    BrowserAnimationsModule,
    MatGridListModule,
    MatInputModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  exports: [
    MatButtonModule,
    MatToolbarModule,
    MatTreeModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatExpansionModule,
    BrowserAnimationsModule,
    MatInputModule
  ]
})
export class AppModule { }
