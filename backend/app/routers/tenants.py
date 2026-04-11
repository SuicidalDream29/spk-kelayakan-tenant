from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..deps import get_db                                                                                                                                                                                                                                                                                         
from .. import models, schemas
                                                                                                                                                                                                                                                                                                                  
router = APIRouter()
@router.get("/", response_model=list[schemas.TenantOut])
def list_tenants(db: Session = Depends(get_db)):
    return db.query(models.Tenant).all()                                                                                                                                                                                                                                                                          
 
@router.post("/", response_model=schemas.TenantOut, status_code=201)                                                                                                                                                                                                                                              
def create_tenant(payload: schemas.TenantCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Tenant).filter(models.Tenant.nik == payload.nik).first()                                                                                                                                                                                                                           
    if existing:
        raise HTTPException(400, "NIK sudah terdaftar")                                                                                                                                                                                                                                                           
    tenant = models.Tenant(**payload.model_dump())                                                                                                                                                                                                                                                                
    db.add(tenant)
    db.commit()                                                                                                                                                                                                                                                                                                   
    db.refresh(tenant)
    return tenant
@router.get("/{id}", response_model=schemas.TenantOut)                                                                                                                                                                                                                                                            
def get_tenant(id: int, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == id).first()                                                                                                                                                                                                                                       
    if not tenant:
        raise HTTPException(404, "Tenant tidak ditemukan")
    return tenant                                                                                                                                                                                                                                                                                                 
 
@router.put("/{id}", response_model=schemas.TenantOut)                                                                                                                                                                                                                                                            
def update_tenant(id: int, payload: schemas.TenantUpdate, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == id).first()                                                                                                                                                                                                                                       
    if not tenant:
        raise HTTPException(404, "Tenant tidak ditemukan")                                                                                                                                                                                                                                                        
    for k, v in payload.model_dump().items():
        setattr(tenant, k, v)                                                                                                                                                                                                                                                                                     
    db.commit()
    db.refresh(tenant)                                                                                                                                                                                                                                                                                            
    return tenant
@router.delete("/{id}", status_code=204)
def delete_tenant(id: int, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == id).first()                                                                                                                                                                                                                                       
    if not tenant:
        raise HTTPException(404, "Tenant tidak ditemukan")                                                                                                                                                                                                                                                        
    db.delete(tenant)
    db.commit()
                                                                                                                                                                                                                                                                                                                  
@router.post("/{id}/nilai", status_code=201)
def input_nilai(id: int, payload: schemas.TenantNilaiCreate, db: Session = Depends(get_db)):                                                                                                                                                                                                                      
    tenant = db.query(models.Tenant).filter(models.Tenant.id == id).first()
    if not tenant:                                                                                                                                                                                                                                                                                                
        raise HTTPException(404, "Tenant tidak ditemukan")
    # hapus nilai lama kalau ada                                                                                                                                                                                                                                                                                  
    db.query(models.NilaiTenant).filter(models.NilaiTenant.tenant_id == id).delete()                                                                                                                                                                                                                              
    for item in payload.nilai:
        kriteria = db.query(models.Kriteria).filter(models.Kriteria.id == item.kriteria_id).first()                                                                                                                                                                                                               
        if not kriteria:                                                                                                                                                                                                                                                                                          
            raise HTTPException(404, f"Kriteria id {item.kriteria_id} tidak ditemukan")
        db.add(models.NilaiTenant(tenant_id=id, kriteria_id=item.kriteria_id, nilai=item.nilai))                                                                                                                                                                                                                  
    db.commit() 
    return {"message": "Nilai berhasil disimpan"}                                                                                                                                                                                                                                                                 
