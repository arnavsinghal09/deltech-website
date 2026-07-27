import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Build the `items` prop for a Base UI <Select>. Base UI resolves the trigger label
 * from `items`, not from the <SelectItem> children, so any select whose value differs
 * from its visible text needs this or the trigger shows the raw value (e.g. a cuid).
 */
export function toSelectItems<T>(
  list: readonly T[],
  getValue: (item: T) => string,
  getLabel: (item: T) => string
): { value: string; label: string }[] {
  return list.map((item) => ({ value: getValue(item), label: getLabel(item) }))
}
