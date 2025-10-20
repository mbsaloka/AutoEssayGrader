"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Eye,
  UserPlus,
  DotsThreeVertical,
  Plus,
  CalendarBlank,
} from "phosphor-react";

interface Assignment {
  id: number;
  title: string;
  deadline: string;
  color: "yellow" | "blue";
}

// Mock data untuk assignments
const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: 1,
    title: "Tugas 1",
    deadline: "Deadline: 10 Oktober 2025",
    color: "yellow",
  },
  {
    id: 2,
    title: "Tugas 2",
    deadline: "Deadline: 17 Oktober 2025",
    color: "blue",
  },
  {
    id: 3,
    title: "ETS",
    deadline: "Deadline: 24 Oktober 2025",
    color: "yellow",
  },
  {
    id: 4,
    title: "Tugas 3",
    deadline: "Deadline: 10 November 2025",
    color: "blue",
  },
  {
    id: 5,
    title: "Tugas 4",
    deadline: "Deadline: 17 November 2025",
    color: "yellow",
  },
  {
    id: 6,
    title: "EAS",
    deadline: "Deadline: 26 November 2025",
    color: "blue",
  },
];

export default function ClassPage() {
  return (
    <ProtectedRoute>
      <ClassContent />
    </ProtectedRoute>
  );
}

function ClassContent() {
  const router = useRouter();
  const [assignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);

  const handleBack = () => {
    router.push("/home");
  };

  const getAssignmentColor = (color: "yellow" | "blue") => {
    return color === "yellow"
      ? "bg-gradient-to-br from-yellow-600 to-yellow-700"
      : "bg-gradient-to-br from-blue-700 to-blue-800";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#2b2d31]">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleBack}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Kelas Baru
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={() => router.push("/peserta")}
                size="sm"
                className="flex items-center gap-2 flex-1 sm:flex-none text-xs sm:text-sm !bg-gray-700 hover:bg-gray-500 !text-white"
              >
                <Eye
                  className="w-4 h-4 sm:w-5 sm:h-5 !text-white"
                  weight="bold"
                />
                <span className="hidden sm:inline">Lihat Peserta</span>
                <span className="sm:hidden">Peserta</span>
              </Button>
              <Button
                onClick={() => router.push("/invite-peserta")}
                variant="primary"
                size="sm"
                className="flex items-center gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
              >
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" weight="bold" />
                <span className="hidden sm:inline">Undang Peserta</span>
                <span className="sm:hidden">Undang</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Penilaian Section */}
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Penilaian
          </h2>

          {/* Assignment Cards Grid */}
          <div className="space-y-3 sm:space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`${getAssignmentColor(
                  assignment.color
                )} rounded-xl p-3 sm:p-4 flex items-center justify-between transition-all hover:scale-[1.01] shadow-lg`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CalendarBlank
                      className="w-4 h-4 sm:w-5 sm:h-5 text-white/80"
                      weight="bold"
                    />
                    <div>
                      <h3 className="text-base sm:text-lg font-bold !text-white">
                        {assignment.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-white/80">
                        {assignment.deadline}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toast("Menu opsi tugas")}
                  className="!text-white hover:bg-white/20 rounded-full p-1.5 sm:p-2 transition-colors"
                >
                  <DotsThreeVertical className="w-5 h-5" weight="bold" />
                </button>
              </div>
            ))}

            {/* Add New Assignment Button */}
            <button
              onClick={() => toast.success("Tambah penilaian baru")}
              className="w-full border-2 border-dashed border-gray-600 hover:border-gray-500 bg-white dark:bg-gray-950 rounded-xl p-4 sm:p-6 flex items-center justify-center gap-2 sm:gap-3 transition-all hover:bg-gray-white group"
            >
              <Plus
                className="w-5 h-5 sm:w-6 sm:h-6 !text-white group-hover:text-gray-300"
                weight="bold"
              />
              <span className="text-sm sm:text-base !text-white group-hover:text-gray-300 font-medium">
                Tambah Penilaian Baru
              </span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
