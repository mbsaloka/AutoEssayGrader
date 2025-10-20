"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Books } from "phosphor-react";

interface Participant {
  id: number;
  name: string;
}

const MOCK_PARTICIPANTS: Participant[] = [
  { id: 1, name: "Alvin Zanua Putra" },
  { id: 2, name: "Christiano Ronaldo" },
  { id: 3, name: "Lionel Messi" },
  { id: 4, name: "Alvin Zanua Putra" },
  { id: 5, name: "Alvin Zanua Putra" },
  { id: 6, name: "Alvin Zanua Putra" },
  { id: 7, name: "Alvin Zanua Putra" },
  { id: 8, name: "Alvin Zanua Putra" },
  { id: 9, name: "Alvin Zanua Putra" },
  { id: 10, name: "Alvin Zanua Putra" },
  { id: 11, name: "Alvin Zanua Putra" },
  { id: 12, name: "Alvin Zanua Putra" },
  { id: 13, name: "Alvin Zanua Putra" },
  { id: 14, name: "Alvin Zanua Putra" },
  { id: 15, name: "Alvin Zanua Putra" },
  { id: 16, name: "Alvin Zanua Putra" },
];

export default function PesertaPage() {
  return (
    <ProtectedRoute>
      <PesertaContent />
    </ProtectedRoute>
  );
}

function PesertaContent() {
  const router = useRouter();
  const [participants] = useState<Participant[]>(MOCK_PARTICIPANTS);
  const handleBack = () => {
    router.push("/class");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#2b2d31]">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
                Kelas Baru
              </h1>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
            Peserta
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="!bg-slate-800 border border-white rounded-xl px-4 sm:px-6 py-3 sm:py-4 transition-all hover:bg-gray-800/50 hover:bg-slate-400 dark:hover:border-gray-800"
              >
                <p className="text-sm sm:text-base !text-white font-medium">
                  {participant.name}
                </p>
              </div>
            ))}
          </div>
          {participants.length === 0 && (
            <div className="text-center py-12 sm:py-20">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
                  <Books
                    className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400"
                    weight="bold"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  Belum Ada Peserta
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  Undang peserta untuk bergabung ke kelas ini
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}