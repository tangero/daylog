interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === "PUT") {
    try {
      const { email, firstName, lastName, password } = await request.json();

      let query = `
        UPDATE users 
        SET first_name = ?, 
            last_name = ?
      `;
      const params = [firstName, lastName];

      if (password) {
        query += ", password = ?";
        params.push(password);
      }

      query += " WHERE email = ? RETURNING email, first_name, last_name";
      params.push(email);

      const result = await env.DB.prepare(query)
        .bind(...params)
        .first();

      if (!result) {
        return new Response("User not found", { status: 404 });
      }

      return Response.json(result);
    } catch (error) {
      console.error("Profile update error:", error);
      return new Response(
        error instanceof Error ? error.message : "Failed to update profile",
        { status: 500 },
      );
    }
  }

  return new Response("Method not allowed", { status: 405 });
};
