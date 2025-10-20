interface AlertProps {
  type: "error" | "success" | "info";
  message: string;
}

const alertStyles = {
  error:
    "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300",
  success:
    "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300",
  info: "bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300",
};

export default function Alert({ type, message }: AlertProps) {
  if (!message) return null;

  return (
    <div className={`border px-4 py-3 rounded-lg text-sm ${alertStyles[type]}`}>
      {message}
    </div>
  );
}
