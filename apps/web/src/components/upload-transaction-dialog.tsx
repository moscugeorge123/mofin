import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useEffect, useRef, useState } from "react"
import { useBankAccounts } from "../hooks/use-bank-accounts"
import {
  useTransactionFiles,
  useUploadTransactionFile,
} from "../hooks/use-transactions"
import { transactionsApi } from "../services/transactions.service"
import type { Transaction } from "../types/transaction"

interface UploadTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = "select-account" | "upload-file" | "processing" | "result"

export function UploadTransactionDialog({
  open,
  onOpenChange,
}: UploadTransactionDialogProps) {
  const [step, setStep] = useState<Step>("select-account")
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedTransactions, setUploadedTransactions] = useState<
    Transaction[]
  >([])
  const [error, setError] = useState<string>("")
  const [fileId, setFileId] = useState<string | null>(null)
  const [isCached, setIsCached] = useState(false)
  const [processingMessage, setProcessingMessage] = useState("")
  const fetchedFileRef = useRef<string | null>(null)

  const { data: bankAccounts, isLoading: loadingAccounts } = useBankAccounts()
  const uploadMutation = useUploadTransactionFile()

  // Use global polling data instead of individual polling
  const { data: filesData } = useTransactionFiles()

  // Effect to watch for file status changes in global polling
  useEffect(() => {
    if (!fileId || !filesData?.files) return

    const currentFile = filesData.files.find((f) => f.fileId === fileId)
    if (!currentFile) return

    if (
      currentFile.status === "completed" &&
      fetchedFileRef.current !== fileId
    ) {
      // Fetch full file details to get transactions
      fetchedFileRef.current = fileId // Mark as fetched to prevent duplicate fetches
      transactionsApi
        .getFileStatus(fileId)
        .then((fileDetails) => {
          setUploadedTransactions(fileDetails.transactions)
          setStep("result")
        })
        .catch((err) => {
          console.error("Error fetching file details:", err)
          // Still show success but without transaction details
          setStep("result")
          setUploadedTransactions([])
        })
    } else if (currentFile.status === "failed") {
      setError(currentFile.errorMessage || "Processing failed")
      setStep("result")
    }
  }, [fileId, filesData])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedAccountId) return

    setError("")

    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        accountId: selectedAccountId,
      })

      setFileId(result.fileId)
      setIsCached(result.cached || false)

      if (result.status === "completed" && result.transactions) {
        // File was already processed (cached)
        setUploadedTransactions(result.transactions)
        setStep("result")
      } else {
        // File is being processed (new or cached but still processing)
        setStep("processing")
        if (result.cached) {
          setProcessingMessage(
            "This file is already being processed. You can close this dialog and check back later."
          )
        } else {
          setProcessingMessage(
            "Your file is being processed. You can close this dialog - transactions will appear when ready."
          )
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload the file")
      setStep("result")
    }
  }

  const handleClose = () => {
    // Reset state
    setStep("select-account")
    setSelectedAccountId("")
    setSelectedFile(null)
    setUploadedTransactions([])
    setError("")
    setFileId(null)
    setIsCached(false)
    setProcessingMessage("")
    fetchedFileRef.current = null
    onOpenChange(false)
  }

  const canProceedToUpload = !!selectedAccountId
  const canUpload = !!selectedFile

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="flex max-h-[90vh] max-w-6xl min-w-4xl flex-col overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Upload Transactions from File</DialogTitle>
          <DialogDescription>
            {step === "select-account" &&
              "Select the bank account for these transactions"}
            {step === "upload-file" && "Choose a file to upload (PDF or CSV)"}
            {step === "processing" && "Processing your file..."}
            {step === "result" &&
              (error ? "Upload failed" : "Upload successful")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {/* Step 1: Select Account */}
          {/* Step 1: Select Account */}
          {step === "select-account" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Bank Account</Label>
                {loadingAccounts ? (
                  <div className="text-sm text-muted-foreground">
                    Loading accounts...
                  </div>
                ) : (
                  <Select
                    value={selectedAccountId}
                    onValueChange={setSelectedAccountId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts?.map((account) => (
                        <SelectItem key={account._id} value={account._id}>
                          {account.name} ({account.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Upload File */}
          {step === "upload-file" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select File (PDF or CSV)</Label>
                <input
                  type="file"
                  accept=".pdf,.csv"
                  onChange={handleFileChange}
                  className="block w-full cursor-pointer text-sm text-slate-500 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-sm font-medium text-muted-foreground">
                {processingMessage}
              </p>
              {fileId && filesData?.files && (
                <p className="text-xs text-muted-foreground">
                  Status:{" "}
                  {filesData.files.find((f) => f.fileId === fileId)?.status ||
                    "checking..."}
                </p>
              )}
              <Alert className="mt-4">
                <AlertDescription className="text-xs">
                  You can close this dialog. Processing will continue in the
                  background, and transactions will appear automatically when
                  complete.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 4: Result */}
          {step === "result" && (
            <div className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Upload Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <AlertDescription>
                      {isCached
                        ? `File already processed! Found ${uploadedTransactions.length} cached transaction(s)`
                        : `Successfully processed ${uploadedTransactions.length} transaction(s)`}
                    </AlertDescription>
                  </Alert>

                  {uploadedTransactions.length > 0 && (
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-25">Date</TableHead>
                            <TableHead className="min-w-30">Store</TableHead>
                            <TableHead className="min-w-50">Notes</TableHead>
                            <TableHead className="min-w-20">Type</TableHead>
                            <TableHead className="min-w-25 text-right">
                              Amount
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uploadedTransactions.map((transaction, idx) => (
                            <TableRow key={transaction._id || idx}>
                              <TableCell className="font-medium whitespace-nowrap">
                                {new Date(transaction.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </TableCell>
                              <TableCell className="max-w-37.5 truncate">
                                {transaction.store || "-"}
                              </TableCell>
                              <TableCell className="max-w-62.5">
                                <div
                                  className="line-clamp-2"
                                  title={transaction.notes || "-"}
                                >
                                  {transaction.notes || "-"}
                                </div>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {transaction.creditDebitIndicator}
                              </TableCell>
                              <TableCell className="text-right font-mono whitespace-nowrap">
                                {transaction.creditDebitIndicator === "Credit"
                                  ? "+"
                                  : "-"}
                                {Math.abs(transaction.amount.sum).toFixed(2)}{" "}
                                {transaction.amount.currency}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0">
          {step === "select-account" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep("upload-file")}
                disabled={!canProceedToUpload}
              >
                Next
              </Button>
            </>
          )}

          {step === "upload-file" && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("select-account")}
              >
                Back
              </Button>
              <Button onClick={handleUpload} disabled={!canUpload}>
                Upload & Process
              </Button>
            </>
          )}

          {step === "processing" && (
            <Button onClick={handleClose}>
              Close (Processing continues in background)
            </Button>
          )}

          {step === "result" && <Button onClick={handleClose}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
