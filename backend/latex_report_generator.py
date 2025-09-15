import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from models.inspection_models import ProcessedData, RiskLevel

class LaTeXReportGenerator:
    def __init__(self, processed_data: ProcessedData, template_path: str = "template.tex"):
        """Inicializa el generador con datos procesados y ruta de plantilla"""
        self.data = processed_data
        self.template_path = template_path
        self.output_dir = Path("reports")
        self.chart_data = {}
        self.stats = {}
        
    def generate_monthly_report(self, output_dir: str = "reports/", month: Optional[str] = None, year: Optional[str] = None) -> str:
        """
        Genera informe mensual completo
        Retorna: ruta del PDF generado
        """
        # Configurar fechas
        month = month or datetime.now().strftime("%B").lower()
        year = year or str(datetime.now().year)
        
        # Crear directorios
        report_dir = Path(output_dir) / year / f"{month}_{year}"
        report_dir.mkdir(parents=True, exist_ok=True)
        
        # Calcular estadísticas
        self.calculate_statistics()
        self.generate_charts_data()
        
        # Generar LaTeX
        tex_content = self.fill_template(self.read_template())
        tex_file = report_dir / f"informe_{month}_{year}.tex"
        
        # Guardar y compilar
        tex_file.write_text(tex_content, encoding='utf-8')
        pdf_path = self.compile_pdf(tex_file)
        
        return str(pdf_path)
    
    def calculate_statistics(self):
        """Calcula todas las estadísticas necesarias para el informe"""
        self.stats = {
            'total_inspections': len(self.data.inspections),
            'average_compliance': sum(i.compliance for i in self.data.inspections) / len(self.data.inspections),
            'critical_failures': sum(i.critical_failures for i in self.data.inspections),
            'risk_levels': {
                RiskLevel.LOW: sum(1 for i in self.data.inspections if i.risk_level == RiskLevel.LOW),
                RiskLevel.MEDIUM: sum(1 for i in self.data.inspections if i.risk_level == RiskLevel.MEDIUM),
                RiskLevel.HIGH: sum(1 for i in self.data.inspections if i.risk_level == RiskLevel.HIGH),
                RiskLevel.CRITICAL: sum(1 for i in self.data.inspections if i.risk_level == RiskLevel.CRITICAL)
            }
        }
    
    def generate_charts_data(self):
        """Genera datos formateados para gráficos LaTeX/TikZ"""
        # Datos para gráfico de inspecciones diarias
        daily_inspections = {}
        for inspection in self.data.inspections:
            date = inspection.date.date()
            daily_inspections[date] = daily_inspections.get(date, 0) + 1
        
        self.chart_data['daily_inspections'] = " ".join(
            f"({day.day},{count})" for day, count in sorted(daily_inspections.items())
        )
        
        # Datos para gráfico de torta de riesgo
        total = len(self.data.inspections)
        risk_percentages = {
            level: (count / total) * 100 
            for level, count in self.stats['risk_levels'].items()
        }
        
        self.chart_data['risk_pie'] = ", ".join(
            f"{percent:.1f}/{level.value} ({count})"
            for level, (percent, count) in zip(RiskLevel, risk_percentages.items())
        )
    
    def generate_automatic_alerts(self) -> List[Dict[str, str]]:
        """Genera alertas automáticas según criterios configurados"""
        alerts = []
        
        # Alerta por bajo cumplimiento
        if self.stats['average_compliance'] < 90:
            alerts.append({
                'type': 'warning',
                'title': 'Cumplimiento Bajo',
                'message': f'El cumplimiento promedio ({self.stats["average_compliance"]:.1f}%) está por debajo del objetivo del 90%'
            })
        
        # Alerta por fallas críticas
        if self.stats['critical_failures'] > 10:
            alerts.append({
                'type': 'danger',
                'title': 'Fallas Críticas Elevadas',
                'message': f'Se detectaron {self.stats["critical_failures"]} fallas críticas en el período'
            })
        
        return alerts
    
    def fill_template(self, template_content: str) -> str:
        """Rellena plantilla LaTeX con datos calculados"""
        # Reemplazar placeholders con datos reales
        replacements = {
            '%%TOTAL_INSPECTIONS%%': str(self.stats['total_inspections']),
            '%%AVERAGE_COMPLIANCE%%': f"{self.stats['average_compliance']:.1f}\\%",
            '%%CRITICAL_FAILURES%%': str(self.stats['critical_failures']),
            '%%DAILY_INSPECTIONS_DATA%%': self.chart_data['daily_inspections'],
            '%%RISK_PIE_DATA%%': self.chart_data['risk_pie']
        }
        
        for key, value in replacements.items():
            template_content = template_content.replace(key, value)
        
        return template_content
    
    def compile_pdf(self, tex_file_path: Path) -> str:
        """Compila archivo .tex a PDF usando pdflatex"""
        os.system(f'pdflatex -interaction=nonstopmode -output-directory="{tex_file_path.parent}" "{tex_file_path}"')
        os.system(f'pdflatex -interaction=nonstopmode -output-directory="{tex_file_path.parent}" "{tex_file_path}"')
        
        # Limpiar archivos temporales
        for ext in ['.aux', '.log', '.out']:
            temp_file = tex_file_path.with_suffix(ext)
            if temp_file.exists():
                temp_file.unlink()
        
        return str(tex_file_path.with_suffix('.pdf'))
    
    def read_template(self) -> str:
        """Lee el contenido de la plantilla LaTeX"""
        with open(self.template_path, 'r', encoding='utf-8') as f:
            return f.read()