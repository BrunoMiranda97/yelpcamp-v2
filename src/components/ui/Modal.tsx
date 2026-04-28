import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Button } from "./Layout.tsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  confirmVariant?: "primary" | "danger";
  isLoading?: boolean;
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "Confirm",
  confirmVariant = "primary",
  isLoading = false,
}: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl pointer-events-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 font-mono">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans font-medium">
                {children}
              </div>
              <div className="flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={onClose} className="uppercase text-[10px] font-black font-mono tracking-widest">
                  Cancel
                </Button>
                {onConfirm && (
                  <Button
                    variant={confirmVariant}
                    size="sm"
                    onClick={onConfirm}
                    isLoading={isLoading}
                    className="uppercase text-[10px] font-black font-mono tracking-widest"
                  >
                    {confirmText}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
