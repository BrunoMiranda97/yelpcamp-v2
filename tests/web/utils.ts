/** Unsigned token with the given payload; the client only reads `exp`. */
export const fakeToken = (payload: object) =>
  `header.${btoa(JSON.stringify(payload)).replace(/=+$/, "")}.signature`;
