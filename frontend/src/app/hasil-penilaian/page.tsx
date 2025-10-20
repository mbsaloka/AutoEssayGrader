"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import { ArrowLeft, Books, DotsThreeVertical } from "phosphor-react";

// Type untuk data nilai peserta
interface StudentScore {
  id: number;
  name: string;
  score: number;
  status: "lulus" | "tidak-lulus";
}

export default function HasilPenilaianPage() {
  return (
    <ProtectedRoute>
      <HasilPenilaianContent />
    </ProtectedRoute>
  );
}

function HasilPenilaianContent() {
  const router = useRouter();

  // Mock data nilai peserta
  const [students] = useState<StudentScore[]>([
    { id: 1, name: "Alvin Zanua Putra", score: 100, status: "lulus" },
    { id: 2, name: "Christiano Ronaldo", score: 50, status: "tidak-lulus" },
    { id: 3, name: "Lionel Messi", score: 10, status: "tidak-lulus" },
    { id: 4, name: "Neymar Junior", score: 80, status: "lulus" },
    { id: 5, name: "Lamine Yamal", score: 100, status: "lulus" },
    { id: 6, name: "Sergio Ramos", score: 100, status: "lulus" },
    { id: 7, name: "Ole Romeny", score: 90, status: "lulus" },
    { id: 8, name: "Yakob Sayuri", score: 86, status: "lulus" },
    { id: 9, name: "Ragnar Oratmangoen", score: 20, status: "tidak-lulus" },
    { id: 10, name: "Marc Klok", score: 57, status: "tidak-lulus" },
    { id: 11, name: "Marten Paes", score: 100, status: "lulus" },
    { id: 12, name: "Jay Idzes", score: 100, status: "lulus" },
    { id: 13, name: "Kevin Diks", score: 63, status: "tidak-lulus" },
    { id: 14, name: "Sandy Walsh", score: 100, status: "lulus" },
    { id: 15, name: "Joey Pelupessy", score: 100, status: "lulus" },
    { id: 16, name: "Tom Haye", score: 100, status: "lulus" },
  ]);

  const totalStudents = students.length;
  const passedStudents = students.filter((s) => s.status === "lulus").length;
  const failedStudents = students.filter(
    (s) => s.status === "tidak-lulus"
  ).length;
  const passPercentage = Math.round((passedStudents / totalStudents) * 100);

  const handleBack = () => {
    router.push("/class");
  };

  const handleDetail = (studentId: number) => {
    // Navigate to detail page
    console.log("View detail for student:", studentId);
  };

  const handleMenuClick = (studentId: number) => {
    console.log("Menu clicked for student:", studentId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#2b2d31]">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <button
              onClick={handleBack}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <Books
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  weight="bold"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Hasil Penilaian
              </h1>
            </div>
          </div>
        </div>

        {/* Statistik Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Statistik
          </h2>
          <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Bar Chart - Kelulusan */}
              <div>
                <h3 className="text-sm sm:text-base text-white font-semibold text-center mb-4 sm:mb-6">
                  Kelulusan
                </h3>
                <div className="flex items-end justify-center gap-8 sm:gap-12 h-48 sm:h-64">
                  {/* Lulus Bar */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-16 sm:w-24 bg-green-500 rounded-t-lg relative"
                      style={{
                        height: `${
                          (passedStudents / totalStudents) * 100 * 1.8
                        }px`,
                        maxHeight: "180px",
                      }}
                    >
                      <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 text-sm sm:text-base text-white font-semibold">
                        {passedStudents}
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3 text-xs sm:text-base text-gray-400 font-medium">
                      Lulus
                    </div>
                  </div>

                  {/* Tidak Lulus Bar */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-16 sm:w-24 bg-red-500 rounded-t-lg relative"
                      style={{
                        height: `${
                          (failedStudents / totalStudents) * 100 * 1.8
                        }px`,
                        maxHeight: "180px",
                      }}
                    >
                      <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 text-sm sm:text-base text-white font-semibold">
                        {failedStudents}
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3 text-xs sm:text-base text-gray-400 font-medium">
                      Tidak Lulus
                    </div>
                  </div>
                </div>
              </div>

              {/* Donut Chart - Persentase Kelulusan */}
              <div>
                <h3 className="text-sm sm:text-base text-white font-semibold text-center mb-4 sm:mb-6">
                  Persentase Kelulusan
                </h3>
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <div className="relative w-36 h-36 sm:w-48 sm:h-48">
                    {/* SVG Donut Chart */}
                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      {/* Background Circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#4a4d52"
                        strokeWidth="12"
                      />
                      {/* Progress Circle - Lulus (Green) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="12"
                        strokeDasharray={`${passPercentage * 2.51} ${
                          251 - passPercentage * 2.51
                        }`}
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Percentage Text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl sm:text-4xl font-bold text-white">
                        {passPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 sm:gap-8 mt-4 sm:mt-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
                    <span className="text-gray-300 text-xs sm:text-sm">
                      Lulus
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-500 rounded"></div>
                    <span className="text-gray-300 text-xs sm:text-sm">NT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nilai Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Nilai
          </h2>
          <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-4 sm:p-6">
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-400 text-center">
                Jumlah Jawaban : {totalStudents}
              </p>
            </div>

            {/* Student List */}
            <div className="space-y-2 sm:space-y-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="bg-[#2b2d31] rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                >
                  {/* Student Name */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <p className="text-sm sm:text-base text-white font-medium truncate">
                      {student.name}
                    </p>
                  </div>

                  {/* Score Badge and Actions */}
                  <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Score Badge */}
                    <div
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-white text-sm sm:text-base min-w-[50px] sm:min-w-[60px] text-center ${
                        student.status === "lulus"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {student.score}
                    </div>

                    {/* Detail Button */}
                    <Button
                      onClick={() => handleDetail(student.id)}
                      variant="outline"
                      size="sm"
                      className="border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm"
                    >
                      Detail
                    </Button>

                    {/* Menu Button */}
                    <button
                      onClick={() => handleMenuClick(student.id)}
                      className="text-gray-400 hover:text-white transition-colors p-1 sm:p-2"
                    >
                      <DotsThreeVertical
                        className="w-4 h-4 sm:w-5 sm:h-5"
                        weight="bold"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
