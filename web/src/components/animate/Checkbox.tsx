import React from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { motion, AnimatePresence } from "motion/react";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onCheckedChange, id, label }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <RadixCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(val) => onCheckedChange(val === true)}
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "4px",
          border: "2px solid #38bdf8",
          background: checked ? "#0284c7" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          outline: "none",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
        }}
        className="focus-ring"
      >
        <RadixCheckbox.Indicator forceMount>
          <AnimatePresence>
            {checked && (
              <motion.svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <motion.path
                  d="M2 6l3 3 5-6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: "0.78rem",
            color: "#8b949e",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {label}
        </label>
      )}
    </div>
  );
};
