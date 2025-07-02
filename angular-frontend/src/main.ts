import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserAnimationsModule,
      ReactiveFormsModule,
      HttpClientModule,
      MatToolbarModule,
      MatCardModule,
      MatButtonModule,
      MatFormFieldModule,
      MatInputModule,
      MatSelectModule,
      MatProgressSpinnerModule,
      MatChipsModule,
      MatIconModule,
      MatExpansionModule,
      MatProgressBarModule,
      MatSnackBarModule,
      MatDividerModule
    )
  ]
}).catch(err => console.error(err));