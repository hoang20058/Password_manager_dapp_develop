# DApp Password Manager

Ứng dụng FE quản lý mật khẩu theo hướng DApp, xây dựng bằng React + Vite + Tailwind CSS.
Phiên bản hiện tại đã triển khai lớp bảo mật cục bộ theo các phase gần nhất: mã hóa vault bằng AES-GCM + PBKDF2, verifier cho master password, re-encrypt khi đổi master password và lưu trữ vault ciphertext trên IndexedDB.

## Tech Stack
- React 19
- Vite
- Tailwind CSS
- React Router
- Firebase Auth hoặc luồng mô phỏng khi chưa cấu hình
- MetaMask / EIP-1193 wallet
- Ethers cho blockchain helper
- zxcvbn-ts để đánh giá độ mạnh mật khẩu
- IndexedDB cho dữ liệu vault mã hóa
- localStorage cho trạng thái giao diện/phiên không nhạy cảm

## Trạng Thái Triển Khai
- Hoàn tất mã hóa vault ở client-side với AES-256-GCM và PBKDF2-SHA256 (310000 iterations)
- Hoàn tất chuyển lưu trữ vault từ localStorage sang IndexedDB (dữ liệu vault được lưu dạng ciphertext)
- Hoàn tất verifier master password theo hash+salt, có tương thích ngược dữ liệu legacy
- Hoàn tất luồng đổi master password: decrypt toàn bộ -> re-encrypt bằng key mới
- Import JSON dùng modal xác nhận: nhập master password để giải mã ciphertext hoặc chọn Skip cho file plaintext legacy

## Cấu Trúc Dự Án

```text
exercise2_WP/
|-- .env
|-- .env.example
|-- .gitignore
|-- CHANGELOG.md
|-- README.md
|-- index.html
|-- package.json
|-- postcss.config.js
|-- tailwind.config.js
|-- vite.config.js
|-- docs/
|   |-- ARCHITECTURE.md
|   |-- CONTRIBUTING.md
|   |-- SECURITY.md
|   |-- SETUP.md
|   `-- examples/
|       |-- test_export.json
|       |-- vault test.json
|       |-- vault-export phase D.json
|       |-- vault-export.json
|       |-- vault_hack.json
|       |-- vaults.json
|       `-- vaults_20data.json
`-- src/
    |-- app/
    |   `-- App.jsx
    |-- components/
    |   |-- layout/
    |   |   `-- Topbar.jsx
    |   |-- navigation/
    |   |   `-- ResponsiveSidebar.jsx
    |   |-- security/
    |   |   `-- MasterPasswordGate.jsx
    |   |-- shared/
    |   |   `-- PageHeader.jsx
    |   |-- ui/
    |   |   |-- Modal.jsx
    |   |   `-- Toast.jsx
    |   `-- vault/
    |       `-- VaultPanel.jsx
    |-- config/
    |   `-- navigation.js
    |-- context/
    |   `-- AppContext.jsx
    |-- hooks/
    |   `-- useLocalStorage.js
    |-- layouts/
    |   `-- ShellLayout.jsx
    |-- pages/
    |   |-- AccountPage.jsx
    |   |-- AuthPage.jsx
    |   |-- BlockchainPage.jsx
    |   |-- ExportPage.jsx
    |   |-- GeneratorPage.jsx
    |   |-- ImportPage.jsx
    |   |-- ReportsPage.jsx
    |   |-- SecurityPage.jsx
    |   `-- VaultPage.jsx
    |-- services/
    |   |-- authService.js
    |   |-- blockchainService.js
    |   |-- vaultService.js
    |   `-- walletService.js
    |-- styles/
    |   |-- index.css
    |   `-- tokens.css
    |-- utils/
    |   |-- crypto.js
    |   |-- password.js
    |   `-- storageKeys.js
    `-- main.jsx
```

## Luồng Ứng Dụng
- `AuthPage`: đăng nhập Google hoặc kết nối ví
- `ShellLayout`: giao diện chính với sidebar đa cấp và topbar responsive
- `VaultPage`: quản lý vault sau khi phiên đã được mở khóa
- `GeneratorPage`: sinh mật khẩu mạnh
- `ImportPage`: nhập JSON qua modal xác nhận master password/skip
- `ExportPage`: xuất JSON ciphertext sau bước xác thực master password
- `BlockchainPage`: tạo commitment hash và chuẩn bị lưu lên smart contract
- `AccountPage` / `SecurityPage`: hồ sơ và bảo mật
- `ReportsPage`: thống kê trạng thái vault

## Bảo Mật Và DApp Logic
- Hybrid Auth: hỗ trợ Google Auth và ví MetaMask trong một luồng xác thực
- Session unlock: nhập master password để mở khóa phiên; key giải mã chỉ giữ trong memory và bị xóa khi lock/auto-lock/logout
- Master Password Gate: chỉ bắt buộc lại cho các thao tác cực nhạy cảm như export và xóa toàn bộ dữ liệu
- Vault actions: thêm/sửa/xóa từng mật khẩu không còn lặp lại yêu cầu xác thực
- Vault encryption: AES-256-GCM + PBKDF2-SHA256 (310000 iterations, salt 16 bytes)
- Master verifier: lưu theo hash+salt, có tương thích với dữ liệu hash legacy
- Password rotation: đổi master password sẽ decrypt -> re-encrypt toàn bộ vault
- Import compatibility: hỗ trợ cả ciphertext export mới (`vault-ciphertext-v1`) và plaintext legacy array
- Blockchain helper: tạo commitment hash và sẵn sàng ghi lên smart contract khi có cấu hình
- Password strength: dùng zxcvbn-ts để đánh giá mật khẩu khi đăng ký, thêm/sửa vault và nhập JSON
- Toast snackbar: thông báo nổi ở đáy màn hình, có hành động hoàn tác cho xóa nhanh
- Mobile nav: có nút mở menu riêng trên màn hình nhỏ

## Design Tokens
Toàn bộ màu sắc, font và theme được khai báo ở:
- [src/styles/tokens.css](src/styles/tokens.css)

Tailwind được map trực tiếp sang các token này trong:
- [tailwind.config.js](tailwind.config.js)

## Chạy Dự Án
1. `npm install`
2. `npm run dev`
3. Mở URL do Vite trả về, mặc định là `http://localhost:5173`

## Scripts
- `npm run dev`: chạy development server
- `npm run build`: build production
- `npm run preview`: xem bản build

Lưu ý: hiện chưa có script test tự động trong `package.json`; kiểm tra nhanh chủ yếu qua `npm run build` + test tay các luồng bảo mật.

## Biến Môi Trường
Copy từ `.env.example` sang `.env` và cấu hình các biến cần thiết cho auth / blockchain:
- `VITE_APP_NAME`
- `VITE_APP_LOCALE`
- `VITE_DEFAULT_MASTER_PASSWORD`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_VAULT_CONTRACT_ADDRESS`

## Ghi Chú
- Vault được lưu client-side ở IndexedDB dưới dạng ciphertext; localStorage chỉ giữ state không nhạy cảm
- Lần mở khóa đầu sau nâng cấp có thể kích hoạt migrate dữ liệu legacy tự động
- Bộ dữ liệu test import/export nằm ở `docs/examples`
- File legacy trong `legacy/bootstrap-static` được giữ lại để tham chiếu lịch sử, không dùng trong runtime React hiện tại
- Các trang chi tiết trong `src/pages` đã được tách theo vai trò nghiệp vụ, phù hợp mở rộng thêm feature sau này
