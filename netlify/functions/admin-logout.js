const COOKIE_NAME = "editorial_admin_session";

exports.handler = async function (event) {
  const host = String((event && event.headers && (event.headers.host || event.headers.Host)) || "");
  const secure = !/^localhost(?::\d+)?$/.test(host) && !/^127\.0\.0\.1(?::\d+)?$/.test(host);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Set-Cookie": `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}; Max-Age=0`
    },
    body: JSON.stringify({ ok: true })
  };
};
