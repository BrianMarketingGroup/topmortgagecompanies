"use client";

import { clsx } from "clsx";
import { FormField, Textarea } from "@/components/ui/FormField";

export default function CharacterCounterTextarea({
  label,
  value,
  onChange,
  maxChars,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxChars: number;
  error?: string;
  placeholder?: string;
}) {
  const count = value.length;
  const atLimit = count >= maxChars;

  return (
    <FormField label={label} error={error}>
      <Textarea
        rows={6}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.slice(0, maxChars))}
        error={error}
      />
      <p className={clsx("text-xs text-right mt-1", atLimit ? "text-danger font-semibold" : "text-muted")}>
        {count} / {maxChars}
      </p>
    </FormField>
  );
}
