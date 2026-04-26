export interface TransactionAmount {
  sum: number
  currency: string
}

export interface Transaction {
  _id: string
  userId: string
  bankTransactionId?: string
  accountId: string | BankAccount
  amount: TransactionAmount
  notes?: string
  state: "sent" | "received"
  relationBankAccount?: string
  tags: Array<string | Tag>
  category?: string | Category
  location?: string
  store?: string
  creditDebitIndicator: "Credit" | "Debit"
  status: "Booked" | "Pending"
  date: string
  createdAt: string
  updatedAt: string
}

export interface BankAccount {
  _id: string
  name: string
  balance: number
  currency: string
}

export interface Tag {
  _id: string
  name: string
  color?: string
}

export interface Category {
  _id: string
  name: string
  color?: string
  icon?: string
}

export interface TransactionsQueryParams {
  accountId?: string
  category?: string
  startDate?: string
  endDate?: string
  status?: "Booked" | "Pending"
  search?: string
  creditDebitIndicator?: "Credit" | "Debit"
  minAmount?: string
  maxAmount?: string
  currency?: string
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedTransactionsResponse {
  data: Transaction[]
  pagination: PaginationMeta
}

export interface TransactionFile {
  fileId: string
  originalName: string
  status: "pending" | "processing" | "completed" | "failed"
  errorMessage?: string
  transactionCount: number
  fileSize: number
  accountId: BankAccount
  createdAt: string
  updatedAt: string
}
