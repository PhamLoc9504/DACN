# 📄 Functional Requirements Document (FRD)

## 1. Quản lý Nhập hàng (Inbound Management)

### **FR-01: Barcode Scanning Integration**
- **Description:** Quét Barcode để tự động điền thông tin hàng hóa
- **Priority:** High
- **Acceptance Criteria:**
  - [ ] Support camera-based barcode scanning
  - [ ] Auto-fill product information (MaHH, TenHH, DonGia)
  - [ ] Support multiple barcode formats (EAN-13, Code 128, QR)
  - [ ] Manual barcode entry option
- **Technical Specs:** html5-qrcode library, React hooks
- **API Endpoint:** `/api/products/barcode/:code`

### **FR-02: Import Ticket Generation**
- **Description:** In phiếu nhập kho sau khi xác nhận
- **Priority:** High
- **Acceptance Criteria:**
  - [ ] Auto-generate unique import ticket number (sopn)
  - [ ] Print-friendly format with barcode
  - [ ] Include supplier, date, items, quantities
  - [ ] Digital signature capability
- **Technical Specs:** PDF generation with jsPDF
- **API Endpoint:** `/api/import-tickets/:id/print`

### **FR-03: Supplier Management**
- **Description:** Quản lý thông tin nhà cung cấp
- **Priority:** Medium
- **Acceptance Criteria:**
  - [ ] CRUD operations for suppliers
  - [ ] Supplier performance tracking
  - [ ] Auto-complete supplier selection
  - [ ] Supplier contact management
- **Technical Specs:** Form validation with Zod
- **API Endpoint:** `/api/suppliers/*`

### **FR-04: Quality Control Integration**
- **Description:** Kiểm tra chất lượng hàng nhập
- **Priority:** Medium
- **Acceptance Criteria:**
  - [ ] Quality check checklist
  - [ ] Pass/Fail status tracking
  - [ ] Photo attachment for defects
  - [ ] Return/Exchange workflow
- **Technical Specs:** File upload with Supabase Storage
- **API Endpoint:** `/api/quality-control/*`

## 2. Quản lý Xuất hàng (Outbound Management)

### **FR-05: Real-time Stock Deduction**
- **Description:** Tự động trừ tồn kho sau khi bấm "Xuất kho"
- **Priority:** Critical
- **Acceptance Criteria:**
  - [ ] Atomic transaction for stock update
  - [ ] Prevent negative inventory
  - [ ] Real-time stock validation
  - [ ] Rollback capability on failure
- **Technical Specs:** Database transactions with optimistic locking
- **API Endpoint:** `/api/export/confirm`

### **FR-06: E-Invoicing Integration**
- **Description:** Tích hợp xuất Hóa đơn điện tử (E-Invoicing) dạng PDF
- **Priority:** High
- **Acceptance Criteria:**
  - [ ] Compliant with Vietnamese e-invoice standards
  - [ ] Digital signature integration
  - [ ] Tax calculation (10% VAT)
  - [ ] Invoice number generation (HĐĐT format)
- **Technical Specs:** Integration with government e-invoice API
- **API Endpoint:** `/api/invoices/generate`

### **FR-07: Customer Management**
- **Description:** Quản lý thông tin khách hàng
- **Priority:** High
- **Acceptance Criteria:**
  - [ ] Customer CRUD operations
  - [ ] Credit limit management
  - [ ] Order history tracking
  - [ ] Customer segmentation
- **Technical Specs:** React Hook Form with validation
- **API Endpoint:** `/api/customers/*`

### **FR-08: Delivery Tracking**
- **Description:** Theo dõi quá trình giao hàng
- **Priority:** Medium
- **Acceptance Criteria:**
  - [ ] Delivery status updates
  - [ ] GPS tracking integration
  - [ ] Delivery proof (photo/signature)
  - [ ] Customer notifications
- **Technical Specs:** Third-party logistics API integration
- **API Endpoint:** `/api/delivery/*`

## 3. Quản lý Tồn kho (Inventory Management)

### **FR-09: Real-time Inventory Dashboard**
- **Description:** Dashboard hiển thị tồn kho real-time
- **Priority:** Critical
- **Acceptance Criteria:**
  - [ ] Live stock levels
  - [ ] Low stock alerts
  - [ ] Inventory value calculation
  - [ ] Branch comparison
- **Technical Specs:** Supabase Realtime + Recharts
- **API Endpoint:** `/api/inventory/dashboard`

### **FR-10: Stock Movement Tracking**
- **Description:** Theo dõi lịch sử di chuyển hàng hóa
- **Priority:** High
- **Acceptance Criteria:**
  - [ ] Complete audit trail
  - [ ] Filter by date range
  - [ ] Movement reason tracking
  - [ ] User attribution
- **Technical Specs:** CTEs with window functions
- **API Endpoint:** `/api/inventory/movements`

### **FR-11: Inventory Counting**
- **Description:** Kiểm kê định kỳ tồn kho
- **Priority:** Medium
- **Acceptance Criteria:**
  - [ ] Cycle counting workflow
  - [ ] Discrepancy reporting
  - [ ] Adjustment approval
  - [ ] Counting history
- **Technical Specs:** Mobile-responsive forms
- **API Endpoint:** `/api/inventory/counting`

### **FR-12: Multi-warehouse Management**
- **Description:** Quản lý tồn kho đa chi nhánh
- **Priority:** High
- **Acceptance Criteria:**
  - [ ] Inter-warehouse transfers
  - [ ] Branch-specific access control
  - [ ] Consolidated reporting
  - [ ] Transfer approval workflow
- **Technical Specs:** RLS policies + transfer transactions
- **API Endpoint:** `/api/inventory/transfers`

## 4. Báo cáo & Phân tích (Reporting & Analytics)

### **FR-13: Inventory Valuation Report**
- **Description:** Báo cáo giá trị tồn kho
- **Priority:** High
- **Acceptance Criteria:**
  - [ ] FIFO/AVCO cost methods
  - [ ] Period-based valuation
  - [ ] Category-wise breakdown
  - [ ] Export to Excel/PDF
- **Technical Specs:** Materialized views + complex aggregations
- **API Endpoint:** `/api/reports/inventory-valuation`

### **FR-14: Sales Analytics Dashboard**
- **Description:** Dashboard phân tích doanh thu
- **Priority:** High
- **Acceptance Criteria:**
  - [ ] Revenue by product/customer
  - [ ] Trend analysis
  - [ ] Performance comparison
  - [ ] Forecasting capabilities
- **Technical Specs:** Time-series analysis + predictive models
- **API Endpoint:** `/api/analytics/sales`

### **FR-15: Dead Stock Analysis**
- **Description:** Phân tích hàng tồn kho chậm luân chuyển
- **Priority:** Medium
- **Acceptance Criteria:**
  - [ ] Identify slow-moving items
  - [ ] Aging analysis (30/60/90 days)
  - [ ] Disposal recommendations
  - [ ] Automated alerts
- **Technical Specs:** Advanced SQL with date calculations
- **API Endpoint:** `/api/analytics/dead-stock`

### **FR-16: Custom Report Builder**
- **Description:** Công cụ tạo báo cáo tùy chỉnh
- **Priority:** Low
- **Acceptance Criteria:**
  - [ ] Drag-and-drop interface
  - [ ] Custom metrics calculation
  - [ ] Scheduled reports
  - [ ] Report templates
- **Technical Specs:** Dynamic query builder
- **API Endpoint:** `/api/reports/custom`

## 5. Yêu cầu phi chức năng (Non-Functional Requirements)

### **NFR-01: Performance Requirements**
- **Response Time:** 
  - Dashboard load: < 0.5 seconds
  - Inventory updates: < 0.1 seconds
  - Report generation: < 2 seconds
- **Throughput:** 
  - Concurrent users: 150+
  - Transactions/second: 1000+
- **Optimization:** SQL query optimization 97.5% efficiency

### **NFR-02: Security Requirements**
- **Authentication:** JWT-based authentication with refresh tokens
- **Authorization:** Role-based access control (RBAC)
- **Data Protection:** Row Level Security (RLS) on PostgreSQL
- **Encryption:** AES-256 for sensitive data
- **Compliance:** GDPR + Vietnamese data protection laws

### **NFR-03: Availability Requirements**
- **Uptime:** 99.9% availability (8.76 hours downtime/month)
- **Backup:** Daily automated backups with 30-day retention
- **Disaster Recovery:** RTO < 4 hours, RPO < 1 hour
- **Monitoring:** Real-time health checks + alerting

### **NFR-04: Scalability Requirements**
- **Data Volume:** Handle 10M+ transaction records
- **User Growth:** Support 1000+ concurrent users
- **Storage:** Auto-scaling storage with Supabase
- **Geographic:** Multi-region deployment support

### **NFR-05: Usability Requirements**
- **Mobile Responsive:** Full functionality on mobile devices
- **Accessibility:** WCAG 2.1 AA compliance
- **Loading States:** Proper loading indicators
- **Error Handling:** User-friendly error messages
- **Training Time:** < 2 hours for new users

### **NFR-06: Integration Requirements**
- **API Standards:** RESTful API with OpenAPI documentation
- **Third-party:** E-invoicing, payment gateways, logistics
- **Data Import/Export:** CSV, Excel, PDF formats
- **Webhooks:** Real-time event notifications

### **NFR-07: Data Quality Requirements**
- **Data Integrity:** Referential integrity with foreign keys
- **Validation:** Input validation with Zod schemas
- **Audit Trail:** Complete audit logging for all operations
- **Data Consistency:** ACID compliance for transactions

---

## 🎯 Implementation Priority Matrix

| Feature | Priority | Complexity | Business Value | Timeline |
|----------|-----------|-------------|-----------------|----------|
| FR-05: Stock Deduction | Critical | High | Critical | Week 1 |
| FR-09: Inventory Dashboard | Critical | Medium | Critical | Week 1 |
| FR-01: Barcode Scanning | High | Medium | High | Week 2 |
| FR-06: E-Invoicing | High | High | High | Week 3 |
| FR-13: Inventory Valuation | High | High | Medium | Week 4 |

---

## 📊 Success Metrics

### **Performance KPIs:**
- Dashboard load time < 0.5s
- Inventory update accuracy > 99.9%
- Report generation time < 2s

### **Business KPIs:**
- Inventory reduction: 20%
- Order fulfillment accuracy: 99.5%
- User adoption rate: 90%

### **Quality KPIs:**
- Bug rate: < 0.1%
- System uptime: 99.9%
- User satisfaction: 4.5/5

*These functional requirements provide a comprehensive foundation for building an enterprise-grade WMS system with modern technical capabilities.*
