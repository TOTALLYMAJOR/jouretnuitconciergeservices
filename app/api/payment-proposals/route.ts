import { NextResponse } from "next/server";
import {
  constantTimeEqual,
  createPaymentToken,
  sha256,
} from "../../../lib/payment-crypto";
import { proposalKey } from "../../../lib/payment-domain";
import {
  PaymentConfigurationError,
  paymentDb,
  paymentPublicUrl,
  requireLongSecret,
} from "../../../lib/payment-runtime";

export const dynamic = "force-dynamic";

type ProposalInput = {
  proposalId?: unknown;
  version?: unknown;
  clientName?: unknown;
  clientEmail?: unknown;
  businessName?: unknown;
  description?: unknown;
  acceptanceReference?: unknown;
  depositAmount?: unknown;
  currency?: unknown;
  acceptedAt?: unknown;
  dueAt?: unknown;
};

function text(
  value: unknown,
  field: string,
  maximum: number,
  required = true,
) {
  if (value == null && !required) return null;
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be a string.`);
  }
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > maximum) {
    throw new TypeError(`${field} is invalid.`);
  }
  return normalized || null;
}

function timestamp(value: unknown, field: string, required = true) {
  if (value == null && !required) return null;
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be an ISO date string.`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`${field} must be a valid ISO date string.`);
  }
  return parsed;
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
}

export async function POST(request: Request) {
  try {
    const suppliedAdminToken = bearerToken(request);
    const configuredAdminToken = await requireLongSecret(
      "PAYMENT_ADMIN_TOKEN",
    );
    if (
      !suppliedAdminToken ||
      !constantTimeEqual(suppliedAdminToken, configuredAdminToken)
    ) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as ProposalInput;
    const proposalId = text(body.proposalId, "proposalId", 64)!;
    if (!/^[A-Za-z0-9_-]{3,64}$/u.test(proposalId)) {
      throw new TypeError(
        "proposalId may contain letters, numbers, underscores, and hyphens.",
      );
    }

    const version = body.version;
    if (!Number.isSafeInteger(version) || Number(version) < 1) {
      throw new TypeError("version must be a positive integer.");
    }

    const clientName = text(body.clientName, "clientName", 120)!;
    const clientEmail = text(body.clientEmail, "clientEmail", 254)!.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(clientEmail)) {
      throw new TypeError("clientEmail must be a valid email address.");
    }

    const businessName = text(body.businessName, "businessName", 160, false);
    const description = text(body.description, "description", 240)!;
    const acceptanceReference = text(
      body.acceptanceReference,
      "acceptanceReference",
      160,
    )!;
    const depositAmount = body.depositAmount;
    if (
      !Number.isSafeInteger(depositAmount) ||
      Number(depositAmount) < 100 ||
      Number(depositAmount) > 100_000_000
    ) {
      throw new TypeError(
        "depositAmount must be an integer between 100 and 100000000 minor currency units.",
      );
    }

    const currency = text(body.currency, "currency", 3)!.toLowerCase();
    if (!/^[a-z]{3}$/u.test(currency)) {
      throw new TypeError("currency must be a three-letter ISO currency code.");
    }

    const acceptedAt = timestamp(body.acceptedAt, "acceptedAt")!;
    if (acceptedAt > Date.now() + 5 * 60 * 1000) {
      throw new TypeError("acceptedAt cannot be in the future.");
    }
    const dueAt = timestamp(body.dueAt, "dueAt", false);
    if (dueAt !== null && dueAt < acceptedAt) {
      throw new TypeError("dueAt cannot be earlier than acceptedAt.");
    }

    const immutableValues = {
      proposalId,
      version: Number(version),
      clientName,
      clientEmail,
      businessName,
      description,
      acceptanceReference,
      depositAmount: Number(depositAmount),
      currency,
      acceptedAt,
      dueAt,
    };
    const immutableFingerprint = await sha256(
      JSON.stringify(immutableValues),
    );
    const key = proposalKey(proposalId, Number(version));
    const now = Date.now();

    const database = paymentDb();
    const inserted = await database<{ immutable_fingerprint: string }[]>`
        INSERT INTO jour_payments.payment_proposals (
          key, proposal_id, version, client_name, client_email, business_name,
          description, acceptance_reference, immutable_fingerprint,
          deposit_amount, currency, status, accepted_at, due_at, created_at,
          updated_at
        ) VALUES (
          ${key}, ${proposalId}, ${Number(version)}, ${clientName},
          ${clientEmail}, ${businessName}, ${description},
          ${acceptanceReference}, ${immutableFingerprint},
          ${Number(depositAmount)}, ${currency}, 'deposit_requested',
          ${acceptedAt}, ${dueAt}, ${now}, ${now}
        )
        ON CONFLICT (proposal_id, version) DO NOTHING
        RETURNING immutable_fingerprint`;
    const created = inserted.length === 1;

    if (!created) {
      const [existing] = await database<{ immutable_fingerprint: string }[]>`
          SELECT immutable_fingerprint
          FROM jour_payments.payment_proposals
          WHERE proposal_id = ${proposalId} AND version = ${Number(version)}
          LIMIT 1`;
      if (
        !existing ||
        !constantTimeEqual(
          existing.immutable_fingerprint,
          immutableFingerprint,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "That proposal version already exists with different immutable commercial terms.",
          },
          { status: 409 },
        );
      }
    }

    const token = await createPaymentToken(
      proposalId,
      Number(version),
      requireLongSecret("PAYMENT_LINK_SECRET"),
    );
    const paymentUrl = `${await paymentPublicUrl(request)}/payment/${encodeURIComponent(token)}`;

    return NextResponse.json(
      {
        proposalId,
        version: Number(version),
        paymentUrl,
        created,
      },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof PaymentConfigurationError) {
      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 503 },
      );
    }
    console.error("Unable to issue payment proposal.", error);
    return NextResponse.json(
      { error: "Unable to issue the payment proposal." },
      { status: 500 },
    );
  }
}
