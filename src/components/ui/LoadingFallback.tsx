import { ComponentPropsWithoutRef } from "react";
import { Loader2 } from "lucide-react";

export function LoadingFallback({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div 
      className={`min-h-[50vh] flex flex-col items-center justify-center gap-4 text-muted-foreground ${className}`} 
      {...props}
    >
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-sm font-medium animate-pulse">Cargando experiencia...</p>
    </div>
  );
}
