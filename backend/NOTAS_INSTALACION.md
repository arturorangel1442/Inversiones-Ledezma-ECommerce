# Notas de Instalación - Solución de Compatibilidad

## Problema de Compatibilidad con Python 3.14

Si estás experimentando errores de importación con SQLAlchemy en Python 3.14, es posible que necesites:

### Opción 1: Usar Python 3.11 o 3.12 (Recomendado)

Python 3.14 es muy nuevo y algunas bibliotecas aún no están completamente compatibles. Se recomienda usar Python 3.11 o 3.12:

1. Descarga Python 3.12 desde https://www.python.org/downloads/
2. Instala Python 3.12
3. Crea un nuevo entorno virtual con Python 3.12:
   ```bash
   python3.12 -m venv venv
   # O en Windows:
   py -3.12 -m venv venv
   ```
4. Activa el entorno virtual e instala las dependencias

### Opción 2: Actualizar SQLAlchemy a la versión más reciente

Si debes usar Python 3.14, intenta actualizar SQLAlchemy:

```bash
pip install --upgrade SQLAlchemy>=2.0.36
pip install --upgrade Flask-SQLAlchemy
```

### Opción 3: Verificar que las dependencias estén instaladas correctamente

Si el problema persiste, reinstala todas las dependencias:

```bash
pip uninstall Flask Flask-SQLAlchemy SQLAlchemy Flask-CORS -y
pip install -r requirements.txt
```

## Verificación

Para verificar que todo funciona correctamente:

```bash
python -c "from flask import Flask; from flask_sqlalchemy import SQLAlchemy; print('✓ Importaciones exitosas')"
```

Si este comando funciona, entonces puedes ejecutar `python app.py` sin problemas.


