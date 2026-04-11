from celery import Celery                                                                                                                                                                                                                                                                                         
import os                                                                                                                                                                                                                                                                                                         
                                                                                                                                                                                                                                                                                                                  
celery_app = Celery(                                                                                                                                                                                                                                                                                              
    "spk_worker",
    broker=os.getenv("REDIS_URL", "redis://redis:6379/0"),                                                                                                                                                                                                                                                        
    backend=os.getenv("REDIS_URL", "redis://redis:6379/0"),
    include=["app.tasks.topsis_task"]                                                                                                                                                                                                                                                                             
)
                                                                                                                                                                                                                                                                                                                  
celery_app.conf.update(
    task_serializer    = "json",
    result_serializer  = "json",
    accept_content     = ["json"],                                                                                                                                                                                                                                                                                
    timezone           = "Asia/Jakarta",
    enable_utc         = True,                                                                                                                                                                                                                                                                                    
)               
