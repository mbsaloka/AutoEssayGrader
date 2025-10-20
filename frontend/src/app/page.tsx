"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import GuestRoute from "@/components/GuestRoute";

export default function Home() {
  return (
    <GuestRoute>
      <HomeContent />
    </GuestRoute>
  );
}
function HomeContent() {
  return (
    <div className="min-h-screen flex flex-col bg-[#2b2d31] transition-colors duration-300">
      <Navbar />
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6">
              <span className="text-yellow-400">GRADE</span>
              <br />
              <span className="text-white">MIND</span>
            </h1>
          </div>
          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-white">
              Selamat Datang!
            </h2>
            <p className="text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 leading-relaxed text-gray-300">
              Mengoreksi esai kini tak lagi memakan waktu. Grade Mind adalah
              platform bertenaga AI yang merevolusi cara Anda menilai
              tugas-tugas mahasiswa. Mengoreksi esai tidak pernah secepat ini.
              Dengan teknologi OCR dan LLM, platform kami menilai jawaban
              tulisan tangan secara otomatis dan akurat. Kurangi beban
              administratif, fokus pada pendidikan.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:min-w-[140px]">
                  Masuk
                </Button>
              </Link>
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:min-w-[140px] text-white hover:bg-gray-700"
                >
                  Daftar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
