#!/bin/bash
# Script untuk menguji AI Auto Grading dengan 1 kunci jawaban dan 3 variasi jawaban mahasiswa
# Target nilai: 100, 80, 60
# Pastikan server FastAPI sudah aktif di http://127.0.0.1:8000 dan Ollama juga berjalan

URL="http://127.0.0.1:8000/grade"
# MODEL="llama3:8b"
MODEL="phi3:mini"
# MODEL="llama3.2:1b"
# MODEL="mistral:7b-instruct"

ANSWER_KEY="Sistem operasi memiliki peran penting dalam mengatur memori komputer agar setiap proses dapat berjalan dengan efisien. Manajemen memori mencakup alokasi, dealokasi, dan proteksi terhadap ruang memori. Salah satu teknik dasar adalah partitioning, di mana memori dibagi menjadi beberapa bagian. Selain itu, ada paging yang membagi memori menjadi blok tetap bernama frame, serta segmentation yang membagi berdasarkan unit logis seperti fungsi atau modul. Teknik lain yang populer adalah virtual memory, yang memungkinkan sistem menjalankan program lebih besar dari kapasitas fisik dengan menggunakan disk sebagai perluasan memori. Virtual memory biasanya diimplementasikan dengan demand paging. Sistem operasi juga harus menangani fragmentasi, baik internal maupun eksternal, serta menyediakan mekanisme swapping untuk memindahkan proses antara memori utama dan disk. Proteksi memori juga penting agar proses tidak saling mengganggu. Semua mekanisme ini bekerja bersama untuk memastikan penggunaan memori efisien, mencegah crash, dan memberikan ilusi bahwa setiap proses memiliki ruang memori sendiri. Manajemen memori yang baik sangat berpengaruh pada performa keseluruhan sistem."

# === Case 1 ===
echo "=== Case 1 ==="
curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d "{
    \"answer_key\": \"$ANSWER_KEY\",
    \"student_answer\": \"Sistem operasi bertanggung jawab mengatur alokasi dan proteksi memori. Teknik dasar mencakup partitioning, paging, dan segmentation. Virtual memory memberi ilusi memori besar menggunakan disk, biasanya dengan demand paging. Sistem juga mengelola fragmentasi, baik internal maupun eksternal, serta swapping untuk memindahkan proses ke disk bila perlu. Dengan manajemen ini, proses tidak saling mengganggu, dan performa sistem tetap terjaga.\",
    \"model\": \"$MODEL\"
  }" | jq .

# === Case 2 ===
echo "=== Case 2 ==="
curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d "{
    \"answer_key\": \"$ANSWER_KEY\",
    \"student_answer\": \"Sistem operasi memiliki manajemen memori seperti paging dan virtual memory. Virtual memory membantu jalankan program lebih besar dari RAM. Swapping memindahkan proses dari memori ke disk. Dengan manajemen ini, sistem tetap efisien. Namun, saya tidak membahas segmentation maupun fragmentasi secara detail.\",
    \"model\": \"$MODEL\"
  }" | jq .

# === Case 3 ===
echo "=== Case 3 ==="
curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d "{
    \"answer_key\": \"$ANSWER_KEY\",
    \"student_answer\": \"Sistem operasi menyimpan semua data di RAM dan memori tidak pernah dibagi. Jika RAM penuh, komputer akan langsung berhenti. Kadang sistem memakai disk, tapi itu hanya untuk menyimpan file, bukan untuk menjalankan program.\",
    \"model\": \"$MODEL\"
  }" | jq .

# === Case 4 ===
echo "=== Case 4 ==="
curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d "{
    \"answer_key\": \"$ANSWER_KEY\",
    \"student_answer\": \"Manajemen memori dalam sistem operasi bertujuan agar pemakaian RAM efisien. Teknik umum seperti partitioning, paging, dan segmentation membantu membagi ruang memori. Virtual memory digunakan agar program besar tetap bisa dijalankan, biasanya dengan demand paging. Sistem juga melakukan swapping untuk memindahkan proses dan mencegah fragmentasi. Semua ini membuat proses berjalan stabil dan tidak saling mengganggu.\",
    \"model\": \"$MODEL\"
  }" | jq .

  # === Case 5 ===
echo "=== Case 5 ==="
curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d "{
    \"answer_key\": \"$ANSWER_KEY\",
    \"student_answer\": \"Manajemen memori berarti sistem operasi menyimpan semua data program di hard disk. Setiap aplikasi mendapat bagian tetap di disk, dan sistem tidak bisa menambah atau mengurangi alokasi itu. Paging dan segmentation tidak digunakan karena memperlambat sistem. Virtual memory justru memperkecil kapasitas RAM sebenarnya.\",
    \"model\": \"$MODEL\"
  }" | jq .

# === Case 6 ===
echo "=== Case 6 ==="
curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -d "{
    \"answer_key\": \"$ANSWER_KEY\",
    \"student_answer\": \"Sistem operasi digunakan untuk mengatur jaringan internet dan koneksi WiFi. Manajemen memori dilakukan oleh kartu grafis agar tampilan layar lebih halus. Jika komputer lambat, solusinya adalah menambah antivirus atau mengganti browser. Paging dan virtual memory tidak berhubungan dengan sistem operasi.\",
    \"model\": \"$MODEL\"
  }" | jq .
