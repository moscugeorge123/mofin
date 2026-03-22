import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { AVAILABLE_EMOJIS } from "../constants/emojis"

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const selectedEmojiRef = useRef<HTMLButtonElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const selectedEmoji = AVAILABLE_EMOJIS.find((item) => item.emoji === value)
  const filteredEmojis = AVAILABLE_EMOJIS.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.emoji.includes(search)
  )

  useEffect(() => {
    if (open) {
      setSearch("")
      setTimeout(() => {
        if (selectedEmojiRef.current) {
          selectedEmojiRef.current.scrollIntoView({
            block: "center",
            behavior: "smooth",
          })
        }
      }, 100)
    }
  }, [open])

  return (
    <div className="flex items-center gap-2">
      <div className="text-2xl">{value || "💰"}</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
          >
            {selectedEmoji ? selectedEmoji.name : "Select an emoji"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            scrollContainerRef.current?.focus()
          }}
        >
          <div className="flex flex-col">
            <div className="border-b p-2">
              <Input
                placeholder="Search emojis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <div
              ref={scrollContainerRef}
              tabIndex={0}
              className="max-h-72 overflow-y-auto p-1 outline-none"
              onWheel={(e) => {
                e.stopPropagation()
              }}
            >
              {filteredEmojis.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No emoji found.
                </div>
              ) : (
                filteredEmojis.map((item) => {
                  const isSelected = value === item.emoji
                  return (
                    <button
                      key={item.emoji}
                      type="button"
                      onClick={() => {
                        onChange(item.emoji)
                        setOpen(false)
                      }}
                      ref={isSelected ? selectedEmojiRef : null}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted",
                        isSelected && "bg-muted"
                      )}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <span className="flex-1 text-left text-sm">
                        {item.name}
                      </span>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
