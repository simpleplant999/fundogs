export function isPrismaUniqueConflict(e: unknown): boolean {
  return Boolean(
    e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002",
  );
}
