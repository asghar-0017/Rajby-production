# Troubleshooting Rajby API Connectivity Issues

## Problem
Production server (`157.245.150.54:5155`) cannot reach Rajby API (`103.104.84.43:5000`), resulting in timeout errors.

## Quick Diagnosis

### Step 1: Test from Production Server
SSH into your production server and run:

```bash
# Test basic connectivity
curl -v --max-time 10 http://116.0.43.82:5000/api/Auth/login

# Or test with telnet
telnet 103.104.84.43 5000

# Or use the diagnostic script
node apps/backend/scripts/test-rajby-connectivity.js
```

### Step 2: Check Firewall Rules
```bash
# Check if outbound connections to port 5000 are allowed
sudo iptables -L -n | grep 5000

# Check if the server can reach the IP
ping 103.104.84.43
```

## Solutions

### Solution 1: Open Firewall Port (Recommended)
If you have control over the production server firewall:

```bash
# Allow outbound connections to port 5000
sudo ufw allow out 5000/tcp

# Or for iptables
sudo iptables -A OUTPUT -p tcp --dport 5000 -j ACCEPT
```

### Solution 2: Use a Proxy Server
If direct connection is blocked, route through a proxy:

1. Set up a proxy server that can reach both:
   - Your production server
   - The Rajby API

2. Update environment variables:
```env
RAJBY_API_BASE_URL=http://116.0.43.82:5000
HTTP_PROXY=http://your-proxy-server:port
HTTPS_PROXY=http://your-proxy-server:port
```

3. Update axios configuration to use proxy (see below)

### Solution 3: Use Your Backend as Proxy
Since your backend can receive requests, proxy Rajby API calls through your backend:

1. The frontend calls your backend: `/api/rajby-login`
2. Your backend calls Rajby API
3. If your backend can't reach Rajby API, make the call from a server that can

### Solution 4: VPN or Network Tunnel
Set up a VPN or network tunnel between:
- Production server network
- Network that can reach Rajby API

## Code Changes for Proxy Support

If you need to use a proxy, update `RajbyService.js`:

```javascript
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

const response = await axios.post(url, data, {
  httpAgent: agent,
  httpsAgent: agent,
  // ... other config
});
```

## Temporary Workaround

If you cannot fix the network issue immediately, you can:

1. **Make Rajby features optional**: The application already handles errors gracefully
2. **Use cached tokens**: If you have a valid token, it will be used
3. **Manual token injection**: Temporarily inject tokens manually if needed

## Contact Network Administrator

If you don't have server access, contact your network administrator with:

- **Source**: Production server IP `157.245.150.54`
- **Destination**: Rajby API `103.104.84.43:5000`
- **Protocol**: HTTP (TCP port 5000)
- **Direction**: Outbound
- **Purpose**: Integration with external Rajby API service

## Verification

After implementing a solution, verify with:

```bash
node apps/backend/scripts/test-rajby-connectivity.js
```

Expected output:
```
✅ All connectivity tests passed!
   The Rajby API is reachable from this server.
```

