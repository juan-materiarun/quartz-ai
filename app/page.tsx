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
  const [errorMessage, setErrorMessage] = useState<string>('')

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

      const auditResult: AuditResult = await response.json()
      
      // Verificar si la respuesta contiene un error (incluso con status 200)
      if (auditResult.error) {
        setErrorMessage(auditResult.error)
        addLog(`Error: ${auditResult.error}`, 'error')
        setStatus('error')
        return
      }
      
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
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setErrorMessage(errorMsg)
      addLog(`Audit failed: ${errorMsg}`, 'error')
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
    setErrorMessage('')
  }

  return (
    <main className="min-h-screen relative z-10 pt-4 sm:pt-6 bg-transparent">
      <div className="container mx-auto w-full">
        {status === 'idle' && (
          <AuditInput
            onUrlSubmit={handleUrlSubmit}
            onCodeSubmit={handleCodeSubmit}
          />
        )}

        {status === 'processing' && (
          <div className="pt-8">
            <ProcessingState progress={progress} logs={logs} />
          </div>
        )}

        {status === 'completed' && auditResult && (
          <ReportGenerator result={auditResult} onReset={handleReset} />
        )}

        {status === 'error' && (
          <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
            <div className="glass-card rounded-lg p-6 sm:p-8 animate-slide-up-spring">
              {/* Ícono de error */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ef4444]/10 flex items-center justify-center">
                  <svg 
                    className="w-8 h-8 sm:w-10 sm:h-10 text-[#ef4444]" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                  </svg>
                </div>
              </div>

              {/* Título */}
              <h2 className="text-xl sm:text-2xl font-semibold text-[#0f172a] dark:text-white text-center mb-3">
                {t.error.auditError}
              </h2>
              
              {/* Mensaje específico del error */}
              <p className="text-sm sm:text-base text-[#ef4444] text-center mb-4">
                {errorMessage || t.error.websiteNotAccessible}
              </p>

              {/* Descripción */}
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] text-center mb-6">
                {t.error.websiteNotFound}
              </p>

              {/* Posibles razones */}
              <div className="bg-[#f8fafc] dark:bg-[#0f172a] rounded-lg p-4 mb-6 text-left">
                <p className="text-xs sm:text-sm font-semibold text-[#0f172a] dark:text-white mb-3">
                  {t.error.possibleReasons}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8]">
                    <span className="text-[#ef4444] mt-0.5">•</span>
                    <span>{t.error.reasons.blocked}</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8]">
                    <span className="text-[#ef4444] mt-0.5">•</span>
                    <span>{t.error.reasons.invalidUrl}</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8]">
                    <span className="text-[#ef4444] mt-0.5">•</span>
                    <span>{t.error.reasons.noInternet}</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8]">
                    <span className="text-[#ef4444] mt-0.5">•</span>
                    <span>{t.error.reasons.siteDown}</span>
                  </li>
                </ul>
              </div>

              {/* Sugerencia */}
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94a3b8] text-center mb-6">
                💡 {t.error.tryDifferentSite}
              </p>

              {/* Botón */}
              <div className="flex justify-center">
                <Button
                  onClick={handleReset}
                  className="h-11 px-8 text-sm font-medium bg-[#38bdf8] text-white dark:text-[#020617] hover:bg-[#38bdf8]/90 hover:glow-cyan transition-all duration-300"
                >
                  {t.common.tryAgain}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

