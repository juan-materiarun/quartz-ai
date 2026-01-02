'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertTriangle, Download, Copy, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import type { AuditResult } from '@/types'
import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useLanguage } from '@/lib/language-context'
import { LanguageSelector } from '@/components/language-selector'
import { ThemeSelector } from '@/components/theme-selector'
import { exportToPDF } from '@/lib/pdf-export'

interface ReportGeneratorProps {
  result: AuditResult
  onReset: () => void
}

// Premium colors with glow
const COLORS = {
  critical: '#e11d48', // Rose-600
  medium: '#f59e0b', // Amber-500
  low: '#94a3b8', // Slate-400
}

export function ReportGenerator({ result, onReset }: ReportGeneratorProps) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [scriptExpanded, setScriptExpanded] = useState(false)

  // Calculate statistics
  const stats = useMemo(() => {
    const criticalCount = result.defects.filter(d => d.priority === 'Critical').length
    const mediumCount = result.defects.filter(d => d.priority === 'Medium').length
    const lowCount = result.defects.filter(d => d.priority === 'Low').length
    
    const categoryBreakdown = result.defects.reduce((acc, defect) => {
      acc[defect.category] = (acc[defect.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalPassed: result.passedTests.length,
      totalDefects: result.defects.length,
      criticalCount,
      mediumCount,
      lowCount,
      categoryBreakdown,
    }
  }, [result])

  // Prepare chart data
  const priorityData = [
    { name: 'Critical', value: stats.criticalCount, color: COLORS.critical },
    { name: 'Medium', value: stats.mediumCount, color: COLORS.medium },
    { name: 'Low', value: stats.lowCount, color: COLORS.low },
  ].filter(item => item.value > 0)

  const categoryData = Object.entries(stats.categoryBreakdown).map(([name, value]) => ({
    name,
    value,
  }))

  const overallScore = useMemo(() => {
    const totalTests = stats.totalPassed + stats.totalDefects
    if (totalTests === 0) return 100
    return Math.round((stats.totalPassed / totalTests) * 100)
  }, [stats])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.testScript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadScript = () => {
    const blob = new Blob([result.testScript], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'quartz-audit-test.spec.js'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-[#e11d48] border-[#e11d48]/40 bg-[#e11d48]/10 glow-critical'
      case 'Medium':
        return 'text-[#f59e0b] border-[#f59e0b]/40 bg-[#f59e0b]/10 glow-warning'
      case 'Low':
        return 'text-[#94a3b8] border-[#94a3b8]/40 bg-[#94a3b8]/10'
      default:
        return 'text-[#94a3b8] border-[#334155] bg-[#1e293b]'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <XCircle className="h-4 w-4 text-[#e11d48]" />
      case 'Medium':
        return <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
      default:
        return <AlertTriangle className="h-4 w-4 text-[#94a3b8]" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#10b981]'
    if (score >= 60) return 'text-[#f59e0b]'
    return 'text-[#ef4444]'
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-8 px-4 sm:px-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 py-4 border-b border-[#334155] dark:border-[#334155] border-[#cbd5e1] animate-slide-up-spring">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Logo */}
            <Image 
              src="/logo.png" 
              alt="QUARTZ AI" 
              width={120}
              height={48}
              className="h-10 sm:h-12 w-auto object-contain hidden sm:block"
            />
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-semibold text-white dark:text-white text-[#0f172a]">{t.report.title}</h1>
              <p className="text-sm sm:text-base text-[#94a3b8] dark:text-[#94a3b8] text-[#475569]">{t.report.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <LanguageSelector />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button 
            onClick={() => exportToPDF(result)}
            className="h-10 px-4 text-sm font-medium bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-white border-shimmer hover:from-[#38bdf8]/90 hover:to-[#0ea5e9]/90 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
          >
            <FileText className="h-4 w-4" />
            <span>Export PDF</span>
          </Button>
          <Button 
            onClick={onReset} 
            className="h-10 px-6 text-sm font-medium bg-[#38bdf8] text-[#020617] dark:text-[#020617] text-white hover:bg-[#38bdf8]/90 hover:glow-cyan transition-all duration-300"
          >
            {t.common.newAudit}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-slide-up-spring">
        <div className="glass-card p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm font-medium text-[#334155] dark:text-[#94a3b8] mb-1">{t.report.stats.passed}</p>
          <p className="text-xl sm:text-2xl font-semibold text-[#10b981]">{stats.totalPassed}</p>
        </div>
        <div className="glass-card p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-[#94a3b8] mb-1">{t.report.stats.defects}</p>
          <p className="text-xl sm:text-2xl font-semibold text-[#ef4444]">{stats.totalDefects}</p>
        </div>
        <div className="glass-card p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-[#94a3b8] mb-1">{t.report.stats.critical}</p>
          <p className="text-xl sm:text-2xl font-semibold text-[#f59e0b]">{stats.criticalCount}</p>
        </div>
        <div className="glass-card p-3 sm:p-4 rounded-lg">
          <p className="text-xs sm:text-sm text-[#94a3b8] mb-1">{t.report.stats.score}</p>
          <p className={`text-xl sm:text-2xl font-semibold ${getScoreColor(overallScore)}`}>{overallScore}%</p>
        </div>
      </div>

      {/* Integrated Grid: Charts + Score + Passed Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 border-b border-[#334155] pb-6 animate-slide-up-spring">
        {/* Pie Chart */}
        {priorityData.length > 0 && (
          <div className="glass-card p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-white dark:text-white text-[#0f172a] mb-3">{t.report.charts.byPriority}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Health Score */}
        <div className="glass-card p-4 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-sm font-semibold text-white dark:text-white text-[#0f172a] mb-2">{t.report.charts.generalHealth}</h3>
            <div className={`text-4xl sm:text-5xl font-semibold ${getScoreColor(overallScore)} mb-1`}>
              {overallScore}
            </div>
            <div className="text-sm text-[#94a3b8] dark:text-[#94a3b8] text-[#475569]">{t.report.stats.of100}</div>
          </div>
        </div>

        {/* Passed Tests - Compact List */}
        <div className="glass-card p-4 rounded-lg md:col-span-2 lg:col-span-1">
          <h3 className="text-sm font-semibold text-white dark:text-white text-[#0f172a] mb-3 flex items-center gap-2">
            {t.report.charts.passedTests}
            <span className="ml-auto text-xs font-normal text-[#94a3b8] dark:text-[#94a3b8] text-[#475569]">
              {stats.totalPassed}
            </span>
          </h3>
          <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin">
            {result.passedTests.length > 0 ? (
              result.passedTests.map((test, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 py-1.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#10b981] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white dark:text-white text-[#0f172a]">{test.category}</p>
                    <p className="text-xs text-[#94a3b8] dark:text-[#94a3b8] text-[#475569] mt-0.5">{test.test}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#94a3b8] dark:text-[#94a3b8] text-[#475569] text-center py-4">{t.report.defects.noPassedTests}</p>
            )}
          </div>
        </div>
      </div>

      {/* Bar Chart Section */}
      {categoryData.length > 0 && (
        <div className="border-b border-[#334155] pb-6 animate-slide-up-spring">
          <h3 className="text-sm font-semibold text-white dark:text-white text-[#0f172a] mb-3">{t.report.charts.defectsByCategory}</h3>
          <div className="glass-card p-3 sm:p-4 rounded-lg overflow-x-auto">
            <ResponsiveContainer width="100%" height={200} minWidth={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10}
                  tick={{ fill: '#94a3b8' }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                  }}
                />
                <Bar dataKey="value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Defects Section */}
      <div className="space-y-3 sm:space-y-4 animate-slide-up-spring">
        <div className="flex items-center justify-between border-b border-[#334155] dark:border-[#334155] border-[#cbd5e1] pb-2">
          <h2 className="text-base sm:text-lg font-semibold text-white dark:text-white text-[#0f172a] flex items-center gap-2">
            {t.report.defects.title}
          </h2>
          <span className="text-xs sm:text-sm text-[#94a3b8] dark:text-[#94a3b8] text-[#475569]">
            {stats.totalDefects} {stats.totalDefects === 1 ? t.report.defects.defect : t.report.defects.defects}
          </span>
        </div>
        <div className="space-y-3">
          {result.defects.length > 0 ? (
            result.defects.map((defect, index) => (
              <div
                key={defect.id}
                className={`glass-card p-3 sm:p-4 rounded-lg border ${getPriorityColor(defect.priority)} transition-all duration-300 animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {getPriorityIcon(defect.priority)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-[#1e293b] dark:bg-[#1e293b] bg-[#f8fafc] text-[#94a3b8] dark:text-[#94a3b8] text-[#475569] border border-[#334155] dark:border-[#334155] border-[#cbd5e1]">
                        {defect.id}
                      </span>
                      {defect.priority === 'Critical' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#e11d48] text-white glow-critical">
                          {defect.priority}
                        </span>
                      )}
                      {defect.priority === 'Medium' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#f59e0b] text-white glow-warning">
                          {defect.priority}
                        </span>
                      )}
                      {defect.priority === 'Low' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#94a3b8] text-white">
                          {defect.priority}
                        </span>
                      )}
                      <span className="text-xs text-[#94a3b8] dark:text-[#94a3b8] text-[#475569]">
                        {defect.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white dark:text-white text-[#0f172a] mb-1 break-words">{defect.title}</h3>
                    <p className="text-xs sm:text-sm text-[#94a3b8] dark:text-[#94a3b8] text-[#475569] leading-relaxed break-words">{defect.description}</p>
                    {defect.location && (
                      <p className="font-mono text-xs text-[#94a3b8] dark:text-[#94a3b8] text-[#475569] mt-2 break-all">{defect.location}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 glass-card rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-[#10b981] mx-auto mb-2" />
              <p className="text-sm text-[#94a3b8] dark:text-[#94a3b8] text-[#475569]">{t.report.defects.noDefects}</p>
            </div>
          )}
        </div>
      </div>

      {/* Test Script - Cyber Code Block */}
      <div className="border-t border-[#334155] dark:border-[#334155] border-[#cbd5e1] pt-6 animate-slide-up-spring">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-white dark:text-white text-[#0f172a]">{t.report.testScript}</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 px-3 text-xs text-[#94a3b8] dark:text-[#94a3b8] text-[#475569] hover:text-white dark:hover:text-white hover:text-[#0f172a] hover:bg-[#1e293b] dark:hover:bg-[#1e293b] hover:bg-[#f1f5f9] flex-1 sm:flex-none"
            >
              <Copy className="h-3 w-3 mr-1.5" />
              <span className="hidden xs:inline">{copied ? t.common.copied : t.common.copy}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadScript}
              className="h-8 px-3 text-xs text-[#94a3b8] dark:text-[#94a3b8] text-[#475569] hover:text-white dark:hover:text-white hover:text-[#0f172a] hover:bg-[#1e293b] dark:hover:bg-[#1e293b] hover:bg-[#f1f5f9] flex-1 sm:flex-none"
            >
              <Download className="h-3 w-3 mr-1.5" />
              <span className="hidden xs:inline">{t.common.download}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setScriptExpanded(!scriptExpanded)}
              className="h-8 px-2 text-[#94a3b8] dark:text-[#94a3b8] text-[#475569] hover:text-white dark:hover:text-white hover:text-[#0f172a] hover:bg-[#1e293b] dark:hover:bg-[#1e293b] hover:bg-[#f1f5f9]"
            >
              {scriptExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {scriptExpanded && (
          <div className="glass-card rounded-lg border border-[#334155] overflow-hidden">
            <pre className="font-mono text-xs p-3 sm:p-4 overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-thin">
              <code className="text-[#94a3b8] dark:text-[#94a3b8] text-[#475569]">{result.testScript}</code>
            </pre>
          </div>
        )}
      </div>

    </div>
  )
}
