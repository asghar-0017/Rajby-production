# Draft Invoice API - CURL Examples

## Endpoint
```
POST /api/tenant/:tenantId/invoices/save
```

## Description
This API saves an invoice as a draft. When a `buyerNTNCNIC` is provided, it automatically calls the FBR buyer registration type API to fetch and set the buyer's registration type (`Registered` or `Unregistered`).

## Base URL
```
http://116.0.43.82:5155
```

## Authentication
Requires Bearer token in Authorization header.

## CURL Examples

### Example 1: Create New Draft Invoice with Buyer NTN/CNIC (Auto-fetches Registration Type)

```bash
curl -X POST "http://116.0.43.82:5155/api/tenant/YOUR_TENANT_ID/invoices/save" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "invoiceType": "Standard",
    "invoiceDate": "2024-01-15",
    "sellerNTNCNIC": "1234567890123",
    "sellerFullNTN": "1234567890123",
    "sellerBusinessName": "ABC Company",
    "sellerProvince": "Punjab",
    "sellerAddress": "123 Main Street",
    "sellerCity": "Lahore",
    "buyerNTNCNIC": "9876543210987",
    "buyerBusinessName": "XYZ Corporation",
    "buyerProvince": "Sindh",
    "buyerAddress": "456 Business Avenue",
    "buyerTelephone": "03001234567",
    "invoiceRefNo": "INV-REF-001",
    "companyInvoiceRefNo": "COMP-INV-001",
    "internalInvoiceNo": "INT-001",
    "transctypeId": 1,
    "items": [
      {
        "name": "Product A",
        "hsCode": "1234.56.78",
        "productDescription": "Description of Product A",
        "quantity": 10,
        "rate": 100.00,
        "uoM": "PCS",
        "unitPrice": 100.00,
        "totalValues": 1000.00,
        "valueSalesExcludingST": 1000.00,
        "fixedNotifiedValueOrRetailPrice": 1000.00,
        "salesTaxApplicable": 17.00,
        "salesTaxWithheldAtSource": 0.00,
        "extraTax": 0.00,
        "furtherTax": 0.00,
        "sroScheduleNo": "1",
        "fedPayable": 0.00,
        "advanceIncomeTax": 0.00,
        "discount": 0.00,
        "saleType": "Standard",
        "sroItemSerialNo": "1",
        "billOfLadingUoM": "PCS"
      }
    ]
  }'
```

**Note:** When `buyerNTNCNIC` is provided, the API will automatically:
1. Call the FBR buyer registration check API
2. Fetch the registration type (`Registered` or `Unregistered`)
3. Set `buyerRegistrationType` in the draft invoice

### Example 2: Update Existing Draft Invoice

```bash
curl -X POST "http://116.0.43.82:5155/api/tenant/YOUR_TENANT_ID/invoices/save" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "id": 123,
    "invoiceType": "Standard",
    "invoiceDate": "2024-01-15",
    "sellerNTNCNIC": "1234567890123",
    "sellerFullNTN": "1234567890123",
    "sellerBusinessName": "ABC Company",
    "sellerProvince": "Punjab",
    "sellerAddress": "123 Main Street",
    "sellerCity": "Lahore",
    "buyerNTNCNIC": "9876543210987",
    "buyerBusinessName": "XYZ Corporation",
    "buyerProvince": "Sindh",
    "buyerAddress": "456 Business Avenue",
    "buyerTelephone": "03001234567",
    "invoiceRefNo": "INV-REF-001",
    "companyInvoiceRefNo": "COMP-INV-001",
    "internalInvoiceNo": "INT-001",
    "transctypeId": 1,
    "items": [
      {
        "name": "Product A",
        "hsCode": "1234.56.78",
        "productDescription": "Description of Product A",
        "quantity": 10,
        "rate": 100.00,
        "uoM": "PCS",
        "unitPrice": 100.00,
        "totalValues": 1000.00,
        "valueSalesExcludingST": 1000.00,
        "fixedNotifiedValueOrRetailPrice": 1000.00,
        "salesTaxApplicable": 17.00,
        "salesTaxWithheldAtSource": 0.00,
        "extraTax": 0.00,
        "furtherTax": 0.00,
        "sroScheduleNo": "1",
        "fedPayable": 0.00,
        "advanceIncomeTax": 0.00,
        "discount": 0.00,
        "saleType": "Standard",
        "sroItemSerialNo": "1",
        "billOfLadingUoM": "PCS"
      }
    ]
  }'
```

### Example 3: Create Draft Invoice with Manual Registration Type (No Buyer NTN/CNIC)

```bash
curl -X POST "http://116.0.43.82:5155/api/tenant/YOUR_TENANT_ID/invoices/save" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "invoiceType": "Standard",
    "invoiceDate": "2024-01-15",
    "sellerNTNCNIC": "1234567890123",
    "sellerFullNTN": "1234567890123",
    "sellerBusinessName": "ABC Company",
    "sellerProvince": "Punjab",
    "sellerAddress": "123 Main Street",
    "sellerCity": "Lahore",
    "buyerBusinessName": "XYZ Corporation",
    "buyerProvince": "Sindh",
    "buyerAddress": "456 Business Avenue",
    "buyerRegistrationType": "Unregistered",
    "buyerTelephone": "03001234567",
    "invoiceRefNo": "INV-REF-001",
    "companyInvoiceRefNo": "COMP-INV-001",
    "internalInvoiceNo": "INT-001",
    "transctypeId": 1,
    "items": []
  }'
```

## Response Format

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Invoice saved as draft successfully",
  "data": {
    "invoice_number": "DRAFT_000001",
    "system_invoice_id": "INV-0001",
    "id": 123,
    "invoiceType": "Standard",
    "invoiceDate": "2024-01-15",
    "buyerRegistrationType": "Registered",
    "status": "draft",
    "items": [...]
  }
}
```

### Error Response (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Error saving invoice",
  "error": "Error message details"
}
```

## Important Notes

1. **Buyer Registration Type Auto-Fetch**: 
   - When `buyerNTNCNIC` is provided, the API automatically calls the FBR buyer registration check API
   - The registration type (`Registered` or `Unregistered`) is fetched and set automatically
   - If the API call fails, it defaults to `Unregistered` or uses the provided `buyerRegistrationType` if available

2. **Draft Invoice Number**: 
   - New draft invoices get a number like `DRAFT_000001`
   - Existing draft invoices keep their `DRAFT_` number when updated

3. **Required Fields**:
   - `invoiceType`
   - `invoiceDate`
   - `sellerNTNCNIC`
   - `sellerBusinessName`
   - At least one item in `items` array (for new invoices)

4. **Optional Fields**:
   - `id` - Include to update existing draft invoice
   - `buyerNTNCNIC` - If provided, registration type will be auto-fetched
   - `buyerRegistrationType` - Can be manually set if `buyerNTNCNIC` is not provided

## Buyer Registration Type API Details

The API calls the following endpoint to check buyer registration:
- **URL**: `https://buyercheckapi.inplsoftwares.online/checkbuyer.php`
- **Method**: POST
- **Timeout**: 12 seconds
- **Retries**: 2 attempts
- **Returns**: `"Registered"` or `"Unregistered"`

