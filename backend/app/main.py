from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import clips, files

app = FastAPI(title="Social Video Clipper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(clips.router)
app.include_router(files.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "api"}
