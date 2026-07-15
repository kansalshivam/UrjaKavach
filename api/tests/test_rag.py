import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.anyio
async def test_rag_documents_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/rag/documents")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    assert data[0]["id"] == "SYNTH-MODEL-ISPRL-CAPACITY"
    assert "ISPRL" in data[0]["summary"]

@pytest.mark.anyio
async def test_rag_document_detail():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/rag/documents/SYNTH-MODEL-ISPRL-CAPACITY")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "SYNTH-MODEL-ISPRL-CAPACITY"
    assert "Visakhapatnam" in data["content"]

@pytest.mark.anyio
async def test_rag_query_engine():
    payload = {
        "query": "What is the capacity of the underground rock caverns managed by ISPRL?"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/rag/query", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "retrieved_documents" in data
    assert "SYNTH-MODEL-ISPRL-CAPACITY" in data["retrieved_documents"]
    # Check that it cites the retrieved doc
    assert "SYNTH-MODEL-ISPRL-CAPACITY" in data["answer"]
