interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
) {
  console.log("Sending email with Resend...");
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "DayLog <noreply@daylog.app>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Resend API error:", errorText);
    throw new Error(`Failed to send email: ${errorText}`);
  }

  console.log("Email sent successfully");

  return response.json();
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { to, subject, html } = await request.json();
    await sendEmail(env.RESEND_API_KEY, to, subject, html);
    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(error.message, { status: 500 });
  }
};
