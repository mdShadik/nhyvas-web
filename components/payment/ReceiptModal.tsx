"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Printer, Receipt, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { type ListingPayment, type InvoiceInfo } from "@/services/apiService/payment";
import { formatPrice } from "@/lib/formatPrice";
import Image from "next/image";
import { darkLogo, lightLogo } from "@/assets";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  open: boolean;
  onClose: () => void;
  payment: ListingPayment;
};

export function ReceiptModal({ open, onClose, payment }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const invoice = Array.isArray(payment.invoice) ? payment.invoice[0] : payment.invoice;
  
  if (!invoice) return null;

  const handleDownload = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-border bg-bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-secondary-50/50 dark:bg-secondary-900/20">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-primary-500" />
                </div>
                <h3 className="font-bold text-text-primary">Payment Receipt</h3>
              </div>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
                <X className="size-5 text-text-tertiary" />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh]">
               <div id="printable-receipt" className="receipt-container bg-white text-black p-6 rounded-2xl border-2 border-dashed border-gray-200 shadow-inner">
                  {/* Logos */}
                  <div className="flex justify-between items-center mb-8">
                     <div className="relative h-8 w-24">
                        <Image src={lightLogo} unoptimized alt="Nhyvas" fill className="object-contain" />
                     </div>
                     <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                        <span className="text-[10px] font-bold text-gray-400">LOGO</span>
                     </div>
                  </div>

                  <div className="text-center mb-6">
                    <h2 className="text-xl font-black uppercase tracking-tighter">Official Receipt</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Transaction Verified</p>
                  </div>

                  <div className="space-y-4 border-t border-b border-gray-100 py-6 my-6">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Receipt No:</span>
                      <span className="font-bold">{invoice.invoice_no}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Date:</span>
                      <span className="font-bold">{new Date(invoice.issued_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Property:</span>
                      <span className="font-bold text-right ml-4 line-clamp-1">{payment.listing?.property_title}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 font-medium">Payment ID:</span>
                      <span className="font-mono text-[10px]">{payment.transaction_id || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-gray-400">Total Amount</span>
                      <div className="text-2xl font-black">
                        {invoice.currency_code} {invoice.amount}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-100">
                       <CheckCircle2 className="h-3 w-3" />
                       Paid In Full
                    </div>
                    <p className="text-[9px] text-gray-400 mt-6 leading-relaxed">
                      Thank you for choosing Nhyvas. This is a computer generated receipt and does not require a physical signature.
                    </p>
                  </div>
               </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-0 flex gap-3">
               <Button variant="outline" className="flex-1 rounded-2xl h-12" onClick={onClose}>
                 Close
               </Button>
               <Button className="flex-1 rounded-2xl h-12 gap-2 bg-primary-600" onClick={handleDownload}>
                 <Download className="h-4 w-4" />
                 Download
               </Button>
            </div>
          </motion.div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            border: none;
            box-shadow: none;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}
