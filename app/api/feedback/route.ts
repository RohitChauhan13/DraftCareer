import { randomUUID } from "crypto";
import { errorResponse, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { sendFeedbackThanksEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { feedbackSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse(new Error("Unauthorized"), 401);
    if (user.role === "admin") return errorResponse(new Error("Admin feedback is not collected here."), 403);

    const payload = feedbackSchema.parse(await request.json());
    const feedbackId = `feedback_${randomUUID()}`;

    await prisma.$queryRaw`
      INSERT INTO feedback (id, user_id, rating, category, message, allow_contact, created_at)
      VALUES (${feedbackId}, ${user.id}, ${payload.rating}, ${payload.category}, ${payload.message}, ${payload.allowContact}, CURRENT_TIMESTAMP)
    `;

    void sendFeedbackThanksEmail({
      email: user.email,
      name: user.name
    }).catch((error) => {
      console.error("Unable to send feedback thank-you email", error);
    });

    return ok({ feedback: { id: feedbackId } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
