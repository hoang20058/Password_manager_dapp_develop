# DApp Password Manager

Ứng dụng FE cho quản lý mật khẩu theo hướng DApp, được tổ chức lại bằng React + Vite + Tailwind CSS với kiến trúc module, route rõ ràng, lớp bảo mật cục bộ và luồng unlock phiên theo phiên làm việc.

## Tech Stack
- React 19
- Vite
- Tailwind CSS
- React Router
- Firebase Auth hoặc luồng mô phỏng khi chưa cấu hình
- MetaMask / EIP-1193 wallet
- Ethers cho blockchain helper
- zxcvbn-ts để đánh giá độ mạnh mật khẩu
- localStorage cho dữ liệu cục bộ

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
|   `-- SETUP.md
|-- legacy/
|   `-- bootstrap-static/
|       |-- auth-style.css
|       |-- auth.html
|       |-- component.js
|       |-- index.bootstrap.html
|       |-- script.js
|       `-- style.css
|-- Fake_data/
|   |-- test_export.json
|   |-- vaults.json
|   `-- vaults_20data.json
|-- file_giai_thich_code/
|   |-- bootstrap-giai-thich.md
|   |-- code.txt
|   |-- scipt_bao_cao.txt
|   |-- script-giai-thich.txt
|   `-- tu_nghiem.txt
`-- src/
    |-- app/
    |   `-- App.jsx
    |-- components/
    |   |-- auth/
    |   |   |-- AuthCard.jsx
    |   |   `-- HybridAuthCard.jsx
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
    |   |-- AppearancePage.jsx
    |   |-- AuthPage.jsx
    |   |-- BlockchainPage.jsx
    |   |-- DashboardPage.jsx
    |   |-- ExportPage.jsx
    |   |-- GeneratorPage.jsx
    |   |-- ImportPage.jsx
    |   |-- ReportsPage.jsx
    |   |-- SecurityPage.jsx
    |   |-- SendPage.jsx
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
- `VaultPage`: quản lý vault, yêu cầu master password khi xem, sửa, xóa
- `GeneratorPage`: sinh mật khẩu mạnh
- `ImportPage` / `ExportPage`: nhập và xuất JSON
- `BlockchainPage`: tạo commitment hash và chuẩn bị lưu lên smart contract
- `AccountPage` / `SecurityPage` / `AppearancePage`: hồ sơ, bảo mật, giao diện
- `ReportsPage`: thống kê trạng thái vault

## Bảo Mật Và DApp Logic
- Hybrid Auth: hỗ trợ Google Auth và ví MetaMask trong một luồng xác thực
- Session unlock: nhập master password một lần để mở khóa phiên; phiên tự khóa khi hết thời gian không sử dụng
- Master Password Gate: chỉ bắt buộc lại cho các thao tác cực nhạy cảm như export và xóa toàn bộ dữ liệu
- Vault actions: thêm/sửa/xóa từng mật khẩu không còn lặp lại yêu cầu xác thực
- Hash utilities: hash SHA-256 cho mật khẩu cục bộ và commitment blockchain
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

## Biến Môi Trường
Copy từ `.env.example` sang `.env` và cấu hình các biến cần thiết cho auth / blockchain:
- `VITE_APP_NAME`
- `VITE_APP_LOCALE`
- `VITE_DEFAULT_MASTER_PASSWORD`
- `VITE_DEFAULT_ACCOUNT_PASSWORD`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_VAULT_CONTRACT_ADDRESS`

## Ghi Chú
- Dữ liệu vẫn là client-side localStorage, chưa có backend lưu trữ thật
- Thư mục `legacy/bootstrap-static` lưu lại phiên bản Bootstrap cũ để đối chiếu
- Các trang chi tiết trong `src/pages` đã được tách theo vai trò nghiệp vụ, phù hợp mở rộng thêm feature sau này
