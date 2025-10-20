"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { getCurrentUser } from "@/lib/api";
import toast from "react-hot-toast";
import {
  MagnifyingGlass,
  Plus,
  DotsThreeVertical,
  Users,
  Calendar,
  Books,
} from "phosphor-react";

interface ClassData {
  id: number;
  class_name: string;
  subject: string | null;
  description: string | null;
  class_code: string;
  teacher_name: string;
  student_count: number;
  assignment_count: number;
  user_role: string;
}

// Mock data for demonstration (Backend class features disabled)
const MOCK_CLASSES: ClassData[] = [
  {
    id: 1,
    class_name: "MPPL (A)",
    subject: null,
    description: null,
    class_code: "MPPL2024A",
    teacher_name: "Dr. Budi Santoso",
    student_count: 30,
    assignment_count: 5,
    user_role: "student",
  },
  {
    id: 2,
    class_name: "Rekayasa Kebutuhan (B)",
    subject: null,
    description: null,
    class_code: "RK2024B",
    teacher_name: "Prof. Siti Aminah",
    student_count: 25,
    assignment_count: 7,
    user_role: "student",
  },
  {
    id: 3,
    class_name: "PBKK (C)",
    subject: null,
    description: null,
    class_code: "PBKK2024C",
    teacher_name: "Ir. Ahmad Hidayat",
    student_count: 28,
    assignment_count: 4,
    user_role: "teacher",
  },
  {
    id: 4,
    class_name: "Aljabar Linear (D)",
    subject: null,
    description: null,
    class_code: "AL2024D",
    teacher_name: "Dr. Rina Wijaya",
    student_count: 32,
    assignment_count: 6,
    user_role: "student",
  },
  {
    id: 5,
    class_name: "Jaringan Komputer (A)",
    subject: null,
    description: null,
    class_code: "JK2024A",
    teacher_name: "Ir. Joko Susilo",
    student_count: 27,
    assignment_count: 5,
    user_role: "student",
  },
  {
    id: 6,
    class_name: "KKA (B)",
    subject: null,
    description: null,
    class_code: "KKA2024B",
    teacher_name: "Dr. Putri Lestari",
    student_count: 29,
    assignment_count: 8,
    user_role: "student",
  },
];

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [isProcessingOAuth, setIsProcessingOAuth] = useState(false);
  useEffect(() => {
    const token = searchParams.get("token");

    if (token && !isAuthenticated && !isProcessingOAuth) {
      setIsProcessingOAuth(true);

      const handleOAuthLogin = async () => {
        try {
          console.log("Processing OAuth token...");
          const userData = await getCurrentUser(token);
          console.log("👤 User data:", userData);

          if (userData) {
            login(userData, token, true);
            toast.success(`Selamat datang, ${userData.fullname}!`, {
              duration: 2000,
            });

            setTimeout(() => {
              window.location.href = "/home";
            }, 1500);
          }
        } catch (error) {
          console.error("OAuth error:", error);
          toast.error("Gagal login dengan OAuth");
          setIsProcessingOAuth(false);
          router.push("/login");
        }
      };

      handleOAuthLogin();
    }
  }, [searchParams, login, router, isAuthenticated, isProcessingOAuth]);

  if (isProcessingOAuth) {
    return <LoadingSpinner fullScreen text="Memproses login..." />;
  }

  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}

function HomeContent() {
  const [classes] = useState<ClassData[]>(MOCK_CLASSES);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab] = useState<"all" | "assessment">("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredClasses = classes.filter(
    (cls) =>
      cls.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClassColor = (index: number) => {
    const colors = [
      "bg-gradient-to-br from-yellow-600 to-yellow-700",
      "bg-gradient-to-br from-blue-700 to-blue-800",
      "bg-gradient-to-br from-yellow-600 to-yellow-700",
      "bg-gradient-to-br from-yellow-600 to-yellow-700",
      "bg-gradient-to-br from-blue-700 to-blue-800",
      "bg-gradient-to-br from-yellow-600 to-yellow-700",
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#2b2d31]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Memuat kelas..." />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#2b2d31]">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6 flex items-center gap-1 border-b border-gray-700 overflow-x-auto">
          <Link
            href="/home"
            className={`px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${
              activeTab === "all"
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Semua
            {activeTab === "all" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </Link>
          <Link
            href="/hasil-penilaian"
            className={`px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${
              activeTab === "assessment"
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Penilaian Saya
            {activeTab === "assessment" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
            )}
          </Link>
        </div>

        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Kelas Saya
            </h1>
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-[#1e1f22] rounded-3xl border-2 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-gray-100 transition-colors"
            />
            <MagnifyingGlass
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              weight="bold"
            />
          </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/">
            <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border-2 border-dashed border-gray-900 hover:border-gray-500 flex items-center justify-center group">
              <div className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-full bg-gray-700 group-hover:bg-gray-600 flex items-center justify-center transition-colors">
                  <Plus
                    className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400 group-hover:text-gray-300"
                    weight="bold"
                  />
                </div>
                <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 font-medium">
                  Buat Kelas Baru
                </p>
              </div>
            </div>
          </Link>

          {filteredClasses.map((cls, index) => (
            <div
              key={cls.id}
              className={`relative h-48 sm:h-56 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] shadow-lg ${getClassColor(
                index
              )}`}
            >
              <div className="relative z-10 p-4 sm:p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-auto">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-white/20 flex items-center justify-center">
                    <Books
                      className="w-5 h-5 sm:w-6 sm:h-6 text-dark dark:text-gray-200"
                      weight="bold"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toast("Menu opsi kelas");
                    }}
                    className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                  >
                    <DotsThreeVertical className="w-5 h-5" weight="bold" />
                  </button>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    {cls.class_name}
                  </h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-white/90 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" weight="bold" />
                      <span>Tanggal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" weight="bold" />
                      <span>Jumlah Partisipan</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredClasses.length === 0 && (
          <div className="text-center py-12 sm:py-20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gray-700 flex items-center justify-center">
                <Books
                  className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
                  weight="bold"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                Belum Ada Kelas
              </h3>
              <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">
                {searchQuery
                  ? "Tidak ada kelas yang cocok dengan pencarian"
                  : "Buat kelas baru atau bergabung dengan kelas yang ada"}
              </p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
