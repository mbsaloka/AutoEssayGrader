#!/bin/bash
# Script untuk menguji AI Auto Grading dengan 1 kunci jawaban dan 3 variasi jawaban mahasiswa
# Target nilai: 100, 80, 60
# Pastikan server FastAPI sudah aktif di http://127.0.0.1:8000 dan Ollama juga berjalan

URL="http://127.0.0.1:8000/grade"
# MODEL="llama3.2:1b"
MODEL="mistral:7b-instruct"

ANSWER_KEY="Hewan mamalia adalah hewan yang menyusui anaknya dengan air susu dari induknya. Tubuh mamalia umumnya ditutupi rambut atau bulu. Mereka bernapas dengan paru-paru dan berdarah panas (suhu tubuh tetap). Contoh hewan mamalia adalah sapi, kucing, anjing, manusia, gajah, dan kuda."

# === Case 1: Nilai 100 ===
echo "=== Case 1 ==="
curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d "{
    \"answer_key\": \"$ANSWER_KEY\",
    \"student_answer\": \"Hewan mamalia merupakan sebutan bagi binatang yang berkembang biak dengan cara melahirkan. Biasanya hewan mamalia memiliki ciri berbulu, bertaring, dan berkaki empat. Contohnya sapi, kucing, dan anjing. Namun, tidak hanya hewan yang hidup di darat yang bisa disebut mamalia, ada beberapa hewan laut yang juga melahirkan, seperti paus dan lumba-lumba.\",
    \"model\": \"$MODEL\"
  }" | jq .
