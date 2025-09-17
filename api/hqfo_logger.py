"""
Sistema de logging centralizado para el análisis de Excel HQ-FO-40
Proporciona logging detallado con niveles, timestamps y seguimiento de errores
"""

import logging
import sys
import os
from datetime import datetime
from typing import Optional
import traceback
import json

class HQFOLogger:
    """
    Logger personalizado para el sistema de análisis HQ-FO-40
    """
    
    def __init__(self, name: str = "HQFO_System", log_level: int = logging.DEBUG):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(log_level)
        
        # Evitar duplicar handlers si ya existen
        if not self.logger.handlers:
            self._setup_handlers()
    
    def _setup_handlers(self):
        """Configura los handlers de logging"""
        
        # Formato detallado con timestamp, nivel, función y mensaje
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Handler para consola (stdout)
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # Handler para archivo de logs (solo si no estamos en Vercel)
        if not os.environ.get('VERCEL'):
            try:
                log_dir = "logs"
                os.makedirs(log_dir, exist_ok=True)
                
                log_file = os.path.join(log_dir, f"hqfo_system_{datetime.now().strftime('%Y%m%d')}.log")
                file_handler = logging.FileHandler(log_file, mode='a', encoding='utf-8')
                file_handler.setLevel(logging.DEBUG)
                file_handler.setFormatter(formatter)
                self.logger.addHandler(file_handler)
                
                self.logger.debug(f"Log file created: {log_file}")
            except Exception as e:
                self.logger.warning(f"Could not create file handler: {e}")
    
    def debug(self, message: str, extra_data: Optional[dict] = None):
        """Log debug message"""
        if extra_data:
            message = f"{message} | DATA: {json.dumps(extra_data, ensure_ascii=False, indent=2)}"
        self.logger.debug(message)
    
    def info(self, message: str, extra_data: Optional[dict] = None):
        """Log info message"""
        if extra_data:
            message = f"{message} | DATA: {json.dumps(extra_data, ensure_ascii=False, indent=2)}"
        self.logger.info(message)
    
    def warning(self, message: str, extra_data: Optional[dict] = None):
        """Log warning message"""
        if extra_data:
            message = f"{message} | DATA: {json.dumps(extra_data, ensure_ascii=False, indent=2)}"
        self.logger.warning(message)
    
    def error(self, message: str, error: Optional[Exception] = None, extra_data: Optional[dict] = None):
        """Log error message with optional exception details"""
        error_info = {}
        
        if error:
            error_info.update({
                'error_type': type(error).__name__,
                'error_message': str(error),
                'traceback': traceback.format_exc()
            })
        
        if extra_data:
            error_info.update(extra_data)
        
        if error_info:
            message = f"{message} | ERROR_DATA: {json.dumps(error_info, ensure_ascii=False, indent=2)}"
        
        self.logger.error(message)
    
    def critical(self, message: str, error: Optional[Exception] = None, extra_data: Optional[dict] = None):
        """Log critical message"""
        error_info = {}
        
        if error:
            error_info.update({
                'error_type': type(error).__name__,
                'error_message': str(error),
                'traceback': traceback.format_exc()
            })
        
        if extra_data:
            error_info.update(extra_data)
        
        if error_info:
            message = f"{message} | CRITICAL_DATA: {json.dumps(error_info, ensure_ascii=False, indent=2)}"
        
        self.logger.critical(message)
    
    def log_function_entry(self, func_name: str, args: Optional[dict] = None):
        """Log function entry with parameters"""
        entry_data = {'function': func_name}
        if args:
            # Filtrar datos sensibles o muy largos
            safe_args = {}
            for key, value in args.items():
                if isinstance(value, str) and len(value) > 200:
                    safe_args[key] = f"{value[:200]}... (truncated)"
                elif key.lower() in ['password', 'token', 'secret']:
                    safe_args[key] = "***HIDDEN***"
                else:
                    safe_args[key] = str(value)[:100]  # Limitar longitud
            entry_data['args'] = safe_args
        
        self.debug(f"FUNCTION_ENTRY: {func_name}", entry_data)
    
    def log_function_exit(self, func_name: str, result: Optional[dict] = None, duration: Optional[float] = None):
        """Log function exit with result"""
        exit_data = {'function': func_name}
        
        if duration is not None:
            exit_data['duration_seconds'] = round(duration, 4)
        
        if result is not None:
            # Resumir resultado si es muy largo
            if isinstance(result, dict):
                exit_data['result_keys'] = list(result.keys())
                if 'success' in result:
                    exit_data['success'] = result['success']
            else:
                exit_data['result'] = str(result)[:200]
        
        self.debug(f"FUNCTION_EXIT: {func_name}", exit_data)
    
    def log_data_summary(self, data_name: str, data, details: Optional[dict] = None):
        """Log summary of data structure"""
        summary = {'data_name': data_name}
        
        if isinstance(data, (list, tuple)):
            summary['type'] = 'list'
            summary['length'] = len(data)
            if data:
                summary['first_item_type'] = type(data[0]).__name__
        elif isinstance(data, dict):
            summary['type'] = 'dict'
            summary['keys'] = list(data.keys())
            summary['key_count'] = len(data)
        elif hasattr(data, 'shape'):  # DataFrame o array
            summary['type'] = type(data).__name__
            summary['shape'] = getattr(data, 'shape', None)
        else:
            summary['type'] = type(data).__name__
            summary['value'] = str(data)[:100]
        
        if details:
            summary.update(details)
        
        self.debug(f"DATA_SUMMARY: {data_name}", summary)

# Instancia global del logger
main_logger = HQFOLogger("HQFO_MAIN")
api_logger = HQFOLogger("HQFO_API")
analyzer_logger = HQFOLogger("HQFO_ANALYZER")

def get_logger(component: str = "MAIN") -> HQFOLogger:
    """
    Obtiene logger para componente específico
    """
    loggers = {
        "MAIN": main_logger,
        "API": api_logger,
        "ANALYZER": analyzer_logger
    }
    
    return loggers.get(component.upper(), main_logger)