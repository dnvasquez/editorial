function isSafeRemoteImageUrl(raw) {
  try {
    var parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

exports.handler = async function (event) {
  var params = event && event.queryStringParameters ? event.queryStringParameters : {};
  var rawUrl = String(params.url || "").trim();

  if (!rawUrl) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: "Missing image url."
    };
  }

  if (!isSafeRemoteImageUrl(rawUrl)) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: "Unsupported image url."
    };
  }

  try {
    var response = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "image/*"
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store"
        },
        body: "Upstream image request failed."
      };
    }

    var contentType = response.headers.get("content-type") || "image/jpeg";
    var buffer = Buffer.from(await response.arrayBuffer());

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff"
      },
      body: buffer.toString("base64")
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: "Could not proxy image."
    };
  }
};
