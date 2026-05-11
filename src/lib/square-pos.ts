export function buildSquarePOSUrl(amountCents: number): string {
  const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || "";
  const callbackUrl = typeof window !== "undefined" ? `${window.location.origin}/callback` : "";
  const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "";

  const data = {
    amount_money: {
      amount: String(amountCents),
      currency_code: "USD",
    },
    callback_url: callbackUrl,
    client_id: appId,
    version: "1.3",
    notes: `MSA Payment - $${(amountCents / 100).toFixed(2)}`,
    location_id: locationId,
    options: {
      supported_tender_types: ["CREDIT_CARD"],
      auto_return: true,
    },
  };

  const encoded = btoa(JSON.stringify(data));

  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent.toLowerCase() : "";
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);

  if (isIOS) {
    return `square-commerce-v1://payment/create?data=${encoded}`;
  } else if (isAndroid) {
    return `intent:#Intent;action=com.squareup.pos.action.CHARGE;package=com.squareup;S.browser_fallback_url=${encodeURIComponent(callbackUrl.replace("/callback", ""))};S.com.squareup.pos.WEB_CALLBACK_URI=${encodeURIComponent(callbackUrl)};S.com.squareup.pos.CLIENT_ID=${appId};S.com.squareup.pos.API_VERSION=v2.0;i.com.squareup.pos.TOTAL_AMOUNT=${amountCents};S.com.squareup.pos.CURRENCY_CODE=USD;S.com.squareup.pos.TENDER_TYPES=com.squareup.pos.TENDER_CARD;S.com.squareup.pos.NOTE=${encodeURIComponent(`MSA Payment - $${(amountCents / 100).toFixed(2)}`)};S.com.squareup.pos.LOCATION_ID=${locationId};end`;
  }

  return "";
}

export function launchSquarePOS(amountCents: number) {
  const url = buildSquarePOSUrl(amountCents);
  if (url) {
    window.location.href = url;
  }
}
