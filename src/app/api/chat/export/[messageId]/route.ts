import { auth } from "@/lib/auth";
import { getLocalDb } from "@/lib/db/local";
import { chatConversations, chatMessages } from "@/schema/local";
import { and, eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const { messageId } = await params;
  let msgId: bigint;
  let userId: bigint;
  try {
    msgId = BigInt(messageId);
    userId = BigInt(session.user.id);
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const db = getLocalDb();
  const rows = await db
    .select({ message: chatMessages })
    .from(chatMessages)
    .innerJoin(chatConversations, eq(chatMessages.conversationId, chatConversations.id))
    .where(and(eq(chatMessages.id, msgId), eq(chatConversations.userId, userId)))
    .limit(1);

  const entry = rows[0];
  if (!entry) return new NextResponse("Not Found", { status: 404 });
  const { message } = entry;

  const columns = Array.isArray(message.resultColumns) ? (message.resultColumns as string[]) : null;
  const resultRows = Array.isArray(message.resultRows)
    ? (message.resultRows as Record<string, unknown>[])
    : null;

  if (!columns || !resultRows) {
    return new NextResponse("Message has no tabular results to export", { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Willian's Hub";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Resultados");
  sheet.columns = columns.map((name) => ({
    header: name,
    key: name,
    width: Math.min(Math.max(name.length + 2, 12), 40),
  }));
  for (const row of resultRows) sheet.addRow(row);
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle", horizontal: "left" };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEBEBF7" },
  };

  // Metadata sheet
  const meta = workbook.addWorksheet("Query");
  meta.columns = [
    { header: "Campo", key: "k", width: 20 },
    { header: "Valor", key: "v", width: 100 },
  ];
  meta.getRow(1).font = { bold: true };
  meta.addRow({ k: "Pregunta (origen)", v: "—" });
  meta.addRow({ k: "Base de datos", v: message.dataSource ?? "" });
  meta.addRow({ k: "Filas", v: message.rowCount ?? 0 });
  meta.addRow({ k: "Duración (ms)", v: message.durationMs ?? 0 });
  meta.addRow({ k: "Generado", v: new Date().toISOString() });
  meta.addRow({ k: "SQL", v: message.sqlGenerated ?? "" });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `analytics_${messageId}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as unknown as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
