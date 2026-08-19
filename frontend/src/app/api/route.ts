import { jsonOk } from "@/server/http";

export const dynamic = "force-dynamic";

/** Health check so `GET /api` is not a 404 (there is no other handler at this path). */
export async function GET() {
  return jsonOk({ ok: true, service: "fundogs-api" });
}
