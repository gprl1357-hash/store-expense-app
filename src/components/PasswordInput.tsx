"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholder: string;
  autoComplete: string;
  centered?: boolean;
  autoFocus?: boolean;
};

export function PasswordInput({
  value,
  onChange,
  onEnter,
  placeholder,
  autoComplete,
  centered,
  autoFocus,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full">
      <input
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        placeholder={placeholder}
        className={`min-h-16 w-full rounded-2xl border-0 bg-gray-50 py-3 pl-5 pr-14 text-xl font-bold text-gray-900 ring-2 ring-gray-200 focus:ring-blue-500 ${
          centered ? "text-center tracking-widest" : ""
        }`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
      </button>
    </div>
  );
}
