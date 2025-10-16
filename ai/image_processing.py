import cv2
import numpy as np
import matplotlib.pyplot as plt

# ========================================================================
#  HELPER: Order points (Dari kode Anda)
# ========================================================================
def order_points(pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]   # top-left
    rect[2] = pts[np.argmax(s)]   # bottom-right

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right
    rect[3] = pts[np.argmax(diff)]  # bottom-left
    return rect

# ========================================================================
#  LANGKAH 1: PERSPECTIVE TRANSFORM (Dari kode Anda)
# ========================================================================
def correct_perspective(image_input):
    if isinstance(image_input, str):
        image = cv2.imread(image_input)
    else:
        image = image_input.copy()

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    # Adaptive threshold agar tahan bayangan
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 35, 10
    )

    # Menyatukan tepi yang patah
    kernel = np.ones((5, 5), np.uint8)
    morph = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    page_contour = None
    max_area = 0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 10000:
            continue
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        x, y, w, h = cv2.boundingRect(approx)
        ratio = w / float(h)
        if 0.7 < ratio < 1.4 and area > max_area:
            page_contour = approx
            max_area = area

    if page_contour is None or len(page_contour) < 4:
        x, y, w, h = cv2.boundingRect(max(contours, key=cv2.contourArea))
        ordered_corners = np.array([
            [x, y],
            [x+w, y],
            [x+w, y+h],
            [x, y+h]
        ], dtype=np.float32)
    else:
        ordered_corners = order_points(page_contour.reshape(-1, 2))

    # Perspective transform
    (tl, tr, br, bl) = ordered_corners
    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    maxWidth = int(max(widthA, widthB))
    maxHeight = int(max(heightA, heightB))

    dst_pts = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(ordered_corners, dst_pts)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))

    print("✅ [Perspective] Koreksi perspektif berhasil (robust mode).")
    return warped


# ========================================================================
#  LANGKAH 2: ROTATIONAL DESKEW 
# ========================================================================
def correct_rotation_hough(image_input):
    """
    Menyempurnakan pelurusan gambar dengan mengoreksi rotasi minor
    menggunakan Hough Line Transform.
    Bisa menerima path string ATAU numpy array.
    """
    if isinstance(image_input, str):
        image = cv2.imread(image_input)
        if image is None: raise FileNotFoundError(f"Gagal membaca gambar dari {image_input}")
    else:
        image = image_input.copy()

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.bitwise_not(gray) # Inversi warna agar teks putih, latar hitam
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=100, maxLineGap=10)

    if lines is None:
        print("⚠️ [Rotation] Tidak ada garis terdeteksi. Melewatkan koreksi rotasi.")
        return image

    angles = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        angle = np.rad2deg(np.arctan2(y2 - y1, x2 - x1))
        # Hanya pertimbangkan garis yang mendekati horizontal
        if abs(angle) < 45:
            angles.append(angle)
    
    if not angles:
        print("⚠️ [Rotation] Tidak ada garis horizontal valid. Melewatkan koreksi rotasi.")
        return image

    median_angle = np.median(angles)
    print(f"✅ [Rotation] Sudut kemiringan terdeteksi: {median_angle:.2f} derajat. Mengoreksi...")

    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
    rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    
    return rotated

# ========================================================================
#  MASTER PREPROCESSING PIPELINE
# ========================================================================
def preprocess_image(image_input, visualize=False):
    """
    Menjalankan pipeline preprocessing lengkap:
    1. Koreksi perspektif.
    2. Koreksi rotasi (fine-tuning).
    """
    # Langkah 1: Koreksi Perspektif
    perspective_corrected = correct_perspective(image_input)
    
    # Langkah 2: Koreksi Rotasi sebagai penyempurnaan
    fully_corrected = correct_rotation_hough(perspective_corrected)
    
    if visualize:
        plt.figure(figsize=(10, 12))
        
        # Tampilkan gambar asli jika inputnya path
        if isinstance(image_input, str):
            original_image = cv2.imread(image_input)
            plt.subplot(1, 2, 1)
            plt.imshow(cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB))
            plt.title("Gambar Asli")
            plt.axis("off")
        
        # Tampilkan hasil akhir
        plt.subplot(1, 2, 2)
        plt.imshow(cv2.cvtColor(fully_corrected, cv2.COLOR_BGR2RGB))
        plt.title("Hasil Preprocessing Akhir")
        plt.axis("off")
        plt.show()
        
    return fully_corrected


# ========================================================================
#  DETEKSI KOTAK JAWABAN (Dari kode Anda, tidak ada perubahan)
# ========================================================================
def detect_answer_boxes(image_input, max_boxes=4, visualize=False):
    if isinstance(image_input, str):
        image = cv2.imread(image_input)
        if image is None:
            raise FileNotFoundError(f"Gagal membaca gambar dari {image_input}")
    else:
        image = image_input.copy()

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # 🔧 Gunakan adaptive threshold agar lebih stabil di DPI tinggi
    binary = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 15, 8
    )

    # 🔧 Deteksi kontur
    contours, hierarchy = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        print("⚠️ [Boxes] Tidak ada kontur valid ditemukan.")
        return []

    h_img, w_img = image.shape[:2]
    img_area = h_img * w_img
    min_area, max_area = img_area * 0.1, img_area * 0.3

    boxes_detected = []
    for i, cnt in enumerate(contours):
        approx = cv2.approxPolyDP(cnt, 0.3 * cv2.arcLength(cnt, True), True)
        if len(approx) <= 4: 
            x, y, w, h = cv2.boundingRect(approx)
            area = w * h
            if min_area < area < max_area:
                boxes_detected.append((x, y, w, h, area))

    # print(f"✅ [Boxes] Jumlah kotak terdeteksi: {len(boxes_detected)}")

    # Seleksi non-overlap
    unique_boxes = []
    for box in boxes_detected:
        (x, y, w, h, area) = box
        threshold = min(w_img, h_img) * 0.5
        if not any(abs(x - ux) < threshold and abs(y - uy) < threshold for (ux, uy, uw, uh, ua) in unique_boxes):
            unique_boxes.append(box)

    unique_boxes = sorted(unique_boxes, key=lambda b: b[4], reverse=True)[:max_boxes]
    unique_boxes = sorted(unique_boxes, key=lambda b: b[1])
    
    margin_boxes = []
    for (x, y, w, h, area) in unique_boxes:
        # Padding ke dalam sebesar 500px
        padding_x = 50
        padding_y = 50

        # Batasi padding agar tidak lebih dari setengah ukuran kotak
        pad_x = min(padding_x, w // 2 - 1)
        pad_y = min(padding_y, h // 2 - 1)

        # Hitung koordinat baru
        x1 = max(0, x + pad_x)
        y1 = max(0, y + pad_y)
        x2 = min(w_img, x + w - pad_x)
        y2 = min(h_img, y + h - pad_y)

        # Pastikan tidak terbalik (kadang kotak kecil bisa jadi negatif)
        if x2 > x1 and y2 > y1:
            margin_boxes.append((x1, y1, x2 - x1, y2 - y1, area))


    if visualize:
        preview = image.copy()
        for i, (x, y, w, h, _) in enumerate(margin_boxes):
            cv2.rectangle(preview, (x, y), (x + w, y + h), (0, 255, 0), 3)
            cv2.putText(preview, f"Box {i+1}", (x, y - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        plt.figure(figsize=(10, 8))
        plt.imshow(cv2.cvtColor(preview, cv2.COLOR_BGR2RGB))
        plt.title("Kotak Jawaban + Sub-box")
        plt.axis("off")
        plt.show()

    return [image[y:y+h, x:x+w] for (x, y, w, h, _) in margin_boxes]


# ========================================================================
#  MAIN EXECUTION
# ========================================================================
if __name__ == "__main__":
    # Ganti dengan path gambar Anda
    img_path = "output_images/page_1.png" 

    print("===== MEMULAI PROSES =====")
    # Jalankan pipeline preprocessing lengkap
    preprocessed_img = preprocess_image(img_path, visualize=False)
    
    print("\n===== MENDETEKSI KOTAK JAWABAN =====")
    # Deteksi kotak jawaban dari gambar yang sudah diproses
    answer_boxes = detect_answer_boxes(preprocessed_img, max_boxes=5, visualize=True)
    
    print(f"\nProses Selesai. Ditemukan {len(answer_boxes)} kotak jawaban.")

    # Tampilkan hasil crop (opsional)
    if answer_boxes:
        for i, box_img in enumerate(answer_boxes):
            plt.figure(figsize=(8, 4))
            plt.imshow(cv2.cvtColor(box_img, cv2.COLOR_BGR2RGB))
            plt.title(f"Hasil Crop Kotak Jawaban {i+1}")
            plt.axis("off")
            plt.show()
            
            
            