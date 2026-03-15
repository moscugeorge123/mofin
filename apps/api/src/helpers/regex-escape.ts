export function escapeRegex(regex: string) {
  return regex.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}
