import { getDashboardData } from "@/db/queries/dashboard";
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

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    if (scope === "statistics") {
      const statistics = await getStatisticsData(session.user.id);

      return Response.json(statistics);
    }

    const dashboard = await getDashboardData(session.user.id);

    return Response.json(dashboard);
  } catch (error) {
    console.error("GET /api/dashboard failed", error);

    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unexpected dashboard load failure.",
      },
      { status: 500 },
    );
  }
}
