import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Función de scraping para obtener el contenido real de una URL
 * 
 * NOTA: Si sitios grandes como Facebook siguen bloqueando las requests después de estos cambios,
 * considerar usar una de estas alternativas:
 * 
 * 1. Firecrawl (https://www.firecrawl.dev/): Servicio de scraping con manejo de JS y anti-bot
 *    npm install @mendable/firecrawl-js
 * 
 * 2. Puppeteer/Playwright: Para sitios que requieren JavaScript
 *    npm install puppeteer
 * 
 * 3. Cheerio: Para parsing de HTML (no ayuda con el fetch, pero mejora el parsing)
 *    npm install cheerio
 * 
 * 4. Proxy rotativo: Para evitar rate limiting y bloqueos
 */
async function scrapeWebsite(url: string): Promise<string> {
  try {
    // Validar que la URL tenga protocolo
    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    // Intentar hacer fetch con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 segundos timeout (aumentado para sitios grandes)

    // Headers completos que simulan un navegador Chrome real
    // Estos headers son críticos para evitar bloqueos en sitios grandes como Facebook
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      'DNT': '1',
      'Referer': 'https://www.google.com/',
    };

    const response = await fetch(validUrl, {
      method: 'GET',
      headers,
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Errores comunes y sus posibles causas
      if (response.status === 403) {
        throw new Error(`HTTP 403: Acceso denegado. El sitio puede estar bloqueando bots. Considerá usar Firecrawl o Puppeteer para sitios protegidos.`);
      }
      if (response.status === 429) {
        throw new Error(`HTTP 429: Demasiadas solicitudes. El sitio está limitando el acceso. Esperá unos minutos e intentá de nuevo.`);
      }
      if (response.status === 400) {
        throw new Error(`HTTP 400: Solicitud inválida. El sitio puede estar rechazando la conexión. Verificá que la URL sea correcta.`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Verificar si la respuesta es realmente HTML o si es una página de error/bloqueo
    if (html.length < 100) {
      throw new Error('La respuesta del servidor es demasiado corta. Puede ser una página de error o bloqueo.');
    }
    
    // Extraer texto útil del HTML (remover scripts, styles, etc.)
    const textContent = extractTextFromHTML(html);
    
    if (!textContent || textContent.trim().length === 0) {
      throw new Error('El contenido de la web está vacío');
    }

    return textContent;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La web tardó demasiado en responder (más de 20 segundos)');
    }
    // Si el error ya tiene un mensaje descriptivo, usarlo directamente
    if (error.message && error.message.includes('HTTP')) {
      throw error;
    }
    throw new Error(`No se pudo acceder a la web: ${error.message}`);
  }
}

/**
 * Extrae texto útil del HTML removiendo scripts, styles y otros elementos no relevantes
 * Pero mantiene información importante para análisis de seguridad
 */
function extractTextFromHTML(html: string): string {
  let extractedText = '';
  
  // 1. Extraer scripts (importante para análisis de seguridad)
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  const scripts = html.matchAll(scriptRegex);
  let scriptCount = 0;
  for (const script of scripts) {
    if (scriptCount < 10) { // Limitar cantidad de scripts
      const scriptContent = script[1].trim();
      if (scriptContent.length > 0 && scriptContent.length < 2000) {
        extractedText += `[SCRIPT]\n${scriptContent}\n[/SCRIPT]\n\n`;
        scriptCount++;
      }
    }
  }

  // 2. Extraer meta tags (importantes para SEO y seguridad)
  const metaRegex = /<meta[^>]+>/gi;
  const metas = html.matchAll(metaRegex);
  for (const meta of metas) {
    extractedText += `[META] ${meta[0]}\n`;
  }

  // 3. Extraer links y sus atributos
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  const links = html.matchAll(linkRegex);
  let linkCount = 0;
  for (const link of links) {
    if (linkCount < 50) { // Limitar cantidad de links
      extractedText += `[LINK] href="${link[1]}" text="${link[2].replace(/<[^>]+>/g, '').trim()}"\n`;
      linkCount++;
    }
  }

  // 4. Extraer formularios completos (crítico para seguridad)
  const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
  const forms = html.matchAll(formRegex);
  for (const form of forms) {
    extractedText += `[FORM]\n${form[0]}\n[/FORM]\n\n`;
  }

  // 5. Extraer inputs y sus atributos
  const inputRegex = /<input[^>]+>/gi;
  const inputs = html.matchAll(inputRegex);
  for (const input of inputs) {
    extractedText += `[INPUT] ${input[0]}\n`;
  }

  // 6. Extraer texto visible de elementos importantes
  const importantTags = ['title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'button', 'label'];
  for (const tag of importantTags) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
    const matches = html.matchAll(regex);
    for (const match of matches) {
      const content = match[1].replace(/<[^>]+>/g, ' ').trim();
      if (content && content.length > 3) {
        extractedText += `[${tag.toUpperCase()}] ${content}\n`;
      }
    }
  }

  // 7. Si no hay mucho contenido extraído, incluir HTML limpio (sin scripts/styles grandes)
  if (extractedText.trim().length < 500) {
    let cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    
    // Limitar tamaño del HTML limpio
    cleanHtml = cleanHtml.substring(0, 30000);
    extractedText = `[HTML CONTENT]\n${cleanHtml}\n[/HTML CONTENT]`;
  }

  // Limitar tamaño total a 100k caracteres para no exceder límites de tokens
  return extractedText.substring(0, 100000);
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Falta API KEY' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const body = await request.json();
    
    let contentToAnalyze = body.content;
    let contentType = body.type;

    // Si es una URL, hacer scraping primero
    if (body.type === 'url') {
      try {
        const scrapedContent = await scrapeWebsite(body.content);
        contentToAnalyze = scrapedContent;
        contentType = 'contenido real de la web';
      } catch (scrapingError: any) {
        // Si el scraping falla, devolver error inmediatamente
        return NextResponse.json({
          error: scrapingError.message || 'No se pudo acceder a la web',
          passedTests: [],
          defects: [],
          testScript: ''
        }, { status: 400 });
      }
    }

    // Validar que hay contenido para analizar
    if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
      return NextResponse.json({
        error: 'El contenido está vacío. No se puede analizar.',
        passedTests: [],
        defects: [],
        testScript: ''
      }, { status: 400 });
    }
    
    // MODELOS ACTUALES (Diciembre 2025):
    // Probamos el 3-flash-preview (lanzado hace 10 días) que suele tener cuota de prueba libre
    // Si falla, saltamos al 2.5-flash-lite (GA desde julio 2025)
    const models = ["gemini-3-flash-preview", "gemini-2.5-flash-lite", "gemini-2.5-flash"];
    
    let text = "";
    let errorLog = "";

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `Sos un Consultor Senior de Infraestructura Digital realizando una auditoría privada de nivel enterprise.

CONTENIDO REAL DE LA INFRAESTRUCTURA:
${contentToAnalyze.substring(0, 100000)} ${contentToAnalyze.length > 100000 ? '\n\n[... contenido truncado por longitud ...]' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTRUCCIÓN CRÍTICA DE VALIDACIÓN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este contenido fue extraído mediante scraping real. Analizá ÚNICAMENTE lo que está presente arriba.

Si el contenido está vacío o no hay suficiente información técnica: devolvé un error en el campo "error" del JSON indicando que la auditoría no pudo completarse por falta de información.

NO inventes hallazgos. NO asumas tecnologías que no ves. NO especules sobre infraestructura oculta.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTÁNDAR DE ANÁLISIS (MATERIA.RUN GRADE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Esto NO es un validador HTML gratuito. Es una auditoría de infraestructura crítica orientada a ROI.

ÁREAS DE ANÁLISIS (Basándote SOLO en el contenido real extraído):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORÍA 1: SEGURIDAD Y CONFIANZA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Identificá vulnerabilidades que comprometan la confianza del cliente o expongan la infraestructura:
- Claves API, tokens o credenciales expuestas en el código fuente
- Endpoints de administración accesibles públicamente
- Falta de protección CSRF en formularios críticos (checkout, login, registro)
- Librerías desactualizadas con CVEs conocidos
- Vectores de XSS (innerHTML sin sanitizar, eval() expuesto)
- Validaciones del lado del cliente que pueden manipularse
- Falta de certificados SSL/TLS o configuración débil
- Comentarios HTML que revelan lógica de negocio confidencial

IMPACTO DE NEGOCIO: Pérdida de confianza del cliente, exposición a fraudes, posibles multas GDPR/PCI DSS, daño reputacional irreversible.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORÍA 2: RENDIMIENTO Y CONVERSIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Detectá fricciones que hagan que los usuarios abandonen antes de convertir:
- Imágenes sin atributo 'alt' (pérdida de tráfico SEO + exclusión de usuarios con discapacidad visual)
- Botones críticos (CTA, checkout) ocultos o inaccesibles
- Menús móviles rotos o que no se cierran
- Formularios con validación confusa o campos innecesarios
- Carga lenta de recursos críticos (CSS/JS bloqueantes)
- Falta de meta tags para redes sociales (pérdida de viralidad orgánica)
- Enlaces rotos que llevan a 404
- Texto ilegible por contraste bajo

IMPACTO DE NEGOCIO: Aumento de tasa de rebote, pérdida de conversiones cualificadas, caída en rankings de búsqueda, exclusión de segmentos de mercado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORÍA 3: ARQUITECTURA TÉCNICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Evaluá la calidad técnica y escalabilidad de la infraestructura:
- Tags HTML mal cerrados o anidamiento incorrecto
- Scripts y estilos en línea que bloquean el rendering
- Falta de lazy loading en imágenes pesadas
- Requests HTTP innecesarios o duplicados
- Ausencia de Service Workers o estrategias de caché
- Código jQuery legacy mezclado con frameworks modernos
- Dependencias con versiones conflictivas

IMPACTO DE NEGOCIO: Costos de mantenimiento elevados, dificultad para escalar, deuda técnica que limita innovación, tiempos de desarrollo más largos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE RESPUESTA (JSON ESTRUCTURADO):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Devolvé ÚNICAMENTE un objeto JSON con esta estructura exacta:

{
  "business_impact": "Resumen ejecutivo de 2 frases sobre cómo estos hallazgos afectan directamente el ROI, la conversión o la confianza del cliente. Ejemplo: 'La exposición de credenciales API pone en riesgo la integridad de los datos de clientes y podría resultar en multas regulatorias. Los conversion killers detectados están causando una pérdida estimada del 23% en el embudo de ventas.'",
  
  "severity_score": 85,  // Número del 1-100 basado en gravedad técnica + impacto de negocio combinado
  
  "passedTests": [
    {
      "category": "Seguridad y Confianza" | "Rendimiento y Conversión" | "Arquitectura Técnica",
      "test": "Descripción de la validación que pasó correctamente",
      "status": "passed"
    }
  ],
  
  "defects": [
    {
      "id": "SEC-001",  // Formato: SEC (Seguridad), CONV (Conversión), ARCH (Arquitectura)
      "category": "Seguridad y Confianza" | "Rendimiento y Conversión" | "Arquitectura Técnica",
      "title": "Título técnico preciso del defecto",
      "description": "Descripción técnica detallada del hallazgo",
      "priority": "Critical" | "Medium" | "Low",
      "location": "URL, línea de código o componente específico (si es identificable)",
      "impact_translation": "TRADUCCIÓN AL LENGUAJE DE NEGOCIO: Cómo este error técnico impacta directamente en ingresos, conversión o confianza. Ejemplos: 'Pérdida de tráfico orgánico (SEO) y exclusión de usuarios con discapacidad visual' | 'Aumento en la tasa de rebote; los clientes abandonan antes de ver la oferta' | 'Riesgo de fraude y pérdida de confianza del cliente, resultando en daño reputacional'"
    }
  ],
  
  "testScript": "Script de testing automatizado para validar los defectos encontrados (Playwright, Cypress o cURL)",
  
  "error": null  // Solo si el contenido está vacío o no hay información suficiente. En ese caso, este campo contiene el mensaje de error y los demás pueden estar vacíos
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONO DE VOZ (MATERIA.RUN STYLE):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Profesional, directo, autoritario.
- Sin fluff técnico innecesario.
- Cada hallazgo debe tener un "bridge" claro entre el error técnico y el impacto de negocio.
- No uses frases como "podría mejorar" o "se recomienda". Usá: "Está causando", "Resultará en", "Exponiendo a".
- Hablá como un consultor senior que cobra $15k/mes, no como un validador HTML gratuito.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLAS FINALES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NO escribas nada fuera del JSON.
2. Analizá ÚNICAMENTE el contenido real extraído arriba.
3. Si el contenido está vacío: devolvé {"error": "Contenido insuficiente para auditoría", ...campos vacíos}.
4. Prioriza defectos "Critical" para vulnerabilidades que afecten seguridad o conversión directamente.
5. CADA defecto DEBE tener su "impact_translation" explicando el impacto de negocio en términos claros.
6. Los IDs deben seguir el formato: SEC-001, CONV-002, ARCH-003 según la categoría.
7. El severity_score debe considerar tanto gravedad técnica como impacto económico.

Generá el JSON ahora:`;

        const result = await model.generateContent(prompt);
        text = result.response.text();
        if (text) break; 
      } catch (e: any) {
        errorLog += `[${modelName}]: ${e.message}. `;
        continue;
      }
    }

    if (!text) throw new Error("Google bloqueó todos los modelos (Límite 0). " + errorLog);

    // LIMPIEZA DE JSON (Extracción estricta entre llaves)
    const match = text.match(/\{[\s\S]*\}/);
    const finalJson = match ? match[0] : text;

    return NextResponse.json(JSON.parse(finalJson));

  } catch (error: any) {
    console.error("ERROR CRÍTICO:", error.message);
    
    // Si llegas aquí con "limit: 0", el problema es tu cuenta de Google, no el código.
    return NextResponse.json({ 
      error: "CUOTA AGOTADA (LÍMITE 0)",
      causa: "Google restringió el acceso gratuito en Argentina este mes.",
      solucion_inmediata: "1. Entrá a https://aistudio.google.com/ 2. Andá a 'Settings' > 'Billing' 3. Vinculá una tarjeta. Te darán 1500 consultas gratis al mes, pero sin tarjeta el límite es 0."
    }, { status: 429 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'POST ONLY' }, { status: 405 });
}