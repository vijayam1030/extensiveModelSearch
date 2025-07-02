import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { ModelCard } from '../models/model.interfaces';

@Component({
  selector: 'app-model-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule
  ],
  template: `
    <mat-card class="model-card" [ngClass]="getCardClass()">
      <mat-card-header>
        <mat-card-title class="model-title">
          <mat-icon [ngClass]="getIconClass()">{{ getStatusIcon() }}</mat-icon>
          {{ modelCard.name }}
        </mat-card-title>
        <mat-card-subtitle>
          <mat-chip [ngClass]="getChipClass()">{{ getStatusText() }}</mat-chip>
          <span class="word-count" *ngIf="modelCard.wordCount > 0">
            {{ modelCard.wordCount }} words
          </span>
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <mat-expansion-panel 
          [expanded]="modelCard.isExpanded" 
          (expandedChange)="toggleExpansion()"
          class="response-panel">
          <mat-expansion-panel-header>
            <mat-panel-title>
              Response Preview
            </mat-panel-title>
            <mat-panel-description>
              {{ getPreviewText() }}
            </mat-panel-description>
          </mat-expansion-panel-header>
          
          <div class="response-content">
            <pre>{{ modelCard.response }}</pre>
          </div>
          
          <mat-action-row *ngIf="modelCard.status === 'completed'">
            <button mat-button (click)="copyResponse()">
              <mat-icon>content_copy</mat-icon>
              Copy Response
            </button>
          </mat-action-row>
        </mat-expansion-panel>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .model-card {
      margin: 12px;
      transition: all 0.3s ease;
      border-left: 4px solid var(--status-color, #ccc);
    }

    .model-card.streaming {
      --status-color: #4caf50;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }

    .model-card.completed {
      --status-color: #2196f3;
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
    }

    .model-card.error {
      --status-color: #f44336;
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
    }

    .model-card.pending {
      --status-color: #ff9800;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .model-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .status-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .status-icon.streaming {
      color: #4caf50;
      animation: pulse 1.5s infinite;
    }

    .status-icon.completed {
      color: #2196f3;
    }

    .status-icon.error {
      color: #f44336;
    }

    .status-icon.pending {
      color: #ff9800;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .status-chip {
      font-size: 12px;
      height: 24px;
      margin-right: 8px;
    }

    .status-chip.streaming {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-chip.completed {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .status-chip.error {
      background-color: #ffebee;
      color: #c62828;
    }

    .status-chip.pending {
      background-color: #fff3e0;
      color: #ef6c00;
    }

    .word-count {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .response-panel {
      margin-top: 16px;
      box-shadow: none;
      border: 1px solid #e0e0e0;
    }

    .response-content {
      max-height: 400px;
      overflow-y: auto;
      background: #fafafa;
      padding: 16px;
      border-radius: 4px;
      margin: 8px 0;
    }

    .response-content pre {
      white-space: pre-wrap;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
      color: #333;
    }

    mat-card-subtitle {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }
  `]
})
export class ModelCardComponent {
  @Input() modelCard!: ModelCard;

  getCardClass(): string {
    return this.modelCard.status;
  }

  getIconClass(): string {
    return `status-icon ${this.modelCard.status}`;
  }

  getChipClass(): string {
    return `status-chip ${this.modelCard.status}`;
  }

  getStatusIcon(): string {
    switch (this.modelCard.status) {
      case 'streaming': return 'radio_button_checked';
      case 'completed': return 'check_circle';
      case 'error': return 'error';
      case 'pending': return 'schedule';
      default: return 'help';
    }
  }

  getStatusText(): string {
    switch (this.modelCard.status) {
      case 'streaming': return 'Streaming...';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      case 'pending': return 'Pending';
      case 'stopped': return 'Stopped';
      default: return 'Unknown';
    }
  }

  getPreviewText(): string {
    if (!this.modelCard.response) {
      return 'Waiting for response...';
    }
    const preview = this.modelCard.response.substring(0, 100);
    return preview + (this.modelCard.response.length > 100 ? '...' : '');
  }

  toggleExpansion(): void {
    this.modelCard.isExpanded = !this.modelCard.isExpanded;
  }

  copyResponse(): void {
    navigator.clipboard.writeText(this.modelCard.response).then(() => {
      // Could add a snackbar notification here
      console.log('Response copied to clipboard');
    });
  }
}