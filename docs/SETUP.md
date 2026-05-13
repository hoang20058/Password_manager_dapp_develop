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

Sau các bản cập nhật bảo mật mới:
- Vault được lưu trong IndexedDB dưới dạng ciphertext
- Lần mở khóa đầu có thể chạy migrate tự động dữ liệu vault legacy từ localStorage
- Import chạy theo modal xác nhận sau khi chọn file:
	- Nhập master password nếu là file ciphertext export mới
	- Chọn Skip nếu là JSON plaintext legacy

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
- Đăng nhập và mở khóa phiên thành công bằng master password
- Thử đổi master password tại Security để kiểm tra luồng re-encrypt vault
- Xuất dữ liệu và kiểm tra file JSON không chứa plaintext vault

## Kiểm Tra Luồng Import
1. Vào trang Import, bấm chọn file JSON.
2. Xác nhận modal import xuất hiện.
3. Với file ciphertext (`vault-ciphertext-v1`), nhập đúng master password đã dùng lúc export.
4. Với file plaintext legacy dạng array, bấm Skip để import.

## Lỗi Thường Gặp
- `Invalid vault import format`: file không phải array plaintext hoặc không đúng envelope ciphertext chuẩn.
- `Không thể giải mã file import ...`: sai master password export hoặc dữ liệu ciphertext bị hỏng/sai metadata.
- `Phiên đang khóa...`: chưa mở khóa phiên trước khi import dữ liệu vào vault hiện tại.
