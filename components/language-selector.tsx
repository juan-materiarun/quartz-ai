'use client'

import { Globe } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es')
  }

  return (
    <Button
      onClick={toggleLanguage}
      variant="ghost"
      size="sm"
      className="h-9 px-3 text-sm text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition-all duration-300"
      title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <Globe className="h-4 w-4 mr-2" />
      <span className="uppercase font-medium">{language === 'es' ? 'EN' : 'ES'}</span>
    </Button>
  )
}




