from celery_worker import celery_app
from app.database import SessionLocal
from app.topsis_engine import hitung_topsis                                                                                                                                                                                                                                                                       
from app import models
import os                                                                                                                                                                                                                                                                                                         
                                                                                                                                                                                                                                                                                                                  
@celery_app.task(name="tasks.hitung_topsis")
def task_hitung_topsis():                                                                                                                                                                                                                                                                                         
    db = SessionLocal()
    try:
        threshold = float(os.getenv("THRESHOLD_LAYAK", 0.5))
        results   = hitung_topsis(db, threshold)                                                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                  
        # hapus hasil lama                                                                                                                                                                                                                                                                                        
        db.query(models.HasilTopsis).delete()                                                                                                                                                                                                                                                                     
                
        for r in results:                                                                                                                                                                                                                                                                                         
            db.add(models.HasilTopsis(
                tenant_id        = r["tenant"].id,                                                                                                                                                                                                                                                                
                nilai_preferensi = r["nilai_preferensi"],
                ranking          = r["ranking"],
                status           = r["status"],                                                                                                                                                                                                                                                                   
            ))
        db.commit()                                                                                                                                                                                                                                                                                               
        return {"status": "success", "total": len(results)}
    except Exception as e:                                                                                                                                                                                                                                                                                        
        db.rollback()
        raise e                                                                                                                                                                                                                                                                                                   
    finally:    
        db.close()
