#!/bin/bash
# ============================================================
# 🔍 Script untuk menguji AI Auto Grading dengan 5 soal & 5 variasi jawaban
# Menampilkan tabel hasil perbandingan skor dan waktu inferensi
# ============================================================

URL="http://127.0.0.1:8000/grade"
MODEL="qwen2.5:3b-instruct"

# ============================================================
# 🧩 Daftar Soal dan Kunci Jawaban
# ============================================================

declare -A QUESTIONS
declare -A ANSWER_KEYS

QUESTIONS[1]="Jelaskan konsep manajemen memori dalam sistem operasi!"
ANSWER_KEYS[1]="Sistem operasi mengelola memori melalui alokasi, dealokasi, proteksi, dan virtual memory. Teknik utama meliputi partitioning, paging, segmentation, serta swapping. Virtual memory memungkinkan program besar berjalan dengan memanfaatkan disk sebagai perpanjangan RAM. Sistem juga menangani fragmentasi untuk efisiensi dan stabilitas proses."

QUESTIONS[2]="Apa fungsi hash dalam keamanan informasi?"
ANSWER_KEYS[2]="Hash berfungsi menghasilkan representasi unik dari data untuk memastikan integritas. Hash bersifat satu arah, artinya data asli tidak bisa dikembalikan dari hasil hash. Fungsi hash digunakan dalam penyimpanan password, verifikasi file, dan tanda tangan digital. Algoritma umum: SHA-256, MD5, dan SHA-1."

QUESTIONS[3]="Apa perbedaan antara algoritma greedy dan dynamic programming?"
ANSWER_KEYS[3]="Algoritma greedy memilih solusi lokal terbaik di setiap langkah tanpa meninjau masa depan, sedangkan dynamic programming memecah masalah menjadi submasalah dan menyimpan hasilnya agar efisien. DP menjamin solusi optimal untuk masalah overlapping subproblems, sementara greedy hanya optimal untuk masalah dengan sifat greedy-choice."

QUESTIONS[4]="Jelaskan konsep relasi dan fungsi dalam matematika diskrit!"
ANSWER_KEYS[4]="Relasi adalah himpunan pasangan terurut yang menghubungkan elemen dari dua himpunan. Fungsi adalah relasi khusus di mana setiap elemen domain dipasangkan tepat satu elemen di kodomain. Relasi dapat memiliki sifat refleksif, simetris, dan transitif. Fungsi dapat berupa injektif, surjektif, atau bijektif."

QUESTIONS[5]="Apa tujuan analisis kebutuhan sistem berbasis perangkat lunak?"
ANSWER_KEYS[5]="Analisis kebutuhan bertujuan memahami apa yang dibutuhkan pengguna dan sistem agar perangkat lunak memenuhi tujuan bisnis. Meliputi identifikasi kebutuhan fungsional, non-fungsional, batasan, dan prioritas. Hasilnya berupa dokumen SRS (Software Requirement Specification) yang menjadi acuan tahap desain dan implementasi."

# ============================================================
# 🧑‍🎓 Jawaban Mahasiswa per Soal
# ============================================================

declare -A STUDENT_ANSWERS
declare -A EXPECTED_SCORES
declare -A AI_SCORES
declare -A INFER_TIMES

# ---------- Soal 1 ----------
STUDENT_ANSWERS[1,1]="Sistem operasi mengatur alokasi memori dengan teknik seperti paging, segmentation, dan virtual memory. Virtual memory memakai disk sebagai tambahan RAM. Fragmentasi dan swapping juga ditangani untuk efisiensi."
STUDENT_ANSWERS[1,2]="Manajemen memori mengatur penggunaan RAM agar efisien. Sistem memakai paging dan virtual memory. Namun, tidak semua proses dijelaskan detail seperti segmentation."
STUDENT_ANSWERS[1,3]="Sistem operasi menyimpan semua data di RAM dan memakai hard disk jika penuh. Tidak disebutkan fragmentation maupun teknik lain."
STUDENT_ANSWERS[1,4]="Manajemen memori dilakukan oleh CPU agar komputer cepat. Paging digunakan untuk menyimpan file besar."
STUDENT_ANSWERS[1,5]="Memori komputer diatur oleh antivirus dan browser agar tidak crash."
EXPECTED_SCORES[1]="100,85,65,40,10"

# ---------- Soal 2 ----------
STUDENT_ANSWERS[2,1]="Hash menghasilkan nilai unik dari data dan tidak dapat dikembalikan ke bentuk semula. Digunakan untuk keamanan password dan verifikasi integritas data seperti SHA-256."
STUDENT_ANSWERS[2,2]="Fungsi hash digunakan untuk memastikan data tidak berubah. Hashing juga dipakai di database."
STUDENT_ANSWERS[2,3]="Hash digunakan untuk mengenkripsi data agar aman dari hacker."
STUDENT_ANSWERS[2,4]="Hash berarti menyalin file ke tempat lain agar lebih aman."
STUDENT_ANSWERS[2,5]="Hash adalah teknik mempercepat internet dan menyalin cache browser."
EXPECTED_SCORES[2]="100,80,60,35,10"

# ---------- Soal 3 ----------
STUDENT_ANSWERS[3,1]="Greedy memilih solusi lokal terbaik tiap langkah, sedangkan DP menyimpan hasil submasalah untuk hasil optimal. Contohnya: knapsack, shortest path."
STUDENT_ANSWERS[3,2]="Greedy lebih cepat dari DP tapi tidak selalu optimal. DP lebih kompleks namun efisien karena menyimpan hasil sebelumnya."
STUDENT_ANSWERS[3,3]="Keduanya sama-sama algoritma pencarian, hanya berbeda dalam jumlah langkah."
STUDENT_ANSWERS[3,4]="Greedy digunakan untuk enkripsi data, sedangkan DP untuk dekripsi."
STUDENT_ANSWERS[3,5]="Greedy adalah metode cepat, DP adalah bahasa pemrograman."
EXPECTED_SCORES[3]="100,85,60,30,5"

# ---------- Soal 4 ----------
STUDENT_ANSWERS[4,1]="Relasi adalah pasangan terurut antar himpunan, sedangkan fungsi adalah relasi khusus dengan satu pasangan unik. Fungsi bisa injektif, surjektif, atau bijektif."
STUDENT_ANSWERS[4,2]="Relasi menghubungkan dua himpunan, fungsi adalah hubungan satu ke satu. Ada fungsi bijektif dan surjektif."
STUDENT_ANSWERS[4,3]="Relasi dan fungsi adalah rumus matematika untuk menghitung nilai x dan y."
STUDENT_ANSWERS[4,4]="Relasi berarti hubungan sosial, fungsi berarti tugas dari seseorang."
STUDENT_ANSWERS[4,5]="Relasi adalah tabel database dan fungsi adalah SQL query."
EXPECTED_SCORES[4]="100,85,60,25,10"

# ---------- Soal 5 ----------
STUDENT_ANSWERS[5,1]="Analisis kebutuhan mengidentifikasi apa yang dibutuhkan pengguna agar sistem sesuai tujuan bisnis. Hasilnya berupa dokumen SRS untuk acuan pengembangan."
STUDENT_ANSWERS[5,2]="Analisis kebutuhan dilakukan agar software sesuai harapan pengguna. Dokumennya disebut SRS."
STUDENT_ANSWERS[5,3]="Analisis kebutuhan digunakan untuk desain tampilan antarmuka pengguna."
STUDENT_ANSWERS[5,4]="Analisis kebutuhan adalah proses instalasi program di komputer pengguna."
STUDENT_ANSWERS[5,5]="Analisis kebutuhan bertujuan mencari bug dalam sistem agar aman dari virus."
EXPECTED_SCORES[5]="100,85,60,35,10"

# ============================================================
# 🚀 Eksekusi Pengujian
# ============================================================

echo "🔍 Menguji model: $MODEL"
echo "===================================================="

for qid in {1..5}; do
  echo ""
  echo "📘 Soal $qid: ${QUESTIONS[$qid]}"
  echo "----------------------------------------------------"
  echo "Ekspektasi skor (manual): ${EXPECTED_SCORES[$qid]}"
  echo ""

  for sid in {1..5}; do
    echo "💬 Jawaban Mahasiswa $sid:"
    echo "${STUDENT_ANSWERS[$qid,$sid]}"
    echo "⏳ Mengirim ke API..."

    start_time=$(date +%s%3N)

    response=$(curl -s -X POST $URL \
      -H "Content-Type: application/json" \
      -d "{
        \"answer_key\": \"${ANSWER_KEYS[$qid]}\",
        \"student_answer\": \"${STUDENT_ANSWERS[$qid,$sid]}\",
        \"model\": \"$MODEL\"
      }")

    end_time=$(date +%s%3N)
    infer_time=$((end_time - start_time))
    INFER_TIMES[$qid,$sid]=$infer_time

    score=$(echo "$response" | jq -r '.final_score // .score // empty')
    AI_SCORES[$qid,$sid]=$score

    echo "Hasil Skor: $score (Waktu: ${infer_time} ms)"
    echo ""
  done
done

# ============================================================
# 📊 RINGKASAN HASIL
# ============================================================

echo ""
echo "===================================================="
echo "📊 RINGKASAN HASIL AKHIR"
echo "===================================================="

for qid in {1..5}; do
  echo ""
  echo "🧩 Soal $qid: ${QUESTIONS[$qid]}"
  echo "----------------------------------------------------"
  printf "%-15s %-15s %-15s\n" "Mahasiswa" "Ekspektasi" "AI_Score (ms)"
  echo "----------------------------------------------------"

  IFS=',' read -ra exp_scores <<< "${EXPECTED_SCORES[$qid]}"

  total_ai=0
  total_exp=0
  for sid in {1..5}; do
    ai_score=${AI_SCORES[$qid,$sid]}
    infer_time=${INFER_TIMES[$qid,$sid]}
    exp_score=${exp_scores[$((sid-1))]}

    printf "%-15s %-15s %-15s\n" "Case $sid" "$exp_score" "${ai_score} (${infer_time})"

    if [[ "$ai_score" != "null" && "$ai_score" != "" ]]; then
      total_ai=$(echo "$total_ai + $ai_score" | bc)
      total_exp=$(echo "$total_exp + $exp_score" | bc)
    fi
  done

  avg_ai=$(echo "scale=2; $total_ai / 5" | bc)
  avg_exp=$(echo "scale=2; $total_exp / 5" | bc)
  echo "----------------------------------------------------"
  echo "Rata-rata Skor Ekspektasi : $avg_exp"
  echo "Rata-rata Skor Model      : $avg_ai"
done

echo ""
echo "===================================================="
echo "✅ Semua pengujian selesai!"
