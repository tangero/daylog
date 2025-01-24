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

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { email, password, firstName, lastName } = await request.json();

    // Check if user already exists
    const { results } = await env.DB.prepare(
      "SELECT email FROM users WHERE email = ?",
    )
      .bind(email)
      .all();

    if (results.length > 0) {
      return new Response("Uživatel s tímto emailem již existuje", {
        status: 400,
      });
    }

    // Create new user with verification token
    const hashedPassword = hashPassword(password);
    const verificationToken = crypto.randomUUID();

    await env.DB.prepare(
      "INSERT INTO users (email, password, first_name, last_name, verification_token) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(email, hashedPassword, firstName, lastName, verificationToken)
      .run();

    // Send verification email
    const verificationUrl = `${new URL(request.url).origin}/api/verify-email?token=${verificationToken}`;
    await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Ověření emailu - DayLog",
        html: `
          <h1>Vítejte v DayLog, ${firstName}!</h1>
          <p>Pro dokončení registrace prosím ověřte svůj email kliknutím na následující odkaz:</p>
          <p><a href="${verificationUrl}">Ověřit email</a></p>
        `,
      }),
    });

    // Send welcome email
    try {
      await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: "Vítejte v DayLog",
          html: `
            <h1>Vítejte v DayLog, ${firstName}!</h1>
            <p>Váš účet byl úspěšně vytvořen. Můžete se přihlásit na adrese:</p>
            <p><a href="${request.url.replace("/api/register", "/login")}">Přihlásit se</a></p>
          `,
        }),
      });
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      // Continue even if email fails
    }

    return new Response(null, { status: 201 });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
};
