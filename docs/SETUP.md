# Hướng Dẫn Thiết Lập

## Yêu Cầu
- Node.js 20+
- npm 10+

## Cài Đặt
```bash
npm install
```

## Chạy Môi Trường Phát Triển
```bash
npm run dev
```

Màn hình ứng dụng sẽ yêu cầu mở khóa phiên bằng master password một lần. Sau đó, các thao tác thường trong vault sẽ không hỏi lại liên tục.

## Build Production
```bash
npm run build
```

## Xem Bản Build
```bash
npm run preview
```

## Biến Môi Trường
Sao chép `.env.example` thành `.env` rồi điền các giá trị phù hợp cho Google Auth, ví và smart contract.

## Kiểm Tra Nhanh
- `npm run build` để xác nhận toàn bộ source và tài liệu liên quan vẫn đồng bộ sau khi chỉnh sửa.
