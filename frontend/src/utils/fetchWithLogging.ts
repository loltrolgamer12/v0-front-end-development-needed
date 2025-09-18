// Wrapper para fetch con logging detallado
import { logger } from './logger';

interface FetchOptions extends RequestInit {
  timeout?: number;
}

export async function fetchWithLogging(
  url: string, 
  options: FetchOptions = {}
): Promise<Response> {
  const startTime = Date.now();
  const method = options.method || 'GET';
  
  // Log inicial
  logger.logApiCall(url, method);
  
  try {
    // Configurar timeout por defecto
    const { timeout = 10000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Clonar la respuesta para poder leer el body múltiples veces
    const responseClone = response.clone();
    
    let body;
    let isHtmlResponse = false;
    
    try {
      // Intentar parsear como JSON
      body = await responseClone.json();
    } catch (e) {
      try {
        // Si no es JSON, intentar como texto
        body = await response.clone().text();
        
        // Detectar si es una respuesta HTML
        if (typeof body === 'string' && (body.trim().startsWith('<!DOCTYPE') || body.trim().startsWith('<html'))) {
          isHtmlResponse = true;
          console.warn('🚨 BACKEND ERROR: Respuesta HTML detectada en lugar de JSON');
          console.warn('📄 Contenido HTML:', body.substring(0, 200) + '...');
        }
      } catch (e2) {
        body = '[Could not parse response body]';
      }
    }
    
    if (response.ok) {
      if (isHtmlResponse) {
        logger.logApiError(url, new Error('Backend devolvió HTML en lugar de JSON - posible error de routing'), response, startTime);
      } else {
        logger.logApiSuccess(url, response, body, startTime);
      }
    } else {
      if (isHtmlResponse) {
        logger.logApiError(url, new Error(`Backend devolvió página de error HTML (Status ${response.status})`), response, startTime);
      } else {
        logger.logApiError(url, new Error(`HTTP ${response.status}: ${response.statusText}`), response, startTime);
      }
    }
    
    return response;
    
  } catch (error: any) {
    // Detectar errores CORS específicamente
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      logger.logCorsError(url);
    } else if (error.name === 'AbortError') {
      logger.logApiError(url, new Error(`Request timeout after ${options.timeout || 10000}ms`), undefined, startTime);
    } else {
      logger.logApiError(url, error, undefined, startTime);
    }
    
    throw error;
  }
}

// Helper para llamadas GET con logging
export async function getWithLogging(url: string): Promise<any> {
  try {
    const response = await fetchWithLogging(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Intentar parsear como JSON con manejo de errores mejorado
    const text = await response.text();
    
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(`Backend devolvió HTML en lugar de JSON. Contenido: ${text.substring(0, 100)}...`);
    }
    
    try {
      return JSON.parse(text);
    } catch (jsonError) {
      throw new Error(`Respuesta no es JSON válido. Contenido: ${text.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error(`❌ GET request failed for ${url}:`, error);
    throw error;
  }
}

// Helper para llamadas POST con logging
export async function postWithLogging(url: string, data: any): Promise<any> {
  try {
    const response = await fetchWithLogging(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ POST request failed for ${url}:`, error);
    throw error;
  }
}

// Helper para upload de archivos (FormData) con logging
export async function uploadWithLogging(url: string, formData: FormData): Promise<any> {
  try {
    console.log('📤 Starting file upload to:', url);
    
    const response = await fetchWithLogging(url, {
      method: 'POST',
      // No configurar Content-Type para FormData - el navegador lo hace automáticamente
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Intentar parsear como JSON con manejo de errores mejorado
    const text = await response.text();
    
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(`Backend devolvió HTML en lugar de JSON. Contenido: ${text.substring(0, 100)}...`);
    }
    
    try {
      return JSON.parse(text);
    } catch (jsonError) {
      throw new Error(`Respuesta no es JSON válido. Contenido: ${text.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error(`❌ File upload failed for ${url}:`, error);
    throw error;
  }
}