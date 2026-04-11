from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone                                                                                                                                                                                                                                                                           
import enum
from .database import Base                                                                                                                                                                                                                                                                                        
                
class JenisKriteria(str, enum.Enum):                                                                                                                                                                                                                                                                              
    benefit = "benefit"
    cost = "cost"                                                                                                                                                                                                                                                                                                 
                
class Kriteria(Base):
    __tablename__ = "kriteria"
                                                                                                                                                                                                                                                                                                                  
    id       = Column(Integer, primary_key=True, index=True)
    nama     = Column(String(100), nullable=False)                                                                                                                                                                                                                                                                
    bobot    = Column(Float, nullable=False)
    jenis    = Column(Enum(JenisKriteria), nullable=False)                                                                                                                                                                                                                                                        
 
    nilai_tenant = relationship("NilaiTenant", back_populates="kriteria", cascade="all, delete")                                                                                                                                                                                                                  
                
class Tenant(Base):                                                                                                                                                                                                                                                                                               
    __tablename__ = "tenants"
                                                                                                                                                                                                                                                                                                                  
    id      = Column(Integer, primary_key=True, index=True)
    nama    = Column(String(100), nullable=False)                                                                                                                                                                                                                                                                 
    nik     = Column(String(16), unique=True, nullable=False)
    no_telp = Column(String(15), nullable=False)
    alamat  = Column(String(255), nullable=False)                                                                                                                                                                                                                                                                 
 
    nilai    = relationship("NilaiTenant", back_populates="tenant", cascade="all, delete")                                                                                                                                                                                                                        
    hasil    = relationship("HasilTopsis", back_populates="tenant", cascade="all, delete")
                                                                                                                                                                                                                                                                                                                  
class NilaiTenant(Base):
    __tablename__ = "nilai_tenant"                                                                                                                                                                                                                                                                                
                
    id          = Column(Integer, primary_key=True, index=True)                                                                                                                                                                                                                                                   
    tenant_id   = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    kriteria_id = Column(Integer, ForeignKey("kriteria.id"), nullable=False)                                                                                                                                                                                                                                      
    nilai       = Column(Float, nullable=False)
                                                                                                                                                                                                                                                                                                                  
    tenant   = relationship("Tenant", back_populates="nilai")
    kriteria = relationship("Kriteria", back_populates="nilai_tenant")                                                                                                                                                                                                                                            
                
class HasilTopsis(Base):
    __tablename__ = "hasil_topsis"
                                                                                                                                                                                                                                                                                                                  
    id               = Column(Integer, primary_key=True, index=True)
    tenant_id        = Column(Integer, ForeignKey("tenants.id"), nullable=False)                                                                                                                                                                                                                                  
    nilai_preferensi = Column(Float, nullable=False)
    ranking          = Column(Integer, nullable=False)                                                                                                                                                                                                                                                            
    status           = Column(String(15), nullable=False)
    dihitung_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                  
    tenant = relationship("Tenant", back_populates="hasil")
