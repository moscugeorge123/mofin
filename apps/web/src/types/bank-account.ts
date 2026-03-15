export interface BankAccount {
  _id: string
  bankAccountId: string
  name: string
  description?: string
  owner: string
  accessGivenTo: string[]
  currency: string
  type: "Personal" | "Business"
  subType: "CurrentAccount" | "Savings" | "CreditCard"
  createdAt: string
  updatedAt: string
}

export interface CreateBankAccountRequest {
  name: string
  description?: string
  currency: string
  type: "Personal" | "Business"
  subType: "CurrentAccount" | "Savings" | "CreditCard"
  accessGivenTo?: string[]
}
