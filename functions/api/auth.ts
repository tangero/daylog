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

  try {
    if (request.method === "POST") {
      const { email, password } = await request.json();
      const hashedPassword = hashPassword(password);

      const { results } = await env.DB.prepare(
        "SELECT * FROM users WHERE email = ? AND password = ?",
      )
        .bind(email, hashedPassword)
        .all();

      if (results.length === 0) {
        return new Response("Invalid credentials", { status: 401 });
      }

      // V produkci byste zde měli použít JWT nebo jiný bezpečný token systém
      return Response.json({
        email: results[0].email,
        firstName: results[0].first_name,
        lastName: results[0].last_name,
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
};
