# Kiến Trúc

## Tổng Quan
Dự án này là một shell DApp chạy trên frontend được xây dựng bằng React, Vite và Tailwind CSS.
Nó hỗ trợ xác thực hybrid, mở khóa phiên bằng master password, cổng xác thực cho thao tác nhạy cảm, và logic commitment sẵn sàng cho blockchain.

## Các Lớp
- app: khai báo route và lazy-load navigation
- context: trạng thái ứng dụng toàn cục, phiên xác thực, trạng thái mở khóa phiên, master gate, theme, toast
- layouts: shell xác thực với sidebar responsive, nút menu mobile và topbar
- pages: màn hình tính năng theo route
- components: UI tái sử dụng được nhóm theo miền
- config: siêu dữ liệu menu và navigation
- services: Google auth, wallet connect, vault storage/import/export, blockchain helper
- utils: crypto primitives (AES/PBKDF2/verifier), sinh mật khẩu, storage keys
- styles: design tokens và Tailwind entry

## Luồng Runtime Chính
1. Người dùng đăng nhập qua Google hoặc ví tại `/auth`.
2. Khi đã authenticated, ứng dụng chuyển vào shell `/app/*`.
3. Nếu phiên chưa mở khóa, `ShellLayout` kích hoạt `requestSessionUnlock()` và hiển thị `MasterPasswordGate`.
4. `confirmMasterGate()` gọi `runSessionUnlock()` để xác thực verifier + derive key + load vault từ IndexedDB.
5. Sau khi mở khóa, key giải mã được giữ trong memory (`sessionKeyRef`) để thực hiện add/edit/delete/import/export theo quyền luồng.

## Bản Đồ Route
- `/auth`: màn hình đăng nhập hybrid
- `/app/vault`: quản lý vault
- `/app/tools/generator`: trình tạo mật khẩu
- `/app/tools/import`: nhập JSON
- `/app/tools/export`: xuất JSON được bảo vệ
- `/app/tools/blockchain`: xem trước commitment/hash
- `/app/reports`: thống kê bảo mật
- `/app/settings/account`: hồ sơ và trạng thái xác thực
- `/app/settings/security`: master password và cài đặt auto-lock

## Mô Hình Bảo Mật
- Đăng nhập Google có thể sử dụng Firebase Auth khi cấu hình biến môi trường, hoặc xác thực mô phỏng khi chưa
- Kết nối ví sử dụng MetaMask / các nhà cung cấp tương thích EIP-1193
- Master password được xác thực qua verifier hash+salt (PBKDF2) và dùng để derive key giải mã vault
- Key giải mã vault chỉ tồn tại trong memory; bị xóa khi lock, auto-lock, logout và khi rời trang
- Master password mở khóa phiên; xác thực lại chỉ cần thiết cho các luồng quan trọng như xuất và xóa toàn bộ
- Các luồng vault thêm/sửa/xóa thường xuyên không buộc yêu cầu lặp lại sau khi mở khóa
- Độ mạnh mật khẩu được kiểm tra bằng zxcvbn-ts trong quá trình đăng ký, chỉnh sửa vault và nhập JSON
- Thông báo Toast được hiển thị dưới dạng snackbar nổi ở dưới, có hỗ trợ hoàn tác cho xóa từng mục
- Sidebar có thể được mở từ nút menu trên màn hình nhỏ
- Vault được mã hóa bằng AES-256-GCM với key derivation PBKDF2-SHA256 (310000 iterations)
- Đổi master password thực hiện theo luồng decrypt -> re-encrypt toàn bộ vault
- Lưu trữ blockchain được đại diện dưới dạng lớp cam kết, không phải lưu trữ plaintext thô

## Luồng Import/Export
- Export: chỉ được thực thi sau khi xác thực qua `requestMasterAction(..., { forceReauth: true })`.
- Import: người dùng chọn file JSON trước, sau đó mở modal để nhập master password hoặc Skip.
- File ciphertext hợp lệ cần đúng envelope `format = vault-ciphertext-v1` và metadata KDF/cipher tương thích.
- File plaintext legacy dạng mảng JSON vẫn được chấp nhận để hỗ trợ migrate người dùng cũ.

## Trạng Thái & Tính Bền Vững
- `session`: phiên xác thực và siêu dữ liệu nhà cung cấp
- `vaults`: dữ liệu vault đã giải mã trong memory khi phiên mở khóa
- `userProfile`: dữ liệu hồ sơ
- `theme`: ưu tiên UI sáng/tối
- `isSessionUnlocked`: cờ mở khóa phiên cục bộ cho hồ sơ trình duyệt hiện tại
- `autoLockMinutes`: timeout không hoạt động dùng để khóa lại phiên
- `masterPasswordHash`: lưu record verifier hash+salt của master password

## Lưu Trữ Vault
- Vault persistence sử dụng IndexedDB với bản ghi ciphertext (không lưu plaintext vault trong localStorage)
- Export mặc định tạo file ciphertext có metadata KDF để có thể giải mã lại khi import
- Hỗ trợ migrate tự động dữ liệu vault legacy từ localStorage trong lần mở khóa đầu sau nâng cấp

## Tương Thích Dữ Liệu Legacy
- `masterPasswordHash` hỗ trợ đọc record cũ theo dạng chuỗi hash hoặc giá trị JSON-string hóa.
- Nếu decrypt lỗi với key mới nhưng phát hiện hash legacy, hệ thống có fallback migration để đọc dữ liệu và ghi lại bằng verifier/format mới.

## Nguồn Kế Thừa
Nguồn Bootstrap kế thừa vẫn được giữ trong `legacy/bootstrap-static` để tham chiếu lịch sử, nhưng không tham gia vào runtime của ứng dụng React hiện tại.
