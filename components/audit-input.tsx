'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Link, Code, ArrowRight, Globe, FileCode } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language-context'
import { useTheme } from '@/lib/theme-context'
import { LanguageSelector } from '@/components/language-selector'
import { ThemeSelector } from '@/components/theme-selector'

interface AuditInputProps {
  onUrlSubmit: (url: string) => void
  onCodeSubmit: (code: string) => void
}

type InputMode = 'url' | 'code'

export function AuditInput({ onUrlSubmit, onCodeSubmit }: AuditInputProps) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const [mode, setMode] = useState<InputMode>('url')
  const [urlInput, setUrlInput] = useState('')
  const [codeInput, setCodeInput] = useState('')

  const handleSubmit = () => {
    if (mode === 'url' && urlInput.trim()) {
      onUrlSubmit(urlInput.trim())
    } else if (mode === 'code' && codeInput.trim()) {
      onCodeSubmit(codeInput.trim())
    }
  }

  const isSubmitDisabled = mode === 'url' 
    ? !urlInput.trim() 
    : !codeInput.trim()

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 px-4 sm:px-6 animate-in fade-in duration-300">
      {/* Centered Hero Section */}
      <div className="text-center space-y-2 relative">
        <div className="absolute top-0 right-0 flex items-center gap-2">
          <ThemeSelector />
          <LanguageSelector />
        </div>
        
        {/* Logo - Limpio sin efectos */}
        <div className="flex justify-center items-center -mb-2">
          <div className="w-56 sm:w-64 flex justify-center">
            <Image 
              src={theme === 'dark' ? '/logo-blacktheme.png' : '/logo.png'}
              alt="QUARTZ AI - Bank-Grade Testing Automation" 
              width={256}
              height={103}
              priority
              className="w-full h-auto object-contain mx-auto"
            />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-lg p-3 sm:p-5 animate-slide-up-spring">
        {/* Tab Selector */}
        <div className="flex gap-1 sm:gap-2 mb-4 border-b border-[#cbd5e1] dark:border-[#334155]">
          <button
            onClick={() => setMode('url')}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-300 relative ${
              mode === 'url'
                ? 'text-[#38bdf8] border-b-2 border-[#38bdf8]'
                : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#38bdf8]'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">{t.auditInput.websiteTab}</span>
          </button>
          <button
            onClick={() => setMode('code')}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-300 relative ${
              mode === 'code'
                ? 'text-[#38bdf8] border-b-2 border-[#38bdf8]'
                : 'text-[#475569] dark:text-[#94a3b8] hover:text-[#38bdf8]'
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span className="hidden xs:inline sm:inline">{t.auditInput.codeTab}</span>
          </button>
        </div>

        {/* URL Input Mode */}
        {mode === 'url' && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#0f172a] dark:text-white flex items-center gap-2">
              <Link className="h-4 w-4 text-[#38bdf8]" />
              {t.auditInput.websiteUrl}
            </label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={t.auditInput.websitePlaceholder}
              className="input-focus-glow flex h-11 w-full rounded-lg border border-[#cbd5e1] dark:border-[#334155] bg-white dark:bg-[#1e293b] px-4 py-2.5 text-sm text-[#0f172a] dark:text-white placeholder:text-[#475569] dark:placeholder:text-[#94a3b8] focus:outline-none focus:border-[#38bdf8] transition-all duration-300"
              onKeyDown={(e) => e.key === 'Enter' && !isSubmitDisabled && handleSubmit()}
            />
            <p className="text-xs text-[#475569] dark:text-[#94a3b8]">
              {t.auditInput.websiteDescription}
            </p>
          </div>
        )}

        {/* Code Input Mode */}
        {mode === 'code' && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#0f172a] dark:text-white flex items-center gap-2">
              <Code className="h-4 w-4 text-[#38bdf8]" />
              {t.auditInput.codeLabel}
            </label>
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder={t.auditInput.codePlaceholder}
              rows={10}
              className="input-focus-glow flex w-full rounded-lg border border-[#334155] dark:border-[#334155] light:border-[#e2e8f0] bg-[#1e293b] dark:bg-[#1e293b] light:bg-white px-4 py-2.5 text-sm font-mono text-white dark:text-white light:text-[#0f172a] placeholder:text-[#94a3b8] dark:placeholder:text-[#94a3b8] light:placeholder:text-[#64748b] focus:outline-none focus:border-[#38bdf8] transition-all duration-300 resize-none"
            />
            <p className="text-xs text-[#94a3b8] dark:text-[#94a3b8] light:text-[#64748b]">
              {t.auditInput.codeDescription}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-4 pt-3 border-t border-[#cbd5e1] dark:border-[#334155]">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-full h-11 text-sm font-medium bg-[#38bdf8] text-white dark:text-[#020617] hover:bg-[#38bdf8]/90 hover:glow-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            <span>{t.auditInput.startAudit}</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
