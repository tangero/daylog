interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    switch (request.method) {
      case "GET": {
        const { results } = await env.DB.prepare(
          "SELECT * FROM activities ORDER BY timestamp DESC",
        ).all();
        return Response.json(results);
      }

      case "POST": {
        const activity = await request.json();
        const {
          id,
          timestamp,
          display_timestamp,
          duration,
          action,
          tags,
          user_email,
        } = activity;

        await env.DB.prepare(
          "INSERT INTO activities (id, timestamp, display_timestamp, duration, action, tags, user_email) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(
            id,
            timestamp,
            display_timestamp,
            duration,
            action,
            JSON.stringify(tags),
            user_email,
          )
          .run();

        return new Response(null, { status: 201 });
      }

      case "PUT": {
        const activity = await request.json();
        const {
          id,
          timestamp,
          display_timestamp,
          duration,
          action,
          tags,
          user_email,
        } = activity;

        await env.DB.prepare(
          "UPDATE activities SET timestamp = ?, display_timestamp = ?, duration = ?, action = ?, tags = ?, user_email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
          .bind(
            timestamp,
            display_timestamp,
            duration,
            action,
            JSON.stringify(tags),
            user_email,
            id,
          )
          .run();

        return new Response(null, { status: 200 });
      }

      case "DELETE": {
        const { id } = await request.json();

        await env.DB.prepare("DELETE FROM activities WHERE id = ?")
          .bind(id)
          .run();

        return new Response(null, { status: 200 });
      }

      default:
        return new Response("Method not allowed", { status: 405 });
    }
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
};
