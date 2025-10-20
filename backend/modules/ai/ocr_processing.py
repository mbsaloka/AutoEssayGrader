import cv2
import numpy as np
import os
from PIL import Image
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import matplotlib.pyplot as plt

# ========================================================================
#  SALIN BAGIAN 1, 2, DAN 3 DARI KODE ASLI ANDA KE SINI
# ========================================================================
# (Fungsi ocr_single_line, deskew_image_hough, remove_horizontal_lines_morphological)

# ... (kode BAGIAN 1, 2, 3 Anda di sini) ...
processor = TrOCRProcessor.from_pretrained("microsoft/trocr-large-handwritten")
model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-large-handwritten")

def ocr_single_line(image_pil):
    if image_pil.mode != 'RGB':
        image_pil = image_pil.convert('RGB')
    pixel_values = processor(images=image_pil, return_tensors="pt").pixel_values
    generated_ids = model.generate(pixel_values)
    return processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

def deskew_image_hough(color_image):
    gray = cv2.cvtColor(color_image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 100, minLineLength=50, maxLineGap=10)
    if lines is None: return color_image
    angles = [np.rad2deg(np.arctan2(l[0][3] - l[0][1], l[0][2] - l[0][0])) for l in lines]
    valid_angles = [a for a in angles if -15 < a < 15]
    median_angle = np.median(valid_angles) if len(valid_angles) > 0 else 0
    (h, w) = color_image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
    return cv2.warpAffine(color_image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

def remove_horizontal_lines_morphological(color_image):
    hsv = cv2.cvtColor(color_image, cv2.COLOR_BGR2HSV)
    lower_blue = np.array([90, 20, 120]); upper_blue = np.array([120, 180, 255])
    blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)
    gray = cv2.cvtColor(color_image, cv2.COLOR_BGR2GRAY)
    black_mask = cv2.inRange(gray, 0, 70)
    combined_mask = cv2.bitwise_or(blue_mask, black_mask)
    cols = combined_mask.shape[1]
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (cols // 30, 1))
    detected_lines = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    mask_inv = cv2.bitwise_not(detected_lines)
    no_lines_color = cv2.bitwise_and(color_image, color_image, mask=mask_inv)
    gray_no_lines = cv2.cvtColor(no_lines_color, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(gray_no_lines, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    thresh[detected_lines > 0] = 0
    return thresh


# ========================================================================
#  BAGIAN 4: SEGMENTASI DAN OCR (VERSI IMPROVISASI)
# ========================================================================
# Tambahkan fungsi baru ini di mana saja sebelum fungsi 'segment_lines_with_contours'
def segment_lines_with_contours(binary_image, min_w=5, min_h=5):
    """
    Segmentasi baris teks dan memfilter noise langsung pada level kontur.
    
    Logika ini mengelompokkan kontur menjadi baris, kemudian memvalidasi setiap
    baris untuk memastikan itu bukan noise (misalnya, titik tunggal) sebelum
    mengembalikannya.
    """
    # 1. Temukan dan filter kontur awal
    contours, _ = cv2.findContours(binary_image.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    initial_boxes = sorted(
        [cv2.boundingRect(c) for c in contours if cv2.boundingRect(c)[2] > min_w and cv2.boundingRect(c)[3] > min_h],
        key=lambda b: b[1]
    )

    if not initial_boxes:
        return []

    # 2. Logika Inti: Kelompokkan box menjadi baris-baris secara dinamis
    lines = []
    if initial_boxes:
        current_line_group = [initial_boxes[0]]
        for box in initial_boxes[1:]:
            min_y_in_group = min(b[1] for b in current_line_group)
            max_y_in_group = max(b[1] + b[3] for b in current_line_group)
            current_box_center_y = box[1] + box[3] / 2
            
            if min_y_in_group <= current_box_center_y <= max_y_in_group:
                current_line_group.append(box)
            else:
                lines.append(current_line_group)
                current_line_group = [box]
        lines.append(current_line_group)

    # 3. Gabungkan dan VALIDASI setiap grup menjadi ROI yang bersih
    final_line_rois = []
    
    # Atur ambang batas untuk dianggap sebagai baris yang valid
    MIN_COMPONENTS_PER_LINE = 2  # Harus terdiri dari minimal 2 kontur (misal: dua huruf, atau huruf 'i' dan titiknya)
    MIN_WIDTH_PER_LINE = 40      # Atau, lebarnya harus minimal 40 piksel (untuk kata pendek seperti "dan")

    for line_group in lines:
        if not line_group: continue
        
        # Dapatkan koordinat ekstrem untuk membuat satu kotak besar
        min_x = min(b[0] for b in line_group)
        min_y = min(b[1] for b in line_group)
        max_x = max(b[0] + b[2] for b in line_group)
        max_y = max(b[1] + b[3] for b in line_group)
        
        width = max_x - min_x
        height = max_y - min_y
        num_components = len(line_group)
        
        # (LANGKAH BARU) Filter noise di sini
        # Baris dianggap valid jika memenuhi salah satu kondisi:
        # 1. Terdiri dari cukup banyak komponen/kontur.
        # 2. Memiliki lebar yang signifikan.
        if num_components >= MIN_COMPONENTS_PER_LINE or width >= MIN_WIDTH_PER_LINE:
            final_line_rois.append((min_x, min_y, width, height))

    # Urutkan ROI final sekali lagi berdasarkan posisi Y untuk memastikan urutan benar
    final_line_rois.sort(key=lambda r: r[1])
    
    return final_line_rois

def segment_and_ocr(image_input, debug_dir="debug_results"):
    """
    Membaca gambar, meluruskan, membersihkan, melakukan segmentasi
    berbasis kontur, dan menjalankan OCR.
    """
    if isinstance(image_input, str):
        color_image = cv2.imread(image_input)
        if color_image is None: return "⚠️ Gambar tidak ditemukan."
    else:
        color_image = image_input.copy()

    if not os.path.exists(debug_dir): os.makedirs(debug_dir)

    # === Langkah 1 & 2: Deskew dan Hapus Garis (Sama seperti sebelumnya) ===
    deskewed_color_image = deskew_image_hough(color_image)
    cv2.imwrite(os.path.join(debug_dir, "debug_deskewed.png"), deskewed_color_image)

    image_no_lines = remove_horizontal_lines_morphological(deskewed_color_image)
    cv2.imwrite(os.path.join(debug_dir, "debug_cleaned_binary.png"), image_no_lines)

    # === Langkah 3: Segmentasi dengan Kontur (Metode Baru) ===
    line_bounding_boxes = segment_lines_with_contours(image_no_lines)

    # Gambar kotak-kotak baris yang terdeteksi untuk debugging
    debug_img_contours = deskewed_color_image.copy()
    for x, y, w, h in line_bounding_boxes:
        cv2.rectangle(debug_img_contours, (x, y), (x + w, y + h), (0, 255, 0), 2)
    cv2.imwrite(os.path.join(debug_dir, "debug_line_detection.png"), debug_img_contours)


    # === Langkah 4: OCR per baris yang tersegmentasi ===
    final_text = []
    padding = 5 # Beri sedikit ruang di sekitar teks saat memotong
    for i, (x, y, w, h) in enumerate(line_bounding_boxes):
        # Crop dari gambar biner yang sudah bersih
        roi_cleaned_binary = image_no_lines[max(0, y - padding):y + h + padding, 
                                            max(0, x - padding):x + w + padding]
        
        if roi_cleaned_binary.size == 0: continue

        # Invert warna (teks menjadi hitam, background putih) untuk model TrOCR
        roi_final = cv2.bitwise_not(roi_cleaned_binary)
        
        # Konversi ke format yang bisa dibaca TrOCR dan jalankan OCR
        roi_pil = Image.fromarray(roi_final)
        text = ocr_single_line(roi_pil)
        final_text.append(text)

        cv2.imwrite(os.path.join(debug_dir, f"debug_crop_{i}.png"), roi_final)

    return "\n".join(final_text)



# ========================================================================
#  CONTOH PENGGUNAAN
# ========================================================================
if __name__ == '__main__':
    # Ganti dengan path gambar Anda
    image_path = 'page_2.jpg' 
    
    # Jalankan proses OCR
    hasil_teks = segment_and_ocr(image_path)
    
    # Cetak hasil
    print("="*30)
    print("      HASIL EKSTRAKSI TEKS")
    print("="*30)
    print(hasil_teks)   