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

    // Validace vstupů
    if (!email || !password || !firstName || !lastName) {
      return new Response("Všechna pole jsou povinná", { status: 400 });
    }

    // Kontrola, zda uživatel již existuje
    const existingUser = await env.DB.prepare(
      "SELECT email FROM users WHERE email = ?",
    )
      .bind(email)
      .first();

    if (existingUser) {
      return new Response("Uživatel s tímto emailem již existuje", {
        status: 400,
      });
    }

    // Vytvoření nového uživatele
    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomUUID();

    const result = await env.DB.prepare(
      `INSERT INTO users (email, password, first_name, last_name, verification_token, verified) 
       VALUES (?, ?, ?, ?, ?, false)`,
    )
      .bind(email, hashedPassword, firstName, lastName, verificationToken)
      .run();

    if (!result.success) {
      throw new Error("Chyba při vytváření uživatele");
    }

    // Odeslání ověřovacího emailu
    const verificationUrl = `${new URL(request.url).origin}/verify-email?token=${verificationToken}`;

    try {
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
    } catch (error) {
      console.error("Failed to send verification email:", error);
      // Pokračujeme i když se nepodaří odeslat email
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Registrace proběhla úspěšně. Zkontrolujte svůj email pro ověření účtu.",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : "Registrace selhala",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
