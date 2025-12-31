'use client'

import { useState } from 'react'
import { AuditInput } from '@/components/audit-input'
import { ProcessingState } from '@/components/processing-state'
import { ReportGenerator } from '@/components/report-generator'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AuditStatus, AuditResult, ProcessingLog } from '@/types'
import { useLanguage } from '@/lib/language-context'

export default function Home() {
  const { t } = useLanguage()
  const [status, setStatus] = useState<AuditStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<ProcessingLog[]>([])
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [auditType, setAuditType] = useState<'url' | 'code'>('url')
  const [auditSource, setAuditSource] = useState<string>('')

  const addLog = (message: string, logStatus: ProcessingLog['status'] = 'info') => {
    setLogs(prev => [...prev, {
      timestamp: Date.now(),
      message,
      status: logStatus
    }])
  }

  const simulateProcessing = async (type: 'url' | 'code') => {
    setProgress(0)
    setLogs([])

    const steps = type === 'url' 
      ? [
          { delay: 500, progress: 15, message: 'Connecting to website...', status: 'info' as const },
          { delay: 800, progress: 30, message: 'Fetching page content...', status: 'info' as const },
          { delay: 1000, progress: 45, message: 'Analyzing HTML structure...', status: 'info' as const },
          { delay: 1200, progress: 60, message: 'Checking for broken tags...', status: 'success' as const },
          { delay: 1000, progress: 75, message: 'Scanning for input vulnerabilities...', status: 'info' as const },
          { delay: 1200, progress: 90, message: 'Evaluating performance metrics...', status: 'info' as const },
          { delay: 800, progress: 95, message: 'Generating test scripts...', status: 'info' as const },
          { delay: 500, progress: 100, message: 'Audit complete!', status: 'success' as const },
        ]
      : [
          { delay: 500, progress: 20, message: 'Parsing code structure...', status: 'info' as const },
          { delay: 800, progress: 40, message: 'Analyzing HTML elements...', status: 'info' as const },
          { delay: 1000, progress: 55, message: 'Checking for broken tags...', status: 'success' as const },
          { delay: 1200, progress: 70, message: 'Scanning for input vulnerabilities...', status: 'info' as const },
          { delay: 1000, progress: 85, message: 'Evaluating code quality...', status: 'info' as const },
          { delay: 1200, progress: 95, message: 'Generating test scripts...', status: 'info' as const },
          { delay: 500, progress: 100, message: 'Audit complete!', status: 'success' as const },
        ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay))
      setProgress(step.progress)
      addLog(step.message, step.status)
    }
  }

  const performAudit = async (type: 'url' | 'code', content: string) => {
    setAuditType(type)
    setAuditSource(content)
    setStatus('processing')
    
    // Start processing simulation
    simulateProcessing(type)

    try {
      // Call the real API
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to perform audit')
      }

      const auditResult: AuditResult = await response.json()
      
      // Wait for processing simulation to complete if it hasn't
      // (in case API responds faster than simulation)
      if (progress < 100) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setProgress(100)
        addLog('Audit complete!', 'success')
      }

      setAuditResult(auditResult)
      setStatus('completed')
    } catch (error) {
      console.error('Audit failed:', error)
      addLog(`Audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
      setStatus('error')
    }
  }

  const handleUrlSubmit = async (url: string) => {
    addLog(`Analyzing live site: ${url}`, 'info')
    await performAudit('url', url)
  }

  const handleCodeSubmit = async (code: string) => {
    addLog(`Analyzing code snippet (${code.length} characters)`, 'info')
    await performAudit('code', code)
  }

  const handleReset = () => {
    setStatus('idle')
    setProgress(0)
    setLogs([])
    setAuditResult(null)
  }

  return (
    <main className="min-h-screen relative z-10 p-6 bg-transparent">
      <div className="container mx-auto py-6">
        {status === 'idle' && (
          <AuditInput
            onUrlSubmit={handleUrlSubmit}
            onCodeSubmit={handleCodeSubmit}
          />
        )}

        {status === 'processing' && (
          <ProcessingState progress={progress} logs={logs} />
        )}

        {status === 'completed' && auditResult && (
          <ReportGenerator result={auditResult} onReset={handleReset} />
        )}

        {status === 'error' && (
          <div className="w-full max-w-4xl mx-auto px-6">
            <div className="glass-card rounded-lg p-6 text-center space-y-3 animate-slide-up-spring">
              <h2 className="text-base font-semibold text-[#ef4444]">{t.error.auditError}</h2>
              <p className="text-sm text-[#94a3b8] dark:text-[#94a3b8] text-[#475569]">{t.error.auditFailed}</p>
              <Button
                onClick={handleReset}
                className="h-10 px-6 text-sm font-medium bg-[#38bdf8] text-[#020617] hover:bg-[#38bdf8]/90 hover:glow-cyan transition-all duration-300"
              >
                {t.common.tryAgain}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

