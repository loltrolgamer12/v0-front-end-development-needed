# Guía de Contribución - Sistema de Inspección Vehicular

¡Gracias por tu interés en contribuir al Sistema de Inspección Vehicular! Este documento te guiará a través del proceso de contribución.

## 🤝 Cómo Contribuir

### Tipos de Contribuciones Bienvenidas

- 🐛 **Bug fixes**: Corrección de errores y problemas
- ✨ **Nuevas features**: Funcionalidades que agreguen valor
- 📚 **Documentación**: Mejoras en documentación y ejemplos
- 🧪 **Tests**: Ampliación de cobertura de testing
- 🎨 **UI/UX**: Mejoras en interfaz y experiencia de usuario
- ⚡ **Performance**: Optimizaciones de rendimiento
- 🌐 **Internacionalización**: Traducciones y localización
- 🔒 **Seguridad**: Mejoras en seguridad del sistema

## 🚀 Proceso de Contribución

### 1. Preparación del Entorno

#### Fork y Clone
```bash
# 1. Fork el repositorio en GitHub
# 2. Clone tu fork localmente
git clone https://github.com/tu-usuario/vehicle-inspection-system.git
cd vehicle-inspection-system

# 3. Agregar remote upstream
git remote add upstream https://github.com/original-repo/vehicle-inspection-system.git
```

#### Configuración Local
```bash
# Instalar dependencias de desarrollo
install-dependencies.bat  # Windows
./install-dependencies.sh # macOS/Linux

# Verificar que todo funciona
run-all-tests.bat        # Windows
./run-all-tests.sh       # macOS/Linux
```

### 2. Crear una Nueva Feature

#### Crear Branch
```bash
# Sincronizar con upstream
git checkout main
git pull upstream main

# Crear branch para tu feature
git checkout -b feature/mi-nueva-funcionalidad
```

#### Naming Conventions para Branches
- `feature/descripcion-breve` - Nuevas funcionalidades
- `bugfix/descripcion-del-bug` - Correcciones de bugs
- `docs/tipo-de-documentacion` - Mejoras de documentación
- `test/area-a-testear` - Nuevos tests
- `refactor/componente-a-refactorizar` - Refactorización

### 3. Desarrollo

#### Backend (Python/Flask)
```python
# Seguir PEP 8
# Usar type hints cuando sea posible
from typing import List, Optional

def create_vehicle(vehicle_data: dict) -> Optional[Vehicle]:
    """
    Crear un nuevo vehículo en el sistema.
    
    Args:
        vehicle_data: Diccionario con datos del vehículo
        
    Returns:
        Vehicle instance o None si hay error
        
    Raises:
        ValidationError: Si los datos son inválidos
    """
    pass
```

#### Frontend (React/TypeScript)
```typescript
// Usar TypeScript estricto
// Componentes funcionales con hooks
interface VehicleFormProps {
  onSubmit: (data: VehicleData) => void;
  initialData?: VehicleData;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ 
  onSubmit, 
  initialData 
}) => {
  // Implementación
};
```

#### Estándares de Código

**Python (Backend)**:
- Seguir PEP 8
- Usar Black para formateo automático
- Docstrings en formato Google Style
- Type hints obligatorios
- Máximo 88 caracteres por línea

**JavaScript/TypeScript (Frontend)**:
- Seguir ESLint + Prettier
- Usar interfaces TypeScript
- Componentes funcionales preferidos
- Hooks personalizados para lógica reutilizable
- CSS Modules o styled-components

### 4. Testing

#### Escribir Tests
```python
# Backend: pytest
def test_create_vehicle_success():
    """Test successful vehicle creation."""
    # Arrange
    vehicle_data = {
        'license_plate': 'ABC123',
        'make': 'Toyota',
        'model': 'Camry'
    }
    
    # Act
    vehicle = create_vehicle(vehicle_data)
    
    # Assert
    assert vehicle is not None
    assert vehicle.license_plate == 'ABC123'
```

```typescript
// Frontend: Jest + React Testing Library
describe('VehicleForm', () => {
  it('should submit form with correct data', async () => {
    // Arrange
    const mockOnSubmit = jest.fn();
    render(<VehicleForm onSubmit={mockOnSubmit} />);
    
    // Act
    await user.type(screen.getByLabelText(/placa/i), 'ABC123');
    await user.click(screen.getByRole('button', { name: /guardar/i }));
    
    // Assert
    expect(mockOnSubmit).toHaveBeenCalledWith({
      licensePlate: 'ABC123'
    });
  });
});
```

#### Ejecutar Tests
```bash
# Tests específicos del área modificada
cd backend && pytest tests/unit/test_vehicle.py -v
cd frontend && npm test -- --testPathPattern=Vehicle

# Tests completos antes del PR
run-all-tests.bat
```

### 5. Documentación

#### Documentar Cambios
- Actualizar docstrings y comentarios
- Agregar ejemplos de uso
- Actualizar README si es necesario
- Documentar APIs nuevas o modificadas

#### Ejemplo de Documentación API
```python
@app.route('/api/vehicles', methods=['POST'])
def create_vehicle():
    """
    Crear un nuevo vehículo.
    
    Request Body:
        {
            "license_plate": "string (requerido)",
            "make": "string (requerido)",
            "model": "string (requerido)",
            "year": "integer (requerido)",
            "owner_name": "string (requerido)"
        }
    
    Response:
        201: Vehicle created successfully
        400: Validation error
        409: License plate already exists
    
    Example:
        POST /api/vehicles
        {
            "license_plate": "ABC123",
            "make": "Toyota",
            "model": "Camry",
            "year": 2020,
            "owner_name": "Juan Pérez"
        }
    """
    pass
```

### 6. Commit y Push

#### Convenciones de Commit
```bash
# Formato: tipo(scope): descripción breve
git commit -m "feat(vehicles): agregar validación de placa duplicada"
git commit -m "fix(dashboard): corregir cálculo de estadísticas"
git commit -m "docs(api): actualizar documentación de endpoints"
git commit -m "test(inspections): agregar tests para flujo completo"
```

#### Tipos de Commit
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan código)
- `refactor`: Refactorización sin cambiar funcionalidad
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

#### Push Changes
```bash
git push origin feature/mi-nueva-funcionalidad
```

## 📋 Pull Request Process

### 1. Crear Pull Request

#### Template de PR
```markdown
## 📝 Descripción
Breve descripción de los cambios realizados.

## 🔧 Tipo de Cambio
- [ ] Bug fix (cambio que corrige un problema)
- [ ] Nueva feature (cambio que agrega funcionalidad)
- [ ] Breaking change (cambio que rompe compatibilidad)
- [ ] Documentación

## 🧪 Testing
- [ ] Tests unitarios pasan
- [ ] Tests de integración pasan
- [ ] Tests e2e pasan (si aplica)
- [ ] Cobertura de código mantenida/mejorada

## ✅ Checklist
- [ ] Código sigue las convenciones del proyecto
- [ ] Auto-review realizado
- [ ] Documentación actualizada
- [ ] No hay errores de lint
- [ ] Tests agregados/actualizados
```

### 2. Review Process

#### Antes del Review
- Verificar que no hay conflictos
- Asegurar que todos los tests pasan
- Validar que lint/format están correctos
- Revisar tu propio código

#### Durante el Review
- Responder constructivamente a comentarios
- Hacer cambios solicitados en commits separados
- Mantener discusión profesional y respetuosa

### 3. Merge Requirements
- ✅ Aprobación de al menos 1 maintainer
- ✅ Todos los tests CI/CD pasan
- ✅ Sin conflictos con rama main
- ✅ Documentación actualizada
- ✅ Cobertura de tests mantenida

## 🐛 Reportar Bugs

### Información Requerida
```markdown
## 🐛 Descripción del Bug
Descripción clara y concisa del problema.

## 🔄 Pasos para Reproducir
1. Ir a '...'
2. Hacer clic en '...'
3. Scroll down to '...'
4. Ver error

## ✅ Comportamiento Esperado
Descripción de lo que debería pasar.

## 📱 Capturas/Videos
Si aplica, agregar capturas o videos del problema.

## 🖥️ Ambiente
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]

## 📋 Información Adicional
Cualquier contexto adicional sobre el problema.
```

## 🚀 Solicitar Features

### Template de Feature Request
```markdown
## 🚀 Feature Request

### ❓ ¿El feature está relacionado con un problema?
Descripción clara del problema: "Estoy frustrado cuando [...]"

### 💡 Describe la solución que te gustaría
Descripción clara y concisa de lo que quieres que pase.

### 🔄 Describe alternativas consideradas
Descripción de soluciones alternativas o features que consideraste.

### 📋 Contexto Adicional
Agregar cualquier otro contexto o capturas sobre el feature request.

### 🎯 Criterios de Aceptación
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3
```

## 📋 Estándares de Calidad

### Code Quality Gates
- **Cobertura de Tests**: Mínimo 80%
- **Linting**: 0 errores, warnings mínimos
- **Performance**: No degradación significativa
- **Seguridad**: Pasar análisis de seguridad
- **Accesibilidad**: Cumplir WCAG 2.1 AA

### Definition of Done
- [ ] Código implementado y testeado
- [ ] Documentación actualizada
- [ ] Tests automatizados incluidos
- [ ] Review de código completado
- [ ] CI/CD pasa exitosamente
- [ ] Feature funciona en entorno de staging

## 🏷️ Labels en Issues/PRs

### Por Tipo
- `bug` - Errores y problemas
- `enhancement` - Nuevas features
- `documentation` - Mejoras de documentación
- `question` - Preguntas de la comunidad
- `help-wanted` - Busca contribuidores
- `good-first-issue` - Ideal para principiantes

### Por Prioridad
- `priority:high` - Crítico, resolver ASAP
- `priority:medium` - Importante, próximo sprint
- `priority:low` - Nice to have

### Por Área
- `area:backend` - Backend/API
- `area:frontend` - React/UI
- `area:database` - Base de datos
- `area:testing` - Testing/QA
- `area:devops` - Docker/CI/CD

## 🌟 Reconocimientos

### Contribuidores Destacados
Los contribuidores serán reconocidos en:
- README del proyecto
- Release notes
- Hall of Fame (si aplicable)

### Niveles de Contribución
- **Bronze**: 1-5 PRs merged
- **Silver**: 6-15 PRs merged
- **Gold**: 16+ PRs merged
- **Maintainer**: Contribuidor regular con permisos especiales

## 📞 Contacto y Soporte

### Canales de Comunicación
- **GitHub Issues**: Para bugs y feature requests
- **GitHub Discussions**: Para preguntas generales
- **Email**: soporte@vehicleinspection.com (para temas privados)

### Horarios de Respuesta
- **Issues críticos**: 24-48 horas
- **PRs**: 2-5 días laborales
- **Preguntas generales**: 1 semana

---

¡Gracias por contribuir al Sistema de Inspección Vehicular! Tu ayuda hace que este proyecto sea mejor para toda la comunidad. 🚗💙