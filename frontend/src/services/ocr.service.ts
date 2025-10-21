import { apiClient } from "@/lib/api-client";
import { OCRResultRead } from "@/types";

export const ocrService = {
  // Upload a PDF for OCR processing
  uploadPDF: async (file: File): Promise<OCRResultRead> => {
    const formData = new FormData();
    formData.append("file", file);
    
    return apiClient.uploadFile<OCRResultRead>("/api/ocr/upload", formData);
  },

  // Get the latest OCR result
  getLatestResult: async (): Promise<OCRResultRead> => {
    return apiClient.get<OCRResultRead>("/api/ocr/result");
  },
};

