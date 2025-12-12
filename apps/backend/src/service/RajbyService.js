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
 * @param {number} retries - Number of retry attempts (default: 1)
 * @returns {Promise<Object>} The response from Rajby API
 */
export async function deleteRajbyInvoice(companyInvoiceRefNo, retries = 1) {
  if (!companyInvoiceRefNo) {
    throw new Error("Company Invoice Reference Number is required");
  }

  const axios = (await import("axios")).default;
  
  // Get token with retry logic
  let token;
  try {
    token = await getRajbyToken();
  } catch (tokenError) {
    console.error(`[Rajby API] Failed to get token:`, tokenError.message);
    throw new Error(`Failed to get Rajby token: ${tokenError.message}`);
  }

  const url = `http://103.104.84.43:5000/api/InvoicingApi/delete/${encodeURIComponent(companyInvoiceRefNo)}`;
  
  console.log(`[Rajby API] DELETE Request URL: ${url}`);
  console.log(`[Rajby API] Using token: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);

  let lastError;
  
  // Retry logic for timeout errors
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Rajby API] Retry attempt ${attempt} for DELETE ${companyInvoiceRefNo}`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const response = await axios.delete(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 60000, // 60 seconds timeout
      });

      console.log(`[Rajby API] DELETE Response Status: ${response.status}`);
      console.log(`[Rajby API] DELETE Response Data:`, JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error) {
      lastError = error;
      
      // Enhanced error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error(`[Rajby API] DELETE Error Response Status: ${error.response.status}`);
        console.error(`[Rajby API] DELETE Error Response Data:`, JSON.stringify(error.response.data, null, 2));
        
        const errorMessage = error.response.data?.message || error.message || 'Unknown error';
        
        // Don't retry on client errors (4xx) except 408 (Request Timeout)
        if (error.response.status >= 400 && error.response.status < 500 && error.response.status !== 408) {
          throw new Error(`Rajby API DELETE failed: ${errorMessage} (Status: ${error.response.status})`);
        }
        
        // Retry on server errors (5xx) or 408
        if (attempt < retries && (error.response.status >= 500 || error.response.status === 408)) {
          console.log(`[Rajby API] Server error ${error.response.status}, will retry...`);
          continue;
        }
        
        throw new Error(`Rajby API DELETE failed: ${errorMessage} (Status: ${error.response.status})`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error(`[Rajby API] DELETE Error: No response received (Attempt ${attempt + 1}/${retries + 1})`);
        
        // Check if it's a timeout error
        const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
        
        if (isTimeout && attempt < retries) {
          console.log(`[Rajby API] Timeout error, will retry...`);
          continue;
        }
        
        if (isTimeout) {
          throw new Error(`Rajby API DELETE failed: Request timeout after ${retries + 1} attempt(s). The server may be slow or unreachable.`);
        }
        
        throw new Error(`Rajby API DELETE failed: No response received from server`);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error(`[Rajby API] DELETE Error:`, error.message);
        throw new Error(`Rajby API DELETE failed: ${error.message}`);
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError;
}

