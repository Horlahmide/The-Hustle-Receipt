export async function initiateFlutterwavePayment(params: {
  amount: number;
  email: string;
  name?: string;
  txRef: string;
  redirectUrl: string;
}) {
  const response = await fetch(
    "https://api.flutterwave.com/v3/payments",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: params.txRef,
        amount: params.amount,
        currency: "NGN",
        redirect_url: params.redirectUrl,
        customer: {
          email: params.email,
          name: params.name || "Anonymous",
        },
        customizations: {
          title: "The Hustle Receipt",
          description: "Send a tip to a creator",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Flutterwave initiation failed: ${error}`);
  }

  const data = await response.json();
  return data as { status: string; message: string; data: { link: string } };
}

export async function verifyFlutterwaveTransaction(txRef: string) {
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Flutterwave verification failed: ${error}`);
  }

  const data = await response.json();
  return data as {
    status: string;
    message: string;
    data: {
      id: number;
      tx_ref: string;
      amount: number;
      currency: string;
      status: string;
      customer: { email: string; name: string };
    };
  };
}
