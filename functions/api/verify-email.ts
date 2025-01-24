interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { token } = await request.json();

    if (!token) {
      return new Response("Token is required", { status: 400 });
    }

    // Update user and get their email
    const result = await env.DB.prepare(
      "UPDATE users SET verified = TRUE, verification_token = NULL WHERE verification_token = ? RETURNING email",
    )
      .bind(token)
      .first();

    if (!result) {
      return new Response("Invalid or expired verification token", {
        status: 400,
      });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Email verification error:", error);
    return new Response(
      error instanceof Error ? error.message : "Failed to verify email",
      { status: 500 },
    );
  }
};
