// Rajby API token cache
let rajbyTokenCache = {
  token: null,
  expiresAt: null,
};

/**
 * Get fresh Rajby API token
 * Always calls login API first to get a fresh token (ignores provided tokens from frontend)
 * Uses cached token only if still valid (within 5 min buffer), otherwise calls login API
 * @param {boolean} forceRefresh - Whether to bypass the cache and get a fresh token (default: false)
 * @returns {Promise<string>} The Rajby API token
 */
export async function getRajbyToken(forceRefresh = false) {
  const axios = (await import("axios")).default;

  // Return cached token if still valid (with 5 min buffer) and not forced
  if (
    !forceRefresh &&
    rajbyTokenCache.token &&
    rajbyTokenCache.expiresAt &&
    Date.now() < rajbyTokenCache.expiresAt - 300000
  ) {
    console.log("Using cached Rajby token (still valid)");
    return rajbyTokenCache.token;
  }

  // Cache expired or doesn't exist or forced - always call login API to get fresh token
  if (forceRefresh) {
    console.log("Rajby token refresh forced - calling login API to get fresh token");
  } else {
    console.log("Rajby token cache expired or missing - calling login API to get fresh token");
  }

  const RAJBY_API_BASE_URL = process.env.RAJBY_API_BASE_URL || "http://103.104.84.43:5000";
  const RAJBY_USERNAME = process.env.RAJBY_USERNAME || "innovative";
  const RAJBY_PASSWORD = process.env.RAJBY_PASSWORD || "K7#mP!vL9qW2xR$8";

  console.log(`Fetching new Rajby token from ${RAJBY_API_BASE_URL}...`);

  // Retry logic for network issues
  const maxRetries = 1;
  let lastError = null;
  let loginResponse = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        if (process.env.NODE_ENV === 'development' || process.env.RAJBY_DEBUG === 'true') {
          console.log(`Rajby token fetch attempt ${attempt + 1}, retrying...`);
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }

      // Configure axios with proxy support if available
      const axiosConfig = {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        timeout: 10000, // 10 seconds timeout
      };

      // Add proxy support if HTTP_PROXY or HTTPS_PROXY is set
      if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
        const { HttpsProxyAgent } = await import('https-proxy-agent');
        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
        const agent = new HttpsProxyAgent(proxyUrl);
        axiosConfig.httpAgent = agent;
        axiosConfig.httpsAgent = agent;
      }

      loginResponse = await axios.post(
        `${RAJBY_API_BASE_URL}/api/Auth/login`,
        {
          userName: RAJBY_USERNAME,
          password: RAJBY_PASSWORD,
        },
        axiosConfig
      );

      // If we get here, the request succeeded
      break;
    } catch (error) {
      lastError = error;

      // If it's a timeout or connection error and we have retries left, retry
      if (
        (error.code === 'ECONNABORTED' ||
          error.code === 'ETIMEDOUT' ||
          error.code === 'ECONNREFUSED' ||
          error.message?.includes('timeout')) &&
        attempt < maxRetries
      ) {
        // Only log retry attempts in development or if explicitly enabled
        if (process.env.NODE_ENV === 'development' || process.env.RAJBY_DEBUG === 'true') {
          console.warn(`Rajby token fetch attempt ${attempt + 1} failed: ${error.message}, will retry...`);
        }
        continue;
      }

      // If it's not a retryable error or we're out of retries, break
      break;
    }
  }

  // If all retries failed, throw a user-friendly error
  if (!loginResponse) {
    if (
      lastError?.code === 'ECONNABORTED' ||
      lastError?.code === 'ETIMEDOUT' ||
      lastError?.code === 'ECONNREFUSED' ||
      lastError?.code === 'ENOTFOUND' ||
      lastError?.code === 'EHOSTUNREACH' ||
      lastError?.message?.includes('timeout')
    ) {
      // Log a concise warning with diagnostic info
      const errorType = lastError?.code || 'timeout';
      console.warn(`⚠️  Rajby API unavailable (${errorType}): Cannot reach ${RAJBY_API_BASE_URL}. The application will continue but Rajby features may be unavailable.`);
      console.warn(`   This usually indicates a network/firewall issue. Check if the production server can reach ${RAJBY_API_BASE_URL}`);
      throw new Error(`Rajby API is currently unavailable (${errorType}). Please check network connectivity or try again later.`);
    }
    throw lastError || new Error("Failed to fetch Rajby token");
  }

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
 * Always calls login API first to get a fresh token before performing the delete
 * @param {string} companyInvoiceRefNo - The company invoice reference number
 * @param {number} retries - Number of retry attempts (default: 1)
 * @returns {Promise<Object>} The response from Rajby API
 */
export async function deleteRajbyInvoice(companyInvoiceRefNo, retries = 1) {
  if (!companyInvoiceRefNo) {
    throw new Error("Company Invoice Reference Number is required");
  }

  const axios = (await import("axios")).default;
  const RAJBY_API_BASE_URL = process.env.RAJBY_API_BASE_URL || "http://103.104.84.43:5000";

  // Always call login API first to get fresh token
  let token;
  try {
    console.log(`[Rajby API] Calling login API first to get fresh token for DELETE operation`);
    token = await getRajbyToken(true);
  } catch (tokenError) {
    console.error(`[Rajby API] Failed to get token:`, tokenError.message);
    throw new Error(`Failed to get Rajby token: ${tokenError.message}`);
  }

  const url = `${RAJBY_API_BASE_URL}/api/InvoicingApi/delete/${encodeURIComponent(companyInvoiceRefNo)}`;

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
          throw new Error(`Rajby API DELETE failed: ${errorMessage}`);
        }

        // Retry on server errors (5xx) or 408
        // if (attempt < retries && (error.response.status >= 500 || error.response.status === 408)) {
        //   console.log(`[Rajby API] Server error ${error.response.status}, will retry...`);
        //   continue;
        // }

        throw new Error(`Rajby API DELETE failed: ${errorMessage}`);
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

/**
 * Submit FBR reference for invoice to Rajby API
 * Always calls login API first to get a fresh token before performing the submission
 * @param {Object} params - Parameters for FBR reference submission
 * @param {string} params.fbrInvoiceNumber - The FBR invoice number
 * @param {string} params.companyInvoiceRefNo - Company invoice reference number
 * @param {string} params.invoiceDate - Invoice date in YYYY-MM-DD format
 * @param {Array} params.invoiceDetails - Array of invoice detail objects with detInvNo and fbrNo
 * @returns {Promise<Object>} The response from Rajby API
 */
export async function submitFBRReference({
  fbrInvoiceNumber,
  companyInvoiceRefNo,
  invoiceDate,
  invoiceDetails = [],
}) {


  const axios = (await import("axios")).default;
  const RAJBY_API_BASE_URL = process.env.RAJBY_API_BASE_URL || "http://103.104.84.43:5000";

  // Always call login API first to get fresh token
  let token;
  try {
    console.log(`[Rajby API] Calling login API first to get fresh token for FBR Reference operation`);
    token = await getRajbyToken(true);
  } catch (tokenError) {
    console.error(`[Rajby API] Failed to get fresh token for FBR Reference:`, tokenError.message);
    throw new Error(`Failed to get Rajby token: ${tokenError.message}`);
  }

  const url = `${RAJBY_API_BASE_URL}/api/InvoicingApi/fbr/reference`;

  console.log(`[Rajby API] FBR Reference Request URL: ${url}`);
  console.log(`[Rajby API] FBR Reference Request - fbrInvoiceNumber: ${fbrInvoiceNumber}, companyInvoiceRefNo: ${companyInvoiceRefNo}`);

  const requestData = {
    fbrInvoiceNumber: fbrInvoiceNumber,
    companyInvoiceRefNo: companyInvoiceRefNo,
    invoiceDate: invoiceDate,
    invoiceDetails: invoiceDetails,
  };

  console.log(`[Rajby API] FBR Reference Request Data:`, JSON.stringify(requestData, null, 2));

  try {
    const response = await axios.post(url, requestData, {
      headers: {
        Accept: "text/plain",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 60000, // 60 seconds timeout
    });

    console.log(`[Rajby API] FBR Reference Response Status: ${response.status}`);
    console.log(`[Rajby API] FBR Reference Response Data:`, JSON.stringify(response.data, null, 2));

    // Handle response - check for success field
    if (response.data && response.data.success === false) {
      throw new Error(response.data.message || "Failed to reference invoice to FBR");
    }

    return response.data;
  } catch (error) {
    // If token unauthorized or forbidden, retry once with a freshly renewed token
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn(`[Rajby API] FBR Reference received ${error.response.status}. Forcing token renewal and retrying...`);
      try {
        const freshToken = await getRajbyToken(true);
        const retryResponse = await axios.post(url, requestData, {
          headers: {
            Accept: "text/plain",
            "Content-Type": "application/json",
            Authorization: `Bearer ${freshToken}`,
          },
          timeout: 60000,
        });

        if (retryResponse.data && retryResponse.data.success === false) {
          throw new Error(retryResponse.data.message || "Failed to reference invoice to FBR");
        }

        return retryResponse.data;
      } catch (retryErr) {
        console.error(`[Rajby API] Token renewal retry failed:`, retryErr.message);
        error = retryErr;
      }
    }

    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`[Rajby API] FBR Reference Error Response Status: ${error.response.status}`);
      console.error(`[Rajby API] FBR Reference Error Response Data:`, JSON.stringify(error.response.data, null, 2));

      const errorMessage = error.response.data?.message || error.message || 'Unknown error';

      // Handle "already submitted" as success (idempotent operation)
      // This prevents duplicate submissions and treats re-submission as success
      // Check for "already submitted" message regardless of status code (400, 500, etc.)
      const lowerErrorMessage = errorMessage.toLowerCase();
      if (lowerErrorMessage.includes('already submitted') ||
        lowerErrorMessage.includes('cannot reference again') ||
        lowerErrorMessage.includes('already exists')) {
        console.log(`[Rajby API] Invoice already submitted to FBR - treating as success (idempotent)`);
        return {
          success: true,
          message: "Invoice already submitted to FBR",
          alreadySubmitted: true
        };
      }

      throw new Error(`Rajby API FBR Reference failed: ${errorMessage} (Status: ${error.response.status})`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`[Rajby API] FBR Reference Error: No response received`);

      // Check if it's a timeout error
      const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');

      if (isTimeout) {
        throw new Error(`Rajby API FBR Reference failed: Request timeout. The server may be slow or unreachable.`);
      }

      throw new Error(`Rajby API FBR Reference failed: No response received from server`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error(`[Rajby API] FBR Reference Error:`, error.message);
      throw new Error(`Rajby API FBR Reference failed: ${error.message}`);
    }
  }
}

