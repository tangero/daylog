interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return new Response("Email is required", { status: 400 });
    }

    // Get user and check if already verified
    const { results } = await env.DB.prepare(
      "SELECT verification_token, verified, first_name FROM users WHERE email = ?",
    )
      .bind(email)
      .all();

    if (results.length === 0) {
      return new Response("User not found", { status: 404 });
    }

    const user = results[0];

    if (user.verified) {
      return new Response("Email is already verified", { status: 400 });
    }

    // Generate new verification token if none exists
    const verificationToken = user.verification_token || crypto.randomUUID();
    if (!user.verification_token) {
      const result = await env.DB.prepare(
        "UPDATE users SET verification_token = ? WHERE email = ?",
      )
        .bind(verificationToken, email)
        .run();

      if (!result.success) {
        throw new Error("Failed to update verification token");
      }
    }

    // Send verification email
    const verificationUrl = `${new URL(request.url).origin}/verify-email?token=${verificationToken}`;
    const emailResponse = await fetch(
      `${new URL(request.url).origin}/api/email`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Ověření emailu - Progressor",
          html: `
          <h1>Vítejte v DayLog, ${user.first_name}!</h1>
          <p>Pro dokončení registrace prosím ověřte svůj email kliknutím na následující odkaz:</p>
          <p><a href="${verificationUrl}">Ověřit email</a></p>
        `,
        }),
      },
    );

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send verification email: ${errorText}`);
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Resend verification error:", error);
    return new Response(
      error instanceof Error
        ? error.message
        : "Failed to resend verification email",
      { status: 500 },
    );
  }
};
