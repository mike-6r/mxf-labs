const ipHeaderOrder = ["cf-connecting-ip", "x-real-ip", "x-forwarded-for", "forwarded"];

function cleanIp(value: string) {
  const ip = value
    .replace(/^for=/i, "")
    .replace(/^"|"$/g, "")
    .trim();

  if (!ip || /unknown/i.test(ip)) return "";
  return ip.replace(/^\[|\]$/g, "");
}

function firstIpFromHeader(value: string) {
  if (!value) return "";

  if (value.includes(";")) {
    const forPart = value
      .split(";")
      .map((part) => part.trim())
      .find((part) => /^for=/i.test(part));

    if (forPart) return cleanIp(forPart);
  }

  return cleanIp(value.split(",")[0] || "");
}

function headerValue(source: Request | Headers, header: string) {
  return source instanceof Headers ? source.get(header) : source.headers.get(header);
}

export function requestIp(source: Request | Headers) {
  for (const header of ipHeaderOrder) {
    const ip = firstIpFromHeader(headerValue(source, header) || "");
    if (ip) return ip;
  }

  return "local";
}
