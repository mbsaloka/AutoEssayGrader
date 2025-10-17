import time
from sentence_transformers import SentenceTransformer, util
import torch
import pandas as pd

# =========================================
# ⚙️ Konfigurasi
# =========================================
# Pilih mode eksekusi: "cpu" atau "cuda" (GPU)
DEVICE_MODE = "cuda"  # ubah ke "cuda" jika ingin pakai GPU

# =========================================
# 🧠 Daftar model yang akan diuji
# =========================================
MODEL_LIST = {
    "bert-base-multilingual-cased": "/home/mbsaloka/.cache/huggingface/hub/models--bert-base-multilingual-cased/snapshots/3f076fdb1ab68d5b2880cb87a0886f315b8146f8",
    "all-mpnet-base-v2": "/home/mbsaloka/.cache/huggingface/hub/models--sentence-transformers--all-mpnet-base-v2/snapshots/e8c3b32edf5434bc2275fc9bab85f82640a19130",
    "LaBSE": "/home/mbsaloka/.cache/huggingface/hub/models--sentence-transformers--LaBSE/snapshots/836121a0533e5664b21c7aacc5d22951f2b8b25b",
    "E5-small-v2": "/home/mbsaloka/.cache/huggingface/hub/models--intfloat--multilingual-e5-small/snapshots/c007d7ef6fd86656326059b28395a7a03a7c5846",
    "E5-base-v2": "/home/mbsaloka/.cache/huggingface/hub/models--intfloat--multilingual-e5-base/snapshots/835193815a3936a24a0ee7dc9e3d48c1fbb19c55",
    "MiniLM": "/home/mbsaloka/.cache/huggingface/hub/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/c9745ed1d9f207416be6d2e6f8de32d1f16199bf",
    # "IndoBERT": "indobenchmark/indobert-lite-base-p1"
}

# =========================================
# 🧾 Contoh input
# =========================================
# =========================================
# 🧾 Jawaban Kunci
# =========================================
ANSWER_KEY = """Sistem operasi memiliki peran penting dalam mengatur memori komputer agar setiap proses dapat berjalan dengan efisien.
Manajemen memori mencakup alokasi, dealokasi, dan proteksi terhadap ruang memori. Salah satu teknik dasar adalah partitioning,
di mana memori dibagi menjadi beberapa bagian. Selain itu, ada paging yang membagi memori menjadi blok tetap bernama frame,
serta segmentation yang membagi berdasarkan unit logis seperti fungsi atau modul. Teknik lain yang populer adalah virtual memory,
yang memungkinkan sistem menjalankan program lebih besar dari kapasitas fisik dengan menggunakan disk sebagai perluasan memori.
Virtual memory biasanya diimplementasikan dengan demand paging. Sistem operasi juga harus menangani fragmentasi, baik internal maupun eksternal,
serta menyediakan mekanisme swapping untuk memindahkan proses antara memori utama dan disk. Proteksi memori juga penting agar proses tidak saling mengganggu.
Semua mekanisme ini bekerja bersama untuk memastikan penggunaan memori efisien, mencegah crash, dan memberikan ilusi bahwa setiap proses memiliki ruang memori sendiri.
Manajemen memori yang baik sangat berpengaruh pada performa keseluruhan sistem."""

# =========================================
# 🧾 Jawaban Siswa (6 test case)
# =========================================
STUDENT_ANSWERS = [
    # Case 1
    """Sistem operasi bertanggung jawab mengatur alokasi dan proteksi memori. Teknik dasar mencakup partitioning, paging, dan segmentation.
Virtual memory memberi ilusi memori besar menggunakan disk, biasanya dengan demand paging. Sistem juga mengelola fragmentasi, baik internal maupun eksternal,
serta swapping untuk memindahkan proses ke disk bila perlu. Dengan manajemen ini, proses tidak saling mengganggu, dan performa sistem tetap terjaga.""",

    # Case 2
    """Sistem operasi memiliki manajemen memori seperti paging dan virtual memory. Virtual memory membantu jalankan program lebih besar dari RAM.
Swapping memindahkan proses dari memori ke disk. Dengan manajemen ini, sistem tetap efisien. Namun, saya tidak membahas segmentation maupun fragmentasi secara detail.""",

    # Case 3
    """Sistem operasi menyimpan semua data di RAM dan memori tidak pernah dibagi. Jika RAM penuh, komputer akan langsung berhenti.
Kadang sistem memakai disk, tapi itu hanya untuk menyimpan file, bukan untuk menjalankan program.""",

    # Case 4
    """Manajemen memori dalam sistem operasi bertujuan agar pemakaian RAM efisien. Teknik umum seperti partitioning, paging, dan segmentation
membantu membagi ruang memori. Virtual memory digunakan agar program besar tetap bisa dijalankan, biasanya dengan demand paging.
Sistem juga melakukan swapping untuk memindahkan proses dan mencegah fragmentasi. Semua ini membuat proses berjalan stabil dan tidak saling mengganggu.""",

    # Case 5
    """Manajemen memori berarti sistem operasi menyimpan semua data program di hard disk. Setiap aplikasi mendapat bagian tetap di disk,
dan sistem tidak bisa menambah atau mengurangi alokasi itu. Paging dan segmentation tidak digunakan karena memperlambat sistem.
Virtual memory justru memperkecil kapasitas RAM sebenarnya.""",

    # Case 6
    """Sistem operasi digunakan untuk mengatur jaringan internet dan koneksi WiFi. Manajemen memori dilakukan oleh kartu grafis agar tampilan layar lebih halus.
Jika komputer lambat, solusinya adalah menambah antivirus atau mengganti browser. Paging dan virtual memory tidak berhubungan dengan sistem operasi."""
]

# =========================================
# 🧮 Fungsi Benchmark
# =========================================
def benchmark_model(model_name: str, model_path: str, answer_key: str, student_answers: list, device_mode: str):
    print(f"\n🔍 Menguji model: {model_name} ({device_mode})")

    # Pastikan mode GPU valid
    if device_mode == "cuda" and not torch.cuda.is_available():
        print("⚠️ GPU tidak tersedia. Beralih ke CPU.")
        device_mode = "cpu"

    start_load = time.time()
    model = SentenceTransformer(model_path, device=device_mode)
    load_time = (time.time() - start_load) * 1000

    # Warmup
    model.encode("warmup", convert_to_tensor=True)

    # Encode jawaban kunci
    emb_key = model.encode(answer_key, convert_to_tensor=True, normalize_embeddings=True)

    results = []
    for idx, ans in enumerate(student_answers, 1):
        start_infer = time.time()
        emb_ans = model.encode(ans, convert_to_tensor=True, normalize_embeddings=True)
        sim = util.cos_sim(emb_key, emb_ans).item()
        infer_time = (time.time() - start_infer) * 1000

        device = next(model.parameters()).device
        memory_allocated = (
            torch.cuda.memory_allocated(device) / (1024**2) if device.type == "cuda" else 0
        )

        results.append({
            "Model": model_name,
            "Student": f"Case {idx}",
            "Similarity": round(sim, 4),
            "Load Time (ms)": round(load_time, 2),
            "Inference Time (ms)": round(infer_time, 2),
            "Device": str(device),
            "GPU Mem (MB)": round(memory_allocated, 2),
        })

        print(f"✅ Case {idx}: Similarity={sim:.4f}, Infer={infer_time:.2f}ms")

    return results

# =========================================
# 🚀 Main Benchmarking Loop
# =========================================
if __name__ == "__main__":
    all_results = []
    print(f"🧠 Benchmarking Semantic Similarity Models ({DEVICE_MODE.upper()} Mode)...\n")

    if DEVICE_MODE == "cpu":
        torch.cuda.is_available = lambda: False

    for name, path in MODEL_LIST.items():
        try:
            res = benchmark_model(name, path, ANSWER_KEY, STUDENT_ANSWERS, DEVICE_MODE)
            all_results.extend(res)
        except Exception as e:
            print(f"❌ Gagal memproses {name}: {e}")

    # DataFrame per siswa
    df_cases = pd.DataFrame(all_results)

    # Statistik ringkasan per model
    df_summary = df_cases.groupby("Model")["Similarity"].agg(["mean", "min", "max", "std"]).reset_index()
    df_summary.rename(columns={"mean": "Avg Similarity", "min": "Min Similarity", "max": "Max Similarity", "std": "Std Dev"}, inplace=True)

    # Tampilkan hasil
    print("\n📊 HASIL PER STUDENT CASE:")
    print(df_cases.to_string(index=False))
    print("\n📊 STATISTIK RINGKASAN PER MODEL:")
    print(df_summary.to_string(index=False))

    # Simpan CSV
    df_cases.to_csv(f"benchmark_cases_{DEVICE_MODE}.csv", index=False)
    df_summary.to_csv(f"benchmark_summary_{DEVICE_MODE}.csv", index=False)
    print(f"\n💾 CSV kasus siswa disimpan sebagai benchmark_cases_{DEVICE_MODE}.csv")
    print(f"💾 CSV ringkasan disimpan sebagai benchmark_summary_{DEVICE_MODE}.csv")
