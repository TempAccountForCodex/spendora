import { getStatisticsData } from "@/db/queries/statistics";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const statistics = await getStatisticsData(session.user.id);

    return Response.json(statistics);
  } catch (error) {
    console.error("GET /api/statistics failed", error);

    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unexpected statistics load failure.",
      },
      { status: 500 },
    );
  }
}
