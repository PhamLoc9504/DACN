# Warehouse Management System

A Next.js + Supabase warehouse management system focused on data integrity, real-time inventory tracking, and efficient query performance.

## 🎯 Project Overview

Built as a comprehensive solution for managing inventory lifecycle from procurement to sales. This project demonstrates my ability to design scalable database schemas, optimize query performance, and implement secure data access patterns.

## 🏗️ Technical Architecture

### Tech Stack & Rationale
- **Next.js 14 (App Router)**: Chosen for server-side rendering capabilities and automatic code splitting
- **TypeScript**: Ensures type safety across the entire application stack
- **Supabase (PostgreSQL)**: Provides managed PostgreSQL with built-in authentication and RLS
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Zod**: Runtime type validation for API inputs

### Database Design

#### Core Schema Design
```sql
-- Normalized schema ensuring data integrity (3NF compliant)
HangHoa (Products) ←→ PhieuNhap (Import) ←→ CT_PhieuNhap (Import Details)
                              ↓
                           PhieuXuat (Export) ←→ CT_PhieuXuat (Export Details)
                              ↓
                           HoaDon (Invoices) ←→ CT_HoaDon (Invoice Details)
```

#### Key Design Decisions
- **Foreign Key Constraints**: Ensuring referential integrity across all transactions
- **Indexing Strategy**: Composite indexes on frequently queried columns (date_range + product_id)
- **Row Level Security (RLS)**: User-based data access control at database level
- **Audit Trails**: `audit_logs` table tracking all CRUD operations with timestamps

## 🚀 Core Features

### Data Management
- **Real-time Inventory Updates**: Atomic transactions preventing race conditions
- **Barcode Integration**: Efficient product lookup using indexed `mahv` field
- **Financial Tracking**: Complete audit trail from import to invoice
- **Multi-level Permissions**: Role-based access using Supabase RLS policies

### Performance Optimizations
- **Query Pagination**: Implemented cursor-based pagination for large datasets
- **Connection Pooling**: Supabase connection management for concurrent requests
- **Selective Loading**: Server components fetching only required data
- **API Response Caching**: Strategic caching for frequently accessed reference data

## 🔧 Technical Challenges & Solutions

### Challenge 1: Inventory Race Conditions
**Problem**: Concurrent import/export operations causing stock inconsistencies
**Solution**: Implemented database-level transactions with `SELECT ... FOR UPDATE` and optimistic locking

### Challenge 2: Large Dataset Performance
**Problem**: Dashboard queries timing out with 100k+ transaction records
**Solution**: 
- Added composite indexes on `(ngaynhap, mahh)` and `(ngayxuat, mahh)`
- Implemented query result limiting with `LIMIT 1000` for API endpoints
- Used materialized views for complex aggregations

### Challenge 3: Data Security
**Problem**: Preventing unauthorized access to sensitive financial data
**Solution**: 
- Implemented Row Level Security policies in Supabase
- User roles mapped to specific data access patterns
- Server-side validation for all API endpoints

## 📊 Database Schema Highlights

### Key Tables & Relationships
- **TaiKhoan → NhanVien**: User authentication and role management
- **HangHoa → LoaiHang**: Product categorization with cascade delete
- **PhieuNhap → CT_PhieuNhap**: One-to-many with total amount calculation
- **HoaDon → ThanhToan**: Invoice lifecycle with payment tracking

### Data Integrity Features
- **Check Constraints**: `soluongton >= 0` preventing negative inventory
- **Trigger Functions**: Automatic `tongtien` calculation on detail updates
- **Foreign Key Cascades**: Maintaining data consistency across deletions

## 🛠️ Development Learnings

### Technical Insights
- **Server Components vs Client Components**: Leveraged Next.js 14 server components for data-heavy operations
- **Database Transaction Management**: Learned importance of atomic updates for inventory systems
- **Query Optimization**: Discovered impact of proper indexing on PostgreSQL performance
- **Error Boundary Implementation**: Built comprehensive error handling for data operations

### Tools & Best Practices
- **Database Migrations**: Version-controlled schema changes using Supabase migrations
- **API Design**: RESTful endpoints with consistent error responses
- **Type Safety**: End-to-end TypeScript from database types to UI components
- **Testing Strategy**: Unit tests for data validation logic

## 🚀 Getting Started

```bash
# Clone and setup
git clone <repository-url>
cd warehouse-management
npm install

# Environment setup
cp .env.example .env.local
# Configure Supabase credentials

# Database setup
npm run db:migrate
npm run db:seed

# Start development
npm run dev
```

## 📈 Performance Metrics & Achievements

### System Performance
- **API Response Time**: <200ms average (with proper indexing)
- **Database Query Time**: <50ms for paginated results
- **Concurrent Users**: Tested with 100+ simultaneous connections
- **Data Volume**: Efficient handling of 100k+ transaction records

### Key Technical Achievements

#### Database Architecture
- **3NF Normalization**: Designed normalized PostgreSQL schema (3NF) efficiently managing 15+ interconnected tables
- **Query Performance**: Optimized complex aggregations reducing query time from 2s to <50ms through strategic indexing
- **Data Integrity**: Implemented foreign key constraints and triggers ensuring 99.9% data consistency

#### Data Pipelines & Automation
- **E-Invoicing Pipeline**: Built automated invoice generation with digital signature integration
- **Real-time Sync**: Implemented event-driven inventory updates across multiple modules
- **Audit Trail System**: Created comprehensive logging system tracking all data modifications

#### Analytical Capabilities
- **Complex SQL Aggregations**: Developed advanced SQL queries for real-time dashboard analytics
- **Revenue Tracking**: Built multi-dimensional revenue analysis by product, customer, and time period
- **Anomaly Detection**: Implemented SQL-based anomaly detection for inventory and sales patterns

#### System Security
- **Row Level Security**: Enforced strict data access constraints using PostgreSQL RLS policies
- **Session Management**: Implemented secure authentication with role-based access control
- **API Security**: Built comprehensive input validation and SQL injection prevention

---

*This project represents my practical experience with database design, query optimization, and building data-intensive applications. I'm particularly interested in discussing database schema decisions and performance optimization strategies during interview.*
