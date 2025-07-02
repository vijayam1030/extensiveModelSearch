export interface ModelInfo {
  name: string;
  full_name: string;
  provider: string;
}

export interface ModelResponse {
  model: string;
  status: 'streaming' | 'completed' | 'error' | 'pending';
  content?: string;
  full_response?: string;
  error?: string;
  sessionId?: string;
}

export interface ProcessingStatus {
  status: 'starting' | 'batch_update' | 'all_completed' | 'error';
  message: string;
  sessionId?: string;
}

export interface QuestionRequest {
  question: string;
  mode: 'batch' | 'parallel' | 'sequential';
  responseLength: 'brief' | 'short' | 'medium' | 'long' | 'detailed' | 'custom';
  customLength?: number;
  sessionId: string;
}

export interface ModelCard {
  name: string;
  status: 'pending' | 'streaming' | 'completed' | 'error' | 'stopped';
  response: string;
  wordCount: number;
  isExpanded: boolean;
}

export interface ProcessingConfig {
  mode: 'batch' | 'parallel' | 'sequential';
  responseLength: 'brief' | 'short' | 'medium' | 'long' | 'detailed' | 'custom';
  customLength: number;
}

export interface Summary {
  bestModel: string;
  totalModels: number;
  completedModels: number;
  analysis: string;
  recommendations: string[];
}