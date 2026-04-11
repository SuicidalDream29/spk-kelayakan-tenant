from fastapi import FastAPI
from .database import Base, engine
from .routers import kriteria, tenants, topsis, laporan                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                  
Base.metadata.create_all(bind=engine)                                                                                                                                                                                                                                                                             
                                                                                                                                                                                                                                                                                                                  
app = FastAPI(  
    title="SPK Kelayakan Tenant",
    description="Sistem Pendukung Keputusan menggunakan metode TOPSIS",                                                                                                                                                                                                                                           
    version="1.0.0"                                                                                                                                                                                                                                                                                               
)                                                                                                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                                                                                                  
app.include_router(kriteria.router, prefix="/kriteria", tags=["Kriteria"])
app.include_router(tenants.router, prefix="/tenants", tags=["Tenant"])
app.include_router(topsis.router, prefix="/topsis", tags=["TOPSIS"])                                                                                                                                                                                                                                              
app.include_router(laporan.router, prefix="/laporan", tags=["Laporan"])
                                                                                                                                                                                                                                                                                                                  
@app.get("/", tags=["Health"])
def root():                                                                                                                                                                                                                                                                                                       
    return {"status": "ok", "app": "SPK Kelayakan Tenant"}
