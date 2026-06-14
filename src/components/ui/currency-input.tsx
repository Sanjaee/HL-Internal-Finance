import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: number | string;
  onChange?: (value: number | undefined) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState("");

    // Update display when value changes externally
    useEffect(() => {
      if (value === undefined || value === null || value === "") {
        setDisplayValue("");
        return;
      }
      
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue)) {
        setDisplayValue("");
      } else {
        // Format with Indonesian locale (using dots as thousand separators)
        setDisplayValue(new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(numValue));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow numbers and backspace, remove all non-numeric chars
      const rawValue = e.target.value.replace(/[^0-9]/g, "");
      
      if (!rawValue) {
        setDisplayValue("");
        onChange?.(undefined);
        return;
      }

      const numValue = parseInt(rawValue, 10);
      setDisplayValue(new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(numValue));
      onChange?.(numValue);
    };

    return (
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        ref={ref}
        value={displayValue}
        onChange={handleChange}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
