'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, AlertCircle, Loader2, Shield, Eye, Brain, Terminal } from 'lucide-react'
import type { ProcessingLog } from '@/types'
import { useLanguage } from '@/lib/language-context'

interface ProcessingStateProps {
  progress: number
  logs: ProcessingLog[]
}

interface AgentMessage {
  agent: 'security' | 'ux' | 'logic'
  message: string
  timestamp: number
}

export function ProcessingState({ progress, logs }: ProcessingStateProps) {
  const { t, language } = useLanguage()
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([])
  const [displayedMessage, setDisplayedMessage] = useState('')

  const agents = [
    { 
      id: 'security' as const,
      icon: Shield, 
      name: 'Security Agent',
      color: 'text-[#ef4444]',
      bgColor: 'bg-[#ef4444]/10',
      borderColor: 'border-[#ef4444]/30',
      status: progress > 30 ? (progress > 70 ? 'completed' : 'active') : 'pending'
    },
    { 
      id: 'ux' as const,
      icon: Eye, 
      name: 'UX/UI Agent',
      color: 'text-[#f59e0b]',
      bgColor: 'bg-[#f59e0b]/10',
      borderColor: 'border-[#f59e0b]/30',
      status: progress > 50 ? (progress > 85 ? 'completed' : 'active') : 'pending'
    },
    { 
      id: 'logic' as const,
      icon: Brain, 
      name: 'Logic Agent',
      color: 'text-[#38bdf8]',
      bgColor: 'bg-[#38bdf8]/10',
      borderColor: 'border-[#38bdf8]/30',
      status: progress > 70 ? (progress > 95 ? 'completed' : 'active') : 'pending'
    },
  ]

  // Generate agent messages based on progress
  useEffect(() => {
    const messages: AgentMessage[] = []
    
    if (progress > 15) {
      messages.push({
        agent: 'security',
        message: 'Security Agent: Scanning for exposed API keys...',
        timestamp: Date.now() - 2000
      })
    }
    if (progress > 25) {
      messages.push({
        agent: 'security',
        message: 'Security Agent: Found 2 critical vulnerabilities... Sending to Reporter',
        timestamp: Date.now() - 1500
      })
    }
    if (progress > 40) {
      messages.push({
        agent: 'ux',
        message: 'UX/UI Agent: Evaluating conversion friction points...',
        timestamp: Date.now() - 1000
      })
    }
    if (progress > 55) {
      messages.push({
        agent: 'ux',
        message: 'UX/UI Agent: Identified 3 conversion blockers...',
        timestamp: Date.now() - 800
      })
    }
    if (progress > 65) {
      messages.push({
        agent: 'logic',
        message: 'Logic Agent: Mapping API endpoints and data flows...',
        timestamp: Date.now() - 600
      })
    }
    if (progress > 80) {
      messages.push({
        agent: 'logic',
        message: 'Logic Agent: Detected potential authentication bypass...',
        timestamp: Date.now() - 400
      })
    }
    if (progress > 90) {
      messages.push({
        agent: 'security',
        message: 'Security Agent: Final security scan complete ✓',
        timestamp: Date.now() - 200
      })
    }
    
    setAgentMessages(messages)
    
    // Animate console text
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1]
      let currentIndex = 0
      const interval = setInterval(() => {
        if (currentIndex <= latestMessage.message.length) {
          setDisplayedMessage(latestMessage.message.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(interval)
        }
      }, 30)
      
      return () => clearInterval(interval)
    }
  }, [progress])

  const getLogIcon = (status: ProcessingLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-3 w-3 text-[#10b981]" />
      case 'error':
        return <AlertCircle className="h-3 w-3 text-[#ef4444]" />
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-[#f59e0b]" />
      default:
        return <Loader2 className="h-3 w-3 text-[#38bdf8] animate-spin" />
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-6 animate-in fade-in duration-300">
      {/* Status Board */}
      <div className="glass-card rounded-lg p-6 animate-slide-up-spring">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-[#cbd5e1] dark:border-[#334155] pb-4">
            <h2 className="text-xl font-semibold text-[#0f172a] dark:text-white">Security Dashboard</h2>
            <p className="text-sm text-[#334155] dark:text-[#94a3b8]">Multi-Agent Analysis in Progress</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#0f172a] dark:text-[#94a3b8]">{t.processing.progress}</span>
              <span className="text-sm font-semibold text-[#0f172a] dark:text-white">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Agent Status Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const Icon = agent.icon
              const isActive = agent.status === 'active'
              const isCompleted = agent.status === 'completed'

              return (
                <div
                  key={agent.id}
                  className={`flex flex-col items-start p-4 rounded-lg border-2 transition-all duration-300 ${
                    isCompleted
                      ? `${agent.borderColor} ${agent.bgColor} opacity-100`
                      : isActive
                      ? `${agent.borderColor} ${agent.bgColor} opacity-100 animate-pulse`
                      : 'border-[#cbd5e1] dark:border-[#334155] bg-[#f8fafc]/30 dark:bg-[#1e293b]/30 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3 w-full mb-2">
                    {isActive ? (
                      <Loader2 className={`h-5 w-5 ${agent.color} animate-spin`} />
                    ) : isCompleted ? (
                      <CheckCircle2 className={`h-5 w-5 ${agent.color}`} />
                    ) : (
                      <Icon className={`h-5 w-5 ${agent.color} opacity-50`} />
                    )}
                    <h3 className={`text-sm font-semibold ${agent.color} dark:text-white`}>
                      {agent.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#64748b] dark:text-[#94a3b8] mt-1">
                    {isCompleted 
                      ? 'Analysis complete ✓'
                      : isActive 
                      ? 'Analyzing...'
                      : 'Waiting...'
                    }
                  </p>
                </div>
              )
            })}
          </div>

          {/* Console Output */}
          <div className="space-y-2 border-t border-[#cbd5e1] dark:border-[#334155] pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="h-4 w-4 text-[#38bdf8]" />
              <h3 className="text-xs font-semibold text-[#0f172a] dark:text-[#94a3b8] uppercase tracking-wide">
                Agent Console
              </h3>
            </div>
            <div className="bg-[#0f172a] dark:bg-[#020617] rounded-lg p-4 font-mono text-xs border border-[#334155] min-h-[120px] max-h-[200px] overflow-y-auto scrollbar-thin">
              <div className="space-y-1">
                {agentMessages.map((msg, index) => {
                  const agent = agents.find(a => a.id === msg.agent)
                  return (
                    <div key={index} className="flex items-start gap-2 animate-fade-in">
                      <span className="text-[#64748b] dark:text-[#94a3b8] text-[10px] min-w-[80px]">
                        [{new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 })}]
                      </span>
                      <span className={`${agent?.color || 'text-[#38bdf8]'} font-medium`}>
                        {msg.message}
                      </span>
                    </div>
                  )
                })}
                {displayedMessage && (
                  <div className="flex items-start gap-2">
                    <span className="text-[#64748b] dark:text-[#94a3b8] text-[10px] min-w-[80px]">
                      [{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 })}]
                    </span>
                    <span className="text-[#38bdf8] font-medium">
                      {displayedMessage}
                      <span className="animate-pulse">▊</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
