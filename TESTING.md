# Sistema de Inspección Vehicular - Tests

Este proyecto incluye una suite completa de tests para garantizar la calidad y funcionalidad del sistema.

## Estructura de Tests

```
├── backend/
│   ├── tests/
│   │   ├── unit/          # Tests unitarios
│   │   ├── integration/   # Tests de integración
│   │   └── conftest.py    # Configuración compartida
│   └── pytest.ini        # Configuración pytest
├── frontend/
│   ├── src/__tests__/     # Tests de componentes React
│   ├── jest.config.json   # Configuración Jest
│   └── setupTests.ts      # Setup de testing
└── e2e/
    ├── cypress/
    │   ├── e2e/          # Tests end-to-end
    │   └── fixtures/     # Datos de prueba
    └── cypress.config.ts  # Configuración Cypress

```

## Backend Tests (Python/Flask)

### Herramientas
- **pytest**: Framework de testing
- **pytest-cov**: Cobertura de código
- **pytest-mock**: Mocking
- **requests-mock**: Mock de HTTP requests

### Ejecución
```bash
cd backend

# Ejecutar todos los tests
pytest

# Con cobertura
pytest --cov=app --cov-report=term-missing

# Solo tests unitarios
pytest tests/unit/

# Solo tests de integración
pytest tests/integration/

# Tests específicos
pytest tests/unit/test_vehicle_model.py -v
```

### Cobertura
- Target: 80% de cobertura mínima
- Reportes en terminal y HTML
- Exclusiones configuradas para archivos no críticos

## Frontend Tests (React/TypeScript)

### Herramientas
- **Jest**: Framework de testing
- **React Testing Library**: Testing de componentes React
- **@testing-library/user-event**: Simulación de eventos de usuario

### Ejecución
```bash
cd frontend

# Ejecutar tests
npm test

# Con cobertura
npm run test:coverage

# Modo watch
npm run test:watch

# Para CI/CD
npm run test:ci
```

### Tipos de Tests
- **Componentes**: Renderizado, props, eventos
- **Páginas**: Funcionalidad completa
- **Integración**: Flujos de usuario
- **Hooks**: Lógica personalizada (si aplica)

## End-to-End Tests (Cypress)

### Herramientas
- **Cypress**: Framework E2E moderno
- **@cypress/code-coverage**: Cobertura E2E

### Ejecución
```bash
cd e2e

# Instalar dependencias
npm install

# Ejecutar tests (headless)
npm run cypress:run

# Abrir interfaz interactiva
npm run cypress:open

# Tests específicos
npm run cypress:run -- --spec "cypress/e2e/dashboard.cy.ts"
```

### Flujos Cubiertos
- **Dashboard**: Estadísticas, filtros, navegación
- **Vehículos**: CRUD completo, búsqueda, paginación
- **Inspecciones**: Creación, edición, completado
- **Reportes**: Generación, exportación
- **Responsividad**: Mobile, tablet, desktop

## Scripts de Automatización

### Instalación Completa
```bash
# Windows
install-dependencies.bat

# Instala todas las dependencias del proyecto
```

### Ejecución de Todos los Tests
```bash
# Windows
run-all-tests.bat

# Ejecuta backend, frontend y e2e en secuencia
```

## Configuración de CI/CD

### GitHub Actions (Ejemplo)
```yaml
name: Tests
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: pip install -r backend/requirements.txt
      - run: cd backend && pytest --cov=app

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test:ci

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd e2e && npm ci
      - run: cd e2e && npm run cypress:run
```

## Datos de Prueba

### Fixtures
- `dashboard-stats.json`: Estadísticas del dashboard
- `vehicles-list.json`: Lista de vehículos
- `vehicle-details.json`: Detalles de vehículo específico
- `inspections-list.json`: Lista de inspecciones

### Mocks
- APIs externas
- Servicios de base de datos
- Autenticación
- Notificaciones

## Buenas Prácticas

### Organización
- Un archivo de test por componente/módulo
- Nombres descriptivos para tests
- Agrupación lógica con `describe`
- Setup/teardown apropiados

### Cobertura
- Mínimo 80% de líneas cubiertas
- Tests de casos felices y edge cases
- Validación de errores
- Tests de integración críticos

### Mantenimiento
- Tests como documentación viva
- Refactoring de tests junto al código
- Eliminación de tests obsoletos
- Actualización de mocks y fixtures

## Troubleshooting

### Errores Comunes
1. **Dependencias**: Verificar instalación correcta
2. **Puertos**: Backend en 5000, frontend en 3000
3. **Base de datos**: Usar SQLite para tests
4. **Timeouts**: Ajustar en configuraciones
5. **Mocks**: Verificar URLs y respuestas

### Debug
```bash
# Backend con logs detallados
pytest -v -s

# Frontend con debug
npm test -- --verbose

# Cypress con video
cypress run --record
```

## Métricas de Calidad

### Objetivos
- **Cobertura Backend**: >80%
- **Cobertura Frontend**: >70%
- **Tests E2E**: Flujos críticos cubiertos
- **Tiempo de ejecución**: <5min total
- **Estabilidad**: >95% success rate