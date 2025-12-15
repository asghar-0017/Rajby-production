import express from "express";
import * as rajbyController from "../controller/mysql/rajbyController.js";
import { authenticateToken } from "../middleWare/authMiddleware.js";

const router = express.Router();

// Rajby login route (public, no auth required)
router.post("/rajby-login", rajbyController.login);

// All other Rajby routes require authentication
router.use(authenticateToken);

// Get buyers from Rajby
router.get("/rajby-buyers", rajbyController.getBuyers);

// Get products from Rajby
router.get("/rajby-products", rajbyController.getProducts);

// Delete invoice from Rajby
router.delete("/rajby-invoices/:companyInvoiceRefNo", rajbyController.deleteInvoice);

export default router;

