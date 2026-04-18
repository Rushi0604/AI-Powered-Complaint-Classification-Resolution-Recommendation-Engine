export type Priority = 'High' | 'Medium' | 'Low';

export interface AnalysisResult {
  complaint: string;
  category: string;
  priority: Priority;
  status: 'Valid' | 'Suspicious';
  reason: string[];
  actions: string[];
}
