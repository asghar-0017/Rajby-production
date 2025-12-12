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
      timeout: 30000, // Increased timeout to 30 seconds
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

  const url = `http://103.104.84.43:5000/api/InvoicingApi/delete/${encodeURIComponent(companyInvoiceRefNo)}`;
  
  console.log(`[Rajby API] DELETE Request URL: ${url}`);
  console.log(`[Rajby API] Using token: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);

  try {
    const response = await axios.delete(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000, // Increased timeout to 30 seconds
    });

    console.log(`[Rajby API] DELETE Response Status: ${response.status}`);
    console.log(`[Rajby API] DELETE Response Data:`, JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`[Rajby API] DELETE Error Response Status: ${error.response.status}`);
      console.error(`[Rajby API] DELETE Error Response Data:`, JSON.stringify(error.response.data, null, 2));
      console.error(`[Rajby API] DELETE Error Response Headers:`, JSON.stringify(error.response.headers, null, 2));
      
      const errorMessage = error.response.data?.message || error.message || 'Unknown error';
      const errorDetails = {
        status: error.response.status,
        data: error.response.data,
        message: errorMessage,
      };
      
      throw new Error(`Rajby API DELETE failed: ${errorMessage} (Status: ${error.response.status})`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`[Rajby API] DELETE Error: No response received`);
      console.error(`[Rajby API] DELETE Error Request:`, error.request);
      throw new Error(`Rajby API DELETE failed: No response received from server`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`[Rajby API] DELETE Error:`, error.message);
      throw new Error(`Rajby API DELETE failed: ${error.message}`);
    }
  }
}

