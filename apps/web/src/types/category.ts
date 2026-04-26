export interface CategoryRule {
  field:
    | "store"
    | "location"
    | "amount"
    | "notes"
    | "tags"
    | "date"
    | "currency"
  operator:
    | "equals"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "greaterThan"
    | "lessThan"
    | "between"
    | "after"
    | "before"
    | "betweenDates"
  value: string | number | string[]
  caseSensitive?: boolean
}

export interface Category {
  _id: string
  userId: string
  name: string
  description?: string
  rules: CategoryRule[]
  color?: string
  icon?: string
  transactionCount?: number
  manualTransactionIds?: string[]
  excludedTransactionIds?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryRequest {
  name: string
  description?: string
  rules?: CategoryRule[]
  color?: string
  icon?: string
}
