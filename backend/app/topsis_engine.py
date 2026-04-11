import numpy as np                                                                                                                                                                                                                                                                                                
from sqlalchemy.orm import Session                                                                                                                                                                                                                                                                                
from . import models
                                                                                                                                                                                                                                                                                                                  
def hitung_topsis(db: Session, threshold: float = 0.5) -> list[dict]:
    kriteria_list = db.query(models.Kriteria).all()                                                                                                                                                                                                                                                               
    tenant_list   = db.query(models.Tenant).all()                                                                                                                                                                                                                                                                 
 
    if len(kriteria_list) < 2:                                                                                                                                                                                                                                                                                    
        raise ValueError("Minimal 2 kriteria diperlukan")
    if len(tenant_list) < 2:                                                                                                                                                                                                                                                                                      
        raise ValueError("Minimal 2 tenant diperlukan")
                                                                                                                                                                                                                                                                                                                  
    k_ids  = [k.id for k in kriteria_list]
    bobot  = np.array([k.bobot for k in kriteria_list], dtype=float)                                                                                                                                                                                                                                              
    jenis  = [k.jenis for k in kriteria_list]                                                                                                                                                                                                                                                                     
 
    # ── Bangun matriks keputusan ──────────────────                                                                                                                                                                                                                                                              
    matrix = [] 
    valid_tenants = []                                                                                                                                                                                                                                                                                            
                
    for tenant in tenant_list:                                                                                                                                                                                                                                                                                    
        nilai_map = {
            n.kriteria_id: n.nilai                                                                                                                                                                                                                                                                                
            for n in db.query(models.NilaiTenant)
                       .filter(models.NilaiTenant.tenant_id == tenant.id).all()                                                                                                                                                                                                                                   
        }
        # skip tenant yang belum lengkap input nilainya                                                                                                                                                                                                                                                           
        if not all(kid in nilai_map for kid in k_ids):                                                                                                                                                                                                                                                            
            continue                                                                                                                                                                                                                                                                                              
        matrix.append([nilai_map[kid] for kid in k_ids])                                                                                                                                                                                                                                                          
        valid_tenants.append(tenant)                                                                                                                                                                                                                                                                              
                
    if len(valid_tenants) < 2:                                                                                                                                                                                                                                                                                    
        raise ValueError("Minimal 2 tenant dengan nilai lengkap diperlukan")
                                                                                                                                                                                                                                                                                                                  
    X = np.array(matrix, dtype=float)                                                                                                                                                                                                                                                                             
 
    # ── Step 1: Normalisasi ───────────────────────                                                                                                                                                                                                                                                              
    norm = np.sqrt((X ** 2).sum(axis=0))
    R = X / norm                                                                                                                                                                                                                                                                                                  
 
    # ── Step 2: Normalisasi Terbobot ──────────────                                                                                                                                                                                                                                                              
    Y = R * bobot
                                                                                                                                                                                                                                                                                                                  
    # ── Step 3: Solusi Ideal ──────────────────────                                                                                                                                                                                                                                                              
    A_plus  = np.where([j == "benefit" for j in jenis], Y.max(axis=0), Y.min(axis=0))
    A_minus = np.where([j == "benefit" for j in jenis], Y.min(axis=0), Y.max(axis=0))                                                                                                                                                                                                                             
                
    # ── Step 4: Jarak ─────────────────────────────                                                                                                                                                                                                                                                              
    D_plus  = np.sqrt(((Y - A_plus)  ** 2).sum(axis=1))
    D_minus = np.sqrt(((Y - A_minus) ** 2).sum(axis=1))                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                                                                                  
    # ── Step 5: Nilai Preferensi ──────────────────                                                                                                                                                                                                                                                              
    V = D_minus / (D_plus + D_minus)                                                                                                                                                                                                                                                                              
                                                                                                                                                                                                                                                                                                                  
    # ── Step 6: Ranking ───────────────────────────
    ranking_idx = np.argsort(V)[::-1]                                                                                                                                                                                                                                                                             
                                                                                                                                                                                                                                                                                                                  
    results = []
    for rank, idx in enumerate(ranking_idx, start=1):                                                                                                                                                                                                                                                             
        results.append({
            "tenant"           : valid_tenants[idx],
            "nilai_preferensi" : float(round(V[idx], 6)),                                                                                                                                                                                                                                                         
            "ranking"          : rank,
            "status"           : "LAYAK" if V[idx] >= threshold else "TIDAK LAYAK",                                                                                                                                                                                                                               
        })                                                                                                                                                                                                                                                                                                        

    return results

