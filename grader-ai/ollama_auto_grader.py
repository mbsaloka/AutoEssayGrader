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
USE_LONG_PROMPT = False
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
    question: str
    answer_key: str
    student_answer: str
    model: Optional[str] = DEFAULT_MODEL


# === 1️⃣ Prompt Rubric-based ===
def build_prompt(question: str, answer_key: str, student_answer: str) -> str:
    # handle blank answer
    if not student_answer or not student_answer.strip():
        student_answer = "(jawaban kosong)"

    short_prompt = f"""
Anda adalah sistem penilai jawaban esai otomatis.
Tugas Anda adalah menilai jawaban mahasiswa berdasarkan rubrik berikut secara objektif dan konsisten.

=== RUBRIK PENILAIAN (0–100) ===
1. Pemahaman Konsep — ketepatan dalam menangkap ide utama dari kunci jawaban.
2. Kelengkapan Jawaban — sejauh mana poin penting dari kunci jawaban disebutkan.
3. Kejelasan Bahasa — kejelasan struktur kalimat dan keterbacaan.
4. Analisis / Argumen — logika dan kedalaman penjelasan dalam mendukung jawaban.

=== DATA ===
Pertanyaan:
{question}

Kunci Jawaban Ideal:
{answer_key}

Jawaban Mahasiswa:
{student_answer}

=== PETUNJUK PENILAIAN RUBRIC ===
- Jangan ragu memberi nilai tinggi jika jawaban sesuai dengan kunci jawaban.
- Jangan ragu memberi nilai rendah jika jawaban tidak sesuai, salah konsep, atau tidak jelas.
- Gunakan kunci jawaban sebagai tolok ukur utama, bukan opini Anda sendiri.
- Pahami konteks dan poin penting dari kunci jawaban sebelum menilai.
- Berikan nilai rubrik berupa desimal dengan dua angka di belakang koma, misal 81.25.

=== PETUNJUK FEEDBACK ===
- Feedback ringkas 1-2 kalimat.
- Hindari kalimat generik seperti “jawaban sudah cukup baik” atau "jawaban kurang tepat" tanpa penjelasan.
- Berikan feedback yang spesifik dengan menyebutkan bagian jawaban mahasiswa yang kurang atau berbeda dari kunci jawaban.
- Jika jawaban sudah sangat baik, sebutkan bagian mana yang sudah tepat.
- Sertakan alasan singkat mengapa skor diberikan.
- Jelaskan apa yang salah dari jawaban mahasiswa dan poin apa yang benar.

=== FORMAT OUTPUT ===
Keluarkan hasil dalam format JSON berikut:
{{
  "pemahaman": float,
  "kelengkapan": float,
  "kejelasan": float,
  "analisis": float,
  "feedback": string
}}
"""
#     short_prompt = f"""
# Anda adalah sistem penilai jawaban esai berdasarkan rubrik berikut.

# Rubrik Penilaian Sederhana (0-100)
# 1. Pemahaman Konsep: Seberapa tepat mahasiswa memahami ide utama.
# 2. Kelengkapan Jawaban: Seberapa banyak poin penting dari kunci jawaban tercakup.
# 3. Kejelasan Bahasa: Seberapa mudah jawaban dibaca dan dipahami.
# 4. Analisis / Argumen: Seberapa logis dan mendalam penjelasan.

# Pertanyaan:
# {question}

# Kunci Jawaban:
# {answer_key}

# Jawaban Mahasiswa:
# {student_answer}

# ### PETUNJUK OUTPUT
# - Semua nilai numerik berupa desimal dengan dua angka di belakang koma, misal 84.25.
# - Jangan ragu memberi nilai rendah jika jawaban tidak sesuai kunci jawaban.
# - Jangan ragu memberi nilai tinggi jika jawaban sesuai dengan kunci jawaban.
# - Wajib menyertakan kunci: "pemahaman", "kelengkapan", "kejelasan", "analisis", "feedback".
# - "feedback" = 1-2 kalimat, sebutkan kelebihan atau kekurangan spesifik dibanding kunci jawaban. Jangan menyalin jawaban mahasiswa.

# Contoh output:
# {{
#    "pemahaman": float,
#    "kelengkapan": float,
#    "kejelasan": float,
#    "analisis": float,
#    "feedback": string
# }}
# """

    long_prompt = f"""
Anda adalah sistem penilai jawaban esai yang objektif dan konsisten, menilai berdasarkan rubrik yang ketat serta mencocokkan isi jawaban mahasiswa dengan kunci jawaban yang diberikan.

Rubrik Penilaian Sederhana (0-100)
1. Pemahaman Konsep: Seberapa tepat mahasiswa memahami ide utama.
90-100: Tepat dan lengkap
70-89: Cukup tepat, ada sedikit kesalahan
20-69: Banyak kekeliruan konsep
<20: Salah total

2. Kelengkapan Jawaban: Seberapa banyak poin penting dari kunci jawaban tercakup.
90-100: Semua poin penting ada
70-89: Sebagian besar poin ada
20-69: Banyak poin hilang
<20: Hampir tidak ada poin penting

3. Kejelasan Bahasa: Seberapa mudah jawaban dibaca dan dipahami.
90-100: Jelas dan rapi
70-89: Cukup jelas, ada kesalahan kecil
20-69: Kurang jelas
<20: Sulit dipahami

4. Analisis / Argumen: Seberapa logis dan mendalam penjelasan.
90-100: Logis dan mendalam
70-89: Cukup logis, agak dangkal
20-69: Lemah atau dangkal
<20: Tidak ada analisis

Pertanyaan:
{question}

Kunci Jawaban:
{answer_key}

Jawaban Mahasiswa:
{student_answer}

### PETUNJUK OUTPUT
- Keluarkan **hanya satu blok JSON valid**, mulai dengan `{{` dan diakhiri dengan `}}`.
- Jangan ragu memberi nilai rendah jika memang jawaban tidak sesuai kunci jawaban.
- Jangan ragu memberi nilai tinggi jika memang jawaban mendekati kunci jawaban.
- Semua nilai numerik berupa desimal dengan dua angka di belakang koma, misal 84.25.
- Wajib menyertakan kunci: "pemahaman", "kelengkapan", "kejelasan", "analisis", "feedback".
- "feedback" = 1–2 kalimat, sebutkan kelebihan atau kekurangan spesifik dibanding kunci jawaban. Jangan menyalin jawaban mahasiswa.

Contoh output:
{{
   "pemahaman": float,
   "kelengkapan": float,
   "kejelasan": float,
   "analisis": float,
   "feedback": string
}}
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
        "options": {"num_predict": 800, "temperature": 0.0}
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
def fuse_scores(llm_scores: dict, sim_score: float, weight_llm: float = 0.85):
    weights = {"pemahaman": 0.35, "kelengkapan": 0.35, "kejelasan": 0.1, "analisis": 0.2}
    llm_avg = sum(float(llm_scores.get(k, 0)) * w for k, w in weights.items())
    final = round(weight_llm * llm_avg + (1 - weight_llm) * sim_score, 2)
    return max(0, min(100, final)), llm_avg


# === 🔹 Endpoint /grade ===
@app.post("/grade")
def grade(req: GradeRequest):
    prompt = build_prompt(req.question, req.answer_key, req.student_answer)

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
        final_score, llm_score_avg = fuse_scores(parsed, sim_value)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghitung skor akhir: {e}")

    feedback = parsed.get("feedback", "").strip()

    # === 🔸 Logging Console ===
    print("\n" + "="*60)
    print("🧠 BENCHMARK INFERENCE RESULT")
    print("="*60)
    print(f"📊 Rata-rata Skor LLM       : {llm_score_avg}")
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
            "rata_rata": llm_score_avg,
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
        prompt = "Warm-up test: Halo, anda akan menjadi asisten penilai jawaban esai yang objektif, konsisten, dan kritis. Konfirmasikan jika anda siap."
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
