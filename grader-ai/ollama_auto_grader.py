from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import requests
import json
import re
import time
from typing import Optional
import torch
from sentence_transformers import SentenceTransformer, util
import textwrap

# === Konfigurasi ===
OLLAMA_URL = "http://localhost:11434/api/generate"
# DEFAULT_MODEL = "mistral:7b-instruct"
# DEFAULT_MODEL = "llama3.2:3b"
# DEFAULT_MODEL = "llama3.2:1b"
# DEFAULT_MODEL = "phi3:mini"
# DEFAULT_MODEL = "llama3:8b"
# DEFAULT_MODEL = "qwen2.5:7b-instruct"
DEFAULT_MODEL = "qwen2.5:3b-instruct"
# CODER_MODEL = "qwen2.5-coder:3b"
# DEFAULT_MODEL = "deepseek-r1:1.5b"
# DEFAULT_MODEL = "gemma:7b"

# Path lokal model MiniLM
EMBEDDING_MODEL_PATH = "/home/mbsaloka/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/c9745ed1d9f207416be6d2e6f8de32d1f16199bf"
DEVICE_MODE = "cuda" if torch.cuda.is_available() else "cpu"

# === Inisialisasi Aplikasi ===
app = FastAPI(title="Ollama Essay Auto Grader", version="0.3")

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

    default_prompt = f"""
Anda adalah sistem penilai jawaban esai otomatis.
Tugas Anda adalah menilai jawaban mahasiswa berdasarkan rubrik berikut secara objektif dan konsisten.

=== RUBRIK PENILAIAN (0–100) ===
1. Pemahaman Konsep — ketepatan dalam menangkap ide utama dari kunci jawaban.
2. Kelengkapan Jawaban — sejauh mana poin penting dari kunci jawaban disebutkan.
3. Kejelasan Bahasa — kejelasan struktur kalimat dan keterbacaan.
4. Analisis / Argumen — logika dan kedalaman penjelasan dalam mendukung jawaban.

=== DATA ===
Pertanyaan:
"{question}"

Kunci Jawaban Ideal:
"{answer_key}"

Jawaban Mahasiswa:
"{student_answer}"

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

    coder_prompt = f"""
Anda adalah sistem penilai jawaban esai pemrograman otomatis.
Tugas Anda adalah menilai kualitas jawaban mahasiswa berdasarkan rubrik berikut **secara objektif, konsisten, dan berbasis bukti dari kode dan penjelasan**.

=== RUBRIK PENILAIAN (0–100) ===
1. **Pemahaman Konsep** — sejauh mana mahasiswa memahami maksud soal dan menerapkan konsep pemrograman yang tepat.
   - 95–100: Konsep utama dan logika dipahami sepenuhnya.
   - 70–94: Konsep utama benar, tetapi ada detail minor yang salah.
   - 40–69: Ada sebagian konsep yang salah diterapkan.
   - 0–39: Tidak memahami konsep atau logika dasar.

2. **Kelengkapan Jawaban** — apakah semua bagian penting dari kunci jawaban telah dijelaskan atau diimplementasikan dalam kode.
   - 95–100: Semua elemen utama hadir dan berfungsi.
   - 70–94: Sebagian besar elemen ada, namun ada 1–2 bagian penting yang hilang.
   - 40–69: Hanya sebagian kecil dari solusi yang muncul.
   - 0–39: Hampir tidak ada bagian relevan dari solusi.

3. **Kejelasan Bahasa dan Kode** — apakah penjelasan dan kode tertulis dengan jelas, rapi, serta dapat dipahami tanpa ambiguitas.
   - 95–100: Struktur kode bersih, indentasi benar, komentar/penjelasan ringkas dan jelas.
   - 70–94: Sedikit kekurangan pada gaya atau penjelasan.
   - 40–69: Struktur kode membingungkan atau tidak konsisten.
   - 0–39: Kode berantakan, sulit dipahami, atau tidak bisa dieksekusi.

4. **Analisis / Argumen** — sejauh mana mahasiswa memberikan penalaran logis, menjelaskan alasannya, atau mengidentifikasi kesalahan dengan benar.
   - 95–100: Alasan dan logika sangat jelas dan sesuai konsep.
   - 70–94: Ada penjelasan logis tapi kurang mendalam.
   - 40–69: Analisis dangkal atau tidak relevan.
   - 0–39: Tidak ada analisis atau penjelasan sama sekali.

=== DATA ===
Pertanyaan:
"{question}"

Kunci Jawaban Ideal:
"{answer_key}"

Jawaban Mahasiswa:
"{student_answer}"

=== PETUNJUK PENILAIAN ===
- Gunakan kunci jawaban sebagai referensi utama.
- Fokus pada **fungsi, logika, dan hasil akhir**, bukan gaya penulisan atau format.
- Jika kode mahasiswa berbeda gaya tetapi logikanya benar, tetap beri nilai tinggi.
- Jika logika salah meskipun sintaks benar, nilai rendah.
- Pertimbangkan baik kode maupun penjelasan dalam setiap rubrik.
- Berikan nilai setiap rubrik antara **0–100 dengan dua angka desimal** (misal: 85.50).

=== PETUNJUK FEEDBACK ===
- Feedback harus singkat (1–3 kalimat), **spesifik dan berbasis bukti dari kode atau logika**.
- Sebutkan bagian yang benar dan yang perlu diperbaiki.
- Hindari komentar umum seperti “sudah bagus” tanpa alasan.
- Jika logika hampir benar, jelaskan perbedaannya dengan kunci jawaban.
- Jika ada kesalahan konsep atau sintaks, sebutkan secara eksplisit.

=== FORMAT OUTPUT (WAJIB JSON VALID) ===
{{
  "pemahaman": float,      # skor 0–100
  "kelengkapan": float,    # skor 0–100
  "kejelasan": float,      # skor 0–100
  "analisis": float,       # skor 0–100
  "feedback": string       # maksimal 3 kalimat, fokus ke aspek penting
}}
"""

    # Cek code di dalam answer_key
    code_indicators = [
        r"```", r";", r"\{", r"\}", r"\bfunction\b", r"\bclass\b",
        r"\bpublic\b", r"\bprivate\b", r"::", r"->", r"==", r"!=",
        r"\.php\b", r"\.js\b", r"\.py\b"
    ]

    is_code = any(re.search(p, answer_key) for p in code_indicators)

    if is_code:
        prompt = coder_prompt
        print("🛠️ Menggunakan prompt khusus Coder untuk penilaian jawaban pemrograman.")
    else:
        prompt = default_prompt
        print("📝 Menggunakan prompt standar untuk penilaian jawaban esai.")
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

    match = re.search(r'(\{.*\})', text, flags=re.DOTALL)
    if not match:
        raise ValueError("Tidak ditemukan blok JSON dalam respons.")

    json_text = match.group(1).strip()

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
        model_resp, llm_time = call_ollama(prompt, model=DEFAULT_MODEL)
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
    wrapper = textwrap.TextWrapper(width=80, subsequent_indent=" " * 14)

    print("\n" + "="*60)
    print("🧠 BENCHMARK INFERENCE RESULT")
    print("📝 Question     :", wrapper.fill(req.question if req.question else "(kosong)"))
    print("🔑 Answer Key   :", wrapper.fill(req.answer_key if req.answer_key else "(kosong)"))
    print("🎓 Student Answer:", wrapper.fill(req.student_answer if req.student_answer else "(kosong)"))
    print("="*60)
    print("📝 LLM Raw Response:")
    print(model_text)
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
        print("🔹 Warm-up Ollama Instruct...")
        prompt = "Warm-up test: Halo, anda akan menjadi asisten penilai jawaban esai yang objektif, konsisten, dan kritis. Konfirmasikan jika anda siap."
        start = time.time()
        call_ollama(prompt, model=DEFAULT_MODEL, timeout=120)
        print(f"✅ Ollama Instruct siap (waktu: {round(time.time() - start, 2)} detik)")
    except Exception as e:
        print(f"⚠️ Gagal warm-up Ollama: {e}")
    # try:
    #     print("🔹 Warm-up Ollama Coder...")
    #     prompt = "Warm-up test: Halo, anda akan menjadi asisten penilai jawaban esai yang objektif, konsisten, dan kritis. Konfirmasikan jika anda siap."
    #     start = time.time()
    #     call_ollama(prompt, model=CODER_MODEL, timeout=120)
    #     print(f"✅ Ollama Coder siap (waktu: {round(time.time() - start, 2)} detik)")
    # except Exception as e:
    #     print(f"⚠️ Gagal warm-up Ollama: {e}")

    # 🔸 Warm-up Embedding Model
    try:
        print("🔹 Warm-up MiniLM embedding...")
        start = time.time()
        _ = EMBEDDING_MODEL.encode("warm-up MiniLM", convert_to_tensor=True, normalize_embeddings=True)
        print(f"✅ Embedding siap (waktu: {round(time.time() - start, 2)} detik)")
    except Exception as e:
        print(f"⚠️ Gagal warm-up embedding: {e}")

    print("🔥 Semua komponen siap digunakan!\n")

@app.get("/", response_class=HTMLResponse)
def root():
    html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>AI Essay Grader</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: auto; padding: 20px; }
        textarea { width: 100%; height: 80px; margin-bottom: 10px; }
        button { padding: 10px 20px; font-size: 16px; }
        #result-container {
            background: #f4f4f4;
            padding: 10px;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap; /* agar teks wrap jika terlalu panjang */
            border: 1px solid #ccc;
        }
        #loading {
            display: none;
            font-size: 16px;
            color: #555;
        }
    </style>
</head>
<body>
    <h1>AI Essay Grader</h1>
    <label>Soal:</label><br>
    <textarea id="question" placeholder="Masukkan pertanyaan"></textarea><br>
    <label>Kunci Jawaban:</label><br>
    <textarea id="answer_key" placeholder="Masukkan jawaban ideal"></textarea><br>
    <label>Jawaban Mahasiswa:</label><br>
    <textarea id="student_answer" placeholder="Masukkan jawaban mahasiswa"></textarea><br>
    <button onclick="submitForm()">Submit</button>
    <p id="loading">Processing... Please wait.</p>

    <h2>Hasil:</h2>
    <div id="result-container">
        <pre id="result">Belum ada hasil</pre>
    </div>

    <script>
        async function submitForm() {
            const question = document.getElementById('question').value;
            const answer_key = document.getElementById('answer_key').value;
            const student_answer = document.getElementById('student_answer').value;

            const payload = { question, answer_key, student_answer };

            const loadingElement = document.getElementById('loading');
            const resultElement = document.getElementById('result');

            loadingElement.style.display = 'block';
            resultElement.textContent = '';

            try {
                const response = await fetch('/grade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const data = await response.json();
                    resultElement.textContent = JSON.stringify(data, null, 2);
                } else {
                    resultElement.textContent = 'Error: ' + response.status + ' - ' + await response.text();
                }
            } catch (error) {
                resultElement.textContent = 'Error2: ' + error.message;
            } finally {
                loadingElement.style.display = 'none';
            }
        }
    </script>
</body>
</html>
"""
    return html_content

# === 🔹 Entry Point ===
if __name__ == "__main__":
    import uvicorn
    print("Starting Ollama Hybrid Auto-Grader on http://127.0.0.1:8000")
    uvicorn.run("ollama_auto_grader:app", host="0.0.0.0", port=8000, reload=False)
