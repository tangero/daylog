async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface Env {
  DB: D1Database;
}

// Pro debugování
function logError(error: any, context: string = "") {
  console.error(`Registration Error ${context}:`, {
    message: error.message,
    cause: error.cause,
    stack: error.stack,
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Debug log pro ověření připojení k DB
  console.log("DB binding:", env.DB);

  // Test DB připojení
  try {
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table';",
    ).all();
    console.log("Available tables:", tables);
  } catch (error) {
    console.error("Error checking DB:", error);
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Method not allowed",
      }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  console.log("Starting registration process");

  try {
    const data = await request.json();
    console.log("Received registration data:", {
      ...data,
      password: "[REDACTED]",
    });
    const { email, password, firstName, lastName } = data;

    // Validace vstupů
    if (!email || !password || !firstName || !lastName) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Všechna pole jsou povinná",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Kontrola, zda uživatel již existuje
    console.log("Checking for existing user");
    let existingUser;
    try {
      const stmt = env.DB.prepare("SELECT email FROM users WHERE email = ?");
      console.log("Prepared statement:", stmt);
      existingUser = await stmt.bind(email).first();
      console.log("Existing user check result:", existingUser);
    } catch (error) {
      logError(error, "checking existing user");
      throw error;
    }

    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Uživatel s tímto emailem již existuje",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Vytvoření nového uživatele
    console.log("Creating new user");
    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomUUID();

    try {
      const result = await env.DB.prepare(
        `INSERT INTO users (email, password, first_name, last_name, verification_token, verified) 
         VALUES (?, ?, ?, ?, ?, false)`,
      )
        .bind(email, hashedPassword, firstName, lastName, verificationToken)
        .run();

      console.log("Insert result:", result);

      if (!result.success) {
        throw new Error("Chyba při vytváření uživatele");
      }
    } catch (error) {
      logError(error, "inserting new user");
      throw error;
    }

    // Odeslání ověřovacího emailu
    console.log("Sending verification email");
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

    console.log("Registration completed successfully");
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
    logError(error, "registration process");
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
