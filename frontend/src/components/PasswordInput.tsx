import { useState } from "react";
import { Eye, EyeSlash } from "phosphor-react";

interface PasswordInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  showStrength?: boolean;
  strength?: {
    strength: "weak" | "medium" | "strong";
    message: string;
  } | null;
}

const strengthColors = {
  weak: "bg-red-500",
  medium: "bg-yellow-500",
  strong: "bg-green-500",
};

const strengthWidths = {
  weak: "33%",
  medium: "66%",
  strong: "100%",
};

export default function PasswordInput({
  id,
  name,
  label,
  value,
  placeholder = "kata sandi",
  onChange,
  error,
  showStrength = false,
  strength,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full px-6 py-3 bg-white dark:bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded-full text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 transition-colors"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
          aria-label={
            showPassword ? "Sembunyikan password" : "Tampilkan password"
          }
        >
          {showPassword ? (
            <EyeSlash className="w-5 h-5" weight="bold" />
          ) : (
            <Eye className="w-5 h-5" weight="bold" />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {showStrength && value && strength && (
        <div className="mt-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                strengthColors[strength.strength]
              }`}
              style={{ width: strengthWidths[strength.strength] }}
            />
          </div>
          <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
            {strength.message}
          </p>
        </div>
      )}
    </div>
  );
}
