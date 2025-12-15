import { getRajbyToken, deleteRajbyInvoice } from "../../service/RajbyService.js";
import axios from "axios";

const RAJBY_API_BASE_URL = "http://103.104.84.43:5000";

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

    const response = await axios.post(
      `${RAJBY_API_BASE_URL}/api/Auth/login`,
      credentials,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
          ...(RAJBY_API_KEY && { Authorization: RAJBY_API_KEY }),
        },
        timeout: 30000,
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
    console.error("Rajby login error:", error);
    const status = error.response?.status || 500;
    const data = error.response?.data || {
      error: "Rajby login failed",
    };

    return res.status(status).json({
      success: false,
      message: data?.error || data?.message || "Rajby login failed",
      error: data,
    });
  }
};

/**
 * Get buyers from Rajby API
 */
export const getBuyers = async (req, res) => {
  try {
    // Check if token is provided in request header (from frontend localStorage)
    const providedToken = req.headers["x-rajby-token"] || req.headers["X-Rajby-Token"];

    const token = await getRajbyToken(providedToken);

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
    // Check if token is provided in request header (from frontend localStorage)
    const providedToken = req.headers["x-rajby-token"] || req.headers["X-Rajby-Token"];

    const token = await getRajbyToken(providedToken);

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

    if (!companyInvoiceRefNo) {
      return res.status(400).json({
        success: false,
        message: "Company Invoice Reference Number is required",
      });
    }

    // Check if token is provided in request header (from frontend localStorage)
    const providedToken = req.headers["x-rajby-token"] || req.headers["X-Rajby-Token"];

    const result = await deleteRajbyInvoice(companyInvoiceRefNo, 1, providedToken);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error deleting Rajby invoice:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete invoice from Rajby",
      error: error.message,
    });
  }
};

