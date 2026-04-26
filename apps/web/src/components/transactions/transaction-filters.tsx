import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  Filter,
  Search,
  X,
} from "lucide-react"
import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { useTransactionCurrencies } from "../../hooks/use-transactions"
import type { BankAccount } from "../../types/bank-account"

interface TransactionFiltersProps {
  accountFilter: string
  onAccountFilterChange: (value: string) => void
  accounts: BankAccount[]
  accountsLoading: boolean
  searchQuery: string
  onSearchChange: (value: string) => void
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  minAmount: string
  onMinAmountChange: (value: string) => void
  maxAmount: string
  onMaxAmountChange: (value: string) => void
  currencyFilter: string
  onCurrencyFilterChange: (value: string) => void
  onClearFilters: () => void
}

export function TransactionFilters({
  accountFilter,
  onAccountFilterChange,
  accounts,
  accountsLoading,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  typeFilter,
  onTypeFilterChange,
  minAmount,
  onMinAmountChange,
  maxAmount,
  onMaxAmountChange,
  currencyFilter,
  onCurrencyFilterChange,
  onClearFilters,
}: TransactionFiltersProps) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { data: currencies = [] } = useTransactionCurrencies()

  const hasActiveFilters =
    accountFilter !== "all" ||
    searchQuery ||
    dateRange ||
    typeFilter !== "all" ||
    currencyFilter !== "all" ||
    minAmount ||
    maxAmount

  const advancedFiltersCount =
    (accountFilter !== "all" ? 1 : 0) +
    (dateRange ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (currencyFilter !== "all" ? 1 : 0) +
    (minAmount || maxAmount ? 1 : 0)

  const selectedAccount = accounts.find((acc) => acc._id === accountFilter)

  return (
    <div className="mb-6 shrink-0">
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search transactions..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Advanced Filters Button */}
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {advancedFiltersCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {advancedFiltersCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="leading-none font-medium">Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Filter transactions by various criteria
                </p>
              </div>

              {/* Account Filter */}
              <div className="space-y-2">
                <Label>Account</Label>
                <Popover open={accountOpen} onOpenChange={setAccountOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={accountOpen}
                      className="w-full justify-between"
                    >
                      {accountFilter === "all"
                        ? "All Accounts"
                        : selectedAccount
                          ? selectedAccount.name
                          : "Select account..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search accounts..." />
                      <CommandList>
                        <CommandEmpty>
                          {accountsLoading
                            ? "Loading..."
                            : "No accounts found."}
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              onAccountFilterChange("all")
                              setAccountOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                accountFilter === "all"
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            All Accounts
                          </CommandItem>
                          {accounts.map((account) => (
                            <CommandItem
                              key={account._id}
                              value={account.name}
                              onSelect={() => {
                                onAccountFilterChange(account._id)
                                setAccountOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  accountFilter === account._id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {account.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date Range Picker */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={onDateRangeChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Currency Filter */}
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={currencyFilter}
                  onValueChange={onCurrencyFilterChange}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="All currencies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Currencies</SelectItem>
                    {currencies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label>Amount Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minAmount}
                    onChange={(e) => onMinAmountChange(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxAmount}
                    onChange={(e) => onMaxAmountChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
