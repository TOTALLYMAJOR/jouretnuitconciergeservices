const encoder = new TextEncoder();

function base64Url(bytes: ArrayBuffer) {
  const binary = Array.from(new Uint8Array(bytes), (byte) =>
    String.fromCharCode(byte),
  ).join("");
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64Url(
    await crypto.subtle.sign("HMAC", key, encoder.encode(value)),
  );
}

export function constantTimeEqual(left: string, right: string) {
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    difference |=
      (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}

export async function sha256(value: string) {
  return base64Url(
    await crypto.subtle.digest("SHA-256", encoder.encode(value)),
  );
}

export async function createPaymentToken(
  proposalId: string,
  version: number,
  secret: string,
) {
  const payload = `${proposalId}.${version}`;
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function parseAndVerifyPaymentToken(
  token: string,
  secret: string,
) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [proposalId, rawVersion, signature] = parts;
  const version = Number(rawVersion);
  if (
    !/^[A-Za-z0-9_-]{3,64}$/u.test(proposalId) ||
    !Number.isSafeInteger(version) ||
    version < 1 ||
    !/^[A-Za-z0-9_-]{43}$/u.test(signature)
  ) {
    return null;
  }

  const payload = `${proposalId}.${version}`;
  const expected = await hmac(payload, secret);
  return constantTimeEqual(signature, expected)
    ? { proposalId, version }
    : null;
}
