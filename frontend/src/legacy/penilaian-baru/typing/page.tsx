"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Textarea from "@/components/Textarea";
import toast from "react-hot-toast";
import { ArrowLeft, Books, CalendarBlank, Clock, Play } from "phosphor-react";

// Type untuk soal
interface Question {
  id: number;
  title: string;
  content: string;
}

// Type untuk jawaban
interface Answer {
  questionId: number;
  text: string;
}

export default function TypingGradingPage() {
  return (
    <ProtectedRoute>
      <TypingGradingContent />
    </ProtectedRoute>
  );
}

function TypingGradingContent() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // State untuk jawaban
  const [answers, setAnswers] = useState<Answer[]>(
    questions.map((q) => ({ questionId: q.id, text: "" }))
  );

  const handleBack = () => {
    router.push("/penilaian-baru");
  };

  const handleAnswerChange = (questionId: number, text: string) => {
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === questionId ? { ...answer, text } : answer
      )
    );
  };

  const handleSubmit = async () => {
    // Validasi: cek apakah semua jawaban sudah diisi
    const emptyAnswers = answers.filter((a) => !a.text.trim());
    if (emptyAnswers.length > 0) {
      toast.error("Mohon isi semua jawaban sebelum mengumpulkan tugas");
      return;
    }

    setIsSubmitting(true);

    try {
      // Di sini nanti akan dikirim ke backend untuk penilaian
      // Simulasi API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Jawaban berhasil dikumpulkan!");

      // Redirect ke dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Submit error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengumpulkan jawaban";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAnswerForQuestion = (questionId: number) => {
    return answers.find((a) => a.questionId === questionId)?.text || "";
  };

  // Hitung berapa soal yang sudah dijawab
  const answeredCount = answers.filter((a) => a.text.trim()).length;
  const totalCount = questions.length;

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
                  Tugas 1 - Ketik Manual
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
                disabled={answeredCount === 0 || isSubmitting}
                isLoading={isSubmitting}
              >
                <Play className="w-5 h-5" weight="bold" />
                Kumpulkan Tugas ({answeredCount}/{totalCount})
              </Button>
            </div>
          </div>

          {/* Progress Info */}
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg px-4 py-3 mb-4">
            <p className="text-blue-300 text-sm">
              💡 Ketik jawaban Anda untuk setiap soal di bawah ini. Progress:{" "}
              <span className="font-bold">
                {answeredCount} dari {totalCount} soal dijawab
              </span>
            </p>
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

        {/* Soal dan Jawaban Section */}
        {questions.map((question, index) => (
          <div key={question.id} className="mb-8">
            {/* Soal */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                {question.title}
              </h2>
              <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6">
                <p className="text-gray-300 leading-relaxed">
                  {question.content}
                </p>
              </div>
            </div>

            {/* Jawaban */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Jawaban Anda:
              </h3>
              <Textarea
                value={getAnswerForQuestion(question.id)}
                onChange={(e) =>
                  handleAnswerChange(question.id, e.target.value)
                }
                placeholder={`Ketik jawaban untuk ${question.title} di sini...`}
                rows={8}
                className="w-full"
              />
              <div className="flex justify-end mt-2">
                <span className="text-sm text-gray-400">
                  {getAnswerForQuestion(question.id).length} karakter
                </span>
              </div>
            </div>

            {/* Divider */}
            {index < questions.length - 1 && (
              <div className="border-t border-gray-700 mt-8"></div>
            )}
          </div>
        ))}

        {/* Kumpulkan Tugas Button - Mobile */}
        <div className="sm:hidden flex justify-center mt-8">
          <Button
            onClick={handleSubmit}
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-2"
            disabled={answeredCount === 0 || isSubmitting}
            isLoading={isSubmitting}
          >
            <Play className="w-5 h-5" weight="bold" />
            Kumpulkan Tugas ({answeredCount}/{totalCount})
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
