import React from "react";

interface InputProps {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  required?: boolean;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({
  id,
  name,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  className = "",
  min,
  max,
  step,
  required = false,
  disabled = false,
}) => {
  return (
    <div className={`mb-m ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-body-s font-medium text-neutral-300 mb-s"
        >
          {label}
          {required && <span className="text-alert-600 ml-xs">*</span>}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        required={required}
        disabled={disabled}
        className={`input-field w-full ${
          error ? "border-alert-600 focus:ring-alert-600" : ""
        }`}
      />
      {error && <p className="mt-s text-body-s text-alert-600">{error}</p>}
    </div>
  );
};

export default Input;
