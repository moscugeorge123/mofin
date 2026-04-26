import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Plus, Trash2 } from "lucide-react"
import { useTransactionCurrencies } from "../hooks/use-transactions"
import type { CategoryRule } from "../types/category"

interface CategoryRuleEditorProps {
  rules: CategoryRule[]
  onRulesChange: (rules: CategoryRule[]) => void
}

const FIELD_OPERATORS: Record<
  CategoryRule["field"],
  CategoryRule["operator"][]
> = {
  store: ["equals", "contains", "startsWith", "endsWith"],
  location: ["equals", "contains", "startsWith", "endsWith"],
  notes: ["equals", "contains", "startsWith", "endsWith"],
  tags: ["equals"],
  amount: ["equals", "greaterThan", "lessThan", "between"],
  date: ["after", "before", "betweenDates"],
  currency: ["equals"],
}

const OPERATOR_LABELS: Record<CategoryRule["operator"], string> = {
  equals: "Equals",
  contains: "Contains",
  startsWith: "Starts With",
  endsWith: "Ends With",
  greaterThan: "Greater Than",
  lessThan: "Less Than",
  between: "Between",
  after: "After",
  before: "Before",
  betweenDates: "Between",
}

export function CategoryRuleEditor({
  rules,
  onRulesChange,
}: CategoryRuleEditorProps) {
  const { data: currencies = [] } = useTransactionCurrencies()

  const addRule = () => {
    const newRule: CategoryRule = {
      field: "store",
      operator: "contains",
      value: "",
      caseSensitive: false,
    }
    onRulesChange([...rules, newRule])
  }

  const removeRule = (index: number) => {
    onRulesChange(rules.filter((_, i) => i !== index))
  }

  const updateRule = (index: number, updates: Partial<CategoryRule>) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], ...updates }
    onRulesChange(newRules)
  }

  const handleFieldChange = (index: number, field: CategoryRule["field"]) => {
    const defaultOperator = FIELD_OPERATORS[field][0]
    const defaultValue =
      field === "date" && defaultOperator === "betweenDates" ? ["", ""] : ""
    updateRule(index, { field, operator: defaultOperator, value: defaultValue })
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Automation Rules</h3>
          <p className="text-xs text-muted-foreground">
            Add rules to automatically assign transactions to this group
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addRule}>
          <Plus className="mr-1 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No rules added yet
        </p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div
              key={index}
              className="grid grid-cols-12 items-start gap-2 rounded-md border p-3"
            >
              {/* Field */}
              <div className="col-span-3">
                <Select
                  value={rule.field}
                  onValueChange={(value) =>
                    handleFieldChange(index, value as CategoryRule["field"])
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store">Store</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="tags">Tags</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Operator */}
              <div className="col-span-3">
                <Select
                  value={rule.operator}
                  onValueChange={(value) =>
                    updateRule(index, {
                      operator: value as CategoryRule["operator"],
                      value:
                        value === "betweenDates"
                          ? ["", ""]
                          : value === "between"
                            ? ["", ""]
                            : "",
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPERATORS[rule.field].map((op) => (
                      <SelectItem key={op} value={op}>
                        {OPERATOR_LABELS[op]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value */}
              <div className="col-span-5">
                {rule.field === "currency" ? (
                  <Select
                    value={typeof rule.value === "string" ? rule.value : ""}
                    onValueChange={(value) => updateRule(index, { value })}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : rule.field === "date" &&
                  rule.operator === "betweenDates" ? (
                  <div className="flex gap-1">
                    <Input
                      type="date"
                      value={Array.isArray(rule.value) ? rule.value[0] : ""}
                      onChange={(e) => {
                        const newValue = Array.isArray(rule.value)
                          ? [e.target.value, rule.value[1] || ""]
                          : [e.target.value, ""]
                        updateRule(index, { value: newValue })
                      }}
                      className="h-9"
                    />
                    <Input
                      type="date"
                      value={Array.isArray(rule.value) ? rule.value[1] : ""}
                      onChange={(e) => {
                        const newValue = Array.isArray(rule.value)
                          ? [rule.value[0] || "", e.target.value]
                          : ["", e.target.value]
                        updateRule(index, { value: newValue })
                      }}
                      className="h-9"
                    />
                  </div>
                ) : rule.field === "date" ? (
                  <Input
                    type="date"
                    value={typeof rule.value === "string" ? rule.value : ""}
                    onChange={(e) =>
                      updateRule(index, { value: e.target.value })
                    }
                    className="h-9"
                  />
                ) : rule.operator === "between" ? (
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={Array.isArray(rule.value) ? rule.value[0] : ""}
                      onChange={(e) => {
                        const newValue = Array.isArray(rule.value)
                          ? [e.target.value, rule.value[1] || ""]
                          : [e.target.value, ""]
                        updateRule(index, { value: newValue })
                      }}
                      className="h-9"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={Array.isArray(rule.value) ? rule.value[1] : ""}
                      onChange={(e) => {
                        const newValue = Array.isArray(rule.value)
                          ? [rule.value[0] || "", e.target.value]
                          : ["", e.target.value]
                        updateRule(index, { value: newValue })
                      }}
                      className="h-9"
                    />
                  </div>
                ) : (
                  <Input
                    type={
                      rule.field === "amount" &&
                      (rule.operator === "greaterThan" ||
                        rule.operator === "lessThan" ||
                        rule.operator === "equals")
                        ? "number"
                        : "text"
                    }
                    placeholder="Value"
                    value={
                      typeof rule.value === "string" ||
                      typeof rule.value === "number"
                        ? rule.value
                        : ""
                    }
                    onChange={(e) =>
                      updateRule(index, { value: e.target.value })
                    }
                    className="h-9"
                  />
                )}
              </div>

              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRule(index)}
                  className="h-9 w-9"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
