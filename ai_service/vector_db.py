import os
import json
import math
import requests
import google.generativeai as genai

# Resolve paths relative to the data dir
JSON_DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "db_store"))
MEMORY_FILE = os.path.join(JSON_DB_DIR, "VectorMemory.json")

# Ensure fallback directory exists
os.makedirs(JSON_DB_DIR, exist_ok=True)

# Cosine similarity calculation
def cosine_similarity(vec_a, vec_b):
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = sum(a * a for a in vec_a)
    norm_b = sum(b * b for b in vec_b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (math.sqrt(norm_a) * math.sqrt(norm_b))

# Retrieve Gemini Embedding values
def get_embedding(text):
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return [math.sin(i) * 0.1 for i in range(768)]
        
    try:
        # Use python SDK if configured, else requests REST fallback
        try:
            genai.configure(api_key=api_key)
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            if 'embedding' in result and 'values' in result['embedding']:
                return result['embedding']['values']
            elif 'embedding' in result:
                return result['embedding']
        except Exception as sdk_err:
            # Fallback to direct HTTP request
            url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
            resp = requests.post(url, json={
                "model": "models/text-embedding-004",
                "content": {"parts": [{"text": text}]}
            }, timeout=8)
            resp.raise_for_status()
            data = resp.json()
            if "embedding" in data and "values" in data["embedding"]:
                return data["embedding"]["values"]
    except Exception as e:
        print(f"[VECTOR DB] Embed error: {e}")
        
    return [math.cos(i) * 0.1 for i in range(768)]

# Load all vectors from local json file
def _load_memories():
    if not os.path.exists(MEMORY_FILE):
        return []
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            content = f.read().strip()
            return json.loads(content) if content else []
    except Exception as e:
        print(f"[VECTOR DB] Load error: {e}")
        return []

# Write memories back to json file
def _write_memories(data):
    try:
        with open(MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[VECTOR DB] Save error: {e}")

# Save memory entry
def save_memory(id_key, text, metadata=None):
    if metadata is None:
        metadata = {}
    embedding = get_embedding(text)
    memories = _load_memories()
    
    # Remove existing exact match if any, then insert updated
    memories = [m for m in memories if not (m.get("id") == id_key and m.get("text") == text)]
    memories.append({
        "id": id_key,
        "text": text,
        "metadata": metadata,
        "embedding": embedding
    })
    _write_memories(memories)
    print(f"[VECTOR DB] Saved memory for ID: {id_key}")

# Query similar documents
def query_memory(query_text, limit=3, filter_id=None):
    query_vector = get_embedding(query_text)
    memories = _load_memories()
    
    if not memories:
        return []
        
    results = []
    for mem in memories:
        if filter_id and mem.get("id") != filter_id:
            continue
        sim = cosine_similarity(query_vector, mem.get("embedding"))
        results.append({
            "id": mem.get("id"),
            "text": mem.get("text"),
            "metadata": mem.get("metadata"),
            "similarity": sim
        })
        
    # Sort descending
    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results[:limit]
