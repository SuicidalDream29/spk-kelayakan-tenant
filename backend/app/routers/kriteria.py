from fastapi import APIRouter, Depends, HTTPException                                                                                                                                                                                                                                                             
from sqlalchemy.orm import Session
from ..deps import get_db                                                                                                                                                                                                                                                                                         
from .. import models, schemas
                                                                                                                                                                                                                                                                                                                  
router = APIRouter()
                                                                                                                                                                                                                                                                                                                  
@router.get("/", response_model=list[schemas.KriteriaOut])
def list_kriteria(db: Session = Depends(get_db)):
    return db.query(models.Kriteria).all()
                                                                                                                                                                                                                                                                                                                  
@router.post("/", response_model=schemas.KriteriaOut, status_code=201)
def create_kriteria(payload: schemas.KriteriaCreate, db: Session = Depends(get_db)):                                                                                                                                                                                                                              
    kriteria = models.Kriteria(**payload.model_dump())
    db.add(kriteria)                                                                                                                                                                                                                                                                                              
    db.commit()
    db.refresh(kriteria)                                                                                                                                                                                                                                                                                          
    return kriteria
@router.put("/{id}", response_model=schemas.KriteriaOut)                                                                                                                                                                                                                                                          
def update_kriteria(id: int, payload: schemas.KriteriaUpdate, db: Session = Depends(get_db)):
    kriteria = db.query(models.Kriteria).filter(models.Kriteria.id == id).first()                                                                                                                                                                                                                                 
    if not kriteria:                                                                                                                                                                                                                                                                                              
        raise HTTPException(404, "Kriteria tidak ditemukan")
    for k, v in payload.model_dump().items():                                                                                                                                                                                                                                                                     
        setattr(kriteria, k, v)
    db.commit()
    db.refresh(kriteria)                                                                                                                                                                                                                                                                                          
    return kriteria
                                                                                                                                                                                                                                                                                                                  
@router.delete("/{id}", status_code=204)
def delete_kriteria(id: int, db: Session = Depends(get_db)):
    kriteria = db.query(models.Kriteria).filter(models.Kriteria.id == id).first()
    if not kriteria:                                                                                                                                                                                                                                                                                              
        raise HTTPException(404, "Kriteria tidak ditemukan")
    db.delete(kriteria)                                                                                                                                                                                                                                                                                           
    db.commit() 
