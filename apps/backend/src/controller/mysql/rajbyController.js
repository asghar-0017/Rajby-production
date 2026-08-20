import { getRajbyToken, deleteRajbyInvoice } from "../../service/RajbyService.js";
import axios from "axios";

const RAJBY_API_BASE_URL = process.env.RAJBY_API_BASE_URL || "http://103.104.84.43:5000";

/**
 * Login to Rajby API
 */
export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;
    const RAJBY_USERNAME = process.env.RAJBY_USERNAME || "innovative";
    const RAJBY_PASSWORD = process.env.RAJBY_PASSWORD || "K7#mP!vL9qW2xR$8";
    const RAJBY_API_KEY = process.env.RAJBY_API_KEY || "";

    // Use provided credentials or fallback to env vars
    const credentials = {
      userName: userName || RAJBY_USERNAME,
      password: password || RAJBY_PASSWORD,
    };

    // Retry logic for network issues
    const maxRetries = 1;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${RAJBY_API_BASE_URL}/api/Auth/login`,
          credentials,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "text/plain",
              ...(RAJBY_API_KEY && { Authorization: RAJBY_API_KEY }),
            },
            timeout: 10000,
          }
        );

        // Extract token from response
        const token =
          response.data?.token ||
          response.data?.accessToken ||
          response.data?.data?.token ||
          response.data;

        return res.status(200).json({
          success: true,
          data: {
            token,
            ...response.data,
          },
        });
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
            console.warn(`Rajby login attempt ${attempt + 1} failed, retrying... (${error.message})`);
          }
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }

        // If it's not a retryable error or we're out of retries, break
        break;
      }
    }

    // If we get here, all retries failed
    // Handle timeout/connection errors gracefully with minimal logging
    if (
      lastError?.code === 'ECONNABORTED' ||
      lastError?.code === 'ETIMEDOUT' ||
      lastError?.code === 'ECONNREFUSED' ||
      lastError?.code === 'ENOTFOUND' ||
      lastError?.code === 'EHOSTUNREACH' ||
      lastError?.message?.includes('timeout')
    ) {
      // Only log a concise warning, not the full stack trace
      const errorType = lastError?.code || 'timeout';
      console.warn(`⚠️  Rajby API unavailable (${errorType}): Cannot reach ${RAJBY_API_BASE_URL}. This is non-critical.`);

      return res.status(503).json({
        success: false,
        message: "Rajby API is currently unavailable. Please try again later.",
        error: {
          type: "connection_error",
          code: errorType,
          message: `Unable to connect to Rajby API at ${RAJBY_API_BASE_URL}. The service may be temporarily unavailable or unreachable from this server.`,
        },
      });
    }

    // For other errors, log more details (but still concise)
    console.error(`Rajby login error: ${lastError?.message || lastError?.code || 'Unknown error'}`);

    const status = lastError?.response?.status || 500;
    const data = lastError?.response?.data || {
      error: "Rajby login failed",
    };

    return res.status(status).json({
      success: false,
      message: data?.error || data?.message || "Rajby login failed",
      error: data,
    });
  } catch (error) {
    // Log only the message, not the full error object to avoid stack traces
    console.error(`Rajby login unexpected error: ${error?.message || error?.code || 'Unknown error'}`);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during Rajby login",
      error: error?.message || 'Unknown error',
    });
  }
};

/**
 * Get buyers from Rajby API
 */
export const getBuyers = async (req, res) => {
  try {
    // Always call login API first to get fresh token
    console.log(`[Rajby API] Calling login API first to get fresh token for getBuyers operation`);
    const token = await getRajbyToken(true);

    const response = await axios.get(
      `${RAJBY_API_BASE_URL}/api/Buyer/local-invoice-buyers`,
      {
        headers: {
          Accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error getting Rajby buyers:", error);
    const status = error.response?.status || 500;
    const data = error.response?.data || {
      error: "Failed to fetch buyers from Rajby",
    };

    return res.status(status).json({
      success: false,
      message: data?.error || data?.message || "Failed to fetch buyers from Rajby",
      error: data,
    });
  }
};

/**
 * Get products from Rajby API
 */
export const getProducts = async (req, res) => {
  try {
    // Always call login API first to get fresh token
    console.log(`[Rajby API] Calling login API first to get fresh token for getProducts operation`);
    const token = await getRajbyToken(true);

    const response = await axios.get(`${RAJBY_API_BASE_URL}/api/Item/all`, {
      headers: {
        Accept: "text/plain",
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    });

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error getting Rajby products:", error);
    const status = error.response?.status || 500;
    const data = error.response?.data || {
      error: "Failed to fetch products from Rajby",
    };

    return res.status(status).json({
      success: false,
      message: data?.error || data?.message || "Failed to fetch products from Rajby",
      error: data,
    });
  }
};

/**
 * Delete invoice from Rajby API
 */
export const deleteInvoice = async (req, res) => {
  try {
    const { companyInvoiceRefNo } = req.params;

    // Always call login API first to get fresh token (as requested by user)
    try {
      console.log(`[Rajby API] Calling login API first to get fresh token for deleteInvoice operation`);
      await getRajbyToken(true);
    } catch (tokenError) {
      console.error(`[Rajby API] Failed to get fresh Rajby token for deleteInvoice:`, tokenError.message);
      return res.status(503).json({
        success: false,
        message: `Failed to authenticate with Rajby API: ${tokenError.message}`,
        error: tokenError.message
      });
    }

    if (!companyInvoiceRefNo) {
      return res.status(400).json({
        success: false,
        message: "Company Invoice Reference Number is required",
      });
    }

    // Always call login API first to get fresh token (handled inside deleteRajbyInvoice)
    console.log(`[Rajby API] Will call login API first to get token for deleteInvoice operation`);
    const result = await deleteRajbyInvoice(companyInvoiceRefNo, 1);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const status = error?.response?.status || 500;
    const data = error?.response?.data;
    console.error("Error deleting Rajby invoice:", {
      status,
      message: error?.message,
      data,
    });

    return res.status(status).json({
      success: false,
      message:
        data?.message ||
        data?.error ||
        error?.message ||
        "Failed to delete invoice from Rajby",
      error: data || error?.message || "Unknown error",
    });
  }
};

