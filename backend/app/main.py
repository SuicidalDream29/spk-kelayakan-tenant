from fastapi import FastAPI, Depends
from .routers import kriteria, tenants, topsis, laporan, auth
from .deps import get_current_user

app = FastAPI(
    title="SPK Kelayakan Tenant",
    description="Sistem Pendukung Keputusan menggunakan metode TOPSIS",
    version="1.0.0"
)

# Public
app.include_router(auth.router, prefix="/auth", tags=["Auth"])

# Protected — semua butuh JWT
protected = {"dependencies": [Depends(get_current_user)]}
app.include_router(kriteria.router, prefix="/kriteria", tags=["Kriteria"], **protected)
app.include_router(tenants.router,  prefix="/tenants",  tags=["Tenant"],   **protected)
app.include_router(topsis.router,   prefix="/topsis",   tags=["TOPSIS"],   **protected)
app.include_router(laporan.router,  prefix="/laporan",  tags=["Laporan"],  **protected)

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": "SPK Kelayakan Tenant"}
