import React, { createContext, useContext, useState, useEffect } from "react";
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";

type ToastType = "info" | "success" | "warning" | "error";

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  createdAt: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (title: string, description?: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (
    title: string,
    description?: string,
    type: ToastType = "info"
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = {
      id,
      title,
      description,
      type,
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id);
    }, 5000);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const context = useContext(ToastContext);

  if (!context) return null;

  const { toasts, dismiss } = context;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md"
      aria-live="polite"
      role="status"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg flex gap-3 transform transition-all duration-300 ease-in-out 
            animate-in slide-in-from-right-5 fade-in
            ${
              toast.type === "info"
                ? "bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-900/80 dark:border-blue-400"
                : ""
            }
            ${
              toast.type === "success"
                ? "bg-green-50 border-l-4 border-green-500 dark:bg-green-900/80 dark:border-green-400"
                : ""
            }
            ${
              toast.type === "warning"
                ? "bg-yellow-50 border-l-4 border-yellow-500 dark:bg-yellow-900/80 dark:border-yellow-400"
                : ""
            }
            ${
              toast.type === "error"
                ? "bg-red-50 border-l-4 border-red-500 dark:bg-red-900/80 dark:border-red-400"
                : ""
            }
          `}
          role="alert"
          aria-labelledby={`toast-${toast.id}-title`}
        >
          <div className="flex-shrink-0 text-center self-start">
            {toast.type === "info" && (
              <Info className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            )}
            {toast.type === "success" && (
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
            )}
            {toast.type === "warning" && (
              <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            )}
            {toast.type === "error" && (
              <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className="font-semibold text-gray-900 dark:text-gray-100"
              id={`toast-${toast.id}-title`}
            >
              {toast.title}
            </h4>
            {toast.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="flex-shrink-0 rounded-full p-0.5 inline-flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
