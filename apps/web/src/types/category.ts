export interface CategoryRule {
  field: "store" | "location" | "amount" | "notes" | "tags"
  operator:
    | "equals"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "greaterThan"
    | "lessThan"
    | "between"
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
