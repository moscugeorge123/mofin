import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination"
import type { PaginationMeta } from "../../types/transaction"

interface TransactionPaginationProps {
  pagination: PaginationMeta
  currentPage: number
  onPageChange: (page: number) => void
}

export function TransactionPagination({
  pagination,
  currentPage,
  onPageChange,
}: TransactionPaginationProps) {
  const { totalPages } = pagination

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    const maxPagesToShow = 7

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the start
      if (currentPage <= 3) {
        startPage = 2
        endPage = 5
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4
        endPage = totalPages - 1
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push("ellipsis")
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push("ellipsis")
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="shrink-0 border-t bg-background py-4">
      <div className="flex items-center justify-between px-4">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
          {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
          {pagination.total} transactions
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(currentPage - 1)}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {pageNumbers.map((pageNum, idx) => {
              if (pageNum === "ellipsis") {
                return (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(currentPage + 1)}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
