# 📚 AutoEssayGrader

Sistem otomatis untuk mengoreksi esai dari dokumen PDF yang di-scan menggunakan teknologi Computer Vision dan Natural Language Processing (NLP).

## 📋 Deskripsi Proyek

AutoEssayGrader adalah proyek ambisius yang menggabungkan dua bidang utama dalam kecerdasan buatan:

- **Computer Vision**: untuk membaca dan memproses dokumen scan
- **Natural Language Processing (NLP)**: untuk memahami dan menilai jawaban esai

Proyek ini bertujuan untuk mengotomatisasi proses penilaian esai, sehingga dapat membantu guru dan dosen dalam mengevaluasi hasil ujian secara efisien dan objektif.

## 👥 Tim Pengembang

| Divisi       | Anggota Tim                      | Peran     |
| ------------ | -------------------------------- | --------- |
| **Frontend** | Muhammad Azhar Aziz              | Developer |
|              | Christoforus Indra Bagus Pratama | Developer |
|              | Nadin Nabil Hafizh Ayyasy        | Developer |
| **AI**       | Choirul Anam                     | Leader    |
|              | Rachmat Ramadhan                 | Developer |
|              | Muh. Buyung Saloka               | Developer |
| **Backend**  | Pramuditya Faiz Ardiansyah       | Developer |
|              | Alvin Zanua Putra                | Developer |

## 🛠️ Teknologi dan Tools

Proyek ini menggunakan bahasa pemrograman **Python** dengan berbagai pustaka yang mendukung pengolahan dokumen dan kecerdasan buatan.

### 📄 Pemrosesan Dokumen & OCR (Optical Character Recognition)

Tools untuk membaca dan mengekstrak teks dari gambar hasil scan:

| Library            | Fungsi                 | Keunggulan                                                        |
| ------------------ | ---------------------- | ----------------------------------------------------------------- |
| **PyMuPDF (Fitz)** | Konversi PDF ke gambar | Cepat dan efisien untuk manipulasi PDF                            |
| **Pillow (PIL)**   | Manipulasi gambar      | Pustaka dasar untuk pengolahan gambar Python                      |
| **OpenCV**         | Computer Vision        | Deteksi kotak jawaban, pembersihan noise, preprocessing           |
| **Pytesseract**    | OCR Engine             | Wrapper Python untuk Tesseract Google, mendukung Bahasa Indonesia |
| **EasyOCR**        | OCR Engine             | Alternatif modern, mudah digunakan untuk teks tidak rapi          |

### 🧠 Natural Language Processing (NLP)

Tools untuk memahami dan menilai konten teks jawaban:

| Library                       | Fungsi              | Keunggulan                                                  |
| ----------------------------- | ------------------- | ----------------------------------------------------------- |
| **NLTK/SpaCy**                | Preprocessing teks  | Tokenization, stopword removal, stemming/lemmatization      |
| **Scikit-learn**              | Machine Learning    | Konversi teks ke vektor (TF-IDF), model klasifikasi/regresi |
| **Gensim**                    | Word Embeddings     | Word2Vec, pemodelan topik, analisis kontekstual             |
| **Hugging Face Transformers** | Deep Learning       | Model pra-terlatih (BERT, IndoBERT) untuk analisis semantik |
| **Sentence-Transformers**     | Semantic Similarity | Penghitungan kesamaan makna antar kalimat                   |

## ⚙️ Alur Kerja Sistem

Berikut adalah alur kerja lengkap sistem AutoEssayGrader:

### 🔄 Pipeline Pemrosesan

```
📄 PDF Input → 🖼️ Image Conversion → 📦 Area Detection → 🔍 OCR → 🧠 NLP Analysis → 📊 Scoring
```

### 📋 Langkah-langkah Proses

#### 1️⃣ Pra-pemrosesan Dokumen

- **Input**: File PDF hasil scan
- **Konversi**: PyMuPDF mengubah setiap halaman menjadi gambar beresolusi tinggi (300 DPI)
- **Output**: Gambar siap untuk pemrosesan lebih lanjut

#### 2️⃣ Deteksi dan Isolasi Area Jawaban

- **Deteksi Kotak**: OpenCV memindai gambar untuk menemukan kontur persegi panjang
- **Crop Area**: Gambar dipotong hanya menyisakan area dalam kotak jawaban
- **Keuntungan**: Meningkatkan akurasi OCR secara signifikan

#### 3️⃣ Ekstraksi Teks dengan OCR

- **Preprocessing**: Pembersihan gambar (grayscale, contrast enhancement)
- **OCR Process**: Pytesseract/EasyOCR mengkonversi tulisan menjadi teks digital
- **Output**: Raw text dari setiap area jawaban

#### 4️⃣ Penilaian dan Analisis

## 📊 Metode Penilaian

Sistem menyediakan tiga pendekatan penilaian dengan tingkat kompleksitas yang berbeda:

### 🎯 Pendekatan A: Berbasis Kata Kunci (Sederhana)

| Aspek             | Detail                                                                                          |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **Mekanisme**     | Menghitung kata kunci/frasa penting yang muncul dalam jawaban                                   |
| **✅ Kelebihan**  | • Mudah diimplementasikan<br>• Cepat dalam pemrosesan<br>• Transparan dalam penilaian           |
| **❌ Kekurangan** | • Tidak memahami sinonim<br>• Tidak mempertimbangkan konteks<br>• Kaku terhadap variasi jawaban |

### 🧠 Pendekatan B: Kesamaan Semantik (Menengah)

| Aspek             | Detail                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Mekanisme**     | Menggunakan Sentence-Transformers (IndoBERT) untuk menghitung Cosine Similarity                                    |
| **✅ Kelebihan**  | • Memahami makna, bukan hanya kata<br>• Mengenali sinonim dan variasi kalimat<br>• Lebih fleksibel dalam penilaian |
| **❌ Kekurangan** | • Membutuhkan pemahaman ML<br>• Komputasi lebih berat<br>• Perlu fine-tuning model                                 |

### 🤖 Pendekatan C: Machine Learning Terlatih (Canggih)

| Aspek             | Detail                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| **Mekanisme**     | Model terlatih pada dataset jawaban esai dengan skor rujukan                                         |
| **✅ Kelebihan**  | • Akurasi tertinggi<br>• Dapat disesuaikan kriteria kompleks<br>• Belajar dari pola data historis    |
| **❌ Kekurangan** | • Membutuhkan dataset besar<br>• Proses training memakan waktu<br>• Kompleksitas implementasi tinggi |

#### 5️⃣ Output dan Reporting

- **Skor Akhir**: Nilai numerik atau kategorial (A-E)
- **Detail Analisis**: Kata kunci terdeteksi / tingkat kesamaan semantik
- **Raw Text**: Teks asli hasil ekstraksi OCR untuk verifikasi
- **Confidence Score**: Tingkat kepercayaan sistem terhadap hasil

## 💡 Best Practices & Rekomendasi

### 📋 Standarisasi Format Lembar Jawaban

| Aspek                | Rekomendasi                 | Manfaat                    |
| -------------------- | --------------------------- | -------------------------- |
| **Desain Kotak**     | Garis tebal, kontras tinggi | Mudah dideteksi OpenCV     |
| **Pemisahan Area**   | Satu kotak per jawaban      | Mencegah jawaban tercampur |
| **Identitas Siswa**  | Area khusus dengan QR Code  | Otomatisasi identifikasi   |
| **Format Penulisan** | HURUF KAPITAL CETAK         | Meningkatkan akurasi OCR   |
| **Alat Tulis**       | Pulpen hitam, tinta jelas   | Kualitas scan optimal      |

### 🎯 Strategi Pengembangan

#### 🚀 Fase 1: MVP (Minimum Viable Product)

1. Konversi PDF → Gambar
2. Deteksi kotak jawaban
3. Ekstraksi teks OCR
4. Pencocokan kata kunci dasar

#### 📈 Fase 2: Enhancement

1. Implementasi semantic similarity
2. Fine-tuning model NLP
3. Optimasi akurasi OCR
4. Interface pengguna yang user-friendly

#### 🎓 Fase 3: Advanced Features

1. Machine learning model terlatih
2. Multi-language support
3. Batch processing
4. Analytics dan reporting

### 🔧 Kunci Jawaban Komprehensif

- **Kata Kunci**: Sertakan sinonim dan variasi terminologi
- **Semantic**: Tulis jawaban ideal dalam berbagai struktur kalimat
- **Scoring Rubric**: Definisikan kriteria penilaian yang jelas dan konsisten

### ⚠️ Limitation Awareness

- **Akurasi OCR**: Tidak akan mencapai 100% pada tulisan tangan
- **Human Verification**: Sediakan interface untuk review dan koreksi manual
- **Fallback Mechanism**: Sistem backup jika automated scoring gagal

---

