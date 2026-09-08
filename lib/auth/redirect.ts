export function safeNext(value: string | null) {
  // These are the only destinations the login and recovery flows need.
  return value === "/auth/reset-password" ? value : "/studio";
}
