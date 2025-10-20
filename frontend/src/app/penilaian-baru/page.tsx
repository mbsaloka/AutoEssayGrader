"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Plus,
  Play,
} from "phosphor-react";

// Type untuk soal dan kunci jawaban
interface Question {
  id: number;
  question: string;
  answer: string;
}

// Type untuk jawaban peserta
interface StudentAnswer {
  id: number;
  name: string;
  filename: string;
}

// State type untuk menentukan tampilan
type ViewState =
  | "empty"
  | "with-questions"
  | "with-answers"
  | "deadline-passed";

export default function PenilaianBaruPage() {
  return (
    <ProtectedRoute>
      <PenilaianBaruContent />
    </ProtectedRoute>
  );
}

function PenilaianBaruContent() {
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>("empty");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [uploadedQuestions, setUploadedQuestions] = useState<File | null>(null);
  const [uploadedAnswers, setUploadedAnswers] = useState<File | null>(null);
  const [kkm, setKkm] = useState("75");

  // Mock data untuk soal yang sudah diinput
  const [questions] = useState<Question[]>([
    {
      id: 1,
      question:
        "Lorem ipsum dolor sit amet consectetur. Facilisis massa lobortis ac faucibus sed in facilisi. Lorem arcu lorem sit nulla ad.",
      answer:
        "Lorem ipsum dolor sit amet consectetur. Facilisis massa lobortis ac faucibus sed in facilisi. Lorem arcu lorem sit nulla ad piscing aliquam erat. Egestas habitant tempor at auctor. Lobortis sadipscing sodales varius vulputate ultrices facilisis sed.",
    },
    {
      id: 2,
      question:
        "Ini soal nomer 2: Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2. Ini soal nomer 2.",
      answer:
        "Lorem ipsum dolor sit amet consectetur. Facilisis massa lobortis ac faucibus sed in facilisi. Lorem arcu lorem sit nulla ad piscing aliquam erat. Egestas habitant tempor at auctor.",
    },
    {
      id: 3,
      question:
        "Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3. Ini soal nomer 3.",
      answer:
        "Lorem ipsum dolor sit amet consectetur. Facilisis massa lobortis ac faucibus sed in facilisi. Lorem arcu lorem sit nulla ad piscing aliquam erat. Egestas habitant tempor at auctor.",
    },
  ]);

  // Mock data untuk jawaban peserta
  const [studentAnswers] = useState<StudentAnswer[]>([
    { id: 1, name: "Alvin Zanua Putra", filename: "nama_file1.pdf" },
    { id: 2, name: "Christiano Ronaldo", filename: "nama_file2.pdf" },
    { id: 3, name: "Lionel Messi", filename: "nama_file3.pdf" },
    { id: 4, name: "Neymar Junior", filename: "nama_file4.pdf" },
    { id: 5, name: "Lamine Yamal", filename: "nama_file5.pdf" },
    { id: 6, name: "Sergio Ramos", filename: "nama_file6.pdf" },
    { id: 7, name: "Sahroni Idolaku", filename: "nama_file7.pdf" },
  ]);

  const questionsInputRef = useRef<HTMLInputElement>(null);
  const answersInputRef = useRef<HTMLInputElement>(null);

  const handleBack = () => {
    router.push("/class");
  };

  const handleQuestionsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedQuestions(file);
      toast.success("Soal dan kunci jawaban berhasil diunggah");
    }
  };

  const handleAnswersUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedAnswers(file);
      toast.success("File jawaban berhasil diunggah");
    }
  };

  const handleStartGrading = () => {
    toast.success("Memulai penilaian...");
    // Redirect atau proses penilaian
  };

  const handleDeleteStudent = () => {
    toast.success("Jawaban peserta dihapus");
  };

  // Render berdasarkan state
  const renderContent = () => {
    switch (viewState) {
      case "with-questions":
        return renderWithQuestions();
      case "with-answers":
        return renderWithAnswers();
      case "deadline-passed":
        return renderDeadlinePassed();
      default:
        return renderEmpty();
    }
  };

  // State 1: Belum ada soal (Empty)
  const renderEmpty = () => (
    <>
      {/* Deadline Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Deadline</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <CalendarBlank
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                weight="bold"
              />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Tanggal</option>
                <option value="2025-10-20">20 Oktober 2025</option>
                <option value="2025-10-21">21 Oktober 2025</option>
                <option value="2025-10-22">22 Oktober 2025</option>
              </select>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Clock
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                weight="bold"
              />
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Jam</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Soal dan Kunci Jawaban Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Soal dan Kunci Jawaban
        </h2>
        <div
          onClick={() => questionsInputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-gray-600 hover:bg-gray-800/30 transition-all"
        >
          <UploadSimple
            className="w-12 h-12 text-gray-400 mb-4"
            weight="bold"
          />
          <p className="text-white font-medium mb-1">
            Upload Soal dan Kunci Jawaban
          </p>
          <p className="text-gray-400 text-sm">atau tulis manual</p>
          <input
            ref={questionsInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleQuestionsUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* File Jawaban Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">File Jawaban</h2>
        <div
          onClick={() => answersInputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-gray-600 hover:bg-gray-800/30 transition-all"
        >
          <UploadSimple
            className="w-12 h-12 text-gray-400 mb-4"
            weight="bold"
          />
          <p className="text-white font-medium">Upload Jawaban</p>
          <input
            ref={answersInputRef}
            type="file"
            accept=".pdf"
            onChange={handleAnswersUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Mulai Penilaian Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleStartGrading}
          variant="primary"
          size="lg"
          className="min-w-[200px]"
          disabled={!uploadedQuestions || !uploadedAnswers}
        >
          Mulai Penilaian
        </Button>
      </div>
    </>
  );

  // State 2: Sudah ada soal
  const renderWithQuestions = () => (
    <>
      {/* Deadline Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Deadline</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <CalendarBlank
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                weight="bold"
              />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Tanggal</option>
                <option value="2025-10-20">20 Oktober 2025</option>
              </select>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Clock
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                weight="bold"
              />
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Jam</option>
                <option value="08:00">08:00</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Soal dan Kunci Jawaban Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Soal dan Kunci Jawaban
        </h2>
        <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6">
          {questions.map((q, index) => (
            <div key={q.id} className="mb-6 last:mb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Soal Column */}
                <div>
                  <h3 className="text-white font-semibold mb-3">
                    Soal {index + 1}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {q.question}
                  </p>
                </div>

                {/* Kunci Jawaban Column */}
                <div>
                  <h3 className="text-white font-semibold mb-3">
                    Kunci Jawaban
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {q.answer}
                  </p>
                </div>
              </div>

              {/* Divider */}
              {index < questions.length - 1 && (
                <div className="border-t border-gray-700 mt-6"></div>
              )}
            </div>
          ))}

          {/* Tambah Soal Button */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={() => toast.success("Tambah soal baru")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" weight="bold" />
              Tambah Soal
            </button>
          </div>
        </div>
      </div>

      {/* File Jawaban Peserta - Empty */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          File Jawaban Peserta
        </h2>
        <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-12 flex flex-col items-center justify-center">
          <p className="text-gray-400 text-center">Jumlah Jawaban : 0</p>
        </div>
      </div>
    </>
  );

  // State 3: Sudah ada jawaban peserta
  const renderWithAnswers = () => (
    <>
      {/* Deadline Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Deadline</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <CalendarBlank
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                weight="bold"
              />
              <select className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-500 transition-colors appearance-none cursor-pointer">
                <option>Tanggal</option>
              </select>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Clock
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                weight="bold"
              />
              <select className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-500 transition-colors appearance-none cursor-pointer">
                <option>Jam</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Soal dan Kunci Jawaban Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Soal dan Kunci Jawaban
        </h2>
        <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6">
          {questions.map((q, index) => (
            <div key={q.id} className="mb-6 last:mb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3">
                    Soal {index + 1}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {q.question}
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-3">
                    Kunci Jawaban
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {q.answer}
                  </p>
                </div>
              </div>
              {index < questions.length - 1 && (
                <div className="border-t border-gray-700 mt-6"></div>
              )}
            </div>
          ))}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={() => toast.success("Tambah soal baru")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" weight="bold" />
              Tambah Soal
            </button>
          </div>
        </div>
      </div>

      {/* File Jawaban Peserta - With Data */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          File Jawaban Peserta
        </h2>
        <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-center mb-4">
            Jumlah Jawaban : {studentAnswers.length}
          </p>
          <div className="space-y-3">
            {studentAnswers.map((student) => (
              <div
                key={student.id}
                className="bg-[#2b2d31] rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">{student.name}</p>
                  <p className="text-gray-400 text-sm">{student.filename}</p>
                </div>
                <button
                  onClick={handleDeleteStudent}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  // State 4: Deadline sudah lewat
  const renderDeadlinePassed = () => (
    <>
      {/* Deadline Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Deadline</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <CalendarBlank
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                weight="bold"
              />
              <select className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-500 transition-colors appearance-none cursor-pointer">
                <option>Tanggal</option>
              </select>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Clock
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                weight="bold"
              />
              <select className="w-full pl-10 pr-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-500 transition-colors appearance-none cursor-pointer">
                <option>Jam</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Soal dan Kunci Jawaban Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Soal dan Kunci Jawaban
        </h2>
        <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6">
          {questions.map((q, index) => (
            <div key={q.id} className="mb-6 last:mb-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-3">
                    Soal {index + 1}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {q.question}
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-3">
                    Kunci Jawaban
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {q.answer}
                  </p>
                </div>
              </div>
              {index < questions.length - 1 && (
                <div className="border-t border-gray-700 mt-6"></div>
              )}
            </div>
          ))}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={() => toast.success("Tambah soal baru")}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" weight="bold" />
              Tambah Soal
            </button>
          </div>
        </div>
      </div>

      {/* File Jawaban Peserta */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          File Jawaban Peserta
        </h2>
        <div className="bg-[#1e1f22] border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-center mb-4">
            Jumlah Jawaban : {studentAnswers.length}
          </p>
          <div className="space-y-3">
            {studentAnswers.map((student) => (
              <div
                key={student.id}
                className="bg-[#2b2d31] rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">{student.name}</p>
                  <p className="text-gray-400 text-sm">{student.filename}</p>
                </div>
                <button
                  onClick={handleDeleteStudent}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KKM Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">
          Kriteria Ketuntasan Minimal (KKM)
        </h2>
        <input
          type="number"
          value={kkm}
          onChange={(e) => setKkm(e.target.value)}
          placeholder="75"
          className="w-full px-4 py-3 bg-[#1e1f22] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-gray-500 transition-colors"
        />
      </div>

      {/* Mulai Penilaian Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleStartGrading}
          variant="primary"
          size="lg"
          className="min-w-[200px]"
        >
          Mulai Penilaian
        </Button>
      </div>
    </>
  );

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
                <h1 className="text-3xl font-bold text-white">
                  Penilaian Baru
                </h1>
              </div>
            </div>

            {/* View State Switcher - For Demo */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push("/grading/new")}
                variant="primary"
                size="sm"
                className="flex items-center gap-2"
              >
                <Play className="w-5 h-5" weight="bold" />
                Update Tugas
              </Button>
            </div>
          </div>

          {/* Demo State Switcher */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewState("empty")}
              className={`px-3 py-1 rounded text-sm ${
                viewState === "empty"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Empty
            </button>
            <button
              onClick={() => setViewState("with-questions")}
              className={`px-3 py-1 rounded text-sm ${
                viewState === "with-questions"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              With Questions
            </button>
            <button
              onClick={() => setViewState("with-answers")}
              className={`px-3 py-1 rounded text-sm ${
                viewState === "with-answers"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              With Answers
            </button>
            <button
              onClick={() => setViewState("deadline-passed")}
              className={`px-3 py-1 rounded text-sm ${
                viewState === "deadline-passed"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              Deadline Passed
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        {renderContent()}
      </main>

      <Footer />
    </div>
  );
}
