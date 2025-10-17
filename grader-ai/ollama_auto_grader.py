from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import json
import re
import time
from typing import Optional
import torch
from sentence_transformers import SentenceTransformer, util

# === Konfigurasi ===
OLLAMA_URL = "http://localhost:11434/api/generate"
USE_LONG_PROMPT = True
# DEFAULT_MODEL = "mistral:7b-instruct"
# DEFAULT_MODEL = "llama3.2:3b"
# DEFAULT_MODEL = "llama3.2:1b"
# DEFAULT_MODEL = "phi3:mini"
# DEFAULT_MODEL = "llama3:8b"
# DEFAULT_MODEL = "qwen2.5:7b-instruct"
DEFAULT_MODEL = "qwen2.5:3b-instruct"
# DEFAULT_MODEL = "gemma:7b"

# Path lokal model MiniLM
EMBEDDING_MODEL_PATH = "/home/mbsaloka/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/c9745ed1d9f207416be6d2e6f8de32d1f16199bf"
DEVICE_MODE = "cuda" if torch.cuda.is_available() else "cpu"

# === Inisialisasi Aplikasi ===
app = FastAPI(title="Ollama Hybrid Auto-Grader", version="0.3")

# === Schema Request ===
class GradeRequest(BaseModel):
    answer_key: str
    student_answer: str
    model: Optional[str] = DEFAULT_MODEL


# === 1️⃣ Prompt Rubric-based ===
def build_prompt(answer_key: str, student_answer: str) -> str:
    short_prompt = f"""
Anda adalah sistem penilai jawaban esai berdasarkan rubrik berikut.

Rubrik:
1. Pemahaman Konsep (0–100)
2. Kelengkapan Jawaban (0–100)
3. Kejelasan Bahasa (0–100)
4. Analisis/Argumen (0–100)

Kunci Jawaban:
{answer_key}

Jawaban Mahasiswa:
{student_answer}

### PETUNJUK OUTPUT
- Keluarkan **hanya satu blok JSON valid**, mulai dengan `{{` dan diakhiri dengan `}}`.
- Semua nilai numerik berupa desimal dengan satu angka di belakang koma, misal 87.5.
- Wajib menyertakan kunci: "pemahaman", "kelengkapan", "kejelasan", "analisis", "rata_rata", "feedback".
- "rata_rata" = (pemahaman + kelengkapan + kejelasan + analisis)/4
- "feedback" = 1–2 kalimat, sebutkan **1 kekuatan dan 1 kelemahan spesifik** dibanding kunci jawaban. Jangan menyalin jawaban mahasiswa.

Contoh output:
{{
  "pemahaman": 92.5,
  "kelengkapan": 90.0,
  "kejelasan": 95.0,
  "analisis": 88.5,
  "rata_rata": 91.5,
  "feedback": "Jawaban sangat jelas dan lengkap, namun analisis mekanisme masih kurang mendetail."
}}
"""

    long_prompt = f"""
PENTING:
Keluarkan HANYA satu blok JSON valid seperti contoh.
Jangan tambahkan teks, komentar, atau penjelasan di luar JSON.
Output harus dimulai dengan '{{' dan diakhiri dengan '}}'.

Anda adalah sistem penilai jawaban esai berdasarkan rubrik yang ketat dan konsisten.
Tugas Anda adalah menilai jawaban mahasiswa berdasarkan kunci jawaban dan rubrik berikut.

Rubrik Penilaian:
1. Pemahaman Konsep (0–100): Seberapa benar ide utama disampaikan.
   - 90–100: Sangat benar, mencakup semua ide utama
   - 70–89: Sebagian benar, ide utama sebagian tertangkap
   - 50–69: Ada kesalahan konsep, sebagian ide penting hilang
   - <50: Salah atau keliru secara konsep

2. Kelengkapan Jawaban (0–100): Apakah semua poin penting disebutkan.
   - 90–100: Semua poin penting disebutkan
   - 70–89: Ada beberapa poin hilang
   - 50–69: Banyak poin hilang
   - <50: Hampir tidak ada poin penting

3. Kejelasan Bahasa (0–100): Struktur kalimat dan tata bahasa
   - 90–100: Sangat jelas, kalimat baik dan mudah dipahami
   - 70–89: Cukup jelas, ada beberapa kesalahan kecil
   - 50–69: Sulit dipahami, banyak kesalahan
   - <50: Tidak jelas, kalimat kacau

4. Analisis/Argumen (0–100): Logika dan kedalaman penjelasan
   - 90–100: Analisis sangat baik, argumen logis dan kuat
   - 70–89: Analisis cukup, beberapa argumen kurang kuat
   - 50–69: Analisis dangkal, argumen lemah
   - <50: Analisis salah atau tidak ada

Kunci Jawaban:
{answer_key}

Jawaban Mahasiswa:
{student_answer}

### PETUNJUK OUTPUT (WAJIB DIIKUTI)
- Keluarkan **hanya satu blok JSON valid**, tanpa teks tambahan di luar JSON.
- JSON harus **dimulai dengan '{{' dan diakhiri dengan '}}'**.
- Semua nilai numerik harus **format desimal** (contoh: 87.5).
- Wajib menyertakan **semua kunci berikut**:
  - "pemahaman"
  - "kelengkapan"
  - "kejelasan"
  - "analisis"
  - "rata_rata"
  - "feedback"
- Nilai **"rata_rata"** adalah rata-rata sederhana dari keempat skor di atas.
- Nilai **"feedback"** berupa ringkasan 1–2 kalimat yang menjelaskan
  kelebihan dan kekurangan jawaban mahasiswa.
- Feedback harus menyoroti aspek spesifik yang hilang, kurang lengkap, atau kurang jelas
  dibandingkan dengan kunci jawaban, tanpa menyalin jawaban mahasiswa secara langsung.
- Fokus feedback pada kualitas jawaban, misalnya pemahaman konsep, kelengkapan informasi,
  kejelasan bahasa, dan logika/analisis.

### CONTOH OUTPUT YANG BENAR:
{{
  "pemahaman": 92.5,
  "kelengkapan": 90.0,
  "kejelasan": 95.0,
  "analisis": 88.5,
  "rata_rata": 91.5,
  "feedback": "Jawaban mahasiswa sangat jelas dan lengkap, namun bisa menambahkan sedikit detail pada analisis mekanisme."
}}

Sekarang berikan **hanya JSON seperti di atas**, tanpa teks lain.
"""
    if USE_LONG_PROMPT:
        prompt = long_prompt
    else:
        prompt = short_prompt
    return prompt


# === 2️⃣ Panggil Ollama ===
def call_ollama(prompt: str, model: str = DEFAULT_MODEL, timeout: int = 90) -> dict:
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"max_tokens": 800, "temperature": 0.0}
    }

    try:
        start_time = time.time()
        resp = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
        end_time = time.time()
        llm_inference_time = round(end_time - start_time, 3)
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Gagal terhubung ke Ollama API di {OLLAMA_URL}: {e}")

    if resp.status_code != 200:
        raise RuntimeError(f"Ollama API error: {resp.status_code} - {resp.text}")

    try:
        return resp.json(), llm_inference_time
    except ValueError:
        return {"raw": resp.text}, llm_inference_time


# === 🔹 Parsing JSON Aman ===
def safe_json_parse(text: str):
    text = re.sub(r'```(?:json)?', '', text, flags=re.IGNORECASE)
    match = re.search(r'\{.*?\}', text, re.DOTALL)
    if not match:
        raise ValueError("Tidak ditemukan blok JSON dalam respons.")
    json_text = match.group(0).strip()
    json_text = re.sub(r',\s*}', '}', json_text)
    json_text = re.sub(r'“|”', '"', json_text)
    try:
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Gagal parsing JSON: {e}\nRaw JSON: {json_text[:500]}")


# === 🔹 Load Model Embedding Sekali Saja ===
print(f"\n🧠 Memuat model embedding MiniLM di {DEVICE_MODE}...")
try:
    start_load = time.time()
    EMBEDDING_MODEL = SentenceTransformer(EMBEDDING_MODEL_PATH, device=DEVICE_MODE)
    EMBEDDING_MODEL.encode("warmup", convert_to_tensor=True)
    load_time = round((time.time() - start_load), 2)
    print(f"✅ Model MiniLM siap digunakan (load time {load_time} detik)\n")
except Exception as e:
    print(f"❌ Gagal memuat model MiniLM: {e}")
    EMBEDDING_MODEL = None


# === 🔹 Hitung Similarity dengan MiniLM ===
def compute_embedding_similarity(student_answer: str, answer_key: str):
    if EMBEDDING_MODEL is None:
        raise RuntimeError("Model embedding belum siap.")
    start_time = time.time()
    emb_key = EMBEDDING_MODEL.encode(answer_key, convert_to_tensor=True, normalize_embeddings=True)
    emb_ans = EMBEDDING_MODEL.encode(student_answer, convert_to_tensor=True, normalize_embeddings=True)
    similarity = util.cos_sim(emb_key, emb_ans).item()
    duration = round((time.time() - start_time), 3)
    return round(similarity * 100, 2), duration


# === 🔹 Gabungkan Skor ===
def fuse_scores(llm_scores: dict, sim_score: float, weight_llm: float = 0.75):
    weights = {"pemahaman": 0.3, "kelengkapan": 0.3, "kejelasan": 0.2, "analisis": 0.2}
    llm_avg = sum(float(llm_scores.get(k, 0)) * w for k, w in weights.items())
    final = round(weight_llm * llm_avg + (1 - weight_llm) * sim_score, 2)
    return max(0, min(100, final))


# === 🔹 Endpoint /grade ===
@app.post("/grade")
def grade(req: GradeRequest):
    prompt = build_prompt(req.answer_key, req.student_answer)

    # 🔸 1. Panggil Ollama
    try:
        model_resp, llm_time = call_ollama(prompt, model=req.model)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    model_text = (
        model_resp.get("response")
        or model_resp.get("output")
        or model_resp.get("raw")
        or json.dumps(model_resp)
    )

    # 🔸 2. Parse JSON
    try:
        parsed = safe_json_parse(model_text)
    except Exception as e:
        raise HTTPException(status_code=502, detail={"message": "Model tidak mengembalikan JSON valid.", "raw": model_text})

    # 🔸 3. Hitung Similarity
    try:
        sim_value, sim_time = compute_embedding_similarity(req.student_answer, req.answer_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghitung similarity embedding: {e}")

    # 🔸 4. Hitung Skor Gabungan
    try:
        final_score = fuse_scores(parsed, sim_value)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghitung skor akhir: {e}")

    feedback = parsed.get("feedback", "").strip()

    # === 🔸 Logging Console ===
    print("\n" + "="*60)
    print("🧠 BENCHMARK INFERENCE RESULT")
    print("="*60)
    print(f"📊 Rata-rata Skor LLM       : {parsed.get('rata_rata', 'N/A')}")
    print(f"📊 Similarity (MiniLM)      : {sim_value}")
    print(f"⏱️  LLM Inference Time       : {llm_time} detik")
    print(f"⏱️  Embedding Similarity Time: {sim_time} detik")
    print(f"🏁 Skor Gabungan (Final)    : {final_score}")
    print("="*60 + "\n")

    return {
        "rubric_scores": {
            "pemahaman": parsed.get("pemahaman"),
            "kelengkapan": parsed.get("kelengkapan"),
            "kejelasan": parsed.get("kejelasan"),
            "analisis": parsed.get("analisis"),
            "rata_rata": parsed.get("rata_rata"),
        },
        "embedding_similarity": sim_value,
        "final_score": final_score,
        "feedback": feedback,
        "llm_time": llm_time,
        "similarity_time": sim_time
    }


# === 🔹 Warmup Model Ollama ===
@app.on_event("startup")
def warmup_models():
    print("\n🚀 Melakukan warm-up sistem Auto-Grader...")

    # 🔸 Warm-up Ollama
    try:
        print("🔹 Warm-up Ollama...")
        prompt = "Warm-up test: Jelaskan singkat apa itu sistem operasi dalam satu kalimat."
        start = time.time()
        call_ollama(prompt, model=DEFAULT_MODEL, timeout=120)
        print(f"✅ Ollama siap (waktu: {round(time.time() - start, 2)} detik)")
    except Exception as e:
        print(f"⚠️ Gagal warm-up Ollama: {e}")

    # 🔸 Warm-up Embedding Model
    try:
        print("🔹 Warm-up MiniLM embedding...")
        start = time.time()
        _ = EMBEDDING_MODEL.encode("warm-up MiniLM", convert_to_tensor=True, normalize_embeddings=True)
        print(f"✅ Embedding siap (waktu: {round(time.time() - start, 2)} detik)")
    except Exception as e:
        print(f"⚠️ Gagal warm-up embedding: {e}")

    print("🔥 Semua komponen siap digunakan!\n")


# === 🔹 Entry Point ===
if __name__ == "__main__":
    import uvicorn
    print("Starting Ollama Hybrid Auto-Grader on http://127.0.0.1:8000")
    uvicorn.run("ollama_auto_grader:app", host="0.0.0.0", port=8000, reload=False)
