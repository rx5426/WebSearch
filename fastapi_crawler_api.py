"""
FastAPI + Uvicorn Edition: Web Crawler Search API & MCP Server
Interactive Swagger UI automatically hosted at /docs
No Authentication Required.
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import time
import json
import urllib.parse
from crawler_search_api import crawler, search_engine, weather_time, handle_mcp_request

app = FastAPI(
    title="CrawlerSearch & MCP API",
    version="1.0.0",
    description="Production-grade Web Crawler, Search Engine, Real-time Weather, and Time API. No Auth Needed. Interactive Swagger UI at /docs."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str = Field(..., example="toyota vios 2026")
    num: Optional[int] = Field(5, ge=1, le=15, example=5)
    crawlMetadata: Optional[bool] = Field(True, example=True)

class CrawlRequest(BaseModel):
    url: str = Field(..., example="https://developer.mozilla.org/en-US/docs/Web/API")

class JsonRpcRequest(BaseModel):
    jsonrpc: str = Field("2.0", example="2.0")
    id: Optional[Any] = 1
    method: str = Field(..., example="tools/list")
    params: Optional[Dict[str, Any]] = None

@app.post("/api/search", summary="Search Google / Web and extract page metadata")
def search_api(payload: SearchRequest):
    return search_engine.search(payload.query, num_results=payload.num, crawl_metadata=payload.crawlMetadata)

@app.post("/api/crawl", summary="Crawl single URL for OpenGraph and Schema.org metadata")
def crawl_api(payload: CrawlRequest):
    try:
        return crawler.crawl_url(payload.url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.get("/api/weather", summary="Get real-time weather and 5-day forecast")
def get_weather(location: str = Query("Tokyo", description="City name")):
    try:
        return weather_time.get_weather(location)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/time", summary="Get live timezone-aware time and date")
def get_time(location: str = Query("London", description="City or timezone")):
    try:
        return weather_time.get_time(location)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status", summary="Get crawler health and rate-limiter stats")
def get_status():
    return {
        "status": "online",
        "requests": crawler.total_requests,
        "throttled": crawler.total_throttled,
        "retried": crawler.total_retried
    }

@app.post("/mcp", summary="Model Context Protocol (MCP) JSON-RPC 2.0 endpoint")
def mcp_api(rpc: JsonRpcRequest):
    return handle_mcp_request(rpc.model_dump())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
