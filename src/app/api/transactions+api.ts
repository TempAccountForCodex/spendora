import {
  createTransactionForUser,
  getTransactionForUser,
  searchTransactionsForUser,
} from "@/db/queries/transactions";
import { auth } from "@/lib/auth";

type CreateTransactionBody = {
  title?: unknown;
  amount?: unknown;
  type?: unknown;
  category?: unknown;
  notes?: unknown;
  date?: unknown;
};

function badRequest(message: string) {
  return Response.json({ message }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("id")?.trim() ?? "";

    if (transactionId) {
      const transaction = await getTransactionForUser(
        session.user.id,
        transactionId,
      );

      if (!transaction) {
        return Response.json({ message: "Transaction not found." }, { status: 404 });
      }

      return Response.json({ transaction });
    }

    const query = searchParams.get("query") ?? "";
    const transactions = await searchTransactionsForUser(session.user.id, query);

    return Response.json({ query, transactions });
  } catch (error) {
    console.error("GET /api/transactions failed", error);

    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unexpected transaction search failure.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CreateTransactionBody;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes : undefined;
    const amount =
      typeof body.amount === "number"
        ? body.amount
        : typeof body.amount === "string"
          ? Number(body.amount)
          : Number.NaN;
    const type =
      body.type === "income" || body.type === "expense" ? body.type : null;
    const date = typeof body.date === "string" ? new Date(body.date) : null;

    if (!title) {
      return badRequest("Title is required.");
    }

    if (!category) {
      return badRequest("Category is required.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return badRequest("Amount must be greater than zero.");
    }

    if (!type) {
      return badRequest("Transaction type is required.");
    }

    if (!date || Number.isNaN(date.getTime())) {
      return badRequest("A valid transaction date is required.");
    }

    const transaction = await createTransactionForUser(session.user.id, {
      title,
      amount,
      type,
      category,
      notes,
      occurredAt: date,
    });

    return Response.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions failed", error);

    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unexpected transaction save failure.",
      },
      { status: 500 },
    );
  }
}
