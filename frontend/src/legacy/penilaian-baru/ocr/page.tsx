"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api-config";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Books,
  CalendarBlank,
  Clock,
  UploadSimple,
  Play,
} from "phosphor-react";

// Type untuk soal
interface Question {
  id: number;
  title: string;
  content: string;
}

export default function NewGradingPage() {
  return (
    <ProtectedRoute>
      <NewGradingContent />
    </ProtectedRoute>
  );
}

function NewGradingContent() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Mock data soal
  const [questions] = useState<Question[]>([
    {
      id: 1,
      title: "Soal 1",
      content:
        "Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1.Ini soal nomer 1. soal nomer 1.",
    },
    {
      id: 2,
      title: "Soal 2",
      content:
        "Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2.",
    },
    {
      id: 3,
      title: "Soal 3",
      content:
        "Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3.",
    },
  ]);

  const handleBack = () => {
    router.push("/penilaian-baru");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success(`File ${file.name} dipilih`);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Silakan pilih file terlebih dahulu");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Anda harus login terlebih dahulu");
        setIsUploading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/ocr/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload gagal");
      }

      const data = await response.json();
      toast.success("File berhasil diupload dan diproses!");

      // Redirect ke hasil penilaian atau halaman lain
      setTimeout(() => {
        router.push("/hasil-penilaian");
      }, 1500);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Terjadi kesalahan saat memproses file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#2b2d31]">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" weight="bold" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                  <Books className="w-6 h-6 text-white" weight="bold" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Tugas 1
                </h1>
              </div>
            </div>

            {/* Kumpulkan Tugas Button - Desktop */}
            <div className="hidden sm:block">
              <Button
                onClick={handleSubmit}
                variant="primary"
                size="md"
                className="flex items-center gap-2"
                disabled={!selectedFile || isUploading}
                isLoading={isUploading}
              >
                <Play className="w-5 h-5" weight="bold" />
                Kumpulkan Tugas
              </Button>
            </div>
          </div>
        </div>

        {/* Deadline Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Deadline</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <CalendarBlank
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  weight="bold"
                />
                <input
                  type="text"
                  value="10 Oktober 2025"
                  readOnly
                  className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none cursor-default"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="relative">
                <Clock
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  weight="bold"
                />
                <input
                  type="text"
                  value="23.59"
                  readOnly
                  className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none cursor-default"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Soal Section */}
        {questions.map((question) => (
          <div key={question.id} className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {question.title}
            </h2>
            <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6">
              <p className="text-gray-300 leading-relaxed">
                {question.content}
              </p>
            </div>
          </div>
        ))}

        {/* File Jawaban Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            File Jawaban
          </h2>
          <div
            onClick={handleUploadClick}
            className="bg-[#1e1f22] border-2 border-dashed border-gray-700 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-gray-600 hover:bg-gray-800/30 transition-all"
          >
            <UploadSimple
              className="w-16 h-16 text-gray-400 mb-4"
              weight="bold"
            />
            <p className="text-white font-medium mb-2">
              {selectedFile ? selectedFile.name : "Upload Jawaban"}
            </p>
            {selectedFile && (
              <p className="text-gray-400 text-sm">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            )}
            {!selectedFile && (
              <p className="text-gray-400 text-sm mt-2">
                Klik untuk memilih file
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Kumpulkan Tugas Button - Mobile */}
        <div className="sm:hidden flex justify-center">
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            disabled={!selectedFile || isUploading}
            isLoading={isUploading}
          >
            <Play className="w-5 h-5" weight="bold" />
            Kumpulkan Tugas
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
