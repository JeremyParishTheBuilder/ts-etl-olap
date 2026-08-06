export function capitalize(str: string): string {
  if (str.length === 0) return str;
  return str[0].toUpperCase() + str.slice(1);
}

export function pathToPascalCase(parts: readonly string[]): string {
  return parts.map(toPascalCase).join("");
}

export function toPascalCase(text: string): string {
  return text
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}
