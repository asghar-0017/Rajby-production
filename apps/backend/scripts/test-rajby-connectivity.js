#!/usr/bin/env node

/**
 * Test Rajby API Connectivity
 * 
 * This script tests connectivity to the Rajby API from the production server.
 * Use this to diagnose network/firewall issues.
 */

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const RAJBY_API_BASE_URL = process.env.RAJBY_API_BASE_URL || "http://116.0.43.82:5000";
const RAJBY_USERNAME = process.env.RAJBY_USERNAME || "innovative";
const RAJBY_PASSWORD = process.env.RAJBY_PASSWORD || "K7#mP!vL9qW2xR$8";

async function testConnectivity() {
  console.log("🔍 Testing Rajby API Connectivity");
  console.log("=".repeat(50));
  console.log(`Target URL: ${RAJBY_API_BASE_URL}`);
  console.log(`Username: ${RAJBY_USERNAME}`);
  console.log("");

  // Test 1: Basic connectivity
  console.log("Test 1: Basic HTTP connectivity...");
  try {
    const response = await axios.get(`${RAJBY_API_BASE_URL}/api/Auth/login`, {
      timeout: 5000,
      validateStatus: () => true, // Accept any status code
    });
    console.log(`✅ Server is reachable (Status: ${response.status})`);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ Connection refused - The server is not accepting connections on port 5000`);
      console.log(`   Possible causes: Firewall blocking, server down, or wrong port`);
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.log(`❌ Connection timeout - Server did not respond within 5 seconds`);
      console.log(`   Possible causes: Firewall blocking, network issues, or server overloaded`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`❌ DNS resolution failed - Cannot resolve hostname ${new URL(RAJBY_API_BASE_URL).hostname}`);
      console.log(`   Possible causes: DNS issues or incorrect hostname`);
    } else if (error.code === 'EHOSTUNREACH') {
      console.log(`❌ Host unreachable - Cannot reach the server`);
      console.log(`   Possible causes: Network routing issues or firewall blocking`);
    } else {
      console.log(`❌ Connection error: ${error.code || error.message}`);
    }
    return false;
  }

  // Test 2: Login endpoint
  console.log("\nTest 2: Login endpoint test...");
  try {
    const response = await axios.post(
      `${RAJBY_API_BASE_URL}/api/Auth/login`,
      {
        userName: RAJBY_USERNAME,
        password: RAJBY_PASSWORD,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        timeout: 30000,
      }
    );

    if (response.data?.token || response.data?.accessToken) {
      console.log("✅ Login successful - Token received");
      console.log(`   Token preview: ${(response.data?.token || response.data?.accessToken || response.data).substring(0, 20)}...`);
      return true;
    } else {
      console.log("⚠️  Login endpoint responded but no token in response");
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.log(`❌ Login failed - Server responded with status ${error.response.status}`);
      console.log(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.log(`❌ Login timeout - Server did not respond within 30 seconds`);
      console.log(`   This is the same issue you're experiencing in production`);
    } else {
      console.log(`❌ Login error: ${error.code || error.message}`);
    }
    return false;
  }
}

// Run the test
testConnectivity()
  .then((success) => {
    console.log("\n" + "=".repeat(50));
    if (success) {
      console.log("✅ All connectivity tests passed!");
      console.log("   The Rajby API is reachable from this server.");
    } else {
      console.log("❌ Connectivity tests failed!");
      console.log("\n📋 Troubleshooting steps:");
      console.log("   1. Check if the production server can reach 103.104.84.43:5000");
      console.log("   2. Verify firewall rules allow outbound connections to port 5000");
      console.log("   3. Test from production server: curl http://116.0.43.82:5000/api/Auth/login");
      console.log("   4. Check if the Rajby API server is accessible from your network");
      console.log("   5. Consider using a different URL if the API is behind a load balancer");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });

