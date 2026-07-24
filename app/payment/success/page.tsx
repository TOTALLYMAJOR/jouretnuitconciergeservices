import { PaymentState } from "../PaymentState";
import { findCheckoutWithProposal } from "../../../lib/payment-repository";
import { PaymentConfigurationError } from "../../../lib/payment-runtime";

export const dynamic = "force-dynamic";

type PaymentReturnPageProps = {
  searchParams: Promise<{ session_id?: string | string[] }>;
};

async function readVerifiedState(sessionId: string) {
  try {
    const records = await findCheckoutWithProposal(sessionId);
    return records?.proposal.status === "deposit_verified";
  } catch (error) {
    if (error instanceof PaymentConfigurationError) return false;
    throw error;
  }
}

export default async function PaymentReturnPage({
  searchParams,
}: PaymentReturnPageProps) {
  const params = await searchParams;
  const sessionId =
    typeof params.session_id === "string" ? params.session_id : null;

  if (!sessionId || !/^cs_(?:test_|live_)?[A-Za-z0-9]+$/u.test(sessionId)) {
    return <PaymentState state="returned" />;
  }

  const isVerified = await readVerifiedState(sessionId);
  return <PaymentState state={isVerified ? "verified" : "returned"} />;
}
