# from typing import Dict, List
# import requests
# import json
# import re
# import time
# import os
# import torch
# from sentence_transformers import SentenceTransformer, util

# OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
# USE_LONG_PROMPT = os.getenv("USE_LONG_PROMPT", "False").lower() == "true"
# DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b-instruct")

# EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
# DEVICE_MODE = "cuda" if torch.cuda.is_available() else "cpu"

# EMBEDDING_MODEL = None

# def initialize_embedding_model():
#     global EMBEDDING_MODEL
#     if EMBEDDING_MODEL is None:
#         print(f"\n🧠 Memuat model embedding {EMBEDDING_MODEL_NAME} di {DEVICE_MODE}...")
#         try:
#             start_load = time.time()
#             EMBEDDING_MODEL = SentenceTransformer(EMBEDDING_MODEL_NAME, device=DEVICE_MODE)
#             EMBEDDING_MODEL.encode("warmup", convert_to_tensor=True)
#             load_time = round((time.time() - start_load), 2)
#             print(f"✅ Model embedding siap digunakan (load time {load_time} detik)\n")
#         except Exception as e:
#             print(f"❌ Gagal memuat model embedding: {e}")
#             EMBEDDING_MODEL = None

# def build_prompt(question: str, answer_key: str, student_answer: str) -> str:
#     if not student_answer or not student_answer.strip():
#         student_answer = "(jawaban kosong)"

#     short_prompt = f"""
# Anda adalah sistem penilai jawaban esai otomatis.
# Tugas Anda adalah menilai jawaban mahasiswa berdasarkan rubrik berikut secara objektif dan konsisten.

# === RUBRIK PENILAIAN (0–100) ===
# 1. Pemahaman Konsep — ketepatan dalam menangkap ide utama dari kunci jawaban.
# 2. Kelengkapan Jawaban — sejauh mana poin penting dari kunci jawaban disebutkan.
# 3. Kejelasan Bahasa — kejelasan struktur kalimat dan keterbacaan.
# 4. Analisis / Argumen — logika dan kedalaman penjelasan dalam mendukung jawaban.

# === DATA ===
# Pertanyaan:
# {question}

# Kunci Jawaban Ideal:
# {answer_key}

# Jawaban Mahasiswa:
# {student_answer}

# === PETUNJUK PENILAIAN RUBRIC ===
# - Jangan ragu memberi nilai tinggi jika jawaban sesuai dengan kunci jawaban.
# - Jangan ragu memberi nilai rendah jika jawaban tidak sesuai, salah konsep, atau tidak jelas.
# - Gunakan kunci jawaban sebagai tolok ukur utama, bukan opini Anda sendiri.
# - Pahami konteks dan poin penting dari kunci jawaban sebelum menilai.
# - Berikan nilai rubrik berupa desimal dengan dua angka di belakang koma, misal 81.25.

# === PETUNJUK FEEDBACK ===
# - Feedback ringkas 1-2 kalimat.
# - Hindari kalimat generik seperti "jawaban sudah cukup baik" atau "jawaban kurang tepat" tanpa penjelasan.
# - Berikan feedback yang spesifik dengan menyebutkan bagian jawaban mahasiswa yang kurang atau berbeda dari kunci jawaban.
# - Jika jawaban sudah sangat baik, sebutkan bagian mana yang sudah tepat.
# - Sertakan alasan singkat mengapa skor diberikan.
# - Jelaskan apa yang salah dari jawaban mahasiswa dan poin apa yang benar.

# === FORMAT OUTPUT ===
# Keluarkan hasil dalam format JSON berikut:
# {{
#   "pemahaman": float,
#   "kelengkapan": float,
#   "kejelasan": float,
#   "analisis": float,
#   "feedback": string
# }}
# """

#     long_prompt = f"""
# Anda adalah sistem penilai jawaban esai yang objektif dan konsisten, menilai berdasarkan rubrik yang ketat serta mencocokkan isi jawaban mahasiswa dengan kunci jawaban yang diberikan.

# Rubrik Penilaian Sederhana (0-100)
# 1. Pemahaman Konsep: Seberapa tepat mahasiswa memahami ide utama.
# 90-100: Tepat dan lengkap
# 70-89: Cukup tepat, ada sedikit kesalahan
# 20-69: Banyak kekeliruan konsep
# <20: Salah total

# 2. Kelengkapan Jawaban: Seberapa banyak poin penting dari kunci jawaban tercakup.
# 90-100: Semua poin penting ada
# 70-89: Sebagian besar poin ada
# 20-69: Banyak poin hilang
# <20: Hampir tidak ada poin penting

# 3. Kejelasan Bahasa: Seberapa mudah jawaban dibaca dan dipahami.
# 90-100: Jelas dan rapi
# 70-89: Cukup jelas, ada kesalahan kecil
# 20-69: Kurang jelas
# <20: Sulit dipahami

# 4. Analisis / Argumen: Seberapa logis dan mendalam penjelasan.
# 90-100: Logis dan mendalam
# 70-89: Cukup logis, agak dangkal
# 20-69: Lemah atau dangkal
# <20: Tidak ada analisis

# Pertanyaan:
# {question}

# Kunci Jawaban:
# {answer_key}

# Jawaban Mahasiswa:
# {student_answer}

# ### PETUNJUK OUTPUT
# - Keluarkan **hanya satu blok JSON valid**, mulai dengan `{{` dan diakhiri dengan `}}`.
# - Jangan ragu memberi nilai rendah jika memang jawaban tidak sesuai kunci jawaban.
# - Jangan ragu memberi nilai tinggi jika memang jawaban mendekati kunci jawaban.
# - Semua nilai numerik berupa desimal dengan dua angka di belakang koma, misal 84.25.
# - Wajib menyertakan kunci: "pemahaman", "kelengkapan", "kejelasan", "analisis", "feedback".
# - "feedback" = 1–2 kalimat, sebutkan kelebihan atau kekurangan spesifik dibanding kunci jawaban. Jangan menyalin jawaban mahasiswa.

# Contoh output:
# {{
#    "pemahaman": float,
#    "kelengkapan": float,
#    "kejelasan": float,
#    "analisis": float,
#    "feedback": string
# }}
# """
#     if USE_LONG_PROMPT:
#         prompt = long_prompt
#     else:
#         prompt = short_prompt
#     return prompt

# def call_ollama(prompt: str, model: str = DEFAULT_MODEL, timeout: int = 90) -> tuple:
#     payload = {
#         "model": model,
#         "prompt": prompt,
#         "stream": False,
#         "options": {"num_predict": 800, "temperature": 0.0}
#     }

#     try:
#         start_time = time.time()
#         resp = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
#         end_time = time.time()
#         llm_inference_time = round(end_time - start_time, 3)
#     except requests.exceptions.RequestException as e:
#         raise RuntimeError(f"Gagal terhubung ke Ollama API di {OLLAMA_URL}: {e}")

#     if resp.status_code != 200:
#         raise RuntimeError(f"Ollama API error: {resp.status_code} - {resp.text}")

#     try:
#         return resp.json(), llm_inference_time
#     except ValueError:
#         return {"raw": resp.text}, llm_inference_time

# def safe_json_parse(text: str):
#     text = re.sub(r'```(?:json)?', '', text, flags=re.IGNORECASE)
#     match = re.search(r'\{.*?\}', text, re.DOTALL)
#     if not match:
#         raise ValueError("Tidak ditemukan blok JSON dalam respons.")
#     json_text = match.group(0).strip()
#     json_text = re.sub(r',\s*}', '}', json_text)
#     json_text = re.sub(r'"|"', '"', json_text)
#     try:
#         return json.loads(json_text)
#     except json.JSONDecodeError as e:
#         raise ValueError(f"Gagal parsing JSON: {e}\nRaw JSON: {json_text[:500]}")

# def compute_embedding_similarity(student_answer: str, answer_key: str):
#     if EMBEDDING_MODEL is None:
#         raise RuntimeError("Model embedding belum siap.")
#     start_time = time.time()
#     emb_key = EMBEDDING_MODEL.encode(answer_key, convert_to_tensor=True, normalize_embeddings=True)
#     emb_ans = EMBEDDING_MODEL.encode(student_answer, convert_to_tensor=True, normalize_embeddings=True)
#     similarity = util.cos_sim(emb_key, emb_ans).item()
#     duration = round((time.time() - start_time), 3)
#     return round(similarity * 100, 2), duration

# def fuse_scores(llm_scores: dict, sim_score: float, weight_llm: float = 0.85):
#     weights = {"pemahaman": 0.35, "kelengkapan": 0.35, "kejelasan": 0.1, "analisis": 0.2}
#     llm_avg = sum(float(llm_scores.get(k, 0)) * w for k, w in weights.items())
#     final = round(weight_llm * llm_avg + (1 - weight_llm) * sim_score, 2)
#     return max(0, min(100, final)), llm_avg

# async def grade_question(
#     question_text: str,
#     reference_answer: str,
#     student_answer: str,
#     question_points: int
# ) -> Dict:
#     prompt = build_prompt(question_text, reference_answer, student_answer)

#     try:
#         model_resp, llm_time = call_ollama(prompt, model=DEFAULT_MODEL)
#     except RuntimeError as e:
#         raise RuntimeError(f"Ollama error: {e}")

#     model_text = (
#         model_resp.get("response")
#         or model_resp.get("output")
#         or model_resp.get("raw")
#         or json.dumps(model_resp)
#     )

#     try:
#         parsed = safe_json_parse(model_text)
#     except Exception as e:
#         raise RuntimeError(f"Model tidak mengembalikan JSON valid: {e}")

#     try:
#         sim_value, sim_time = compute_embedding_similarity(student_answer, reference_answer)
#     except Exception as e:
#         raise RuntimeError(f"Gagal menghitung similarity embedding: {e}")

#     try:
#         final_percentage, llm_score_avg = fuse_scores(parsed, sim_value)
#     except Exception as e:
#         raise RuntimeError(f"Gagal menghitung skor akhir: {e}")

#     final_score = round((final_percentage / 100) * question_points, 2)

#     feedback = parsed.get("feedback", "").strip()

#     print("\n" + "="*60)
#     print("🧠 GRADING RESULT")
#     print("="*60)
#     print(f"📊 Rata-rata Skor LLM       : {llm_score_avg}")
#     print(f"📊 Similarity (MiniLM)      : {sim_value}")
#     print(f"⏱️  LLM Inference Time       : {llm_time} detik")
#     print(f"⏱️  Embedding Similarity Time: {sim_time} detik")
#     print(f"🏁 Skor Gabungan (Final)    : {final_score}/{question_points}")
#     print("="*60 + "\n")

#     return {
#         "final_score": final_score,
#         "feedback": feedback,
#         "rubric_scores": {
#             "pemahaman": parsed.get("pemahaman"),
#             "kelengkapan": parsed.get("kelengkapan"),
#             "kejelasan": parsed.get("kejelasan"),
#             "analisis": parsed.get("analisis"),
#             "rata_rata": llm_score_avg,
#         },
#         "embedding_similarity": sim_value,
#         "llm_time": llm_time,
#         "similarity_time": sim_time
#     }

# async def grade_submission_batch(submission_data: Dict) -> Dict:
#     questions = submission_data.get("questions", [])
#     answers = submission_data.get("answers", [])

#     questions_map = {q["question_id"]: q for q in questions}
#     answers_map = {a["question_id"]: a for a in answers}

#     results = []
#     total_score = 0.0
#     total_points = 0
#     total_llm_time = 0.0
#     total_similarity_time = 0.0

#     aggregate_pemahaman = []
#     aggregate_kelengkapan = []
#     aggregate_kejelasan = []
#     aggregate_analisis = []
#     aggregate_similarity = []

#     for question in questions:
#         question_id = question["question_id"]
#         question_text = question["question_text"]
#         reference_answer = question["reference_answer"]
#         points = question["points"]

#         answer_data = answers_map.get(question_id)
#         if not answer_data:
#             student_answer = ""
#         else:
#             student_answer = answer_data["answer_text"]

#         grading_result = await grade_question(
#             question_text=question_text,
#             reference_answer=reference_answer,
#             student_answer=student_answer,
#             question_points=points
#         )

#         results.append({
#             "question_id": question_id,
#             "final_score": grading_result["final_score"],
#             "feedback": grading_result["feedback"],
#             "rubric_scores": grading_result["rubric_scores"],
#             "embedding_similarity": grading_result["embedding_similarity"],
#             "llm_time": grading_result["llm_time"],
#             "similarity_time": grading_result["similarity_time"]
#         })

#         total_score += grading_result["final_score"]
#         total_points += points
#         total_llm_time += grading_result["llm_time"]
#         total_similarity_time += grading_result["similarity_time"]

#         aggregate_pemahaman.append(grading_result["rubric_scores"]["pemahaman"])
#         aggregate_kelengkapan.append(grading_result["rubric_scores"]["kelengkapan"])
#         aggregate_kejelasan.append(grading_result["rubric_scores"]["kejelasan"])
#         aggregate_analisis.append(grading_result["rubric_scores"]["analisis"])
#         aggregate_similarity.append(grading_result["embedding_similarity"])

#     percentage = round((total_score / total_points * 100), 2) if total_points > 0 else 0.0

#     num_questions = len(results)
#     avg_pemahaman = round(sum(aggregate_pemahaman) / num_questions, 2) if num_questions > 0 else 0.0
#     avg_kelengkapan = round(sum(aggregate_kelengkapan) / num_questions, 2) if num_questions > 0 else 0.0
#     avg_kejelasan = round(sum(aggregate_kejelasan) / num_questions, 2) if num_questions > 0 else 0.0
#     avg_analisis = round(sum(aggregate_analisis) / num_questions, 2) if num_questions > 0 else 0.0
#     avg_similarity = round(sum(aggregate_similarity) / num_questions, 2) if num_questions > 0 else 0.0

#     if percentage >= 90:
#         overall_feedback = "Excellent work! The answers demonstrate strong understanding across all questions."
#     elif percentage >= 80:
#         overall_feedback = "Good performance overall. Most concepts are well understood with room for minor improvements."
#     elif percentage >= 70:
#         overall_feedback = "Satisfactory work. Some areas need more depth and clarity in explanations."
#     elif percentage >= 60:
#         overall_feedback = "Adequate understanding shown, but several concepts need more detailed explanation."
#     else:
#         overall_feedback = "Needs improvement. Please review the material and focus on key concepts."

#     return {
#         "results": results,
#         "total_score": round(total_score, 2),
#         "total_points": total_points,
#         "percentage": percentage,
#         "overall_feedback": overall_feedback,
#         "aggregate_rubrics": {
#             "pemahaman": avg_pemahaman,
#             "kelengkapan": avg_kelengkapan,
#             "kejelasan": avg_kejelasan,
#             "analisis": avg_analisis,
#             "avg_embedding_similarity": avg_similarity
#         },
#         "total_llm_time": round(total_llm_time, 3),
#         "total_similarity_time": round(total_similarity_time, 3)
#     }
