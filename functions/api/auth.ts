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
      const hashedPassword = await hashPassword(password);

      const { results } = await env.DB.prepare(
        "SELECT * FROM users WHERE email = ? AND password = ?",
      )
        .bind(email, hashedPassword)
        .all();

      if (results.length === 0) {
        return new Response("Invalid credentials", { status: 401 });
      }

      const user = results[0];
      if (!user.verified) {
        return new Response("Please verify your email before logging in", {
          status: 401,
        });
      }

      return Response.json({
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(error.message, { status: 500 });
  }
};
