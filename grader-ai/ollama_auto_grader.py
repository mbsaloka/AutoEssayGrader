from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import json
import re
import time
from typing import Optional, Dict
from bert_score import score

# === Konfigurasi ===
OLLAMA_URL = "http://localhost:11434/api/generate"
# DEFAULT_MODEL = "mistral:7b-instruct"
# DEFAULT_MODEL = "llama3.2:1b"
DEFAULT_MODEL = "phi3:mini"
# DEFAULT_MODEL = "llama3:8b"

app = FastAPI(title="Ollama Hybrid Auto-Grader", version="0.2")

# === Schema Request ===
class GradeRequest(BaseModel):
    answer_key: str
    student_answer: str
    model: Optional[str] = DEFAULT_MODEL


# === 1️⃣ Prompt Rubric-based ===
def build_prompt(answer_key: str, student_answer: str) -> str:
    prompt = f"""
PENTING:
Keluarkan HANYA satu blok JSON valid seperti contoh.
Jangan tambahkan teks, komentar, atau penjelasan di luar JSON.
Output harus dimulai dengan '{{' dan diakhiri dengan '}}'.

Anda adalah sistem penilai jawaban esai berdasarkan rubrik yang ketat dan konsisten.
Tugas Anda adalah menilai jawaban mahasiswa berdasarkan kunci jawaban dan rubrik berikut.

Rubrik Penilaian:
1. Pemahaman Konsep (0–100): Seberapa benar ide utama disampaikan.
2. Kelengkapan Jawaban (0–100): Apakah semua poin penting disebutkan.
3. Kejelasan Bahasa (0–100): Struktur kalimat dan tata bahasa.
4. Analisis/Argumen (0–100): Logika dan kedalaman penjelasan.

Kunci Jawaban:
{answer_key}

Jawaban Mahasiswa:
{student_answer}

Format output:
{{
  "pemahaman": <float>,
  "kelengkapan": <float>,
  "kejelasan": <float>,
  "analisis": <float>,
  "rata_rata": <float>,
  "feedback": "<ringkasan singkat kelebihan dan kekurangan>"
}}

Contoh output:
{{
  "pemahaman": 92.5,
  "kelengkapan": 90.0,
  "kejelasan": 95.0,
  "analisis": 88.5,
  "rata_rata": 91.5,
  "feedback": "Jawaban mahasiswa sangat jelas dan lengkap, namun bisa menambahkan sedikit detail pada analisis mekanisme."
}}
"""

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


# === 3️⃣ Ekstraksi JSON dari Respons Model ===
def extract_json_from_text(text: str) -> Optional[dict]:
    json_pattern = re.compile(r"\{[\s\S]*\}", re.MULTILINE)
    m = json_pattern.search(text)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            return None
    return None


# === 4️⃣ Hitung BERTScore ===
def compute_bertscore(student_answer: str, answer_key: str) -> float:
    try:
        start_time = time.time()
        P, R, F1 = score([student_answer], [answer_key], lang="id", device='cpu', verbose=False)
        end_time = time.time()
        similarity_time = round(end_time - start_time, 3)
        return round(float(F1[0]) * 100, 2), similarity_time
    except Exception as e:
        print("Gagal menghitung BERTScore:", e)
        return 0.0


# === 5️⃣ Gabungkan Skor (Fusion) ===
def fuse_scores(llm_scores: dict, bert_score: float, weight_llm: float = 0.6, weights: dict = None ) -> float:
    # Bobot default kalau tidak diberikan
    if weights is None:
        weights = {
            "pemahaman": 0.3,
            "kelengkapan": 0.3,
            "kejelasan": 0.2,
            "analisis": 0.2
        }

    # Hitung rata-rata berbobot dari skor LLM
    llm_avg = 0.0
    total_weight = 0.0
    for key, w in weights.items():
        if key in llm_scores:
            llm_avg += float(llm_scores[key]) * w
            total_weight += w

    if total_weight > 0:
        llm_avg /= total_weight
    else:
        llm_avg = float(llm_scores.get("rata_rata", 0.0))

    # Gabungkan dengan BERTScore
    final_score = round(weight_llm * llm_avg + (1 - weight_llm) * bert_score, 2)
    return max(0, min(100, final_score))


# === Fungsi Utilitas: Parsing JSON dengan Aman ===
def safe_json_parse(text: str):
    # Hapus pembungkus markdown
    text = re.sub(r'```(?:json)?', '', text, flags=re.IGNORECASE)

    # Ambil blok JSON pertama (non-greedy)
    match = re.search(r'\{.*?\}', text, re.DOTALL)
    if not match:
        raise ValueError("Tidak ditemukan blok JSON dalam respons.")

    json_text = match.group(0).strip()

    # Bersihkan trailing koma, kutip miring, dan karakter aneh
    json_text = re.sub(r',\s*}', '}', json_text)
    json_text = re.sub(r'“|”', '"', json_text)
    json_text = json_text.replace('\n', ' ').replace('\r', '')

    try:
        return json.loads(json_text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Gagal parsing JSON: {e}\nRaw JSON: {json_text[:500]}")



# === 6️⃣ Endpoint /grade ===
@app.post("/grade")
def grade(req: GradeRequest):
    # 1️⃣ Buat prompt & panggil model Ollama
    prompt = build_prompt(req.answer_key, req.student_answer)
    try:
        model_resp, llm_time = call_ollama(prompt, model=req.model)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 2️⃣ Ambil teks output dari Ollama
    if isinstance(model_resp, dict):
        model_text = (
            model_resp.get("response")
            or model_resp.get("output")
            or model_resp.get("raw")
            or json.dumps(model_resp)
        )
    else:
        model_text = str(model_resp)

    # 3️⃣ Parse JSON hasil LLM dengan aman
    try:
        parsed = safe_json_parse(model_text)
    except Exception as e:
        raise HTTPException(status_code=502, detail={
            "message": "Model tidak mengembalikan JSON valid.",
            "raw": model_text
        })

    # 4️⃣ Hitung BERTScore
    try:
        bert_score_value, similarity_time = compute_bertscore(req.student_answer, req.answer_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghitung BERTScore: {e}")

    # 5️⃣ Gabungkan skor Rubrik + BERTScore
    try:
        final_score = fuse_scores(parsed, bert_score_value)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghitung skor akhir: {e}")

    # 6️⃣ Ambil feedback dan nilai rubrik
    feedback = parsed.get("feedback", "").strip()

    # === Cetak Benchmark ke Console ===
    print("\n" + "="*60)
    print("🧠 BENCHMARK INFERENCE RESULT")
    print("="*60)
    print(f"📊 Rata-rata Skor LLM     : {parsed.get('rata_rata', 'N/A')}")
    print(f"📊 Skor Similarity (BERT) : {bert_score_value}")
    print(f"⏱️  Waktu LLM Inference     : {llm_time} detik")
    print(f"⏱️  Waktu Similarity Calc   : {similarity_time} detik")
    print("-"*60)
    print(f"🏁 Skor Gabungan (Final)   : {final_score}")
    print(f"Total Waktu Proses       : {llm_time + similarity_time} detik")
    print("="*60 + "\n")

    result = {
        "rubric_scores": {
            "pemahaman": parsed.get("pemahaman"),
            "kelengkapan": parsed.get("kelengkapan"),
            "kejelasan": parsed.get("kejelasan"),
            "analisis": parsed.get("analisis"),
            "rata_rata": parsed.get("rata_rata"),
        },
        "bert_score": bert_score_value,
        "final_score": final_score,
        "feedback": feedback,
        # "raw": model_text
    }

    return result


# === Warm-up Model di Startup ===
@app.on_event("startup")
def warmup_ollama():
    print("\n🚀 Melakukan warm-up model Ollama...")
    prompt = "Warm-up test: Jelaskan singkat apa itu sistem operasi dalam satu kalimat."
    try:
        start = time.time()
        resp, _ = call_ollama(prompt, model=DEFAULT_MODEL, timeout=120)
        duration = round(time.time() - start, 2)
        print(f"✅ Warm-up selesai dalam {duration} detik — model siap dipakai.\n")
    except Exception as e:
        print(f"⚠️ Gagal warm-up model Ollama: {e}\n")


# === Entry point ===
if __name__ == "__main__":
    import uvicorn
    print("Starting Ollama Hybrid Auto-Grader on http://127.0.0.1:8000")
    uvicorn.run("ollama_auto_grader:app", host="0.0.0.0", port=8000, reload=False)
