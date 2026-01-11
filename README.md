# Lưu ý
Chỉ khi ứng dụng được deloy lên một môi trường có hosting cụ thể thì mới cần cấu hình các thông tin môi trường trong file .env.(chỉ có thể hoạt động khi có hosting)

# Payment Service

Dịch vụ xử lý thanh toán, tích hợp cổng thanh toán VNPay, quản lý giao dịch và thông báo trạng thái thanh toán qua RabbitMQ.

## 📋 Tính Năng

### Payment Processing
- ✅ **Thanh toán Subscription** (Tích hợp với Subscription Service)
- ✅ **Tạo URL thanh toán VNPay** (Support đa ngôn ngữ, IPN)
- ✅ **Xử lý IPN** (Instant Payment Notification) từ VNPay
- ✅ **Tra cứu trạng thái giao dịch** (Query DR)
- ✅ **Sync Plans** (Lắng nghe sự kiện từ Subscription Service để cập nhật giá)

### Integration
- ✅ **RabbitMQ Publisher** (Bắn sự kiện `PAYMENT_SUCCESS` khi thanh toán thành công và `PAYMENT_FAILED` khi thanh toán thất bại)
- ✅ **RabbitMQ Consumer** (Lắng nghe `PLAN_CREATED`, `PLAN_UPDATED`)
- ✅ **Gateway Auth** (Tin tưởng xác thực từ Gateway)

## 🏗️ Kiến Trúc

```
┌─────────────────────────────────────────────────────────────┐
│                      Payment Service                         │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Controllers  │───▶│  Services    │───▶│ Repositories │  │
│  │              │    │              │    │              │  │
│  │ - payment    │    │ - VNPay      │    │ - Payment    │  │
│  │              │    │ - RabbitMQ   │    │ - PayPlan    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                      │        │
│         │                    ▼                      ▼        │
│         │            ┌──────────────┐    ┌──────────────┐  │
│         │            │ VNPay SDK    │    │   MongoDB    │  │
│         │            └──────────────┘    │  (Database)  │  │
│         │                                └──────────────┘  │
│         ▼                                                   │
│  ┌──────────────┐                                           │
│  │  Middleware  │                                           │
│  │ - Auth       │                                           │
│  └──────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 7.0+
- RabbitMQ 3.12+
- Tài khoản Sandbox VNPay

### Local Development

```bash
# Cài đặt dependencies
npm install

# Tạo file .env từ template
cp .env.example .env

# Cấu hình .env (xem phần Environment Variables)
# Chỉnh sửa file .env với thông tin VNPay

# Chạy development (với auto-reload)
npm run dev

# Chạy production
npm start
```

## ⚙️ Environment Variables

Tạo file `.env` trong root folder:

```env
# Server
PORT=3101

# Database
MONGO_URL=mongodb://localhost:27017/payment_db

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# VNPay Configuration (Sandbox)
VNP_TMN_CODE=your_tmn_code_here
VNP_HASH_SECRET=your_hash_secret_here
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:3000/payment-result
```

### Giải Thích Biến Môi Trường

| Biến | Mô Tả |
|------|-------|
| `VNP_TMN_CODE` | Mã định danh Terminal do VNPay cấp |
| `VNP_HASH_SECRET` | Secret key để tạo checksum |
| `VNP_URL` | URL cổng thanh toán (Sandbox/Prod) |
| `VNP_RETURN_URL` | URL user được redirect về sau khi thanh toán xong |

## 📡 API Endpoints

Base URL: `http://localhost:3101/api/v1/payments`

### Public Endpoints

| Method | Endpoint | Mô Tả | Query Params |
|--------|----------|-------|--------------|
| `GET` | `/vnpay/ipn` | Webhook nhận kết quả từ VNPay | `vnp_Amount`, `vnp_ResponseCode`, ... |

### Protected Endpoints (Requires `x-user-id`)

| Method | Endpoint | Mô Tả | Body/Params |
|--------|----------|-------|-------------|
| `POST` | `/` | Tạo yêu cầu thanh toán Subscription | `subscriptionId`, `planId` |
| `GET` | `/:ref` | Lấy chi tiết/trạng thái giao dịch | Param: `ref` (Mã giao dịch) |

## 📝 API Usage Examples

### 1. Create Payment URL

```http
POST /api/v1/payments
Content-Type: application/json
Authorization: Bearer <token>

{
  "subscriptionId": "65123abc456...",
  "planId": "65123def789..."
}
```

**Response:**
```json
{
  "paymentRef": "PAY_1704253000000",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=5000000&..."
}
```

### 2. VNPay IPN Callback

```http
GET /api/v1/payments/vnpay/ipn?vnp_Amount=5000000&vnp_ResponseCode=00&vnp_TxnRef=PAY_1704253000000...
```

**Response:**
```json
{
  "message": "OK"
}
```

### 3. Get Transaction Status

```http
GET /api/v1/payments/PAY_1704253000000
Authorization: Bearer <token>
```

## 📊 Database Models

### Payment Transaction

```javascript
{
  subscriptionId: ObjectId,    // Reference to Subscription
  planId: ObjectId,            // Reference to Plan (Original Plan)
  paymentRef: String,          // Unique Payment Reference (e.g., PAY_170...)
  amount: Number,              // Số tiền thanh toán
  status: String,              // PENDING, SUCCESS, FAILED
  paidAt: Date,                // Thời gian thanh toán thành công
  createdAt: Date
}
```

### Payment Plan (Cached)

```javascript
{
  planId: ObjectId,            // ID gốc từ Subscription Service
  name: String,
  price: Number,
  interval: String,
  isActive: Boolean
}
```

## 🔄 Event-Driven Architecture

### 1. Published Events

Khi thanh toán thành công (`SUCCESS`), service publish:

**Event:** `PAYMENT_SUCCESS`
**Exchange:** `domain_events`
**Payload:**
```json
{
  "userId": "user_123",
  "paymentRef": "PAY_170...",
  "amount": 50000
}
```

Khi thanh toán thất bại (`FAILED`), service publish:

**Event:** `PAYMENT_FAILED`
**Exchange:** `domain_events`
**Payload:**
```json
{
  "userId": "user_123",
  "paymentRef": "PAY_170...",
  "amount": 50000
}
```

### 2. Consumed Events

Service lắng nghe sự kiện thay đổi Plan từ Subscription Service để cập nhật giá:

- `PLAN_CREATED`
- `PLAN_UPDATED`

## 📦 Dependencies

| Package | Version | Mô Tả |
|---------|---------|-------|
| `express` | ^5.2.1 | Web framework |
| `mongoose` | ^9.1.1 | MongoDB ODM |
| `vnpay` | ^2.4.4 | VNPay SDK |
| `amqplib` | ^0.10.9 | RabbitMQ client |

## 📄 License

ISC


