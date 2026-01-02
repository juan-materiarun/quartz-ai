export type Language = 'es' | 'en'

// Define the translation structure interface
export interface Translations {
  common: {
    newAudit: string
    tryAgain: string
    copy: string
    copied: string
    download: string
  }
  hero: {
    title: string
    subtitle: string
  }
  auditInput: {
    websiteTab: string
    codeTab: string
    websiteUrl: string
    websitePlaceholder: string
    websiteDescription: string
    codeLabel: string
    codePlaceholder: string
    codeDescription: string
    startAudit: string
  }
  processing: {
    title: string
    subtitle: string
    progress: string
    log: string
    steps: {
      analyzingHtml: string
      checkingSecurity: string
      evaluatingPerformance: string
    }
  }
  report: {
    title: string
    subtitle: string
    executiveSummary: string
    severity: string
    businessImpact: string
    stats: {
      passed: string
      defects: string
      critical: string
      score: string
      of100: string
    }
    charts: {
      byPriority: string
      generalHealth: string
      passedTests: string
      defectsByCategory: string
    }
    defects: {
      title: string
      defect: string
      defects: string
      noDefects: string
      noPassedTests: string
    }
    testScript: string
    priority: {
      critical: string
      medium: string
      low: string
    }
  }
  error: {
    auditError: string
    auditFailed: string
    websiteNotAccessible: string
    websiteNotFound: string
    tryDifferentSite: string
    possibleReasons: string
    reasons: {
      blocked: string
      noInternet: string
      invalidUrl: string
      siteDown: string
    }
  }
  logs: {
    analyzingSite: string
    analyzingCode: string
    characters: string
  }
}

export const translations: Record<Language, Translations> = {
  es: {
    // Common
    common: {
      newAudit: 'Nueva Auditoría',
      tryAgain: 'Intentar de Nuevo',
      copy: 'Copiar',
      copied: 'Copiado',
      download: 'Descargar',
    },
    // Hero Section
    hero: {
      title: 'QUARTZ AI',
      subtitle: 'Automatización de Aseguramiento de Calidad de Nivel Bancario',
    },
    // Audit Input
    auditInput: {
      websiteTab: 'Sitio Web',
      codeTab: 'Código',
      websiteUrl: 'URL del Sitio Web',
      websitePlaceholder: 'https://example.com',
      websiteDescription: 'Ingresa una URL para análisis completo de seguridad y rendimiento',
      codeLabel: 'Pega tu Código',
      codePlaceholder: '<html>\n  <head>\n    <title>Mi App</title>\n  </head>\n  <body>\n    <!-- Tu código aquí -->\n  </body>\n</html>',
      codeDescription: 'Pega HTML, CSS, JavaScript o cualquier código web para análisis instantáneo',
      startAudit: 'Iniciar Auditoría',
    },
    // Processing State
    processing: {
      title: 'Escaneando Arquitectura...',
      subtitle: 'Análisis en progreso',
      progress: 'Progreso',
      log: 'Registro',
      steps: {
        analyzingHtml: 'Analizando HTML...',
        checkingSecurity: 'Verificando seguridad...',
        evaluatingPerformance: 'Evaluando rendimiento...',
      },
    },
    // Report Generator
    report: {
      title: 'Reporte de Auditoría',
      subtitle: 'Análisis de Calidad de Nivel Bancario',
      executiveSummary: 'Resumen Ejecutivo: Impacto de Negocio',
      severity: 'Severidad',
      businessImpact: 'Impacto de Negocio',
      stats: {
        passed: 'Exitosas',
        defects: 'Defectos',
        critical: 'Críticos',
        score: 'Puntuación',
        of100: 'de 100',
      },
      charts: {
        byPriority: 'Por Prioridad',
        generalHealth: 'Salud General',
        passedTests: 'Pruebas Exitosas',
        defectsByCategory: 'Defectos por Categoría',
      },
      defects: {
        title: 'Defectos Encontrados',
        defect: 'defecto',
        defects: 'defectos',
        noDefects: 'No se encontraron defectos',
        noPassedTests: 'No hay pruebas exitosas',
      },
      testScript: 'Script de Pruebas',
      priority: {
        critical: 'Critical',
        medium: 'Medium',
        low: 'Low',
      },
    },
    // Error Messages
    error: {
      auditError: 'No pudimos acceder a esta web',
      auditFailed: 'Algo salió mal durante el proceso de auditoría.',
      websiteNotAccessible: 'La web no está disponible o no pudimos acceder a ella',
      websiteNotFound: 'Parece que esta web no existe o no permite el acceso automático',
      tryDifferentSite: 'Podés intentar con otro sitio o verificar que la URL sea correcta',
      possibleReasons: 'Posibles razones:',
      reasons: {
        blocked: 'La web bloquea accesos automáticos (común en Facebook, LinkedIn)',
        noInternet: 'La web no está disponible en este momento',
        invalidUrl: 'La URL no es válida o tiene errores de escritura',
        siteDown: 'El servidor está caído o en mantenimiento',
      },
    },
    // Log Messages (these come from the API, but we can translate the ones we generate)
    logs: {
      analyzingSite: 'Analizando sitio en vivo:',
      analyzingCode: 'Analizando fragmento de código',
      characters: 'caracteres',
    },
  },
  en: {
    // Common
    common: {
      newAudit: 'New Audit',
      tryAgain: 'Try Again',
      copy: 'Copy',
      copied: 'Copied',
      download: 'Download',
    },
    // Hero Section
    hero: {
      title: 'QUARTZ AI',
      subtitle: 'Bank-Grade Quality Assurance Automation',
    },
    // Audit Input
    auditInput: {
      websiteTab: 'Website',
      codeTab: 'Code',
      websiteUrl: 'Website URL',
      websitePlaceholder: 'https://example.com',
      websiteDescription: 'Enter a URL for complete security and performance analysis',
      codeLabel: 'Paste your Code',
      codePlaceholder: '<html>\n  <head>\n    <title>My App</title>\n  </head>\n  <body>\n    <!-- Your code here -->\n  </body>\n</html>',
      codeDescription: 'Paste HTML, CSS, JavaScript or any web code for instant analysis',
      startAudit: 'Start Audit',
    },
    // Processing State
    processing: {
      title: 'Scanning Architecture...',
      subtitle: 'Analysis in progress',
      progress: 'Progress',
      log: 'Log',
      steps: {
        analyzingHtml: 'Analyzing HTML...',
        checkingSecurity: 'Checking security...',
        evaluatingPerformance: 'Evaluating performance...',
      },
    },
    // Report Generator
    report: {
      title: 'Audit Report',
      subtitle: 'Bank-Grade Quality Analysis',
      executiveSummary: 'Executive Summary: Business Impact',
      severity: 'Severity',
      businessImpact: 'Business Impact',
      stats: {
        passed: 'Passed',
        defects: 'Defects',
        critical: 'Critical',
        score: 'Score',
        of100: 'of 100',
      },
      charts: {
        byPriority: 'By Priority',
        generalHealth: 'General Health',
        passedTests: 'Passed Tests',
        defectsByCategory: 'Defects by Category',
      },
      defects: {
        title: 'Defects Found',
        defect: 'defect',
        defects: 'defects',
        noDefects: 'No defects found',
        noPassedTests: 'No passed tests',
      },
      testScript: 'Test Script',
      priority: {
        critical: 'Critical',
        medium: 'Medium',
        low: 'Low',
      },
    },
    // Error Messages
    error: {
      auditError: 'We couldn\'t access this website',
      auditFailed: 'Something went wrong during the audit process.',
      websiteNotAccessible: 'The website is not available or we couldn\'t access it',
      websiteNotFound: 'This website doesn\'t exist or doesn\'t allow automated access',
      tryDifferentSite: 'You can try a different site or verify the URL is correct',
      possibleReasons: 'Possible reasons:',
      reasons: {
        blocked: 'The website blocks automated access (common on Facebook, LinkedIn)',
        noInternet: 'The website is not available at this time',
        invalidUrl: 'The URL is invalid or has typos',
        siteDown: 'The server is down or under maintenance',
      },
    },
    // Log Messages
    logs: {
      analyzingSite: 'Analyzing live site:',
      analyzingCode: 'Analyzing code snippet',
      characters: 'characters',
    },
  },
}




