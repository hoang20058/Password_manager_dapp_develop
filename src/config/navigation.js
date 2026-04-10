import {
  Vault,
  Wrench,
  ChartColumnBig,
  Settings,
  Wand2,
  Upload,
  Download,
  UserRound,
  LockKeyhole,
  CloudCog
} from "lucide-react";

export const navigationGroups = [
  {
    label: "Kho",
    icon: Vault,
    path: "/app/vault"
  },
  {
    label: "Công cụ",
    icon: Wrench,
    children: [
      { label: "Trình tạo", icon: Wand2, path: "/app/tools/generator" },
      { label: "Nhập", icon: Upload, path: "/app/tools/import" },
      { label: "Xuất", icon: Download, path: "/app/tools/export" },
      { label: "Blockchain", icon: CloudCog, path: "/app/tools/blockchain" }
    ]
  },
  {
    label: "Báo cáo",
    icon: ChartColumnBig,
    path: "/app/reports"
  },
  {
    label: "Cài đặt",
    icon: Settings,
    children: [
      { label: "Tài khoản của tôi", icon: UserRound, path: "/app/settings/account" },
      { label: "Bảo mật", icon: LockKeyhole, path: "/app/settings/security" }
    ]
  }
];

export const defaultRoute = "/app/vault";
