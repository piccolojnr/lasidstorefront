"use client";

import * as React from "react";
import { IconChevronDown, IconSearch } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
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
};

export default function HeaderSearch({
  action,
  categories,
  defaultCategory = "",
  defaultSearch = "",
  mode = "desktop",
}: HeaderSearchProps) {
  const [selectedCategory, setSelectedCategory] =
    React.useState(defaultCategory);
  const [isOpen, setIsOpen] = React.useState(false);
  const [filterValue, setFilterValue] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const filterInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      filterInputRef.current?.focus();
    } else {
      setFilterValue("");
    }
  }, [isOpen]);

  const allOptions = [{ slug: "", label: "All categories" }, ...categories];

  const query = filterValue.trim().toLowerCase();
  const filteredOptions = !query
    ? allOptions
    : allOptions.filter((option) => option.label.toLowerCase().includes(query));

  const selectedLabel =
    allOptions.find((option) => option.slug === selectedCategory)?.label ??
    "All categories";

  const isDesktop = mode === "desktop";
  const triggerLabel = isDesktop
    ? selectedLabel
    : selectedCategory
      ? selectedLabel
      : "Category";

  return (
    <form
      action={action}
      method="GET"
      role="search"
      className={cn("w-full", isDesktop ? "mx-auto" : "")}
    >
      <input type="hidden" name="category" value={selectedCategory} />
      <div
        ref={rootRef}
        className={cn(
          "relative rounded-xl border border-input bg-card transition-[border-color,box-shadow]",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
          "flex items-center",
          isDesktop ? "min-h-12" : "min-h-11",
        )}
      >
        <div
          className={cn(
            "relative flex items-center border-r border-border",
            isDesktop ? "h-12 min-w-52.5" : "h-11 max-w-38",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "w-full justify-between rounded-none border-0 text-sm font-medium text-foreground shadow-none hover:bg-muted/70",
              isDesktop ? "h-12 rounded-l-xl px-4" : "h-11 rounded-l-xl px-3",
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
          >
            <span className="truncate text-left">{triggerLabel}</span>
            <IconChevronDown
              className={cn(
                "text-muted-foreground transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </Button>

          {isOpen ? (
            <div
              className={cn(
                "absolute left-0 top-[calc(100%+0.5rem)] z-50 rounded-xl border border-border bg-background p-2 shadow-sm",
                isDesktop
                  ? "w-full min-w-[18rem] max-w-sm"
                  : "w-[min(20rem,calc(100vw-2rem))]",
              )}
            >
              <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3">
                <IconSearch className="size-4 text-muted-foreground" />
                <Input
                  ref={filterInputRef}
                  value={filterValue}
                  onChange={(event) => setFilterValue(event.target.value)}
                  placeholder="Find a category"
                  className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="mt-2 max-h-72 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {filteredOptions.map((option) => {
                      const isSelected = option.slug === selectedCategory;

                      return (
                        <button
                          key={option.slug || "all-categories"}
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            isSelected
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground hover:bg-muted",
                          )}
                          onClick={() => {
                            setSelectedCategory(option.slug);
                            setIsOpen(false);
                          }}
                        >
                          <span className="truncate">{option.label}</span>
                          {isSelected ? (
                            <span className="text-xs font-medium text-muted-foreground">
                              Selected
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg px-3 py-6 text-center text-sm text-muted-foreground">
                    No categories found
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 items-center",
            isDesktop ? "px-4" : "px-3",
          )}
        >
          <label htmlFor={`${mode}-site-search`} className="sr-only">
            Search products
          </label>
          <IconSearch className="size-4 shrink-0 text-muted-foreground" />
          <Input
            id={`${mode}-site-search`}
            type="search"
            name="search"
            defaultValue={defaultSearch}
            placeholder="Search products"
            className="h-11 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
          />
          <Button
            type="submit"
            variant="ghost"
            className="ml-1 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Submit product search"
          >
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
