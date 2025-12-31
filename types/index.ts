export type AuditStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

export interface AuditResult {
  passedTests: TestResult[]
  defects: Defect[]
  testScript: string
}

export interface TestResult {
  category: string
  test: string
  status: 'passed'
}

export interface Defect {
  id: string
  category: string
  title: string
  description: string
  priority: 'Critical' | 'Medium' | 'Low'
  location?: string
}

export interface ProcessingLog {
  timestamp: number
  message: string
  status: 'info' | 'success' | 'warning' | 'error'
}





