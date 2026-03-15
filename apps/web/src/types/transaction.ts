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
}
