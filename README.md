# 🔐 Web2.5 DApp Password Manager

DApp Password Manager là một ứng dụng quản lý mật khẩu Web2.5 (lai ghép Web2 và Web3) hiện đại, an toàn và phân tán. Ứng dụng được thiết kế nhằm mang lại sự tiện lợi của Web2 (đăng nhập Google, tự động hóa) kết hợp với tính bảo mật và phi tập trung tối đa của Web3 (mã hóa client-side đối xứng, lưu trữ IPFS phi tập trung và ghi nhận chữ ký blockchain).

Hệ thống tài liệu dưới đây đã được gộp lại toàn diện giúp người đánh giá (Evaluator) và lập trình viên dễ dàng thiết lập, triển khai và sử dụng hệ thống từ đầu.

---

## 🗺️ Mục Lục Tài Liệu Toàn Diện
1. [⚡ Hướng Dẫn Chạy Nhanh Trong 30 Giây](#-hướng-dẫn-chạy-nhanh-trong-30-giây)
2. [🛠️ Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
3. [📦 Giải Thích Chi Tiết Các Thư Viện (Dependencies)](#-giải-thích-chi-tiết-các-thư-viện-dependencies)
4. [📂 Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
5. [💾 Hướng Dẫn Cài Đặt Chi Tiết Từ Máy Windows Sạch](#-huớng-dẫn-cài-đặt-chi-tiết-từ-máy-windows-sạch)
6. [🚀 Hướng Dẫn Triển Khai Blockchain & Faucet](#-hướng-dẫn-triển-khai-blockchain--faucet)
7. [📐 Đặc Tả Kiến Trúc Hệ Thống (Architecture)](#-đặc-tả-kiến-trúc-hệ-thống-architecture)
8. [🛡️ Đặc Tả Thiết Khế An Toàn Thông Tin (Security Design)](#-đặc-tả-thiết-khế-an-toàn-thông-tin-security-design)
9. [📖 Cẩm Nang Hướng Dẫn Sử Dụng (User Guide)](#-cẩm-nang-hướng-dẫn-sử-dụng-user-guide)
10. [📂 Thư Mục Dữ Liệu Mẫu (Data Example)](#-thư-mục-dữ-liệu-mẫu-data-example)
11. [🐳 Cấu Hình Đóng Gói Container (Docker Guide)](#-cấu-hình-đóng-gói-container-docker-guide)

---

## ⚡ Hướng Dẫn Chạy Nhanh Trong 30 Giây

Nếu máy của bạn đã cài đặt sẵn Node.js và muốn chạy thử nghiệm ngay lập tức với các cấu hình thử nghiệm có sẵn trong `.env`:

1.  **Cài đặt thư viện:**
    ```bash
    npm install
    ```
2.  **Khởi động trạm tài trợ Gas (JIT Gas Station):**
    Mở một terminal mới tại thư mục gốc dự án và chạy:
    ```bash
    npm run faucet
    ```
    *Faucet server sẽ chạy tại cổng `3001` để tự động tài trợ Sepolia ETH cho ví ảo của người dùng Google.*
3.  **Khởi động Frontend Client:**
    Mở một terminal khác và chạy:
    ```bash
    npm run dev
    ```
    *Giao diện Vite sẽ chạy tại [http://localhost:5173](http://localhost:5173).*

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

*   **Frontend Client:** React 19, Vite, React Router v7, Tailwind CSS v3.
*   **Mã Hóa & Bảo Mật:** Web Crypto API (chạy trực tiếp trong nhân trình duyệt), `@zxcvbn-ts` (đánh giá độ mạnh mật khẩu cục bộ).
*   **Blockchain Integration:** Ethers v6, MetaMask API (EIP-1193).
*   **Smart Contract & Deployment:** Solidity v0.8.19, Hardhat v2.28.6.
*   **Database & Caching:** IndexedDB (bộ đệm dữ liệu mã hóa cục bộ), localStorage (lưu trữ giao diện sáng/tối và phiên làm việc không nhạy cảm).
*   **Lưu Trữ Phân Tán:** IPFS (thông qua cổng Pinata API JWT).

---

## 📦 Giải Thích Chi Tiết Các Thư Viện (Dependencies)

Hệ thống sử dụng các thư viện ngoài để thực hiện các nhiệm vụ chuyên biệt. Dưới đây là giải thích chi tiết về từng thư viện được khai báo trong `package.json`:

### 1. Thư viện runtime (Dependencies - Chạy chính trong ứng dụng)
*   **`react` (v19.x) & `react-dom` (v19.x):** Thư viện cốt lõi dùng để xây dựng giao diện người dùng theo mô hình component-based. React 19 cung cấp khả năng tối ưu hóa render và hiệu năng vượt trội cho ứng dụng Web.
*   **`react-router-dom` (v7.x):** Thư viện quản lý định tuyến (routing) cho ứng dụng Single Page Application (SPA). Giúp chuyển đổi mượt mà giữa các trang như trang chủ két sắt, trang báo cáo an toàn, trang cài đặt mà không cần tải lại toàn bộ trang web.
*   **`ethers` (v6.x):** Thư viện Web3 cốt lõi để tương tác với mạng lưới blockchain Ethereum. Thư viện này dùng để kết nối với Smart Contract, tạo giao dịch ghi CID, đọc thông tin từ blockchain và quản lý các đối tượng Wallet/Signer/Provider.
*   **`firebase` (v12.x):** SDK của Google cung cấp giải pháp xác thực người dùng bằng Google Auth Popup, trả về token và mã UID định danh dùng để làm hạt giống (seed) sinh ví Web3 tất định cho người dùng Google.
*   **`lucide-react` (v1.x):** Bộ sưu tập hàng ngàn icon vector hiện đại, sắc nét và nhẹ, dùng để vẽ các biểu tượng ổ khóa, két sắt, nút copy, chỉnh sửa, xóa trên giao diện.
*   **`@zxcvbn-ts/core` (v3.x) & `@zxcvbn-ts/language-common` (v3.x):** Công cụ phân tích và chấm điểm độ mạnh mật khẩu cục bộ phát triển bởi Dropbox. Nó đo lường entropy của mật khẩu, dự đoán thời gian bị bẻ khóa (crack time), đưa ra gợi ý/cảnh báo trực quan giúp người dùng cải thiện mật khẩu chủ và mật khẩu két sắt mà không gửi dữ liệu này lên bất kỳ máy chủ nào.

### 2. Thư viện phát triển (DevDependencies - Dùng để lập trình và build)
*   **`hardhat` (v2.x) & `@nomicfoundation/hardhat-toolbox` (v3.x):** Môi trường phát triển blockchain Ethereum cục bộ. Hỗ trợ biên dịch mã nguồn Solidity (`npm run compile`), chạy mạng blockchain test cục bộ và deploy hợp đồng thông minh lên mạng Sepolia (`npm run deploy:sepolia`).
*   **`vite` (v8.x) & `@vitejs/plugin-react` (v6.x):** Bộ công cụ đóng gói (bundler) và phát triển frontend thế hệ mới siêu nhanh. Vite hỗ trợ Hot Module Replacement (HMR) giúp cập nhật code lập tức lên trình duyệt và đóng gói file tĩnh ra thư mục `dist/` khi build production.
*   **`tailwindcss` (v3.x), `postcss` (v8.x) & `autoprefixer` (v10.x):** Bộ công cụ thiết kế CSS. Tailwind CSS giúp tạo giao diện nhanh chóng bằng các class tiện ích (utility classes) được cấu hình thống nhất theo design tokens trong `tailwind.config.js`. PostCSS và Autoprefixer tự động thêm các tiền tố nhà sản xuất (browser prefixes) giúp CSS chạy ổn định trên mọi trình duyệt Chrome, Safari, Edge.
*   **`dotenv` (v16.x):** Thư viện nhỏ giúp tự động tải các biến cấu hình từ tệp tin cục bộ `.env` vào bộ nhớ tạm `process.env` để Hardhat deploy script và Faucet server có thể đọc được các thông số nhạy cảm một cách an toàn.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
exercise2_WP/
├── contracts/                  # Smart Contracts Solidity
│   └── VaultPointer.sol        # Contract lưu IPFS CID cho từng ví
├── scripts/                    # Scripts triển khai blockchain (Hardhat)
│   ├── deploy.js               # Script deploy contract & tự động ghi .env
│   ├── exportAbi.js            # Xuất file ABI JSON cho frontend
│   └── updateEnv.js            # Tiện ích ghi địa chỉ contract vào .env
├── server/                     # JIT Gas Faucet Server
│   └── faucet.js               # Node server tài trợ phí gas tự động
├── src/                        # Mã nguồn ứng dụng Frontend
│   ├── app/                    # Định tuyến ứng dụng React Router
│   ├── components/             # Components UI dùng chung & theo module
│   │   ├── security/           # Cổng xác thực MasterPassword và check độ mạnh
│   │   └── vault/              # Panel quản lý mật khẩu chính
│   ├── config/                 # Cấu hình Firebase SDK
│   ├── context/                # AppContext quản lý session, khóa RAM, đồng bộ
│   ├── contracts/              # Nơi chứa file ABI của contract sau biên dịch
│   ├── services/               # Lớp giao tiếp API (auth, blockchain, IPFS, faucet, vault)
│   ├── utils/                  # Thư viện tiện ích (mã hóa crypto.js, kiểm tra zxcvbn)
│   └── main.jsx                # Điểm khởi động React
├── Dockerfile                  # Đóng gói hệ thống
└── docker-compose.yml          # Chạy local multi-container (Frontend + Faucet)
```

---

## 💾 Hướng Dẫn Cài Đặt Chi Tiết Từ Máy Windows Sạch (Cho Người Mới Bắt Đầu)

Tài liệu này được thiết kế dành cho những người chưa từng làm việc với Web3, NodeJS hay Firebase. Hãy làm theo từng bước nhỏ dưới đây để cài đặt dự án thành công.

---

### 🧱 BƯỚC 1: Cài Đặt Các Phần Mềm Nền Tảng (Prerequisites)

Nếu máy tính của bạn là máy Windows mới mua hoặc chưa từng cài gì để lập trình, hãy tải và cài đặt 4 phần mềm sau:

#### 1. Cài đặt Node.js (Môi trường chạy mã nguồn Javascript)
*   **Link tải trực tiếp bản ổn định:** Truy cập [https://nodejs.org/en](https://nodejs.org/en) và nhấn vào nút màu xanh ghi **LTS** (ví dụ: `20.18.0 LTS` hoặc tương đương). Tải tệp `.msi` về máy.
*   **Cách cài:** Mở tệp `.msi` vừa tải -> Nhấn **Next** -> Tích vào ô đồng ý điều khoản -> Tiếp tục nhấn **Next** -> Đến màn hình "Tools for Native Modules", **tích vào ô** "Automatically install the necessary tools..." -> Nhấn **Next** -> Nhấn **Install**.
*   **Kiểm tra:** Nhấn nút Windows trên bàn phím, gõ `cmd` để mở **Command Prompt**, gõ lệnh sau rồi nhấn Enter:
    ```cmd
    node -v
    ```
    *Nếu hiển thị phiên bản dạng `v20.x.x` là thành công.*

#### 2. Cài đặt Git (Công cụ quản lý và tải mã nguồn)
*   **Link tải:** Truy cập [https://git-scm.com/download/win](https://git-scm.com/download/win) -> Click chọn **64-bit Git for Windows Setup** để tải về.
*   **Cách cài:** Mở file cài đặt vừa tải -> Nhấn **Next** liên tục (giữ tất cả các cấu hình mặc định) -> Nhấn **Install**.
*   **Kiểm tra:** Mở lại Command Prompt, gõ lệnh sau:
    ```cmd
    git --version
    ```
    *Nếu hiện ra phiên bản Git là đã cài đặt thành công.*

#### 3. Cài đặt VS Code (Trình soạn thảo mã nguồn)
*   **Link tải:** Truy cập [https://code.visualstudio.com/](https://code.visualstudio.com/) -> Nhấn vào nút xanh **Download for Windows**.
*   **Cách cài:** Chạy tệp tin cài đặt -> Nhấn **Next** và chấp nhận các điều khoản -> Nhấn **Install**.

#### 4. Cài đặt Ví MetaMask trên Trình duyệt (Chrome/Edge/Brave)
*   **Link tải:** Truy cập [https://metamask.io/download/](https://metamask.io/download/) -> Chọn **Install MetaMask for Chrome**.
*   **Cách cài đặt ví:**
    1. Nhấn **Add to Chrome** (Thêm vào Chrome) -> Nhấn **Add Extension** (Thêm tiện ích).
    2. Chờ MetaMask tự động mở trang chào mừng -> Nhấn **Tạo ví mới** (Create a new wallet).
    3. Nhập mật khẩu mở khóa ví MetaMask (đây là mật khẩu để bảo vệ ví trên trình duyệt hiện tại).
    4. **CỰC KỲ QUAN TRỌNG:** Đến phần hiển thị **Cụm từ khôi phục bí mật (12 từ tiếng Anh)**. Hãy chép 12 từ này ra một tờ giấy và cất đi. Tuyệt đối không chụp ảnh hoặc lưu lên mạng xã hội vì bất cứ ai có 12 từ này sẽ lấy được toàn bộ tiền trong ví của bạn.
    5. MetaMask sẽ yêu cầu xác nhận lại một số từ trong cụm từ khôi phục. Hoàn tất xác nhận để vào giao diện ví chính.

---

### 🦊 BƯỚC 2: Cấu Hình Mạng Blockchain Sepolia & Nhận Gas Miễn Phí

Ứng dụng của chúng ta lưu thông tin con trỏ két sắt trên chuỗi khối thử nghiệm **Sepolia Testnet** của Ethereum. Bạn cần thực hiện cấu hình ví để bắt đầu.

#### 1. Bật hiển thị mạng Sepolia trên ví MetaMask
Mặc định mạng thử nghiệm bị ẩn đi để tránh nhầm lẫn. Để hiển thị mạng Sepolia:
1. Mở tiện ích MetaMask ở góc trên bên phải trình duyệt (icon hình đầu cáo).
2. Nhấp vào nút chọn Mạng ở góc trên bên trái của cửa sổ MetaMask (thường mặc định ghi là **Ethereum Mainnet**).
3. Bật công tắc **Hiển thị các mạng thử nghiệm** (Show test networks).
4. Bạn sẽ thấy mạng **Sepolia** xuất hiện trong danh sách. Click chọn mạng **Sepolia**.

#### 2. Nhận Sepolia ETH Miễn Phí (Dùng để trả phí giao dịch gas)
Để tương tác với Blockchain, bạn cần một ít đồng Sepolia ETH làm phí gas.
1. Sao chép địa chỉ ví của bạn: Mở cửa sổ MetaMask lên, nhấp chuột vào phần tên tài khoản ở chính giữa phía trên (nó sẽ ghi dạng `Account 1` kèm theo địa chỉ ví bắt đầu bằng `0x...` và kết thúc bằng một vài ký tự ví dụ `0x3a4b...5f2c`). Khi click vào đó, địa chỉ ví sẽ được tự động sao chép.
2. Truy cập trang web cấp ETH thử nghiệm miễn phí:
   *   [Alchemy Sepolia Faucet (Khuyên dùng)](https://sepoliafaucet.com/): Đăng ký tài khoản Alchemy miễn phí -> Dán địa chỉ ví của bạn vào ô trống -> Tích chọn "I'm not a robot" -> Nhấn **Send Me ETH**. Bạn sẽ nhận được `0.05 Sepolia ETH` ngay sau đó.
   *   [QuickNode Faucet](https://faucet.quicknode.com/drip) hoặc [Sepolia-faucet.pk910.de](https://sepolia-faucet.pk910.de/).
3. Kiểm tra ví MetaMask: Chờ khoảng 1-2 phút, bạn sẽ thấy số dư ví của mình hiển thị tăng lên (ví dụ: `0.05 Sepolia ETH`).

#### 3. Lấy Khóa Riêng Tư (Private Key) của ví để deploy hợp đồng thông minh
Khóa riêng tư dùng để cho phép các câu lệnh tự động biên dịch và deploy Smart Contract bằng terminal.
1. Mở MetaMask -> Nhấp vào biểu tượng 3 chấm dọc ở góc trên bên phải cửa sổ ví -> Chọn **Account details** (Chi tiết tài khoản).
2. Nhấp chuột vào nút **Show private key** (Hiển thị khóa riêng tư).
3. Nhập mật khẩu MetaMask của bạn để xác minh.
4. Copy chuỗi ký tự dài hiện ra (chuỗi này bắt đầu bằng ký tự thông thường, **không có chữ `0x` ở đầu**). Lưu tạm chuỗi này ra Notepad để cấu hình ở Bước 5.

---

### 🔥 BƯỚC 3: Tạo Dự Án Firebase Đăng Nhập Google (Google Auth)

Để người dùng không có ví MetaMask vẫn dùng được ứng dụng thông qua đăng nhập Google, ta cần liên kết với Firebase Auth:

1. **Truy cập:** Mở trình duyệt truy cập trang [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Gmail của bạn.
2. **Tạo dự án:**
   * Nhấp nút **Add project** (Tạo dự án).
   * Điền tên dự án (ví dụ: `web3-password-manager`) -> Nhấn **Continue**.
   * Ở bước Google Analytics, bạn hãy **Tắt công tắc** Google Analytics đi để cài đặt nhanh hơn -> Nhấn **Create project** -> Chờ khoảng 30 giây rồi nhấn **Continue** để hoàn tất.
3. **Bật tính năng Google Login:**
   * Tại cột menu bên trái, nhấp vào **Build** -> Chọn **Authentication**.
   * Nhấp vào nút **Get Started**.
   * Tại tab **Sign-in method**, tìm nhà cung cấp tên là **Google** và click vào.
   * Nhấp bật công tắc **Enable** ở góc trên bên phải.
   * Tại ô **Project support email**, click chọn địa chỉ email Gmail của bạn.
   * Nhấn nút **Save** (Lưu) để hoàn thành.
4. **Lấy mã cấu hình Firebase SDK cho ứng dụng:**
   * Nhấp vào biểu tượng trang chủ **Project Overview** ở góc trên bên trái menu.
   * Ở giữa trang, nhấp chuột vào biểu tượng Web (hình dấu `</>` màu trắng trên nền xám tròn).
   * Điền tên hiển thị cho ứng dụng web (ví dụ: `Dapp Web`) -> Nhấn nút **Register app**.
   * Firebase sẽ xuất hiện một đoạn mã Javascript. Bạn chỉ cần chú ý và copy phần đối tượng `firebaseConfig` có dạng như sau:
     ```javascript
     const firebaseConfig = {
       apiKey: "AIzaSy...",
       authDomain: "...",
       projectId: "...",
       storageBucket: "...",
       messagingSenderId: "...",
       appId: "...",
       measurementId: "..."
     };
     ```
     Hãy lưu lại 7 giá trị trên (từ `apiKey` đến `measurementId`) ra file Notepad để sử dụng ở Bước 5.

> [!TIP]
> ### ⚡ TÙY CHỌN THIẾT LẬP NHANH (QUICK SETUP OPTION)
> Để tiết kiệm thời gian và rút ngắn quá trình cấu hình, tác giả đã cấu hình sẵn một ứng dụng sandbox trên **Firebase Development Environment**. 
> 
> Nếu bạn chỉ muốn kiểm thử nhanh các tính năng mà không muốn tự tạo dự án Firebase từ đầu, bạn có thể **bỏ qua hoàn toàn Bước 3** và sao chép trực tiếp các thông số cấu hình dưới đây vào file `.env`:
> 
> ```env
> VITE_FIREBASE_API_KEY="AIzaSyDyjfSSJVoJhR_C1qGMo1-JRAYlv4iUuEU"
> VITE_FIREBASE_AUTH_DOMAIN="web3passwordmanager.firebaseapp.com"
> VITE_FIREBASE_PROJECT_ID="web3passwordmanager"
> VITE_FIREBASE_STORAGE_BUCKET="web3passwordmanager.firebasestorage.app"
> VITE_FIREBASE_MESSAGING_SENDER_ID="460811530088"
> VITE_FIREBASE_APP_ID="1:460811530088:web:0a8eb3570239a7946470dd"
> VITE_FIREBASE_MEASUREMENT_ID="G-SX2QPY31LC"
> ```
> 
> *⚠️ **Lưu ý bảo mật từ tác giả:** Tài khoản Firebase này đã được thiết lập nghiêm ngặt: chỉ bật duy nhất phương thức Google Auth, cấu hình Authorized Domains giới hạn nghiêm ngặt trong môi trường phát triển cục bộ (`localhost`, `127.0.0.1`), và áp dụng Firebase Security Rules chặn mọi quyền ghi cơ sở dữ liệu bên thứ ba. Tuyệt đối an toàn cho việc hội đồng chạy kiểm thử đồ án.*

---

### 📌 BƯỚC 4: Đăng Ký Pinata IPFS Lấy Mã API (Token Lưu File)

Dữ liệu mật khẩu mã hóa (ciphertext) sẽ được đẩy lên mạng lưới lưu trữ đám mây phi tập trung IPFS qua Pinata.

1. **Truy cập:** [https://www.pinata.cloud/](https://www.pinata.cloud/) -> Nhấp **Start Free** hoặc **Sign Up** để đăng ký một tài khoản miễn phí.
2. **Tạo API Key:**
   * Sau khi đăng nhập thành công vào bảng quản lý của Pinata.
   * Nhìn vào thanh menu bên trái, chọn mục **API Keys** (hoặc click biểu tượng Account ở góc trên bên phải -> Chọn **API keys**).
   * Nhấp chuột vào nút **Create New Key** ở góc trên bên phải.
   * Một cửa sổ bật lên, tại mục **Key Permissions**, bạn hãy tích chọn quyền **Admin** (hoặc tích chọn bật tất cả các quyền ghi chép/đọc file).
   * Nhập tên cho Key của bạn ở mục **Key Name** (ví dụ: `DappKey`) -> Nhấp nút **Generate Key**.
3. **Lấy Token JWT:**
   * Cửa sổ hiển thị API Key xuất hiện. Bạn sẽ thấy 3 dòng: `API Key`, `API Secret`, và `JWT`.
   * Hãy **sao chép toàn bộ chuỗi ký tự cực dài ở mục JWT** (chuỗi ký tự này bắt đầu bằng `eyJhbGciOi...` và kéo dài vài dòng). Lưu lại chuỗi này để cấu hình ở Bước 5.

---

### 📝 BƯỚC 5: Cấu Hình Tệp Môi Trường `.env` Thực Tế

Bây giờ bạn sẽ điền tất cả các thông số lấy được vào cấu hình dự án:

1. **Mở thư mục dự án bằng VS Code:**
   * Mở phần mềm VS Code -> Chọn **File** -> **Open Folder...** -> Tìm và chọn thư mục của dự án (`exercise2_WP`).
2. **Tạo file `.env`:**
   * Trong danh sách file bên trái của VS Code, bạn sẽ thấy một file tên là `.env.example`.
   * Click chuột phải vào file `.env.example` -> Chọn **Rename** (Đổi tên) -> Đổi tên file thành `.env` (xóa đuôi `.example` đi).
3. **Điền thông số vào `.env`:**
   * Mở file `.env` vừa đổi tên.
   * Điền các thông số bạn lấy được từ **Bước 2, Bước 3, Bước 4** vào sau các dấu `=` tương ứng:
     *   `VITE_FIREBASE_API_KEY=` -> Điền `apiKey` từ Firebase.
     *   `VITE_FIREBASE_AUTH_DOMAIN=` -> Điền `authDomain` từ Firebase.
     *   `VITE_FIREBASE_PROJECT_ID=` -> Điền `projectId` từ Firebase.
     *   `VITE_FIREBASE_STORAGE_BUCKET=` -> Điền `storageBucket` từ Firebase.
     *   `VITE_FIREBASE_MESSAGING_SENDER_ID=` -> Điền `messagingSenderId` từ Firebase.
     *   `VITE_FIREBASE_APP_ID=` -> Điền `appId` từ Firebase.
     *   `VITE_FIREBASE_MEASUREMENT_ID=` -> Điền `measurementId` từ Firebase.
     *   `VITE_PINATA_JWT=` -> Dán chuỗi JWT Pinata cực dài vào bên trong dấu ngoặc kép. Ví dụ: `VITE_PINATA_JWT="eyJhbGci..."`.
     *   `DEPLOYER_PRIVATE_KEY=` -> Dán khóa riêng tư lấy từ ví MetaMask ở Bước 2.3 vào trong dấu ngoặc kép. Ví dụ: `DEPLOYER_PRIVATE_KEY="56ecff..."`.
   * Nhấn tổ hợp phím **Ctrl + S** để lưu lại file `.env`.

---

### 🚀 BƯỚC 6: Cài Đặt Thư Viện & Triển Khai Blockchain (Đại Diện)

Hệ thống cần cài đặt các thư viện Javascript và deploy Smart Contract chứa danh sách địa chỉ CID lên testnet.

#### 1. Mở Terminal (Cửa sổ dòng lệnh) trong VS Code
*   Trên thanh menu trên cùng của VS Code, chọn **Terminal** -> **New Terminal**.
*   Một cửa sổ dòng lệnh màu đen sẽ xuất hiện ở góc dưới màn hình VS Code.

#### 2. Cài đặt các thư viện Javascript
*   Gõ lệnh sau vào Terminal và nhấn Enter:
    ```bash
    npm install
    ```
    *Chờ khoảng 1-2 phút để phần mềm tự động tải toàn bộ các thư viện cần thiết.*

#### 3. Biên dịch Smart Contract
*   Gõ lệnh sau để biên dịch file contract Solidity:
    ```bash
    npm run compile
    ```
    *Nếu hiển thị dòng chữ `Compiled 1 Solidity file successfully` là thành công.*

#### 4. Triển khai Smart Contract lên mạng Sepolia Testnet
*   Gõ lệnh sau để chạy file script deploy tự động:
    ```bash
    npm run deploy:sepolia
    ```
    *Hệ thống sẽ tự động thực hiện các bước ký giao dịch deploy. Khi chạy xong, nó sẽ in địa chỉ contract ra màn hình (ví dụ: `Contract Address: 0x1704...`) và **tự động ghi địa chỉ này vào file `.env`** ở dòng `VITE_VAULT_CONTRACT_ADDRESS` cho bạn, đồng thời sinh file ABI JSON.*

---

### ⛽ BƯỚC 7: Khởi Chạy Ứng Dụng & Trạm Gas Tự Động (JIT Faucet)

Chúng ta cần chạy 2 tiến trình song song: máy chủ Faucet cấp gas tự động và giao diện frontend.

#### 1. Chạy Faucet Gas Server (Cổng 3001)
*   Tại terminal hiện tại trong VS Code, hãy gõ lệnh sau để chạy faucet:
    ```bash
    npm run faucet
    ```
    *Màn hình sẽ hiển thị thông báo: `JIT Gas Station Faucet listening on port 3001`.*
    *Lưu ý: Để Faucet này chạy liên tục, **không được tắt terminal này**.*

#### 2. Chạy Frontend Client (Cổng 5173)
Để mở thêm một terminal chạy frontend song song:
1. Nhìn vào góc trên bên phải của khung cửa sổ terminal hiện tại trong VS Code, nhấp vào biểu tượng dấu cộng **`+`** (New Terminal) để mở thêm một tab terminal thứ hai.
2. Tại terminal mới mở ra này, gõ lệnh sau để chạy Frontend:
   ```bash
   npm run dev
   ```
3. Hệ thống Vite sẽ chạy và in ra dòng: `Local: http://localhost:5173/`.
4. Nhấn giữ phím **Ctrl** và nhấp chuột trái vào đường link `http://localhost:5173/` hiển thị trong terminal để mở ứng dụng quản lý mật khẩu trên trình duyệt Chrome/Edge của bạn.

---

### 🔍 Hướng Dẫn Sử Dụng Nhanh Khi Chạy Thành Công
1.  **Đăng nhập:** Mở ứng dụng -> Chọn **Đăng nhập Google** (sử dụng tài khoản Google để sinh ví ảo tự động) hoặc **Kết nối ví MetaMask**.
2.  **Tạo Master Password:** Nếu đăng nhập lần đầu, hãy điền một mật khẩu chủ (ví dụ: `Habcd123@`) -> Bấm nút Đăng ký két sắt.
3.  **Tạo Mật khẩu trong Két:** Nhấn nút **Thêm mật khẩu** -> Nhập thông tin tài khoản cần quản lý (ví dụ: website `facebook.com`, mật khẩu `myfbpass123`) -> Nhấn **Lưu**.
    *   Hệ thống sẽ mã hóa dữ liệu cục bộ -> Đẩy file mã hóa lên IPFS -> Faucet tự động nạp phí gas cho ví ảo -> Ký giao dịch gửi CID lên blockchain -> Lưu bộ đệm offline IndexedDB thành công.
4.  **Kiểm tra offline cache:** F5 tải lại trang -> Nhập lại Master Password để mở khóa. Mật khẩu của bạn được hiển thị cực nhanh từ bộ nhớ IndexedDB local.


---

## 📐 Đặc Tả Kiến Trúc Hệ Thống (Architecture)

### 1. Mô Hình xác thực
*   **Xác thực lai:** Kết nối ví MetaMask trực tiếp, hoặc đăng nhập Google thông qua Firebase Auth. Khi đăng nhập Google, hệ thống tự động sinh một cặp khóa Web3 tất định (deterministic wallet) trên RAM dựa trên thông tin định danh `uid` và `email` của tài khoản Google:
    `ethers.id("dapp_secret_salt_" + uid + email)`
*   **Lưu trữ phân tán:** Dữ liệu két sắt được mã hóa đối xứng cục bộ, tải lên IPFS lấy mã băm CID, sau đó lưu con trỏ CID này lên Smart Contract Sepolia.

### 2. Phân Lớp Phần Mềm
*   **Presentation Layer (Giao diện):** `src/layouts/ShellLayout.jsx` bao bọc hệ thống định tuyến, tích hợp `MasterPasswordGate` để kiểm soát các tác vụ nhạy cảm (như Export/Clear All).
*   **Business Layer (Dịch vụ):** `src/context/AppContext.jsx` quản lý RAM session key và bộ đếm tự động khóa két sắt. `vaultService.js` chịu trách nhiệm điều phối luồng mã hóa, lưu trữ local IndexedDB và đồng bộ hóa Web3.
*   **Data & Utility Layer:** `crypto.js` và `password.js` thực hiện các phép mã hóa và chấm điểm mật khẩu entropy cục bộ.

---

## 🛡️ Đặc Tả Thiết Kế An Toàn Thông Tin (Security Design)

### 1. Các Nguyên Thủy Mật Mã (Web Crypto API)
*   **PBKDF2-SHA256:** Master Password kết hợp Salt ngẫu nhiên 16 bytes được dẫn xuất khóa thông qua **310,000 vòng lặp** (đáp ứng tiêu chuẩn OWASP chống brute-force phần cứng GPU/ASIC).
*   **AES-256-GCM:** Dữ liệu két sắt được mã hóa đối xứng sử dụng khóa dẫn xuất 256 bits và Vector khởi tạo (IV) ngẫu nhiên 12 bytes. Galois/Counter Mode đảm bảo tính toàn vẹn dữ liệu - nếu tệp tin bị thay đổi trái phép trên IPFS, quá trình giải mã sẽ lập tức báo lỗi.

### 2. Quản Lý Khóa Cực Kỳ An Toàn Trên RAM
Khóa đối xứng dùng để giải mã và mã hóa két sắt chỉ được lưu trên biến tham chiếu tạm thời trong bộ nhớ **RAM** của tab trình duyệt. Khóa giải mã này sẽ lập tức bị **xóa sạch khỏi bộ nhớ** (gán về `null`) khi:
*   Người dùng đóng tab, tải lại trang (F5).
*   Người dùng nhấn **Khóa két sắt** hoặc **Đăng xuất**.
*   Kích hoạt khóa tự động do không hoạt động (Auto-Lock timeout).

### 3. Phân Tích Threat Model (Mô Hình Đe Dọa)
*   **Pinata IPFS bị hack / Blockchain công khai:** Dữ liệu lưu trữ hoàn toàn là ciphertext được mã hóa AES-256-GCM. Kẻ tấn công không thể giải mã dữ liệu nếu không biết Master Password.
*   **Truy cập IndexedDB nội bộ:** IndexedDB chỉ lưu giữ bản ciphertext được mã hóa cục bộ. Việc ăn cắp IndexedDB không làm lộ mật khẩu thô.
*   **Tấn công Spam Faucet:** Áp dụng rate limit 3 lần/ngày/Google UID và chỉ tài trợ gas khi số dư ví ảo dưới 0.001 ETH.

---

## 📖 Cẩm Nang Hướng Dẫn Sử Dụng (User Guide)

### 1. Đăng Nhập & Khởi Tạo Mật Khẩu Chủ
*   Đăng nhập bằng tài khoản Google hoặc ví MetaMask.
*   Nếu là tài khoản mới đăng ký, hệ thống sẽ yêu cầu thiết lập **Master Password** ban đầu. Mật khẩu chủ này sẽ tạo verifier hash+salt lưu cục bộ để xác minh tính khớp trong các lần đăng nhập tiếp theo.

### 2. Quản Lý Mật Khẩu Trong Két Sắt
*   **Thêm mật khẩu:** Nhấp nút **Thêm mật khẩu** -> Điền URL website, Username, Password và chọn Danh mục phân loại. Hệ thống hỗ trợ sinh mật khẩu ngẫu nhiên an toàn cực nhanh.
*   **Mở khóa phiên:** Sau khi tải lại trang, hệ thống yêu cầu nhập Master Password để khôi phục sessionKey trên RAM.
*   **Auto-Lock & Khóa thủ công:** Tại trang cài đặt Security, bạn có thể cấu hình thời gian tự động khóa (ví dụ: 15 phút không tương tác chuột/bàn phím). Bạn có thể bấm nút Khóa trên Topbar bất cứ lúc nào.

### 3. Đổi Mật Khẩu Chủ (Key Rotation)
Tại menu **Cài đặt -> Bảo mật**:
1. Nhập mật khẩu hiện tại và mật khẩu chủ mới.
2. Nhấn cập nhật. Hệ thống sẽ giải mã dữ liệu trên RAM, sinh khóa dẫn xuất mới, mã hóa lại két sắt và đẩy bản mã mới lên IPFS & Blockchain.

### 4. Nhập & Xuất Dữ Liệu JSON
*   **Export:** Yêu cầu bạn nhập lại Master Password để xác nhận tải file JSON mã hóa (định dạng `vault-ciphertext-v1`).
*   **Import:** Chọn file JSON cần nhập.
    *   Nếu là file `vault-ciphertext-v1` -> Cần điền Master Password giải mã.
    *   Nếu là file mảng JSON plaintext legacy cũ -> Nhấp nút **Skip (Bỏ qua)** để import trực tiếp.

---

## 📂 Thư Mục Dữ Liệu Mẫu (Data Example)

Để thuận tiện cho người đánh giá và người dùng mới muốn kiểm thử tính năng **Nhập Két Sắt (Import)**, dự án có sẵn thư mục **`data_example/`** ở thư mục gốc chứa các file dữ liệu mẫu:

### 1. File dữ liệu mẫu Plaintext Legacy (Dạng thô chưa mã hóa)
*   **Tệp tin:** `data_example/mau_plaintext_legacy.json`
*   **Mô tả:** Chứa danh sách mảng JSON các tài khoản mật khẩu thô (Facebook, Google, GitHub).
*   **Cách kiểm thử Import:**
    1. Truy cập ứng dụng -> Vào menu **Nhập dữ liệu** (Import).
    2. Click chọn file `data_example/mau_plaintext_legacy.json`.
    3. Hộp thoại modal xác nhận hiện ra -> Nhấn nút **Bỏ qua (Skip)**.
    4. Toàn bộ mật khẩu mẫu sẽ được import trực tiếp vào két sắt hiện tại của bạn, tự động tiến hành mã hóa và đồng bộ lên Web3.

### 2. File dữ liệu mẫu Ciphertext v1 (Dạng mã hóa bảo mật)
*   **Tệp tin:** `data_example/mau_ciphertext_v1.json`
*   **Mô tả:** File xuất từ két sắt đã được mã hóa bằng thuật toán AES-256-GCM + PBKDF2.
*   **Mật khẩu giải mã của file này:** **`123hoang`**
*   **Cách kiểm thử Import:**
    1. Truy cập ứng dụng -> Vào menu **Nhập dữ liệu** (Import).
    2. Click chọn file `data_example/data_mau_ma_hoa.json`
    3. Hộp thoại modal xác nhận hiện ra -> Điền mật khẩu giải mã là: `Hoang2005@` -> Nhấn **Giải mã & Nhập**.
    4. Hệ thống sẽ giải mã dữ liệu của file, gộp vào két sắt hiện hành của bạn và đồng bộ lên Web3.

---

## 🐳 Cấu Hình Đóng Gói Container (Docker Guide)

Ứng dụng hỗ trợ chạy đồng thời cả Frontend Vite và Faucet Server thông qua Docker Compose.

### 1. Yêu Cầu
*   Đã cài đặt **Docker Desktop** trên Windows.

### 2. Cấu Hình và Khởi Chạy
Tại thư mục gốc dự án (nơi chứa file `docker-compose.yml` và `Dockerfile`):
1.  Khởi chạy Docker Container:
    ```bash
    docker compose up --build -d
    ```
2.  **Cách thức hoạt động:**
    *   Container `dapp_password_manager_frontend` sẽ chạy Vite dev server ở cổng **5173** (được mount volume nóng để lập trình viên chỉnh sửa code cập nhật ngay lập tức).
    *   Container `dapp_password_manager_faucet` sẽ chạy trạm cấp gas JIT ở cổng **3001**.
3.  Để tắt hệ thống container:
    ```bash
    docker compose down
    ```
