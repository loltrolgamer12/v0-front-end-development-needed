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
    try {
      // Intentar parsear como JSON
      body = await responseClone.json();
    } catch (e) {
      try {
        // Si no es JSON, intentar como texto
        body = await response.clone().text();
      } catch (e2) {
        body = '[Could not parse response body]';
      }
    }
    
    if (response.ok) {
      logger.logApiSuccess(url, response, body, startTime);
    } else {
      logger.logApiError(url, new Error(`HTTP ${response.status}: ${response.statusText}`), response, startTime);
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
    
    return await response.json();
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