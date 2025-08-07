import importlib, sys
# Provide an alias so that existing code importing "FastAPI_app" (camel-case)
# continues to work regardless of file-system case sensitivity.
sys.modules.setdefault("FastAPI_app", importlib.import_module(__name__))
# Ensure absolute import "db" resolves to fastapi_app.db for legacy code
from . import db as _db
sys.modules.setdefault("db", _db)
