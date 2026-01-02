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
        
        const prompt = `Analizá el siguiente ${contentType} y encontrá errores. Si el contenido está vacío, no inventes nada.

CONTENIDO REAL DE LA WEB:
${contentToAnalyze.substring(0, 100000)} ${contentToAnalyze.length > 100000 ? '\n\n[... contenido truncado por longitud ...]' : ''}

INSTRUCCIÓN ESTRICTA: Este es contenido REAL obtenido directamente de la web mediante scraping. Analizá SOLO lo que está presente en el contenido proporcionado arriba. Si el contenido está vacío o no hay suficiente información, NO inventes datos. En su lugar, devolvé un mensaje de error en el campo de respuesta indicando que no se encontró información suficiente para analizar.

IMPORTANTE: NO te enfoques en estructura HTML/DOM simple. Enfócate en VULNERABILIDADES CRÍTICAS y FRICCIÓN DE NEGOCIO basándote SOLO en el contenido real proporcionado.

Busca específicamente en el contenido REAL proporcionado:

1. LÓGICA EXPUESTA:
   - Claves API, tokens o credenciales hardcodeadas en el código
   - Endpoints sensibles expuestos públicamente
   - Comentarios que revelen información confidencial o lógica de negocio
   - Variables de entorno o configuraciones sensibles en el frontend

2. FALLOS DE SEGURIDAD:
   - Formularios sin protección CSRF (tokens faltantes)
   - Librerías desactualizadas con vulnerabilidades conocidas
   - Puntos de entrada potenciales para XSS (innerHTML sin sanitizar, eval(), etc.)
   - Autenticación débil o validación insuficiente
   - Exposición de datos sensibles en respuestas de API

3. CONVERSION KILLERS (UX que hace que los usuarios abandonen):
   - Botones críticos (checkout, registro) ocultos detrás de popups o elementos superpuestos
   - Menús móviles que no se cierran correctamente
   - Formularios que bloquean el flujo de conversión
   - Elementos interactivos inaccesibles o rotos
   - Carga lenta o bloqueos que impiden acciones del usuario

4. ERRORES DE LÓGICA:
   - Posibilidad de bypasear login o autenticación
   - Acceso no autorizado a datos privados
   - Validaciones del lado del cliente que pueden ser manipuladas
   - Rutas o permisos mal configurados
   - Lógica de negocio que puede ser explotada

Responde EXCLUSIVAMENTE con un objeto JSON que contenga:
- "passedTests": array de objetos con {category: string, test: string, status: "passed"}
- "defects": array de objetos con {id: string, category: string, title: string, description: string, priority: "Critical"|"Medium"|"Low", location?: string}
- "testScript": string con un script de prueba automatizado para verificar los defectos encontrados
- "error": string (solo si el contenido está vacío o no hay suficiente información para analizar - en este caso, este campo debe contener el mensaje de error y los demás campos pueden estar vacíos)

IMPORTANTE: 
- No escribas nada más que el JSON.
- Analizá SOLO el contenido real proporcionado arriba.
- Si el contenido está vacío o no hay suficiente información, devolvé un error en lugar de inventar datos.
- Prioriza defectos "Critical" para vulnerabilidades de seguridad y lógica expuesta.
- Solo reportá defectos que puedas identificar claramente en el contenido proporcionado.`;

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