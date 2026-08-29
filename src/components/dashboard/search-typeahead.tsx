"use client";

import { useCallback, useId, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search, X } from "lucide-react";
import clsx from "clsx";

interface TypeaheadSuggestion {
  id: string;
  label: string;
  category?: string;
}

interface SearchTypeaheadProps {
  suggestions: TypeaheadSuggestion[];
  placeholder?: string;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
}

export function SearchTypeahead({
  suggestions,
  placeholder = "Search marketplace…",
  onSearch,
  isLoading = false,
}: SearchTypeaheadProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(
    searchParams.get("q") || ""
  );

  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      setActiveIndex(-1);
      if (value.length > 0) {
        setIsOpen(true);
        onSearch?.(value);
      } else {
        setIsOpen(false);
      }
    },
    [onSearch]
  );

  const handleSelect = useCallback(
    (suggestion: TypeaheadSuggestion) => {
      setInputValue(suggestion.label);
      setIsOpen(false);
      setActiveIndex(-1);

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("q", suggestion.label);
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      router.replace(
        params.toString()
          ? `${pathname}?${params.toString()}`
          : pathname
      );
    });
  }, [searchParams, pathname, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            handleSelect(suggestions[activeIndex]);
          } else if (inputValue.trim()) {
            setIsOpen(false);
            startTransition(() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("q", inputValue);
              router.replace(`${pathname}?${params.toString()}`);
            });
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    },
    [
      suggestions,
      activeIndex,
      handleSelect,
      inputValue,
      searchParams,
      pathname,
      router,
      isOpen,
    ]
  );

  const filteredSuggestions = suggestions.filter((s) =>
    s.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Group suggestions by category if available
  const groupedSuggestions = filteredSuggestions.reduce(
    (acc, suggestion) => {
      const category = suggestion.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(suggestion);
      return acc;
    },
    {} as Record<string, TypeaheadSuggestion[]>
  );

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          aria-label="Search marketplace"
          aria-autocomplete="list"
          aria-controls={isOpen ? listId : undefined}
          aria-expanded={isOpen}
          aria-activedescendant={
            isOpen && activeIndex >= 0
              ? `search-suggestion-${activeIndex}`
              : undefined
          }
          className={clsx(
            "w-full rounded-lg border border-zinc-700 bg-zinc-900/50 py-2.5 pl-10 pr-10 text-sm",
            "placeholder:text-zinc-500 transition-colors",
            "focus:border-cyan-500 focus:bg-zinc-900 focus:ring-2 focus:ring-cyan-400/50 focus:outline-none",
            "hover:border-zinc-600"
          )}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className={clsx(
              "absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500",
              "hover:text-zinc-300 transition-colors focus-visible:ring-2",
              "focus-visible:ring-cyan-400 rounded"
            )}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && inputValue && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          id={listId}
          role="listbox"
          className={clsx(
            "absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto",
            "rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg"
          )}
        >
          {Object.entries(groupedSuggestions).map(([category, items]) => (
            <div key={category}>
              {category !== "Other" && (
                <div className="border-t border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-400 first:border-t-0">
                  {category}
                </div>
              )}
              {items.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  type="button"
                  id={`search-suggestion-${
                    Object.keys(groupedSuggestions)
                      .slice(0, Object.keys(groupedSuggestions).indexOf(category))
                      .reduce((sum, cat) => sum + groupedSuggestions[cat].length, 0) + index
                  }`}
                  role="option"
                  aria-selected={
                    activeIndex ===
                    Object.keys(groupedSuggestions)
                      .slice(0, Object.keys(groupedSuggestions).indexOf(category))
                      .reduce((sum, cat) => sum + groupedSuggestions[cat].length, 0) +
                      index
                  }
                  onClick={() => handleSelect(suggestion)}
                  onMouseEnter={() => {
                    setActiveIndex(
                      Object.keys(groupedSuggestions)
                        .slice(0, Object.keys(groupedSuggestions).indexOf(category))
                        .reduce((sum, cat) => sum + groupedSuggestions[cat].length, 0) + index
                    );
                  }}
                  className={clsx(
                    "flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors",
                    activeIndex ===
                      Object.keys(groupedSuggestions)
                        .slice(0, Object.keys(groupedSuggestions).indexOf(category))
                        .reduce((sum, cat) => sum + groupedSuggestions[cat].length, 0) +
                        index
                      ? "bg-zinc-800 text-cyan-300"
                      : "text-zinc-300 hover:bg-zinc-800/50"
                  )}
                >
                  <Search className="h-4 w-4 flex-shrink-0 text-zinc-500" aria-hidden="true" />
                  <span className="flex-1 text-left">{suggestion.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && inputValue && filteredSuggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm text-zinc-400">
          No results found for "{inputValue}"
        </div>
      )}
    </div>
  );
}
