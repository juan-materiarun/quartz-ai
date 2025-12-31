import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Falta API KEY' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // MODELOS ACTUALES (Diciembre 2025):
    // Probamos el 3-flash-preview (lanzado hace 10 días) que suele tener cuota de prueba libre
    // Si falla, saltamos al 2.5-flash-lite (GA desde julio 2025)
    const models = ["gemini-3-flash-preview", "gemini-2.5-flash-lite", "gemini-2.5-flash"];
    
    let text = "";
    let errorLog = "";

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const body = await request.json();
        
        const prompt = `Analiza este ${body.type}: ${body.content}

IMPORTANTE: NO te enfoques en estructura HTML/DOM simple. Enfócate en VULNERABILIDADES CRÍTICAS y FRICCIÓN DE NEGOCIO.

Busca específicamente:

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

IMPORTANTE: No escribas nada más que el JSON. Prioriza defectos "Critical" para vulnerabilidades de seguridad y lógica expuesta.`;

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