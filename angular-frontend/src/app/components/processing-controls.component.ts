import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ProcessingConfig } from '../models/model.interfaces';

@Component({
  selector: 'app-processing-controls',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="controls-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>settings</mat-icon>
          Processing Configuration
        </mat-card-title>
        <mat-card-subtitle>
          <mat-chip-set>
            <mat-chip>{{ availableModels }} models available</mat-chip>
            <mat-chip *ngIf="isConnected" class="connected-chip">
              <mat-icon>wifi</mat-icon>
              Connected
            </mat-chip>
            <mat-chip *ngIf="!isConnected" class="disconnected-chip">
              <mat-icon>wifi_off</mat-icon>
              Disconnected
            </mat-chip>
          </mat-chip-set>
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <form [formGroup]="configForm" class="config-form">
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Processing Mode</mat-label>
              <mat-select formControlName="mode">
                <mat-option value="batch">
                  <mat-icon>layers</mat-icon>
                  Batch (3 at a time) - Recommended
                </mat-option>
                <mat-option value="parallel">
                  <mat-icon>flash_on</mat-icon>
                  All Parallel - Fastest
                </mat-option>
                <mat-option value="sequential">
                  <mat-icon>list</mat-icon>
                  Sequential - Most Stable
                </mat-option>
              </mat-select>
              <mat-hint>Choose how models are processed</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Response Length</mat-label>
              <mat-select formControlName="responseLength">
                <mat-option value="brief">Brief (1-2 sentences)</mat-option>
                <mat-option value="short">Short (3-5 sentences)</mat-option>
                <mat-option value="medium">Medium (1-2 paragraphs)</mat-option>
                <mat-option value="long">Long (3-4 paragraphs)</mat-option>
                <mat-option value="detailed">Detailed (5+ paragraphs)</mat-option>
                <mat-option value="custom">Custom Length</mat-option>
              </mat-select>
              <mat-hint>Expected response length</mat-hint>
            </mat-form-field>

            <mat-form-field 
              appearance="outline" 
              class="form-field custom-length"
              *ngIf="configForm.get('responseLength')?.value === 'custom'">
              <mat-label>Custom Length (lines)</mat-label>
              <input matInput type="number" formControlName="customLength" min="1" max="50">
              <mat-hint>Number of lines (1-50)</mat-hint>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="question-field">
              <mat-label>Enter your question</mat-label>
              <textarea 
                matInput 
                formControlName="question"
                rows="4"
                placeholder="What would you like to ask all the AI models?">
              </textarea>
              <mat-hint>Press Ctrl+Enter to submit quickly</mat-hint>
            </mat-form-field>
          </div>

          <div class="action-buttons">
            <button 
              mat-raised-button 
              color="primary" 
              type="button"
              [disabled]="!configForm.valid || isProcessing"
              (click)="onSubmit()"
              class="submit-button">
              <mat-icon>rocket_launch</mat-icon>
              Ask All Models
            </button>

            <button 
              mat-raised-button 
              color="warn" 
              type="button"
              *ngIf="isProcessing"
              (click)="onStop()"
              class="stop-button">
              <mat-icon>stop</mat-icon>
              Stop Processing
            </button>

            <button 
              mat-button 
              color="accent" 
              type="button"
              (click)="onRefreshModels()"
              [disabled]="isProcessing"
              class="refresh-button">
              <mat-icon>refresh</mat-icon>
              Refresh Models
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .controls-card {
      margin: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .controls-card ::ng-deep .mat-card-header-text {
      margin: 0;
    }

    .controls-card ::ng-deep .mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: white;
    }

    .controls-card ::ng-deep .mat-card-subtitle {
      color: rgba(255, 255, 255, 0.8);
      margin-top: 8px;
    }

    .config-form {
      margin-top: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .form-field {
      flex: 1;
      min-width: 200px;
    }

    .custom-length {
      max-width: 150px;
    }

    .question-field {
      width: 100%;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 24px;
    }

    .submit-button {
      background: linear-gradient(45deg, #4caf50, #45a049);
      color: white;
      font-weight: 600;
      padding: 0 24px;
      height: 48px;
    }

    .stop-button {
      background: linear-gradient(45deg, #f44336, #d32f2f);
      color: white;
      font-weight: 600;
      padding: 0 24px;
      height: 48px;
    }

    .refresh-button {
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .connected-chip {
      background-color: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }

    .disconnected-chip {
      background-color: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }

    mat-chip-set {
      margin: 0;
    }

    mat-chip {
      font-size: 12px;
    }

    ::ng-deep .mat-mdc-form-field {
      --mdc-filled-text-field-label-text-color: rgba(255, 255, 255, 0.8);
      --mdc-filled-text-field-input-text-color: white;
      --mdc-outlined-text-field-label-text-color: rgba(255, 255, 255, 0.8);
      --mdc-outlined-text-field-input-text-color: white;
      --mdc-outlined-text-field-outline-color: rgba(255, 255, 255, 0.3);
      --mdc-outlined-text-field-hover-outline-color: rgba(255, 255, 255, 0.6);
      --mdc-outlined-text-field-focus-outline-color: white;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-hint {
      color: rgba(255, 255, 255, 0.6);
    }

    ::ng-deep .mat-mdc-select-value-text {
      color: white;
    }

    ::ng-deep .mat-mdc-select-arrow {
      color: rgba(255, 255, 255, 0.8);
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }
      
      .form-field {
        min-width: unset;
      }
      
      .action-buttons {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class ProcessingControlsComponent {
  @Input() isProcessing = false;
  @Input() isConnected = false;
  @Input() availableModels = 0;
  
  @Output() questionSubmit = new EventEmitter<{
    question: string;
    config: ProcessingConfig;
  }>();
  @Output() stopProcessing = new EventEmitter<void>();
  @Output() refreshModels = new EventEmitter<void>();

  configForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.configForm = this.fb.group({
      question: ['', [Validators.required, Validators.minLength(3)]],
      mode: ['batch', Validators.required],
      responseLength: ['medium', Validators.required],
      customLength: [10, [Validators.min(1), Validators.max(50)]]
    });
  }

  onSubmit(): void {
    if (this.configForm.valid) {
      const formValue = this.configForm.value;
      
      this.questionSubmit.emit({
        question: formValue.question,
        config: {
          mode: formValue.mode,
          responseLength: formValue.responseLength,
          customLength: formValue.customLength || 10
        }
      });
    }
  }

  onStop(): void {
    this.stopProcessing.emit();
  }

  onRefreshModels(): void {
    this.refreshModels.emit();
  }
}