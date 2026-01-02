export type AuditStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

export interface AuditResult {
  business_impact?: string
  severity_score?: number
  passedTests: TestResult[]
  defects: Defect[]
  testScript: string
  error?: string
}

export interface TestResult {
  category: string
  test: string
  status: 'passed'
}

export interface Defect {
  id: string
  category: 'Seguridad y Confianza' | 'Rendimiento y Conversión' | 'Arquitectura Técnica' | string
  title: string
  description: string
  priority: 'Critical' | 'Medium' | 'Low'
  location?: string
  impact_translation?: string
}

export interface ProcessingLog {
  timestamp: number
  message: string
  status: 'info' | 'success' | 'warning' | 'error'
}






