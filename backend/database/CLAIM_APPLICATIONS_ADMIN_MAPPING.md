# CLAIM APPLICATIONS - DATABASE TO ADMIN PANEL MAPPING

## ✅ Complete Data Visibility for Admin

### 📊 **Admin Claims Table View** (What Admin Sees)

| Admin Column | Database Field | Type | Description |
|--------------|----------------|------|-------------|
| **Reference** | `reference_no` | TEXT | CLM-2026-XXXXX |
| **Farmer Name** | `farmer_name` | TEXT | Full name of farmer |
| **Father/Husband** | `father_husband_name` | TEXT | S/o or D/o name |
| **Phone** | `farmer_phone` | TEXT | 10-digit mobile |
| **Aadhaar** | `aadhaar_number` | TEXT | 12-digit Aadhaar |
| **Scheme Name** | `scheme_name` | TEXT | PM Fasal Bima, etc. |
| **Land Size** | `land_size` | DECIMAL(10,2) | In acres/hectares |
| **Crop Name** | `crop_name` | TEXT | Wheat, Rice, Cotton |
| **NDVI Loss %** | `crop_loss_percentage` | DECIMAL(5,2) | 0.00 - 100.00 |
| **NDVI Value** | `ndvi_value` | DECIMAL(5,3) | 0.000 - 1.000 |
| **Claim Amount** | `claim_amount` | DECIMAL(12,2) | Farmer requested ₹ |
| **Status** | `status` | TEXT | submitted/under_review/approved/rejected/completed |
| **Applied Date** | `created_at` | TIMESTAMP | Submission date |

---

### 🔍 **Admin Detail Modal View** (Full Claim Details)

#### 1. **Farmer Information Section**
```sql
SELECT 
    farmer_name,
    father_husband_name,
    farmer_phone,
    aadhaar_number,
    user_id
FROM claim_applications
WHERE id = 'claim-id';
```

#### 2. **Claim Details Section**
```sql
SELECT 
    reference_no,
    scheme_name,
    claim_type,
    land_size,
    land_unit,
    crop_name,
    status,
    priority,
    created_at
FROM claim_applications
WHERE id = 'claim-id';
```

#### 3. **NDVI & Loss Analysis Section**
```sql
SELECT 
    ndvi_value,                   -- e.g., 0.450
    crop_loss_percentage,          -- e.g., 35.50%
    loss_assessment_date,
    loss_details                   -- JSONB: detailed assessment
FROM claim_applications
WHERE id = 'claim-id';
```

**loss_details JSONB Structure:**
```json
{
    "ndvi_value": 0.45,
    "assessment_method": "Satellite NDVI Analysis",
    "crop_condition": "Severe",
    "weather_impact": "Drought stress detected",
    "assessment_date": "2026-02-08T03:00:00Z"
}
```

#### 4. **Financial Details Section**
```sql
SELECT 
    claim_amount,                  -- Farmer requested
    approved_amount,               -- Admin approved (may differ)
    subsidy_percentage,
    payment_status,                -- pending/processed/completed
    payment_reference,
    payment_date
FROM claim_applications
WHERE id = 'claim-id';
```

#### 5. **Application Details Section**
```sql
SELECT 
    application_details            -- JSONB: full form data
FROM claim_applications
WHERE id = 'claim-id';
```

**application_details JSONB Structure:**
```json
{
    "additional_details": "Severe drought damage in wheat crop due to low rainfall",
    "submitted_at": "2026-02-08T03:00:00Z",
    "submitted_from": "Claim Application Portal",
    "ndvi_analysis_date": "2026-02-08T02:50:00Z",
    "location": {
        "village": "Rampur",
        "district": "Nagpur",
        "state": "Maharashtra"
    },
    "bank_details": {
        "bank_name": "State Bank of India",
        "account_number": "1234567890",
        "ifsc_code": "SBIN0001234"
    }
}
```

#### 6. **Uploaded Documents Section**
```sql
SELECT 
    document_urls                  -- JSONB: all document URLs
FROM claim_applications
WHERE id = 'claim-id';
```

**document_urls JSONB Structure:**
```json
{
    "crop_photos": [
        "https://storage.example.com/claims/CLM-2026-12345/crop1.jpg",
        "https://storage.example.com/claims/CLM-2026-12345/crop2.jpg",
        "https://storage.example.com/claims/CLM-2026-12345/crop3.jpg"
    ],
    "land_doc": "https://storage.example.com/claims/CLM-2026-12345/land_document.pdf",
    "aadhaar_doc": "https://storage.example.com/claims/CLM-2026-12345/aadhaar.pdf",
    "bank_passbook": "https://storage.example.com/claims/CLM-2026-12345/passbook.pdf",
    "crop_photos_count": 3,
    "has_land_doc": true,
    "has_aadhaar": true,
    "has_bank_passbook": true
}
```

#### 7. **Admin Management Section**
```sql
SELECT 
    admin_notes,
    reviewed_by,
    reviewed_at,
    approved_by,
    approved_at,
    updated_at
FROM claim_applications
WHERE id = 'claim-id';
```

---

### 📈 **Admin Statistics Dashboard**

```sql
-- Total Claims
SELECT COUNT(*) as total FROM claim_applications;

-- Pending Review (Submitted)
SELECT COUNT(*) as submitted 
FROM claim_applications 
WHERE status = 'submitted';

-- Under Review
SELECT COUNT(*) as under_review 
FROM claim_applications 
WHERE status = 'under_review';

-- Approved
SELECT COUNT(*) as approved 
FROM claim_applications 
WHERE status = 'approved';

-- Rejected
SELECT COUNT(*) as rejected 
FROM claim_applications 
WHERE status = 'rejected';

-- Completed (Payment Done)
SELECT COUNT(*) as completed 
FROM claim_applications 
WHERE status = 'completed';

-- Total Claim Amount
SELECT SUM(claim_amount) as total_claim_amount 
FROM claim_applications;

-- Total Approved Amount
SELECT SUM(approved_amount) as total_approved_amount 
FROM claim_applications 
WHERE status IN ('approved', 'completed');
```

---

### 🔎 **Admin Search & Filter Queries**

#### Search by Farmer Name
```sql
SELECT * FROM claim_applications
WHERE LOWER(farmer_name) LIKE LOWER('%search_term%');
```

#### Search by Reference Number
```sql
SELECT * FROM claim_applications
WHERE reference_no = 'CLM-2026-12345';
```

#### Search by Aadhaar
```sql
SELECT * FROM claim_applications
WHERE aadhaar_number = '123456789012';
```

#### Search by Phone
```sql
SELECT * FROM claim_applications
WHERE farmer_phone = '9876543210';
```

#### Filter by Status
```sql
SELECT * FROM claim_applications
WHERE status = 'under_review'
ORDER BY created_at DESC;
```

#### Filter by Priority
```sql
SELECT * FROM claim_applications
WHERE priority = 'urgent'
ORDER BY created_at ASC;
```

#### Filter by Date Range
```sql
SELECT * FROM claim_applications
WHERE created_at BETWEEN '2026-02-01' AND '2026-02-28'
ORDER BY created_at DESC;
```

#### Filter by Loss Percentage (High Priority)
```sql
SELECT * FROM claim_applications
WHERE crop_loss_percentage > 50.00
ORDER BY crop_loss_percentage DESC;
```

---

### 🔄 **Admin Workflow Actions**

#### 1. Move to Review
```sql
UPDATE claim_applications
SET 
    status = 'under_review',
    reviewed_by = 'admin_user_id',
    reviewed_at = NOW()
WHERE id = 'claim-id';
```

#### 2. Approve Claim
```sql
UPDATE claim_applications
SET 
    status = 'approved',
    approved_by = 'admin_user_id',
    approved_at = NOW(),
    approved_amount = 70000.00  -- May differ from claim_amount
WHERE id = 'claim-id';
```

#### 3. Reject Claim
```sql
UPDATE claim_applications
SET 
    status = 'rejected',
    admin_notes = 'Insufficient evidence of crop damage',
    reviewed_by = 'admin_user_id',
    reviewed_at = NOW()
WHERE id = 'claim-id';
```

#### 4. Mark as Completed (Payment Done)
```sql
UPDATE claim_applications
SET 
    status = 'completed',
    payment_status = 'completed',
    payment_reference = 'PAY-2026-12345',
    payment_date = NOW()
WHERE id = 'claim-id';
```

#### 5. Add Admin Notes
```sql
UPDATE claim_applications
SET admin_notes = 'Verified with field officer. Crop damage confirmed.'
WHERE id = 'claim-id';
```

---

### 📋 **Complete Data Flow**

```
FARMER SUBMITS → DATABASE STORES → ADMIN SEES
==========================================

Farmer fills form:
- Name: Ramesh Kumar
- Crop: Wheat
- Land: 5.5 acres
- NDVI Loss: 35.50%
- Uploads 5 photos

↓

Stored in claim_applications:
- reference_no: CLM-2026-12345
- farmer_name: Ramesh Kumar
- crop_name: Wheat
- land_size: 5.50
- crop_loss_percentage: 35.50
- document_urls: {crop_photos: [5 URLs]}
- application_details: {full form data}
- status: submitted

↓

Admin sees in Claims page:
- CLM-2026-12345
- Ramesh Kumar (S/o Suresh Kumar)
- 9876543210
- Wheat, 5.5 acres
- 35.50% NDVI Loss (yellow/orange)
- ₹75,000 claim
- 5 crop photos downloadable
- Full farmer details
- Review/Approve/Reject buttons
```

---

### ✅ **Summary: What Admin Can See**

| Category | Details Available |
|----------|-------------------|
| **Farmer Identity** | ✅ Name, Father/Husband, Phone, Aadhaar, User ID |
| **Claim Info** | ✅ Reference, Scheme, Type, Status, Priority |
| **Farm Details** | ✅ Land size, Crop name, Location |
| **Loss Analysis** | ✅ NDVI value, Loss %, Assessment date, Detailed analysis |
| **Financial** | ✅ Claimed amount, Approved amount, Payment status, Payment ref |
| **Documents** | ✅ All uploaded files with download links |
| **Application Data** | ✅ Full form data, Submission details, Additional notes |
| **Admin Actions** | ✅ Review status, Approval info, Admin notes |
| **Workflow** | ✅ Review → Approve/Reject → Complete → Payment tracking |

---

## 🚀 **Everything is Ready!**

The database schema **`claim_applications`** stores EVERYTHING the admin needs to see:
- ✅ All farmer details
- ✅ Complete NDVI analysis
- ✅ All uploaded documents
- ✅ Full application details (JSONB)
- ✅ Admin workflow tracking
- ✅ Payment management

**Just run the SQL schema in Supabase and it's ready to use!**
