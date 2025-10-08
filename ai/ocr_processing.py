import cv2
import numpy as np
import os
from PIL import Image
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import matplotlib.pyplot as plt

# ========================================================================
#  BAGIAN 1: LOAD MODEL DAN PROSESOR
# ========================================================================
# Pastikan model sudah diunduh atau akan diunduh saat pertama kali dijalankan
processor = TrOCRProcessor.from_pretrained("microsoft/trocr-large-handwritten")
model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-large-handwritten")

def ocr_single_line(image_pil):
    """
    Melakukan OCR untuk satu baris teks dengan TrOCR.
    """
    if image_pil.mode != 'RGB':
        image_pil = image_pil.convert('RGB')
    pixel_values = processor(images=image_pil, return_tensors="pt").pixel_values
    generated_ids = model.generate(pixel_values)
    return processor.batch_decode(generated_ids, skip_special_tokens=True)[0]


# ========================================================================
#  BAGIAN 2: DESKEW (LURUSKAN GAMBAR)
# ========================================================================
def deskew_image_hough(color_image):
    """
    Mendeteksi dan mengoreksi kemiringan menggunakan Hough Line Transform.
    """
    gray = cv2.cvtColor(color_image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 100, minLineLength=50, maxLineGap=10)

    if lines is None:
        return color_image # Kembalikan gambar asli jika tidak ada garis terdeteksi

    angles = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        angle = np.rad2deg(np.arctan2(y2 - y1, x2 - x1))
        angles.append(angle)

    # Batasi hanya sudut kecil (hindari garis vertikal)
    valid_angles = [a for a in angles if -15 < a < 15]
    
    median_angle = 0
    if len(valid_angles) > 0:
        median_angle = np.median(valid_angles)

    (h, w) = color_image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
    deskewed = cv2.warpAffine(color_image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return deskewed


# ========================================================================
#  BAGIAN 3: HAPUS GARIS HITAM HORIZONTAL 
# ========================================================================
def remove_horizontal_lines_morphological(color_image):
    """
    Menghapus garis horizontal berwarna hitam atau biru muda dari gambar berwarna.
    """
    hsv = cv2.cvtColor(color_image, cv2.COLOR_BGR2HSV)
    
    # === Deteksi garis biru muda ===
    lower_blue = np.array([90, 20, 120])
    upper_blue = np.array([120, 180, 255])
    blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)
    
    # === Deteksi garis hitam (gelap) ===
    gray = cv2.cvtColor(color_image, cv2.COLOR_BGR2GRAY)
    black_mask = cv2.inRange(gray, 0, 70)
    
    # Gabungkan keduanya
    combined_mask = cv2.bitwise_or(blue_mask, black_mask)
    
    # === Kernel horizontal untuk mendeteksi garis ===
    cols = combined_mask.shape[1]
    horizontal_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (cols // 30, 1))
    detected_lines = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, horizontal_kernel, iterations=2)
    
    # === Hilangkan garis dari gambar warna ===
    mask_inv = cv2.bitwise_not(detected_lines)
    no_lines_color = cv2.bitwise_and(color_image, color_image, mask=mask_inv)
    
    # === Konversi ke grayscale dan threshold ===
    gray_no_lines = cv2.cvtColor(no_lines_color, cv2.COLOR_BGR2GRAY)
    thresh = cv2.threshold(gray_no_lines, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    
    # === Pastikan area garis benar-benar dihapus dari hasil threshold ===
    # Artinya, di area yang dulu biru/hitam → jadikan hitam (0) lagi
    thresh[detected_lines > 0] = 0

    return thresh


# ========================================================================
#  BAGIAN 4: SEGMENTASI DAN OCR (BAGIAN YANG DIPERBAIKI)
# ========================================================================
def segment_and_ocr(image_input, debug_dir="debug_results"):
    """
    Membaca gambar (path atau numpy array), meluruskan, membersihkan,
    segmentasi, dan menjalankan OCR. Hasil berupa string teks dari gambar.
    Sekarang mendukung penghapusan garis horizontal berwarna biru muda.
    """
    if isinstance(image_input, str):
        color_image = cv2.imread(image_input)
        if color_image is None:
            return "⚠️ Gambar tidak ditemukan."
    else:
        color_image = image_input.copy()

    if not os.path.exists(debug_dir):
        os.makedirs(debug_dir)

    # === Deskew ===
    deskewed_color_image = deskew_image_hough(color_image)
    cv2.imwrite(os.path.join(debug_dir, "debug_deskewed.png"), deskewed_color_image)

    # === Hilangkan garis horizontal hitam (proses morfologi biasa) ===
    image_no_lines = remove_horizontal_lines_morphological(deskewed_color_image)
    cv2.imwrite(os.path.join(debug_dir, "debug_cleaned_binary.png"), image_no_lines)

    # === Segmentasi berdasarkan proyeksi horizontal ===
    projection = np.sum(image_no_lines, axis=1)
    line_ranges, in_line, start = [], False, 0

    for i, val in enumerate(projection):
        if val > 0 and not in_line:
            in_line, start = True, i
        elif val == 0 and in_line:
            in_line = False
            line_ranges.append((start, i))
    if in_line:
        line_ranges.append((start, len(projection)))

    MIN_LINE_HEIGHT = 10
    MERGE_GAP = 2
    filtered_lines = [r for r in line_ranges if (r[1] - r[0]) > MIN_LINE_HEIGHT]

    merged_lines = []
    if filtered_lines:
        prev_start, prev_end = filtered_lines[0]
        for start, end in filtered_lines[1:]:
            if start - prev_end < MERGE_GAP:
                prev_end = end
            else:
                merged_lines.append((prev_start, prev_end))
                prev_start, prev_end = start, end
        merged_lines.append((prev_start, prev_end))

    plt.figure(figsize=(10, 4))
    plt.plot(projection)
    plt.title("Horizontal Projection")
    plt.savefig(os.path.join(debug_dir, "debug_projection.png"))
    plt.close()

    # === OCR per baris ===
    final_text = []
    for i, (y_start, y_end) in enumerate(merged_lines):
        roi_cleaned_binary = image_no_lines[max(0, y_start - 5): y_end + 5, :]
        if roi_cleaned_binary.size == 0:
            continue

        roi_final = cv2.bitwise_not(roi_cleaned_binary)
        roi_pil = Image.fromarray(roi_final)
        text = ocr_single_line(roi_pil)
        final_text.append(text)

        cv2.imwrite(os.path.join(debug_dir, f"debug_crop_{i}.png"), roi_final)

    return "\n".join(final_text)

