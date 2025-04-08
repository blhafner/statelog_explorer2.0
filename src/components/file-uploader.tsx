import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon } from "lucide-react";
import type { MetaMaskStateLog } from "@/types/state-log";

interface FileUploaderProps {
  onFileLoaded: (data: MetaMaskStateLog) => void;
  className?: string;
}

export function FileUploader({ onFileLoaded, className = "" }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);

          // Debug log to see the structure
          console.log("Parsed JSON structure:", {
            hasMetamask: !!jsonData.metamask,
            transactions: jsonData.metamask?.transactions ?
              `Found ${Array.isArray(jsonData.metamask.transactions) ? jsonData.metamask.transactions.length : 'object'} transactions` :
              'No transactions property',
            transactionHistory: jsonData.metamask?.transactionHistory ?
              `Found transaction history with ${Object.keys(jsonData.metamask.transactionHistory || {}).length} entries` :
              'No transaction history',
            pendingApprovals: jsonData.metamask?.pendingApprovals ?
              `Found pending approvals with ${Object.keys(jsonData.metamask.pendingApprovals || {}).length} entries` :
              'No pending approvals',
            // Check for mobile structure
            hasMobileEngine: !!jsonData.engine?.backgroundState,
            mobileTransactions: jsonData.engine?.backgroundState?.TransactionController?.transactions ?
              `Found mobile transactions with ${Array.isArray(jsonData.engine.backgroundState.TransactionController.transactions)
                ? jsonData.engine.backgroundState.TransactionController.transactions.length
                : Object.keys(jsonData.engine.backgroundState.TransactionController.transactions).length} entries` :
              'No mobile transactions found',
            mobileAccounts: jsonData.engine?.backgroundState?.AccountTrackerController?.accounts ?
              `Found ${Object.keys(jsonData.engine.backgroundState.AccountTrackerController.accounts).length} mobile accounts` :
              'No mobile accounts found',
            data: jsonData
          });

          onFileLoaded(jsonData as MetaMaskStateLog);
        } catch (err) {
          setError("Invalid JSON file. Please upload a valid MetaMask state log.");
          console.error("Error parsing JSON:", err);
        }
      };
      reader.onerror = () => {
        setError("Error reading file. Please try again.");
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => {
      setIsDragging(false);
      setError("Please upload a valid JSON file.");
    },
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <UploadIcon className="h-10 w-10 text-muted-foreground/70" />
          <h3 className="text-lg font-medium">Drop a state log file here</h3>
          <p className="text-sm text-muted-foreground">
            Or click to browse for a file
          </p>
        </div>
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-500">{error}</div>
      )}
    </div>
  );
}
