import { cn } from "@/lib/utils/strings";
import { fieldControlClass } from "@/components/ui/form-primitives";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(fieldControlClass, "min-h-[5.5rem] resize-y", className)} {...props} />;
  },
);
