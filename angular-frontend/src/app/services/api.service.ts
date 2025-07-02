import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelInfo } from '../models/model.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getModels(): Observable<{ models: ModelInfo[] }> {
    return this.http.get<{ models: ModelInfo[] }>(`${this.baseUrl}/models`);
  }

  refreshModels(): Observable<{ message: string; models: string[] }> {
    return this.http.post<{ message: string; models: string[] }>(`${this.baseUrl}/refresh-models`, {});
  }

  generateMetaSummary(request: {
    model: string;
    prompt: string;
    responses: Record<string, string>;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/meta-summary`, request);
  }
}