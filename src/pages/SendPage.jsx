import PageHeader from "../components/shared/PageHeader";

export default function SendPage() {
  return (
    <section className="space-y-4">
      <PageHeader
        eyebrow="Send"
        title="Chia sẻ an toàn"
        description="Trang này dành cho luồng gửi an toàn trong DApp: chia sẻ một phần vault, khóa thời hạn, hoặc chuyển thông điệp được mã hóa."
      />
      <div className="panel p-6">
        <p className="text-sm text-app-muted">
          Hiện tại đây là khung chức năng. Bạn có thể mở rộng thành luồng gửi mật khẩu hoặc token đã mã hóa qua ví hoặc smart contract.
        </p>
      </div>
    </section>
  );
}
