import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Divider,
  Stack,
  Alert,
} from "@mui/material";
import { useTenant } from "../Context/TenantProvider";
import Footer from "../component/Footer";

const TenantLogin = () => {
  const [formData, setFormData] = useState({
    sellerNTNCNIC: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { tenantLogin } = useTenant();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await tenantLogin(formData.sellerNTNCNIC, formData.password);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="professional-form"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: { xs: 2, sm: 3 },
          width: { xs: "100%", sm: 360 },
          borderRadius: 4,
          background: "linear-gradient(135deg, #f6f9fc 0%, #e0e7ff 100%)",
          boxShadow: "0 8px 32px rgba(31, 38, 135, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            fontWeight: 900,
            color: "#3f51b5",
            mb: 3,
            textShadow: "0 2px 8px #e3e3e3",
          }}
        >
          Tenant Login
        </Typography>

        <Divider sx={{ mb: 3, borderColor: "#3f51b5" }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Seller NTN/CNIC"
              name="sellerNTNCNIC"
              value={formData.sellerNTNCNIC}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              color="primary"
              placeholder="Enter your NTN/CNIC"
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required
              variant="outlined"
              color="primary"
              placeholder="Enter your password"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="small"
              fullWidth
              disabled={loading}
              sx={{
                fontWeight: 600,
                fontSize: "13px",
                py: 1,
                height: 36,
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(63, 81, 181, 0.3)",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(63, 81, 181, 0.4)",
                },
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Typography
              variant="body2"
              align="center"
              sx={{ color: "#666", mt: 2 }}
            >
              Use your NTN/CNIC as password for demo purposes
            </Typography>
          </Stack>
        </Box>

      </Paper>
      <Footer />
    </Box>
  );
};

export default TenantLogin;
