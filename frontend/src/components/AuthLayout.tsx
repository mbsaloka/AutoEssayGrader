import Navbar from "./Navbar";
import Footer from "./Footer";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AuthLayout({
  children,
  title = "GRADE MIND",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#2b2d31] dark:bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-5xl sm:text-6xl font-bold mb-2">
              <span className="text-yellow-400">{title.split(" ")[0]}</span>
              <span className="text-white">
                {" "}
                {title.split(" ").slice(1).join(" ")}
              </span>
            </h1>
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
