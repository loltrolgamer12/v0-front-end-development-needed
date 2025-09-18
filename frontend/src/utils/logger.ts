// Utilidad para logs detallados del frontend
// Ayuda a diagnosticar problemas con las llamadas al backend

interface LogData {
  url?: string;
  method?: string;
  status?: number;
  statusText?: string;
  headers?: any;
  body?: any;
  error?: any;
  timestamp?: string;
  duration?: number;
  environment?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private log(level: 'info' | 'warn' | 'error', message: string, data?: LogData) {
    const logEntry = {
      level,
      message,
      timestamp: this.formatTimestamp(),
      ...data
    };

    // Siempre mostrar en consola para debugging
    console.group(`🔍 [${level.toUpperCase()}] ${message}`);
    
    if (data?.url) console.log(`📡 URL: ${data.url}`);
    if (data?.method) console.log(`🔧 Method: ${data.method}`);
    if (data?.status) console.log(`📊 Status: ${data.status} ${data.statusText || ''}`);
    if (data?.duration) console.log(`⏱️ Duration: ${data.duration}ms`);
    if (data?.headers) console.log('📋 Response Headers:', data.headers);
    if (data?.body) console.log('📦 Response Body:', data.body);
    if (data?.error) console.error('❌ Error Details:', data.error);
    
    console.groupEnd();

    // También enviar a la consola del navegador de forma estructurada
    if (level === 'error') {
      console.error('🚨 API ERROR:', logEntry);
    } else if (level === 'warn') {
      console.warn('⚠️ API WARNING:', logEntry);
    } else {
      console.info('ℹ️ API INFO:', logEntry);
    }
  }

  logApiCall(url: string, method: string = 'GET') {
    this.log('info', 'Iniciando llamada API', { url, method });
  }

  logApiSuccess(url: string, response: Response, body?: any, startTime?: number) {
    const duration = startTime ? Date.now() - startTime : undefined;
    
    this.log('info', 'Llamada API exitosa', {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: this.extractHeaders(response.headers),
      body: this.sanitizeBody(body),
      duration
    });
  }

  logApiError(url: string, error: any, response?: Response, startTime?: number) {
    const duration = startTime ? Date.now() - startTime : undefined;
    
    this.log('error', 'Error en llamada API', {
      url,
      status: response?.status,
      statusText: response?.statusText,
      headers: response ? this.extractHeaders(response.headers) : undefined,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      duration
    });
  }

  logCorsError(url: string) {
    this.log('error', 'Error CORS detectado', {
      url,
      error: {
        message: 'Blocked by CORS policy',
        solution: 'El backend necesita configurar Access-Control-Allow-Origin'
      }
    });
  }

  private extractHeaders(headers: Headers): Record<string, string> {
    const headerObj: Record<string, string> = {};
    headers.forEach((value, key) => {
      headerObj[key] = value;
    });
    return headerObj;
  }

  private sanitizeBody(body: any): any {
    // Limitar el tamaño de los logs para evitar spam
    if (typeof body === 'string' && body.length > 1000) {
      return body.substring(0, 1000) + '... (truncated)';
    }
    if (typeof body === 'object' && body) {
      try {
        const str = JSON.stringify(body);
        if (str.length > 1000) {
          return JSON.stringify(body, null, 2).substring(0, 1000) + '... (truncated)';
        }
      } catch (e) {
        return '[Object - could not serialize]';
      }
    }
    return body;
  }

  logBackendStatus() {
    this.log('info', 'Estado del Backend', {
      url: process.env.REACT_APP_API_URL || 'No configurada',
      environment: process.env.NODE_ENV,
      timestamp: this.formatTimestamp()
    });
  }
}

export const logger = new Logger();