"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile, changePassword } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import { API_URL } from "@/lib/api-config";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Image from "next/image";
import { Camera, UserCircle } from "phosphor-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
function ProfileContent() {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profilePicture, setProfilePicture] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    bio: "",
    phone: "",
    institution: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullname || "",
        email: user.email || "",
        username: user.username || "",
        bio: user.biografi || "",
        phone: user.notelp || "",
        institution: user.institution || "",
      });
      setProfilePicture(user.profile_picture || "");
    }
  }, [user]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar!");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran gambar maksimal 5MB!");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
        toast.success(
          "Foto profil berhasil dipilih! Klik Simpan untuk mengupdate."
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!formData.fullName.trim()) {
      setErrors({ fullName: "Nama lengkap wajib diisi" });
      return;
    }

    if (!formData.email.trim()) {
      setErrors({ email: "Email wajib diisi" });
      return;
    }

    setIsLoading(true);

    try {
      // Get token from cookies (primary) or localStorage (fallback)
      const token = getCookie("token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Token tidak ditemukan. Silakan login kembali.");
        router.push("/login");
        return;
      }

      // Prepare update data
      const updateData = {
        fullname: formData.fullName,
        email: formData.email,
        username: formData.username,
        biografi: formData.bio,
        notelp: formData.phone,
        institution: formData.institution,
        profile_picture: profilePicture,
      };

      // Call API to update profile
      const updatedUser = await updateUserProfile(token, updateData);

      // Update user in context
      updateUser(updatedUser);
      toast.success("Profil berhasil diperbarui!");
      setSuccessMessage("Profil berhasil diperbarui!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Gagal memperbarui profil";

      if (
        errorMessage.includes("token") ||
        errorMessage.includes("401") ||
        errorMessage.includes("unauthorized")
      ) {
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast.error(errorMessage);
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    if (!passwordData.currentPassword) {
      setErrors({ currentPassword: "Kata sandi saat ini wajib diisi" });
      return;
    }

    if (!passwordData.newPassword) {
      setErrors({ newPassword: "Kata sandi baru wajib diisi" });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrors({ newPassword: "Kata sandi minimal 8 karakter" });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ confirmPassword: "Kata sandi tidak cocok" });
      return;
    }

    setIsLoading(true);

    try {
      // Get token from cookies (primary) or localStorage (fallback)
      const token = getCookie("token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Token tidak ditemukan. Silakan login kembali.");
        router.push("/login");
        return;
      }

      // Call API to change password
      await changePassword(
        token,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      toast.success("Kata sandi berhasil diubah!");
      setSuccessMessage("Kata sandi berhasil diubah!");

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordSection(false);

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal mengubah kata sandi. Silahkan coba lagi !";

      toast.error(errorMessage);

      if (
        errorMessage.includes("salah") ||
        errorMessage.includes("incorrect")
      ) {
        setErrors({ currentPassword: errorMessage });
      } else if (errorMessage.includes("OAuth")) {
        setErrors({ general: errorMessage });
        setShowPasswordSection(false);
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);

    try {
      const token = getCookie("token") || localStorage.getItem("token");
      if (!token) {
        toast.error("Token tidak ditemukan. Silakan login kembali.");
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/api/users/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg =
          errorData?.detail || errorData?.message || "Gagal menghapus akun";
        throw new Error(
          typeof errorMsg === "string" ? errorMsg : "Gagal menghapus akun"
        );
      }

      toast.success("Akun berhasil dihapus");
      logout();

      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      let errorMessage = "Gagal menghapus akun. Silakan coba lagi.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancel = () => {
    router.push("/home");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#2b2d31]">
      <Navbar />
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Edit profil</h1>
          <p className="text-gray-300">
            Ganti informasi pribadi kamu dan pengaturan
          </p>
        </div>
        {successMessage && (
          <div className="mb-6 bg-green-900/30 border border-green-500 text-green-300 px-4 py-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">
              Informasi Profil
            </h2>
            <p className="text-sm text-gray-400">
              Ubah akun kamu & infromasi profil disini
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}
            <div>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-yellow-400 shadow-lg bg-gray-700">
                  {profilePicture ? (
                    <Image
                      src={profilePicture}
                      alt="profil default icon"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                      onError={(e) => {
                        // Fallback to default icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        if (target.nextElementSibling) {
                          (
                            target.nextElementSibling as HTMLElement
                          ).style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-2xl font-bold"
                    style={{ display: profilePicture ? "none" : "flex" }}
                  >
                    <UserCircle className="w-16 h-16" weight="bold" />
                  </div>
                </div>
                <div>
                  {/* Hide upload button for OAuth users */}
                  {!user?.is_oauth_user && (
                    <>
                      <button
                        type="button"
                        onClick={handleImageClick}
                        className="px-4 py-2 bg-transparent border border-gray-600 rounded-lg text-white hover:bg-gray-700/50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" weight="bold" />
                        Ganti gambar
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        JPG, atau PNG. Max size 5MB
                      </p>
                    </>
                  )}
                  {user?.is_oauth_user && (
                    <p className="text-md text-white">Foto profil kamu</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="fullName"
                name="fullName"
                type="text"
                label="Nama Lengkap"
                placeholder="Masukkan nama lengkap"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
                required
              />
              <Input
                id="username"
                name="username"
                type="text"
                label="Nama Pengguna"
                placeholder="Masukkan nama pengguna"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                disabled
              />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              label="Alamat Email"
              placeholder="Masukkan email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="phone"
                name="phone"
                type="tel"
                label="Nomor Telepon"
                placeholder="Masukkan nomor telepon"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
              />
              <Input
                id="institution"
                name="institution"
                type="text"
                label="Institusi"
                placeholder="Masukkan institusi"
                value={formData.institution}
                onChange={handleChange}
                error={errors.institution}
              />
            </div>
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-white mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                placeholder="Ceritakan tentang diri kamu..."
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-transparent border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors resize-none"
              />
              {errors.bio && (
                <p className="mt-2 text-sm text-red-400">{errors.bio}</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Simpan Perubahan
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Batal
              </Button>
            </div>
          </form>
        </Card>

        {/* Hide password section for OAuth users */}
        {!user?.is_oauth_user && (
          <Card className="mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Ubah Kata Sandi
              </h2>
              <p className="text-sm text-gray-400">
                Perbarui kata sandi untuk menjaga keamanan akun kamu
              </p>
            </div>
            {!showPasswordSection ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowPasswordSection(true)}
              >
                Ubah Kata Sandi
              </Button>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  label="Kata Sandi Saat Ini"
                  placeholder="Masukkan kata sandi saat ini"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  error={errors.currentPassword}
                  required
                />
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  label="Kata Sandi Baru"
                  placeholder="Masukkan kata sandi baru"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  error={errors.newPassword}
                  helperText="Kata sandi minimal 8 karakter"
                  required
                />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  label="Konfirmasi Kata Sandi Baru"
                  placeholder="Konfirmasi kata sandi baru"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  error={errors.confirmPassword}
                  required
                />
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    Ganti kata sandi
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setErrors({});
                    }}
                    disabled={isLoading}
                  >
                    Batalkan
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}

        <Card className="mt-6 border-2 border-red-500/30">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Zona Berbahaya
            </h2>
            <p className="text-sm text-gray-400">
              Tindakan yang tidak dapat diubah dan bersifat merusak
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-900/10 rounded-lg border border-red-500/20">
            <div>
              <h3 className="font-medium text-white mb-1">Hapus Akun</h3>
              <p className="text-sm text-gray-400">
                Setelah akun kamu dihapus, tidak dapat dikembalikan lagi
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
              disabled={isLoading}
            >
              Hapus Akun
            </button>
          </div>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-red-400 mb-2">
                  Hapus Akun
                </h3>
                <p className="text-gray-300 text-sm">
                  Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak
                  dapat dibatalkan dan semua data Anda akan hilang secara
                  permanen.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Menghapus..." : "Ya, Hapus Akun"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
