from pydantic import BaseModel, field_validator
from datetime import datetime
from app.models import JenisKriteria
                                                                                                                                                                                                                                                                                                                  
# ── Kriteria ──────────────────────────────────────                                                                                                                                                                                                                                                              
class KriteriaBase(BaseModel):                                                                                                                                                                                                                                                                                    
    nama: str                                                                                                                                                                                                                                                                                                     
    bobot: float
    jenis: JenisKriteria
    @field_validator("bobot")                                                                                                                                                                                                                                                                                     
    @classmethod
    def bobot_valid(cls, v):                                                                                                                                                                                                                                                                                      
        if not 0 < v <= 1:
            raise ValueError("Bobot harus antara 0 dan 1")
        return v                                                                                                                                                                                                                                                                                                  
 
class KriteriaCreate(KriteriaBase):
    pass                                                                                                                                                                                                                                                                          
class KriteriaUpdate(KriteriaBase):
    pass
class KriteriaOut(KriteriaBase):                                                                                                                                                                                                                                                                                  
    id: int
    model_config = {"from_attributes": True}                                                                                                                                                                                                                                                                      
                
# ── Tenant ────────────────────────────────────────
class TenantBase(BaseModel):
    nama: str
    nik: str                                                                                                                                                                                                                                                                                                      
    no_telp: str
    alamat: str                                                                                                                                                                                                                                                                                                   
                
class TenantCreate(TenantBase):
    pass
class TenantUpdate(TenantBase):
    pass
class TenantOut(TenantBase):
    id: int
    model_config = {"from_attributes": True}                                                                                                                                                                                                                                                                      
 
# ── Nilai Tenant ──────────────────────────────────                                                                                                                                                                                                                                                              
class NilaiInput(BaseModel):
    kriteria_id: int
    nilai: float
class TenantNilaiCreate(BaseModel):                                                                                                                                                                                                                                                                               
    nilai: list[NilaiInput]
                                                                                                                                                                                                                                                                                                                  
# ── Hasil TOPSIS ──────────────────────────────────                                                                                                                                                                                                                                                              
class HasilTopsisOut(BaseModel):
    ranking          : int                                                                                                                                                                                                                                                                                        
    tenant           : TenantOut
    nilai_preferensi : float                                                                                                                                                                                                                                                                                      
    status           : str
    dihitung_at      : datetime                                                                                                                                                                                                                                                                                   
    model_config = {"from_attributes": True}
