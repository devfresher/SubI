import { cn } from "@/lib/utils/strings";
import { fieldControlClass } from "@/components/ui/form-primitives";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(fieldControlClass, className)} {...props} />;
});
