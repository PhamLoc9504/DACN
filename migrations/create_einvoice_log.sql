-- Bảng lưu chữ ký số cho hóa đơn điện tử

CREATE TABLE IF NOT EXISTS "EInvoiceLog" (
    id BIGSERIAL PRIMARY KEY,
    mahd VARCHAR(20) NOT NULL REFERENCES hoadon(mahd) ON DELETE CASCADE,
    payload_hash TEXT NOT NULL,
    signature TEXT NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signed_by VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'SIGNED',
    raw_payload JSONB NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_einvoicelog_mahd ON "EInvoiceLog"(mahd);
