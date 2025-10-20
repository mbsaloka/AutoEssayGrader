#!/bin/bash
# Script untuk menguji AI Auto Grading dengan 1 kunci jawaban dan 3 variasi jawaban mahasiswa
# Target nilai: 100, 80, 60
# Pastikan server FastAPI sudah aktif di http://127.0.0.1:8000 dan Ollama juga berjalan

URL="http://127.0.0.1:8000/grade"
# MODEL="llama3:8b"
# MODEL="phi3:mini"
# MODEL="llama3.2:1b"
# MODEL="llama3.2:3b"
# MODEL="mistral:7b-instruct"
# MODEL="qwen2.5:7b-instruct"
MODEL="qwen2.5:3b-instruct"
# MODEL="gemma:7b"

# QUESTION="Jelaskan peran sistem operasi dalam manajemen memori beserta teknik-teknik yang digunakan untuk mengelola memori secara efisien!"

# ANSWER_KEY="Sistem operasi memiliki peran penting dalam mengatur memori komputer agar setiap proses dapat berjalan dengan efisien. Manajemen memori mencakup alokasi, dealokasi, dan proteksi terhadap ruang memori. Salah satu teknik dasar adalah partitioning, di mana memori dibagi menjadi beberapa bagian. Selain itu, ada paging yang membagi memori menjadi blok tetap bernama frame, serta segmentation yang membagi berdasarkan unit logis seperti fungsi atau modul. Teknik lain yang populer adalah virtual memory, yang memungkinkan sistem menjalankan program lebih besar dari kapasitas fisik dengan menggunakan disk sebagai perluasan memori. Virtual memory biasanya diimplementasikan dengan demand paging. Sistem operasi juga harus menangani fragmentasi, baik internal maupun eksternal, serta menyediakan mekanisme swapping untuk memindahkan proses antara memori utama dan disk. Proteksi memori juga penting agar proses tidak saling mengganggu. Semua mekanisme ini bekerja bersama untuk memastikan penggunaan memori efisien, mencegah crash, dan memberikan ilusi bahwa setiap proses memiliki ruang memori sendiri. Manajemen memori yang baik sangat berpengaruh pada performa keseluruhan sistem."

# declare -a STUDENT_ANSWERS=(
# "Sistem operasi bertanggung jawab mengatur alokasi dan proteksi memori. Teknik dasar mencakup partitioning, paging, dan segmentation. Virtual memory memberi ilusi memori besar menggunakan disk, biasanya dengan demand paging. Sistem juga mengelola fragmentasi, baik internal maupun eksternal, serta swapping untuk memindahkan proses ke disk bila perlu. Dengan manajemen ini, proses tidak saling mengganggu, dan performa sistem tetap terjaga."
# "Sistem operasi memiliki manajemen memori seperti paging dan virtual memory. Virtual memory membantu jalankan program lebih besar dari RAM. Swapping memindahkan proses dari memori ke disk. Dengan manajemen ini, sistem tetap efisien. Namun, saya tidak membahas segmentation maupun fragmentasi secara detail."
# "Sistem operasi menyimpan semua data di RAM dan memori tidak pernah dibagi. Jika RAM penuh, komputer akan langsung berhenti. Kadang sistem memakai disk, tapi itu hanya untuk menyimpan file, bukan untuk menjalankan program."
# "Manajemen memori dalam sistem operasi bertujuan agar pemakaian RAM efisien. Teknik umum seperti partitioning, paging, dan segmentation membantu membagi ruang memori. Virtual memory digunakan agar program besar tetap bisa dijalankan, biasanya dengan demand paging. Sistem juga melakukan swapping untuk memindahkan proses dan mencegah fragmentasi. Semua ini membuat proses berjalan stabil dan tidak saling mengganggu."
# "Manajemen memori berarti sistem operasi menyimpan semua data program di hard disk. Setiap aplikasi mendapat bagian tetap di disk, dan sistem tidak bisa menambah atau mengurangi alokasi itu. Paging dan segmentation tidak digunakan karena memperlambat sistem. Virtual memory justru memperkecil kapasitas RAM sebenarnya."
# "Sistem operasi digunakan untuk mengatur jaringan internet dan koneksi WiFi. Manajemen memori dilakukan oleh kartu grafis agar tampilan layar lebih halus. Jika komputer lambat, solusinya adalah menambah antivirus atau mengganti browser. Paging dan virtual memory tidak berhubungan dengan sistem operasi."
# "Sistem operasi memiliki peran penting dalam mengatur memori komputer agar setiap proses dapat berjalan dengan efisien. Manajemen memori mencakup alokasi, dealokasi, dan proteksi terhadap ruang memori. Salah satu teknik dasar adalah partitioning, di mana memori dibagi menjadi beberapa bagian. Selain itu, ada paging yang membagi memori menjadi blok tetap bernama frame, serta segmentation yang membagi berdasarkan unit logis seperti fungsi atau modul. Teknik lain yang populer adalah virtual memory, yang memungkinkan sistem menjalankan program lebih besar dari kapasitas fisik dengan menggunakan disk sebagai perluasan memori. Virtual memory biasanya diimplementasikan dengan demand paging. Sistem operasi juga harus menangani fragmentasi, baik internal maupun eksternal, serta menyediakan mekanisme swapping untuk memindahkan proses antara memori utama dan disk. Proteksi memori juga penting agar proses tidak saling mengganggu. Semua mekanisme ini bekerja bersama untuk memastikan penggunaan memori efisien, mencegah crash, dan memberikan ilusi bahwa setiap proses memiliki ruang memori sendiri. Manajemen memori yang baik sangat berpengaruh pada performa keseluruhan sistem."
# )

# QUESTION="Jelaskan perbedaan antara habitat dan ekosistem. Berikan contoh konkret dari masing-masing konsep."


# ANSWER_KEY="Perbedaan utama adalah bahwa habitat adalah lokasi fisik di mana organisme tinggal, sementara ekosistem melibatkan interaksi antara organisme dan lingkungan fisiknya. Sebagai contoh, sebuah sungai dapat menjadi habitat untuk berbagai spesies ikan, tetapi ekosistem sungai mencakup ikan-ikan tersebut, tumbuhan air, bakteri, dan elemen-elemen fisik seperti air, batuan, dan suhu air."

# declare -a STUDENT_ANSWERS=(
# "Perbedaan utama adalah bahwa habitat adalah lokasi fisik di mana organisme tinggal, sementara ekosistem melibatkan interaksi antara organisme dan lingkungan fisiknya. Sebagai contoh, sebuah sungai dapat menjadi habitat untuk berbagai spesies ikan, tetapi ekosistem sungai mencakup ikan-ikan tersebut, tumbuhan air, bakteri, dan elemen-elemen fisik seperti air, batuan, dan suhu air."
# "Perbedaan utama adalah bahwa habitat adalah lokasi fisik di mana organisme tinggal, sementara ekosistem melibatkan interaksi antara organisme dan lingkungan fisiknya."
# "Perbedaan mendasar terletak pada ruang lingkupnya: habitat adalah tempat fisik tempat suatu organisme hidup, sedangkan ekosistem mencakup hubungan timbal balik antara organisme dan lingkungan fisiknya. Misalnya, sebuah sungai berfungsi sebagai habitat bagi berbagai jenis ikan, namun ekosistem sungai mencakup tidak hanya ikan, tetapi juga tumbuhan air, mikroorganisme, serta faktor-faktor abiotik seperti air, batu, dan suhu."
# "Ekosistem yang baik adalah yang membangun."
# "Saya tidak tahu."
# "Habitat dan ekosistem adalah hal yang sama."
# ""
# "ekosistem ada yang hidup ada yang mati, habitat adalah kumpulan makhluk hidup. contohnya ekosistem kolam, habitat ular"
# )


QUESTION="Bagaimana globalisasi mempengaruhi identitas budaya lokal?"


ANSWER_KEY="Globalisasi bisa menyebabkan pergeseran budaya lokal karena masuknya budaya asing, namun juga dapat memperkuat identitas lokal melalui promosi global."

declare -a STUDENT_ANSWERS=(
"Globalisasi bisa menyebabkan pergeseran budaya lokal karena masuknya budaya asing, namun juga dapat memperkuat identitas lokal melalui promosi global."
"Saya tidak tahu."
"Globalisasi itu penting untuk ekonomi."
"Globalisasi membuat semua budaya menjadi sama."
"Globalisasi berpengaruh kuat dalam identitas budaya lokal, karena budaya asing masuk dan mempengaruhi cara hidup masyarakat setempat. Namun, globalisasi juga bisa memperkuat identitas lokal dengan cara mempromosikan budaya tersebut ke dunia internasional melalui media sosial, pariwisata, dan perdagangan. Contohnya, makanan tradisional yang dulu hanya dikenal di daerah tertentu kini bisa dikenal secara global berkat globalisasi."
""
"Budaya lokal tidak terpengaruh oleh globalisasi."
"Saya cinta budaya lokal saya dan menolak globalisasi."
)

# === Mulai pengujian ===
echo "🔍 Menguji model: $MODEL"
echo "============================================="

start_time=$(date +%s)
declare -a SCORES=()

for i in "${!STUDENT_ANSWERS[@]}"; do
  case_num=$((i+1))
  echo "=== Case $case_num ==="

  response=$(curl -s -X POST $URL \
    -H "Content-Type: application/json" \
    -d "{
      \"question\": \"$QUESTION\",
      \"answer_key\": \"$ANSWER_KEY\",
      \"student_answer\": \"${STUDENT_ANSWERS[$i]}\",
      \"model\": \"$MODEL\"
    }")

  echo "$response" | jq .

  # Ambil skor akhir dari JSON (asumsi ada field "final_score" di hasil API)
  score=$(echo "$response" | jq -r '.final_score // .score // empty')
  SCORES+=("$score")
  echo "Skor Case $case_num: $score"
  echo
done

end_time=$(date +%s)
total_time=$((end_time - start_time))

# === Ringkasan hasil ===
echo "============================================="
echo "✅ Ringkasan Hasil ($MODEL)"
echo "---------------------------------------------"
total_score=0
count=0
for s in "${SCORES[@]}"; do
  if [[ "$s" != "null" && "$s" != "" ]]; then
    total_score=$(echo "$total_score + $s" | bc)
    count=$((count + 1))
  fi
done

if [ $count -gt 0 ]; then
  avg_score=$(echo "scale=2; $total_score / $count" | bc)
else
  avg_score=0
fi

echo "Rata-rata Skor : $avg_score"
echo "Total Waktu    : ${total_time}s"
echo "---------------------------------------------"
for i in "${!SCORES[@]}"; do
  echo "Case $((i+1)): ${SCORES[$i]}"
done
echo "============================================="