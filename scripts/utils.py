#!/usr/bin/env python3
"""
Utilidades de producción para el Sistema de Inspecciones Vehiculares
Versión Windows con las funciones esenciales
"""

import os
import sys
import json
import subprocess
import shutil
from datetime import datetime
import argparse
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class VehicleInspectionUtils:
    """Clase principal para utilidades del sistema"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.backup_dir = self.project_root / "backups"
        self.logs_dir = self.project_root / "logs"
        self.uploads_dir = self.project_root / "uploads"
        
        # Crear directorios si no existen
        for directory in [self.backup_dir, self.logs_dir, self.uploads_dir]:
            directory.mkdir(exist_ok=True)
    
    def health_check(self):
        """Verificación completa de salud del sistema"""
        print("🔍 Ejecutando verificación de salud del sistema...")
        
        issues = []
        
        try:
            # Verificar Docker
            result = subprocess.run(['docker', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                print(f"✅ Docker: {result.stdout.strip()}")
            else:
                issues.append("❌ Docker no disponible")
        except Exception as e:
            issues.append(f"❌ Error verificando Docker: {e}")
        
        try:
            # Verificar docker-compose
            result = subprocess.run(['docker-compose', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                print(f"✅ Docker Compose: {result.stdout.strip()}")
            else:
                issues.append("❌ Docker Compose no disponible")
        except Exception as e:
            issues.append(f"❌ Error verificando Docker Compose: {e}")
        
        # Verificar archivos críticos
        critical_files = [
            'docker-compose.yml',
            'backend/requirements.txt',
            'frontend/package.json',
            '.env.example'
        ]
        
        for file_path in critical_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                print(f"✅ {file_path}")
            else:
                issues.append(f"❌ {file_path} faltante")
        
        # Verificar directorios
        for directory in [self.backup_dir, self.logs_dir, self.uploads_dir]:
            if directory.exists():
                print(f"✅ {directory.name}/")
            else:
                issues.append(f"❌ {directory.name}/ faltante")
        
        # Verificar servicios si están corriendo
        try:
            result = subprocess.run(['docker-compose', 'ps'], 
                                  capture_output=True, text=True, timeout=10,
                                  cwd=self.project_root)
            if result.returncode == 0:
                print("📊 Estado de servicios:")
                print(result.stdout)
            
            # Verificar health check del backend
            try:
                import requests
                response = requests.get('http://localhost:5000/health', timeout=5)
                if response.status_code == 200:
                    print("✅ Backend health check: OK")
                else:
                    issues.append(f"⚠️ Backend health check: {response.status_code}")
            except Exception:
                print("⚠️ Backend no disponible (puede estar iniciando)")
                
        except Exception as e:
            print(f"⚠️ No se puede verificar estado de servicios: {e}")
        
        # Resumen
        if issues:
            print("\n🚨 Problemas encontrados:")
            for issue in issues:
                print(f"  {issue}")
            return False
        else:
            print("\n✅ Sistema saludable - Todos los checks pasaron")
            return True
    
    def create_backup(self, backup_type="basic"):
        """Crear backup del sistema"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"backup_{backup_type}_{timestamp}"
        
        print(f"💾 Creando backup: {backup_name}...")
        
        try:
            if sys.platform == "win32":
                # Windows: usar 7zip si está disponible, sino usar shutil
                backup_path = self.backup_dir / f"{backup_name}.zip"
                
                # Crear lista de archivos a incluir
                files_to_backup = [
                    'docker-compose.yml',
                    'backend/',
                    'frontend/',
                    'monitoring/',
                    'nginx/',
                    'docs/',
                    '.env.example',
                    'README.md'
                ]
                
                # Crear backup usando shutil
                import zipfile
                
                with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for item in files_to_backup:
                        item_path = self.project_root / item
                        
                        if item_path.is_file():
                            zipf.write(item_path, item)
                        elif item_path.is_dir():
                            for file_path in item_path.rglob('*'):
                                if file_path.is_file():
                                    # Evitar archivos temporales
                                    if not any(skip in str(file_path) for skip in 
                                             ['__pycache__', '.git', 'node_modules', '.env']):
                                        arcname = file_path.relative_to(self.project_root)
                                        zipf.write(file_path, arcname)
                
                print(f"✅ Backup creado: {backup_path}")
                
                # Información del backup
                size_mb = backup_path.stat().st_size / (1024 * 1024)
                print(f"📊 Tamaño del backup: {size_mb:.1f} MB")
                
                return str(backup_path)
                
        except Exception as e:
            logger.error(f"Error creando backup: {e}")
            return None
    
    def clean_system(self):
        """Limpiar archivos temporales y optimizar el sistema"""
        print("🧹 Limpiando sistema...")
        
        cleaned_items = []
        
        try:
            # Limpiar archivos temporales de Python
            for pycache in self.project_root.rglob('__pycache__'):
                if pycache.is_dir():
                    shutil.rmtree(pycache)
                    cleaned_items.append(f"__pycache__ en {pycache.parent.name}")
            
            # Limpiar logs antiguos (más de 30 días)
            if self.logs_dir.exists():
                cutoff_date = datetime.now().timestamp() - (30 * 24 * 60 * 60)
                for log_file in self.logs_dir.glob('*.log'):
                    if log_file.stat().st_mtime < cutoff_date:
                        log_file.unlink()
                        cleaned_items.append(f"Log antiguo: {log_file.name}")
            
            # Limpiar uploads antiguos (más de 7 días) 
            if self.uploads_dir.exists():
                cutoff_date = datetime.now().timestamp() - (7 * 24 * 60 * 60)
                for upload_file in self.uploads_dir.glob('*'):
                    if upload_file.is_file() and upload_file.stat().st_mtime < cutoff_date:
                        upload_file.unlink()
                        cleaned_items.append(f"Upload antiguo: {upload_file.name}")
            
            # Limpiar sistema Docker
            try:
                result = subprocess.run(['docker', 'system', 'prune', '-f'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    cleaned_items.append("Contenedores e imágenes Docker no utilizados")
            except Exception:
                pass
            
            if cleaned_items:
                print("✅ Elementos limpiados:")
                for item in cleaned_items:
                    print(f"  - {item}")
            else:
                print("✅ Sistema ya estaba limpio")
                
        except Exception as e:
            logger.error(f"Error durante limpieza: {e}")
    
    def system_status(self):
        """Mostrar estado completo del sistema"""
        print("📊 Estado del Sistema de Inspecciones Vehiculares")
        print("=" * 60)
        
        # Información del sistema
        print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"💻 Plataforma: {sys.platform}")
        print(f"🐍 Python: {sys.version}")
        print(f"📁 Directorio: {self.project_root}")
        
        # Estado de servicios
        print("\n🐳 Estado de Docker:")
        try:
            result = subprocess.run(['docker-compose', 'ps'], 
                                  capture_output=True, text=True, 
                                  cwd=self.project_root)
            if result.returncode == 0:
                print(result.stdout)
            else:
                print("❌ No se puede obtener estado de servicios")
        except Exception as e:
            print(f"❌ Error: {e}")
        
        # Uso de espacio
        print("\n💾 Uso de Espacio:")
        try:
            for directory in [self.uploads_dir, self.logs_dir, self.backup_dir]:
                if directory.exists():
                    size = sum(f.stat().st_size for f in directory.rglob('*') if f.is_file())
                    size_mb = size / (1024 * 1024)
                    file_count = len(list(directory.rglob('*')))
                    print(f"  📁 {directory.name}: {size_mb:.1f} MB ({file_count} archivos)")
        except Exception as e:
            print(f"❌ Error calculando espacio: {e}")

def main():
    """Función principal CLI"""
    parser = argparse.ArgumentParser(
        description="Utilidades del Sistema de Inspecciones Vehiculares v2.0.0"
    )
    parser.add_argument('command', 
                       choices=['health', 'backup', 'clean', 'status'],
                       help='Comando a ejecutar')
    parser.add_argument('--type', 
                       choices=['basic', 'full'], 
                       default='basic',
                       help='Tipo de backup (solo para comando backup)')
    
    args = parser.parse_args()
    
    utils = VehicleInspectionUtils()
    
    if args.command == 'health':
        success = utils.health_check()
        sys.exit(0 if success else 1)
        
    elif args.command == 'backup':
        backup_path = utils.create_backup(args.type)
        sys.exit(0 if backup_path else 1)
        
    elif args.command == 'clean':
        utils.clean_system()
        
    elif args.command == 'status':
        utils.system_status()

if __name__ == '__main__':
    main()