import React, { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCharCount,
      maxLength,
      className = "",
      value,
      ...props
    },
    ref
  ) => {
    const charCount = value ? String(value).length : 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={`
            w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-y
            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            ${
              error
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-yellow-400 focus:border-blue-500 dark:focus:border-yellow-400"
            }
            ${
              props.disabled
                ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                : "bg-white dark:bg-transparent"
            }
            ${className}
          `}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error
              ? `${props.id}-error`
              : helperText
              ? `${props.id}-helper`
              : undefined
          }
          {...props}
        />
        <div className="flex justify-between items-center mt-1">
          <div>
            {error && (
              <p
                className="text-sm text-red-600 dark:text-red-400"
                id={`${props.id}-error`}
              >
                {error}
              </p>
            )}
            {helperText && !error && (
              <p
                className="text-sm text-gray-500 dark:text-gray-400"
                id={`${props.id}-helper`}
              >
                {helperText}
              </p>
            )}
          </div>
          {showCharCount && maxLength && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
