from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import invoices

app = FastAPI(
    title="Agent księgowy API",
    description="Backend do przetwarzania faktur (upload, później OCR i Bielik).",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(invoices.router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
