"use client";

import * as React from "react";
import { IconCheck, IconChevronDown, IconSearch } from "@tabler/icons-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CategoryOption = {
  label: string;
  slug: string;
};

type HeaderSearchProps = {
  action: string;
  categories: CategoryOption[];
  defaultCategory?: string;
  defaultSearch?: string;
  mode?: "desktop" | "mobile";
  placeholder?: string;
};

export default function HeaderSearch({
  action,
  categories,
  defaultCategory = "",
  defaultSearch = "",
  mode = "desktop",
  placeholder = "Search products",
}: HeaderSearchProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState(defaultCategory);
  const [isOpen, setIsOpen] = React.useState(false);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const searchInputId = React.useId();
  const categoryListId = React.useId();

  const isDesktop = mode === "desktop";

  const allOptions = React.useMemo(
    () => [{ slug: "", label: "All categories" }, ...categories],
    [categories],
  );

  const selectedLabel =
    allOptions.find((option) => option.slug === selectedCategory)?.label ??
    "All categories";

  const triggerLabel = isDesktop
    ? selectedLabel
    : selectedCategory
      ? selectedLabel
      : "All";

  React.useEffect(() => {
    setSelectedCategory(defaultCategory);
  }, [defaultCategory]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectCategory = (slug: string) => {
    setSelectedCategory(slug);
    setIsOpen(false);

    window.requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  };

  return (
    <form
      action={action}
      method="GET"
      role="search"
      className="w-full max-w-xl "
    >
      <input type="hidden" name="category" value={selectedCategory} />

      <div
        ref={rootRef}
        className={cn(
          "relative flex w-full items-center rounded-full",
          "border border-border bg-background",
          "transition-[border-color,box-shadow] duration-150",
          "focus-within:border-primary/45",
          "focus-within:ring-2 focus-within:ring-primary/10",
          isDesktop ? "h-9" : "h-10",
        )}
      >
        <label htmlFor={searchInputId} className="sr-only">
          Search products
        </label>

        <IconSearch
          aria-hidden="true"
          className="ml-3.5 size-3.5 shrink-0 text-muted-foreground"
        />

        <Input
          id={searchInputId}
          type="search"
          name="search"
          defaultValue={defaultSearch}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          className={cn(
            "h-full min-w-0 flex-1",
            "border-0 bg-transparent px-2.5",
            "text-[13px] shadow-none",
            "placeholder:text-muted-foreground/75",
            "focus-visible:ring-0",
          )}
        />

        <div className="relative h-full shrink-0">
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={categoryListId}
            onClick={() => setIsOpen((current) => !current)}
            className={cn(
              "flex h-full min-w-0 items-center gap-1.5",
              "border-l border-border/80 bg-transparent",
              "text-xs font-normal text-muted-foreground",
              "outline-none transition-colors",
              "hover:text-foreground",
              "focus-visible:text-foreground",
              isDesktop ? "max-w-40 px-3.5" : "max-w-24 px-3",
            )}
          >
            <span className="truncate">{triggerLabel}</span>

            <IconChevronDown
              aria-hidden="true"
              className={cn(
                "size-3 shrink-0 transition-transform duration-150",
                isOpen && "rotate-180",
              )}
            />
          </button>

          {isOpen && (
            <div
              id={categoryListId}
              role="listbox"
              aria-label="Product categories"
              className={cn(
                "absolute right-0 top-[calc(100%+0.5rem)] z-50",
                "w-[min(17rem,calc(100vw-2rem))]",
                "rounded-xl border border-border",
                "bg-popover p-1.5 text-popover-foreground",
                "shadow-lg shadow-black/5",
              )}
            >
              <div className="max-h-72 overflow-y-auto overscroll-contain">
                {allOptions.map((option) => {
                  const isSelected = option.slug === selectedCategory;

                  return (
                    <button
                      key={option.slug || "all-categories"}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectCategory(option.slug)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3",
                        "rounded-lg px-3 py-2 text-left text-sm",
                        "outline-none transition-colors",
                        "hover:bg-muted",
                        "focus-visible:bg-muted",
                        isSelected && "bg-muted/70 text-foreground",
                      )}
                    >
                      <span className="truncate">{option.label}</span>

                      {isSelected && (
                        <IconCheck
                          aria-hidden="true"
                          className="size-3.5 shrink-0 text-primary"
                          stroke={2.25}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
