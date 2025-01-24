interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Invalid verification token", { status: 400 });
  }

  try {
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

    // Redirect to login page with success message
    return Response.redirect(`${url.origin}/login?verified=true`);
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
};
