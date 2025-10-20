#!/bin/bash
# ======================================================
# 🧠 Script Pengujian AI Auto-Grader
# Topik: Konsep Probabilitas dan Statistika
# Membuat 10 variasi jawaban mahasiswa (100–10)
# Pastikan server FastAPI aktif di http://127.0.0.1:8000 dan Ollama berjalan
# ======================================================

URL="http://127.0.0.1:8000/grade"
MODEL="mistral:7b-instruct"

# === Kunci Jawaban ===
ANSWER_KEY="Probabilitas adalah ukuran kemungkinan terjadinya suatu peristiwa. Konsep ini menjadi dasar dalam statistika inferensial untuk memperkirakan populasi berdasarkan sampel. Nilai probabilitas selalu antara 0 hingga 1. Semakin mendekati 1, semakin besar kemungkinan peristiwa terjadi. Dalam statistika, probabilitas digunakan untuk menghitung peluang, distribusi, dan membuat keputusan berbasis data. Misalnya, distribusi normal menggambarkan penyebaran data dengan rata-rata dan simpangan baku tertentu. Konsep probabilitas juga diterapkan pada pengujian hipotesis, di mana nilai p menunjukkan tingkat keyakinan terhadap hasil penelitian."

# === Daftar Jawaban Mahasiswa ===
declare -A ANSWERS

ANSWERS[90]="Probabilitas menggambarkan peluang terjadinya suatu peristiwa, dengan nilai antara 0 sampai 1. Dalam statistika, probabilitas digunakan untuk menganalisis data dan membuat inferensi dari sampel ke populasi. Misalnya, distribusi normal menunjukkan penyebaran data dengan rata-rata dan simpangan baku tertentu. Konsep ini juga penting dalam uji hipotesis, di mana nilai p membantu menentukan signifikansi hasil penelitian."

ANSWERS[70]="Probabilitas adalah angka antara 0 dan 1 yang menunjukkan kemungkinan. Dalam statistika, probabilitas sering digunakan untuk memperkirakan hasil percobaan atau penelitian."

ANSWERS[50]="Probabilitas adalah kemungkinan sesuatu terjadi. Biasanya nilainya antara 0 sampai 1, tetapi saya tidak tahu hubungannya dengan statistika."

ANSWERS[30]="Probabilitas artinya hal yang bisa terjadi, seperti kalau melempar koin bisa dapat angka atau gambar."

ANSWERS[10]="Probabilitas itu tentang angka dan perhitungan, tapi saya tidak tahu apa hubungannya dengan statistika."

# === Loop untuk setiap nilai target ===
for SCORE in 90 70 50 30 10
do
  echo "=== Case: Nilai $SCORE ==="
  curl -s -X POST $URL \
    -H "Content-Type: application/json" \
    -d "{
      \"answer_key\": \"$ANSWER_KEY\",
      \"student_answer\": \"${ANSWERS[$SCORE]}\",
      \"model\": \"$MODEL\"
    }" | jq .
  echo ""
done
