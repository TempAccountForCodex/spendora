import { auth } from "@/lib/auth";

async function handler(request: Request) {
  return auth.handler(request);
}

export {
  handler as DELETE,
  handler as GET,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
