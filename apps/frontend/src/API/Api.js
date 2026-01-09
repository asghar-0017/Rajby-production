import axios from "axios";

// Create a token manager that will be updated by the context
let tokenManager = {
  getSandboxToken: () => null,
  getProductionToken: () => null,
  getCurrentToken: (environment = "sandbox") => null,
};

// Function to update token manager from context
export const updateTokenManager = (manager) => {
  console.log("API: Updating token manager with:", manager);
  tokenManager = manager;
};

const API_CONFIG = {
  apiKey: import.meta.env.VITE_SERVER_API || "/api",
  apiKeyLocal: import.meta.env.VITE_SERVER_API_LOCAL || "/api",
  get sandBoxTestToken() {
    const token = tokenManager.getSandboxToken();
    console.log(
      "API_CONFIG: sandBoxTestToken =",
      token ? "Available" : "Not available"
    );
    return token;
  },
  get productionToken() {
    const token = tokenManager.getProductionToken();
    console.log(
      "API_CONFIG: productionToken =",
      token ? "Available" : "Not available"
    );
    return token;
  },
  getCurrentToken(environment = "sandbox") {
    const token = tokenManager.getCurrentToken(environment);
    console.log(
      "API_CONFIG: getCurrentToken(",
      environment,
      ") =",
      token ? `Available (${token.substring(0, 10)}...)` : "Not available"
    );
    return token;
  },
};

const api = axios.create({
  // baseURL: "https://fbrtestcase.inplsoftwares.online/api",
  baseURL: "http://143.198.95.2:5155/api",
  // You can add headers or other config here if needed
});

// Rajby API credentials helper (for backend login)
// All Rajby API calls are now handled through backend routes
const getRajbyCredentials = () => {
  const userName = import.meta.env.VITE_RAJBY_USERNAME || "innovative";
  const password = import.meta.env.VITE_RAJBY_PASSWORD || "K7#mP!vL9qW2xR$8";
  return { userName, password };
};

// Add request interceptor to include auth token and tenant ID
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("token");
    const tenantToken = localStorage.getItem("tenantToken");
    const tenantId = localStorage.getItem("tenantId");
    const selectedTenant = localStorage.getItem("selectedTenant");

    // Use tenant token if available, otherwise use admin token
    // Backend handles Rajby token management internally
    if (tenantToken) {
      config.headers.Authorization = `Bearer ${tenantToken}`;
    } else if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }

    // Check if this is a Rajby API endpoint
    const isRajbyEndpoint = config.url.includes("/rajby-");

    // Skip tenant ID for authentication endpoints and Rajby endpoints
    const isAuthEndpoint =
      config.url.includes("/auth/") ||
      config.url.includes("/tenant-auth/") ||
      config.url === "/auth/login" ||
      config.url === "/auth/forgot-password" ||
      config.url === "/auth/verify-reset-code" ||
      config.url === "/auth/reset-password" ||
      config.url === "/auth/refresh-token" ||
      isRajbyEndpoint;

    if (!isAuthEndpoint) {
      // For admin users, use selected tenant ID if available
      let tenantIdToUse = null;

      if (selectedTenant) {
        try {
          const tenant = JSON.parse(selectedTenant);
          tenantIdToUse = tenant.tenant_id;
          console.log(
            "Using tenant ID from selectedTenant localStorage:",
            tenantIdToUse
          );
        } catch (error) {
          console.error(
            "Error parsing selected Company from localStorage:",
            error
          );
        }
      } else if (tenantId) {
        tenantIdToUse = tenantId;
        console.log(
          "Using tenant ID from tenantId localStorage:",
          tenantIdToUse
        );
      }

      // Fallback: Try to extract tenant ID from URL if not found in localStorage
      if (!tenantIdToUse && config.url.includes("/tenant/")) {
        const urlMatch = config.url.match(/\/tenant\/([^\/]+)/);
        if (urlMatch && urlMatch[1]) {
          tenantIdToUse = urlMatch[1];
          console.log(
            "Extracted tenant ID from URL as fallback:",
            tenantIdToUse
          );
        }
      }

      // Set the tenant ID header if we have one
      if (tenantIdToUse) {
        config.headers["X-Tenant-ID"] = tenantIdToUse;
        console.log("Set X-Tenant-ID header:", tenantIdToUse);
      } else {
        console.warn("No tenant ID available for request:", config.url);
      }
    } else {
      console.log("Skipping tenant ID for auth endpoint:", config.url);
    }

    // Debug logging for important requests
    if (config.url.includes("/dashboard") || config.url.includes("/tenant/")) {
      console.log("API Request Debug:", {
        url: config.url,
        method: config.method,
        hasAuthHeader: !!config.headers.Authorization,
        hasTenantHeader: !!config.headers["X-Tenant-ID"],
        tenantId: config.headers["X-Tenant-ID"],
        selectedTenant: selectedTenant ? JSON.parse(selectedTenant) : null,
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Utility function to get current token state for debugging
export const getCurrentTokenState = () => {
  const selectedTenant = localStorage.getItem("selectedTenant");

  return {
    selectedTenant: selectedTenant ? JSON.parse(selectedTenant) : null,
    sandBoxTestToken: API_CONFIG.sandBoxTestToken,
    productionToken: API_CONFIG.productionToken,
    currentSandboxToken: tokenManager.getSandboxToken(),
    currentProductionToken: tokenManager.getProductionToken(),
  };
};

// Debug function to check token manager state
export const debugTokenManager = () => {
  console.log("=== Token Manager Debug ===");
  console.log("Token Manager:", tokenManager);
  console.log("API_CONFIG.sandBoxTestToken:", API_CONFIG.sandBoxTestToken);
  console.log("API_CONFIG.productionToken:", API_CONFIG.productionToken);
  console.log(
    "API_CONFIG.getCurrentToken('sandbox'):",
    API_CONFIG.getCurrentToken("sandbox")
  );
  console.log("=== End Token Manager Debug ===");
};

// Rajby login - backend handles token management
// Frontend doesn't need to store token anymore
export const performRajbyLogin = async (credentials) => {
  const payload = credentials || getRajbyCredentials();

  try {
    // Call backend route - backend will handle token management
    const response = await api.post("/rajby-login", payload);
    // Backend manages token internally, frontend doesn't need it
    return response.data;
  } catch (error) {
    console.error("Rajby login failed:", error?.message || error);
    throw error;
  }
};

// Get buyers from Rajby API through backend
// Backend handles all token management - no token needed from frontend
export const fetchRajbyBuyers = async () => {
  // Call backend route - backend will handle token management
  const response = await api.get("/rajby-buyers");
  return response;
};

// Get products from Rajby API through backend
// Backend handles all token management - no token needed from frontend
export const fetchRajbyProducts = async () => {
  // Call backend route - backend will handle token management
  const response = await api.get("/rajby-products");
  return response;
};

// Delete invoice from Rajby API through backend
// Backend handles all token management - no token needed from frontend
export const deleteRajbyInvoice = async (companyInvoiceRefNo) => {
  if (!companyInvoiceRefNo) {
    throw new Error("Company Invoice Reference Number is required");
  }
  
  // Call backend route - backend will handle token management
  const response = await api.delete(
    `/rajby-invoices/${encodeURIComponent(companyInvoiceRefNo)}`,
    {
      timeout: 60000, // 60 seconds timeout
    }
  );
  return response;
};

export { API_CONFIG, api };
