#!/bin/bash
# ======================================================
# 🧠 Script Pengujian AI Auto-Grader
# Topik: Proses Siklus Peredaran Darah (variasi jawaban keliru)
# Membuat variasi jawaban mahasiswa dari benar sampai salah
# Pastikan server FastAPI aktif di http://127.0.0.1:8000 dan Ollama berjalan
# ======================================================

URL="http://127.0.0.1:8000/grade"
MODEL="mistral:7b-instruct"

# === Kunci Jawaban ===
ANSWER_KEY="Siklus peredaran darah manusia terdiri dari dua sistem utama: peredaran darah besar dan peredaran darah kecil. Peredaran darah besar dimulai ketika darah beroksigen dari jantung bagian kiri dipompa ke seluruh tubuh melalui aorta, lalu kembali ke jantung bagian kanan dalam keadaan kekurangan oksigen. Peredaran darah kecil dimulai dari jantung kanan yang memompa darah ke paru-paru untuk pertukaran gas — karbon dioksida dilepaskan dan oksigen diikat — kemudian darah kaya oksigen kembali ke jantung kiri. Proses ini berlangsung terus-menerus untuk menjaga suplai oksigen dan nutrisi ke seluruh sel tubuh."

# === Daftar Jawaban Mahasiswa ===
declare -A ANSWERS

# Jawaban benar dan hampir benar
ANSWERS[100]="Siklus peredaran darah terdiri atas dua bagian, yaitu peredaran darah kecil dan besar. Pada peredaran darah kecil, jantung kanan memompa darah ke paru-paru untuk pertukaran gas, di mana CO₂ dilepaskan dan O₂ diikat. Darah kemudian kembali ke jantung kiri. Lalu, dalam peredaran darah besar, darah beroksigen dari jantung kiri dipompa ke seluruh tubuh melalui aorta dan kembali ke jantung kanan setelah kehilangan oksigen. Proses ini terjadi terus-menerus agar tubuh mendapat pasokan oksigen dan nutrisi."

ANSWERS[90]="Peredaran darah manusia dibagi menjadi dua, yaitu kecil dan besar. Darah dari jantung kanan menuju paru-paru untuk mengambil oksigen dan melepaskan karbon dioksida, lalu kembali ke jantung kiri. Setelah itu, darah dari jantung kiri diedarkan ke seluruh tubuh dan kembali lagi ke jantung kanan. Proses ini berulang terus agar sel tubuh mendapat oksigen."

ANSWERS[80]="Darah mengalir dari jantung ke paru-paru untuk mengambil oksigen, lalu kembali ke jantung dan diedarkan ke seluruh tubuh. Siklus ini terjadi terus-menerus dan disebut peredaran darah besar dan kecil."

ANSWERS[70]="Darah dipompa dari jantung ke paru-paru untuk mengambil oksigen, lalu ke seluruh tubuh. Proses ini terus terjadi agar tubuh tetap mendapat oksigen."

# === Jawaban rendah dan keliru ===
ANSWERS[60]="Darah keluar dari jantung kiri ke sistem pencernaan untuk memberi nutrisi, lalu kembali ke paru-paru. Ini adalah proses peredaran darah."  # salah tujuan

ANSWERS[50]="Darah dipompa ke bilik kanan untuk mengambil oksigen, kemudian ke tubuh. Saya tidak yakin bagian jantung mana yang harus ke paru-paru."  # salah bilik

ANSWERS[40]="Darah membawa makanan dari usus ke jantung dan paru-paru. Darah mengalir kesana kemari."  # salah fungsi

ANSWERS[30]="Darah mengalir dari jantung ke hati dan sistem pencernaan, lalu ke paru-paru. Tidak ada oksigen di sini."  # keliru konsep

ANSWERS[20]="Darah hanya bergerak di perut dan paru-paru, tidak ke seluruh tubuh."  # salah konsep besar/kecil

ANSWERS[10]="Darah keluar dari jantung kiri ke perut, lalu balik ke paru-paru. Saya pikir jantung hanya memompa ke perut."  # salah besar/kecil, bilik, tujuan

# === Loop untuk setiap nilai target ===
for SCORE in 100 90 80 70 60 50 40 30 20 10
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
