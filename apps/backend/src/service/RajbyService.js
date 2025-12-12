// Rajby API token cache
let rajbyTokenCache = {
  token: null,
  expiresAt: null,
};

/**
 * Get fresh Rajby API token
 * Returns cached token if still valid, otherwise fetches a new one
 * @returns {Promise<string>} The Rajby API token
 */
export async function getRajbyToken() {
  const axios = (await import("axios")).default;

  // Return cached token if still valid (with 5 min buffer)
  if (
    rajbyTokenCache.token &&
    rajbyTokenCache.expiresAt &&
    Date.now() < rajbyTokenCache.expiresAt - 300000
  ) {
    return rajbyTokenCache.token;
  }

  console.log("Fetching new Rajby token...");
  const loginResponse = await axios.post(
    "http://103.104.84.43:5000/api/Auth/login",
    {
      userName: "innovative",
      password: "K7#mP!vL9qW2xR$8",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "text/plain",
      },
      timeout: 10000,
    }
  );

  console.log("Rajby login response:", JSON.stringify(loginResponse.data));
  const token =
    loginResponse.data?.token ||
    loginResponse.data?.accessToken ||
    loginResponse.data?.data?.token ||
    loginResponse.data;
  if (!token || typeof token !== "string") {
    console.error(
      "Token extraction failed. Response data:",
      loginResponse.data
    );
    throw new Error("Failed to get token from Rajby login API");
  }

  // Cache token for 24 hours (or parse exp from JWT if needed)
  rajbyTokenCache.token = token;
  rajbyTokenCache.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  console.log("Rajby token refreshed successfully");

  return token;
}

/**
 * Delete invoice from Rajby API
 * @param {string} companyInvoiceRefNo - The company invoice reference number
 * @returns {Promise<Object>} The response from Rajby API
 */
export async function deleteRajbyInvoice(companyInvoiceRefNo) {
  if (!companyInvoiceRefNo) {
    throw new Error("Company Invoice Reference Number is required");
  }

  const axios = (await import("axios")).default;
  const token = await getRajbyToken();

  const response = await axios.delete(
    `http://103.104.84.43:5000/api/InvoicingApi/delete/${companyInvoiceRefNo}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    }
  );

  return response.data;
}

