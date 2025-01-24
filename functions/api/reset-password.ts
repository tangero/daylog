async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === "POST") {
    try {
      const { email } = await request.json();
      const resetToken = crypto.randomUUID();
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

      const result = await env.DB.prepare(
        "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ? RETURNING email",
      )
        .bind(resetToken, expires.toISOString(), email)
        .first();

      if (!result) {
        return new Response("User not found", { status: 404 });
      }

      // Send reset email
      const resetUrl = `${new URL(request.url).origin}/reset-password?token=${resetToken}`;
      await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Reset hesla - DayLog",
          html: `
            <h1>Reset hesla</h1>
            <p>Pro reset hesla klikněte na následující odkaz:</p>
            <p><a href="${resetUrl}">Resetovat heslo</a></p>
            <p>Odkaz je platný 1 hodinu.</p>
          `,
        }),
      });

      return new Response(null, { status: 200 });
    } catch (error) {
      return new Response(error.message, { status: 500 });
    }
  } else if (request.method === "PUT") {
    try {
      const { token, password } = await request.json();
      const hashedPassword = hashPassword(password);

      const result = await env.DB.prepare(
        `
        UPDATE users 
        SET password = ?, 
            reset_token = NULL, 
            reset_token_expires = NULL 
        WHERE reset_token = ? 
          AND reset_token_expires > CURRENT_TIMESTAMP 
        RETURNING email
      `,
      )
        .bind(hashedPassword, token)
        .first();

      if (!result) {
        return new Response("Invalid or expired reset token", { status: 400 });
      }

      return new Response(null, { status: 200 });
    } catch (error) {
      return new Response(error.message, { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
