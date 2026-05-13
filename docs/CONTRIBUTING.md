# Hướng Dẫn Đóng Góp

## Đặt Tên Nhánh
Nên dùng tiền tố `feature/`, `fix/`, `chore/`.

## Quy Ước Commit
Khuyến nghị theo định dạng:
- `feat`: thêm tính năng mới
- `fix`: sửa lỗi
- `refactor`: tái cấu trúc nội bộ
- `docs`: cập nhật tài liệu

## Danh Sách Kiểm Tra PR
- Dự án build thành công bằng `npm run build`
- Không có secrets hardcode
- Tài liệu được cập nhật khi thay đổi hành vi hoặc cấu trúc
- Kiểm tra giao diện trên desktop và mobile, đặc biệt là menu mobile, snackbar toast và form vault

## Checklist Bổ Sung Cho Security Flow
- Nếu thay đổi logic master password hoặc vault crypto, cập nhật đồng thời `docs/SECURITY.md` và `docs/ARCHITECTURE.md`.
- Nếu thay đổi import/export, kiểm tra cả 2 mode: ciphertext (`vault-ciphertext-v1`) và plaintext legacy (array JSON).
- Nếu thay đổi persistence, ghi rõ migration strategy trong changelog và setup docs.

## Checklist Bổ Sung Cho Tài Liệu
- Đồng bộ `README.md` với trạng thái thực thi thực tế (không mô tả tính năng chưa chạy).
- Ghi changelog theo ngày và theo tác động hành vi người dùng.
- Tránh ghi nhận định tuyệt đối về bảo mật production nếu chưa có backend/HSM/audit độc lập.
