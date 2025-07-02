import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';

import { WebSocketService } from './services/websocket.service';
import { ApiService } from './services/api.service';
import { ProcessingControlsComponent } from './components/processing-controls.component';
import { ModelCardComponent } from './components/model-card.component';
import { ModelInfo, ModelCard, ModelResponse, ProcessingStatus, ProcessingConfig, Summary } from './models/model.interfaces';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatCardModule,
    MatDividerModule,
    ProcessingControlsComponent,
    ModelCardComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'AI Model Comparison Tool';
  
  // State management
  availableModels: ModelInfo[] = [];
  modelCards: ModelCard[] = [];
  isProcessing = false;
  isConnected = false;
  currentProgress = 0;
  statusMessage = 'Ready to process questions';
  summary: Summary | null = null;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  private currentSessionId: string | null = null;
  
  constructor(
    private wsService: WebSocketService,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.initializeApp();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.wsService.disconnect();
  }
  
  private initializeApp(): void {
    try {
      // Load available models
      this.loadModels();
      
      // Connect to WebSocket
      this.connectWebSocket();
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showSnackBar('Failed to initialize application', 'error');
    }
  }
  
  private loadModels(): void {
    console.log('Loading models from:', this.apiService.getBaseUrl());
    
    this.apiService.getModels().subscribe({
      next: (response) => {
        console.log('Models response:', response);
        this.availableModels = response?.models || [];
        
        if (this.availableModels.length === 0) {
          console.warn('No models found in response');
          this.showSnackBar('No models available. Please ensure Ollama is running.', 'warning');
        } else {
          console.log(`Successfully loaded ${this.availableModels.length} models`);
          this.showSnackBar(`Loaded ${this.availableModels.length} models successfully`, 'success');
        }
      },
      error: (error) => {
        console.error('Failed to load models - Full error:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        this.showSnackBar(`Failed to load models: ${error.message}`, 'error');
      }
    });
  }
  
  private connectWebSocket(): void {
    const connectionSub = this.wsService.connect().subscribe({
      next: (connected) => {
        this.isConnected = connected;
        if (connected) {
          this.showSnackBar('Connected to server', 'success');
        }
      },
      error: (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
        this.showSnackBar('Connection failed', 'error');
      }
    });
    
    const messagesSub = this.wsService.getMessages().subscribe({
      next: (message) => this.handleWebSocketMessage(message),
      error: (error) => {
        console.error('WebSocket message error:', error);
        this.showSnackBar('Connection lost', 'error');
      }
    });
    
    const statusSub = this.wsService.getConnectionStatus().subscribe({
      next: (connected) => {
        this.isConnected = connected;
        if (!connected && this.isProcessing) {
          this.resetProcessingState();
        }
      }
    });
    
    this.subscriptions.push(connectionSub, messagesSub, statusSub);
  }
  
  private handleWebSocketMessage(message: ModelResponse | ProcessingStatus): void {
    if ('model' in message) {
      // Handle model response
      this.handleModelResponse(message as ModelResponse);
    } else {
      // Handle processing status
      this.handleProcessingStatus(message as ProcessingStatus);
    }
  }
  
  private handleModelResponse(response: ModelResponse): void {
    const existingCardIndex = this.modelCards.findIndex(card => card.name === response.model);
    
    if (existingCardIndex >= 0) {
      // Update existing card
      const card = this.modelCards[existingCardIndex];
      card.status = response.status;
      
      if (response.content) {
        card.response += response.content;
        card.wordCount = this.countWords(card.response);
      }
      
      if (response.full_response) {
        card.response = response.full_response;
        card.wordCount = this.countWords(card.response);
      }
      
      if (response.error) {
        card.response = `Error: ${response.error}`;
        card.status = 'error';
      }
    } else {
      // Create new card
      const newCard: ModelCard = {
        name: response.model,
        status: response.status,
        response: response.content || response.full_response || '',
        wordCount: 0,
        isExpanded: false
      };
      
      if (response.error) {
        newCard.response = `Error: ${response.error}`;
        newCard.status = 'error';
      }
      
      newCard.wordCount = this.countWords(newCard.response);
      this.modelCards.push(newCard);
    }
  }
  
  private handleProcessingStatus(status: ProcessingStatus): void {
    this.statusMessage = status.message;
    
    switch (status.status) {
      case 'starting':
        this.isProcessing = true;
        this.currentProgress = 10;
        break;
        
      case 'batch_update':
        this.currentProgress = Math.min(this.currentProgress + 20, 90);
        break;
        
      case 'all_completed':
        this.isProcessing = false;
        this.currentProgress = 100;
        this.generateSummary();
        setTimeout(() => {
          this.currentProgress = 0;
          this.statusMessage = 'Ready to process questions';
        }, 2000);
        break;
        
      case 'error':
        this.isProcessing = false;
        this.currentProgress = 0;
        this.showSnackBar('Processing failed: ' + status.message, 'error');
        break;
    }
  }
  
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
  
  private async generateSummary(): Promise<void> {
    try {
      const completedModels = this.modelCards.filter(card => card.status === 'completed');
      
      if (completedModels.length === 0) {
        return;
      }
      
      // Find the best model (longest response or first completed)
      const bestModel = completedModels.reduce((best, current) => 
        current.wordCount > best.wordCount ? current : best
      );
      
      const responses: Record<string, string> = {};
      completedModels.forEach(card => {
        responses[card.name] = card.response;
      });
      
      const summaryRequest = {
        model: bestModel.name,
        prompt: `Please analyze and summarize the following AI model responses. Provide insights about which response is most comprehensive, accurate, and helpful.`,
        responses
      };
      
      const summaryResponse = await this.apiService.generateMetaSummary(summaryRequest).toPromise();
      
      this.summary = {
        bestModel: bestModel.name,
        totalModels: this.availableModels.length,
        completedModels: completedModels.length,
        analysis: summaryResponse?.content || 'Summary generation failed',
        recommendations: this.generateRecommendations(completedModels)
      };
      
    } catch (error) {
      console.error('Failed to generate summary:', error);
      this.showSnackBar('Failed to generate summary', 'error');
    }
  }
  
  private generateRecommendations(completedModels: ModelCard[]): string[] {
    const recommendations: string[] = [];
    
    if (completedModels.length > 0) {
      const avgWordCount = completedModels.reduce((sum, card) => sum + card.wordCount, 0) / completedModels.length;
      const mostVerbose = completedModels.reduce((best, current) => 
        current.wordCount > best.wordCount ? current : best
      );
      
      recommendations.push(`${mostVerbose.name} provided the most detailed response (${mostVerbose.wordCount} words)`);
      recommendations.push(`Average response length: ${Math.round(avgWordCount)} words`);
      
      if (completedModels.length < this.availableModels.length) {
        const failedCount = this.availableModels.length - completedModels.length;
        recommendations.push(`${failedCount} model(s) failed to complete - consider checking system resources`);
      }
    }
    
    return recommendations;
  }
  
  onQuestionSubmit(event: { question: string; config: ProcessingConfig }): void {
    if (!this.isConnected) {
      this.showSnackBar('Not connected to server', 'error');
      return;
    }
    
    // Reset state
    this.modelCards = [];
    this.summary = null;
    this.currentSessionId = this.wsService.generateSessionId();
    
    // Create model cards for all available models
    this.modelCards = this.availableModels.map(model => ({
      name: model.name,
      status: 'pending' as const,
      response: '',
      wordCount: 0,
      isExpanded: false
    }));
    
    // Send question
    try {
      this.wsService.sendQuestion({
        question: event.question,
        mode: event.config.mode,
        responseLength: event.config.responseLength,
        customLength: event.config.customLength,
        sessionId: this.currentSessionId
      });
      
      this.isProcessing = true;
      this.statusMessage = 'Starting processing...';
      this.currentProgress = 5;
      
    } catch (error) {
      console.error('Failed to send question:', error);
      this.showSnackBar('Failed to send question', 'error');
      this.resetProcessingState();
    }
  }
  
  onStopProcessing(): void {
    this.wsService.stopProcessing();
    this.resetProcessingState();
    this.showSnackBar('Processing stopped', 'info');
  }
  
  async onRefreshModels(): Promise<void> {
    try {
      await this.apiService.refreshModels().toPromise();
      await this.loadModels();
      this.showSnackBar('Models refreshed successfully', 'success');
    } catch (error) {
      console.error('Failed to refresh models:', error);
      this.showSnackBar('Failed to refresh models', 'error');
    }
  }
  
  private resetProcessingState(): void {
    this.isProcessing = false;
    this.currentProgress = 0;
    this.statusMessage = 'Ready to process questions';
    
    // Update any pending cards to stopped
    this.modelCards.forEach(card => {
      if (card.status === 'pending' || card.status === 'streaming') {
        card.status = 'stopped';
      }
    });
  }
  
  private showSnackBar(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    const config = {
      duration: 4000,
      panelClass: [`snackbar-${type}`]
    };
    
    this.snackBar.open(message, 'Close', config);
  }
  
  getCompletedCount(): number {
    return this.modelCards.filter(card => card.status === 'completed').length;
  }
  
  getErrorCount(): number {
    return this.modelCards.filter(card => card.status === 'error').length;
  }
  
  trackByModelName(index: number, card: ModelCard): string {
    return card.name;
  }
  
  openGitHub(): void {
    window.open('https://github.com/your-username/askq-models', '_blank');
  }
  
  copySummary(): void {
    if (this.summary) {
      const summaryText = `
AI Model Comparison Summary
Generated by: ${this.summary.bestModel}
Completed: ${this.summary.completedModels}/${this.summary.totalModels} models

Analysis:
${this.summary.analysis}

Recommendations:
${this.summary.recommendations.map(rec => `• ${rec}`).join('\n')}
      `.trim();
      
      navigator.clipboard.writeText(summaryText).then(() => {
        this.showSnackBar('Summary copied to clipboard', 'success');
      });
    }
  }
  
  downloadSummary(): void {
    if (this.summary) {
      const summaryText = `
AI Model Comparison Report
Generated: ${new Date().toLocaleString()}
Generated by: ${this.summary.bestModel}
Completed: ${this.summary.completedModels}/${this.summary.totalModels} models

Analysis:
${this.summary.analysis}

Recommendations:
${this.summary.recommendations.map(rec => `• ${rec}`).join('\n')}

Individual Model Responses:
${this.modelCards.filter(card => card.status === 'completed').map(card => `
${card.name} (${card.wordCount} words):
${card.response}
`).join('\n---\n')}
      `.trim();
      
      const blob = new Blob([summaryText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-model-comparison-${Date.now()}.txt`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      this.showSnackBar('Report downloaded', 'success');
    }
  }
}