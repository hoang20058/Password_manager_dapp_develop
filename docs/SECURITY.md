# Ghi Chú Bảo Mật

## Trạng Thái Security Hiện Tại
- Phase B: đã triển khai crypto primitives `deriveKey`, `encrypt`, `decrypt` bằng Web Crypto API.
- Phase C: đã chuyển persistence vault từ localStorage sang IndexedDB dưới dạng ciphertext.
- Phase D: đã chuyển xác thực master password sang verifier hash+salt và thêm luồng rotate key.

## Mô Hình Bảo Mật Cục Bộ
- Master password được xác thực bằng verifier hash+salt (PBKDF2-SHA256) thay vì so sánh plain hash trực tiếp.
- Key giải mã vault được derive từ master password và chỉ giữ trong memory trong thời gian phiên mở khóa.
- Xác thực lại được dành riêng cho các thao tác quan trọng như xuất và xóa toàn bộ.
- Các luồng vault thêm/sửa/xóa thường xuyên nên giữ nhẹ sau khi mở khóa.
- Vault được lưu trong IndexedDB dưới dạng ciphertext (AES-256-GCM), không lưu plaintext vault trong localStorage.
- Đổi master password thực hiện theo cơ chế decrypt -> re-encrypt toàn bộ vault.
- Xuất vault là luồng được kiểm soát và mặc định xuất định dạng ciphertext (`vault-ciphertext-v1`).
- Import vault dùng modal xác nhận: nhập master password để giải mã ciphertext hoặc Skip cho JSON plaintext cũ.
- Key memory bị xóa khi lock, auto-lock, logout và khi rời trang.

## Lớp Kiểm Soát Chính
- Session unlock gate: bắt buộc mở khóa phiên trước khi đọc/ghi vault.
- Master action gate: tái xác thực cho các thao tác nhạy cảm (export, clear all).
- Password policy gate: dùng zxcvbn để chặn mật khẩu yếu trong các luồng tạo/đổi/nhập.
- Legacy compatibility gate: cho phép migrate dữ liệu cũ nhưng luôn ghi lại theo format bảo mật mới.

## Xác Thực Hybrid
- Xác thực Google có ý định sử dụng Firebase Auth khi các biến môi trường được cấu hình.
- Kết nối ví có ý định sử dụng MetaMask hoặc nhà cung cấp tương thích EIP-1193 khác.
- Nếu các nhà cung cấp không khả dụng trong quá trình phát triển, các giá trị fallback mô phỏng được sử dụng để giữ cho UI có thể sử dụng được.

## Chiến Lược Lưu Trữ Blockchain
- Không lưu trữ mật khẩu plaintext trên chuỗi.
- Chỉ lưu trữ commitments, hashes, tham chiếu payload được mã hóa hoặc siêu dữ liệu IPFS/CID.
- Coi các giao dịch ghi smart contract là công khai và không thể đảo ngược.

## Các Bước Tiếp Theo Được Đề Xuất
- Bổ sung audit trail và rollback marker cho luồng rotate master password ở tầng IndexedDB.
- Tăng cường kiểm thử tự động cho các case migrate legacy, decrypt fail và key rotation giữa nhiều phiên.
- Di chuyển xác thực bí mật và chính sách phiên sang backend hoặc auth service chuyên dụng khi sẵn sàng production.
- Cân nhắc bổ sung versioning cho schema IndexedDB để quản lý migration đa phiên bản trong tương lai.
