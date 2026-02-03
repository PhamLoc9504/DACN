"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Tài khoản & bảo mật (LU01)",
    bullets: [
      "Cam kết của hệ thống: bảo vệ tài khoản bằng mật khẩu, ghi nhận và theo dõi lịch sử đăng nhập bất thường để bảo đảm an toàn.",
      "Nghĩa vụ của người dùng: cung cấp thông tin đăng ký chính xác, không chia sẻ tài khoản cho người khác và tự chịu trách nhiệm về mọi hành vi phát sinh từ tài khoản của mình.",
    ],
    binding:
      'Bằng việc đăng ký, bạn đồng ý rằng hệ thống được phép ghi nhận và lưu trữ lịch sử đăng nhập (ví dụ: địa chỉ IP, thời điểm truy cập) để phục vụ việc bảo đảm an ninh, theo tinh thần Luật An ninh mạng 2018 (LU01).',
    legal: [
      {
        ma: "LU01",
        ten: "Luật An ninh mạng 2018 – an ninh hệ thống, bảo vệ dữ liệu truy cập.",
        link: "https://datafiles.chinhphu.vn/cpp/files/vbpq/2022/07/24-2018-qh14..pdf",
      },
    ],
  },
  {
    title: "2. Dữ liệu khách hàng & người dùng (LU01 + LU02)",
    bullets: [
      "Cam kết: hệ thống chỉ dùng thông tin khách hàng/nhân viên cho mục đích quản lý kho, chăm sóc khách hàng và vận hành dịch vụ.",
      "Cam kết: không bán hoặc chia sẻ dữ liệu cá nhân cho bên thứ ba nếu không có cơ sở pháp lý hoặc sự đồng ý rõ ràng của bạn.",
      "Quyền của người dùng/khách hàng: có quyền yêu cầu xem, chỉnh sửa hoặc cập nhật thông tin cá nhân; yêu cầu xóa thông tin khi không còn sử dụng dịch vụ (trong giới hạn pháp luật cho phép và nghĩa vụ lưu trữ kế toán).",
    ],
    binding:
      'Bằng việc tiếp tục sử dụng hệ thống, bạn đồng ý cho phép hệ thống xử lý thông tin cá nhân của bạn cho mục đích quản lý kho, chăm sóc khách hàng theo đúng phạm vi đã nêu, phù hợp Luật An ninh mạng 2018 (LU01) và Luật Bảo vệ quyền lợi người tiêu dùng (LU02).',
    legal: [
      {
        ma: "LU01",
        ten: "Luật An ninh mạng 2018 – bảo vệ dữ liệu cá nhân trên môi trường mạng.",
        link: "https://datafiles.chinhphu.vn/cpp/files/vbpq/2022/07/24-2018-qh14..pdf",
      },
      {
        ma: "LU02",
        ten: "Luật Bảo vệ quyền lợi người tiêu dùng – bảo vệ thông tin và quyền của khách hàng.",
        link: "https://datafiles.chinhphu.vn/cpp/files/vbpq/2023/7/luat19_2023.pdf",
      },
    ],
  },
  {
    title: "3. Chứng từ, hóa đơn & báo cáo (LU04 + LU05 + LU03)",
    bullets: [
      "Cam kết: phiếu nhập, phiếu xuất, hóa đơn và các chứng từ liên quan được lưu trữ đủ lâu theo quy định của Luật Kế toán; một số chức năng chỉ cho phép “khóa” hoặc “xóa mềm” để vẫn bảo đảm khả năng tra cứu.",
      "Cam kết: số liệu doanh thu, thuế GTGT và các báo cáo được ghi nhận dựa trên dữ liệu chứng từ trên hệ thống, hỗ trợ lập báo cáo tài chính và báo cáo thuế.",
      "Nghĩa vụ của người dùng: không cố ý sửa, hủy hoặc tạo chứng từ giả nhằm trốn thuế hoặc gian lận sổ sách; mọi thao tác trên hệ thống đều có thể được ghi nhận và cung cấp cho cơ quan chức năng khi có yêu cầu hợp pháp.",
    ],
    binding:
      'Bằng việc sử dụng các chức năng nhập/xuất hàng và lập hóa đơn trên hệ thống, bạn đồng ý rằng dữ liệu chứng từ do bạn tạo ra có thể được lưu trữ, khóa, tra cứu và sử dụng để phục vụ nghĩa vụ kế toán – thuế của doanh nghiệp theo Luật Kế toán 2015 (LU04), Luật Thuế GTGT (LU05) và Luật Thương mại 2005 (LU03).',
    legal: [
      {
        ma: "LU04",
        ten: "Luật Kế toán 2015 – quy định về chứng từ, sổ sách, thời hạn lưu trữ.",
        link: "https://datafiles.chinhphu.vn/cpp/files/vbpq/2016/01/88.signed.pdf",
      },
      {
        ma: "LU05",
        ten: "Luật Thuế giá trị gia tăng – quy định về hóa đơn, thuế GTGT.",
        link: "https://datafiles.chinhphu.vn/cpp/files/vbpq/2025/01/luat48.pdf",
      },
      {
        ma: "LU03",
        ten: "Luật Thương mại 2005 – hợp đồng mua bán hàng hóa, cung ứng dịch vụ.",
        link: "https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Ffiles.thuvienphapluat.vn%2Fuploads%2FFileLargeTemp%2F2005%2F6%2F14%2F36_2005_QH11_2633.doc%3Fvv%3D115500&wdOrigin=BROWSELINK",
      },
    ],
  },
];

export default function RegisterTermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#f2f4fb] via-[#e6ebf7] to-[#dbe1f0] text-[#3d4766]">
      <div className="w-full max-w-3xl bg-[#eef1f8]/90 backdrop-blur-xl rounded-[28px] shadow-[24px_24px_48px_-28px_rgba(79,90,119,0.4),-18px_-18px_36px_rgba(255,255,255,0.92)] border border-white/60 p-6 md:p-8 space-y-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-[#5f73c7] hover:text-[#4c61bc] font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại đăng ký
        </button>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white shadow-[8px_8px_20px_rgba(146,163,184,0.35),-8px_-8px_20px_rgba(255,255,255,0.95)] flex items-center justify-center text-[#6b7aa6]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-[#3d4766]">
              Điều khoản sử dụng &amp; Thông tin pháp lý
            </h1>
            <p className="text-sm text-[#6b7aa6]">
              Tóm tắt nhanh các cam kết của hệ thống và cơ sở pháp lý tương ứng cho từng nhóm chức năng.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#4f5d82] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Điều khoản áp dụng cho việc đăng ký và sử dụng hệ thống
          </h2>
          <div className="space-y-3 text-sm">
            {SECTIONS.map((s) => (
              <div
                key={s.title}
                className="border border-[#d9e0f3] rounded-2xl p-4 bg-white/70 shadow-[10px_10px_24px_rgba(146,163,184,0.18),-10px_-10px_24px_rgba(255,255,255,0.95)] space-y-2"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#5f73c7]" />
                  <p className="font-semibold text-[#3d4766]">{s.title}</p>
                </div>
                <ul className="list-disc list-inside text-xs text-[#556286] space-y-1">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                <div className="text-[11px] text-[#4f5d82] bg-[#f0f3fb] border border-[#dbe2f5] rounded-lg px-3 py-2 italic">
                  {s.binding}
                </div>
                <div className="border-t border-[#dfe5f5] pt-2 mt-2">
                  <p className="text-[11px] text-[#6b7aa6] mb-1 flex items-center gap-1">
                    Cơ sở pháp lý liên quan:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {s.legal.map((law) => (
                      <a
                        key={law.ma}
                        href={law.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-[#eef2fb] text-[#4254b5] px-2.5 py-1 text-[11px] hover:bg-[#e0e7ff]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="font-medium">{law.ma}</span>
                        <span className="hidden sm:inline">– {law.ten}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2 text-xs text-[#4f5d82] bg-[#f0f3fb] border border-[#dbe2f5] rounded-2xl p-4 shadow-[8px_8px_18px_rgba(146,163,184,0.18),-8px_-8px_18px_rgba(255,255,255,0.92)]">
          <p className="font-semibold">Khi bấm “Đăng ký”:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Bạn xác nhận đã đọc và đồng ý với nội dung tóm tắt ở trên.</li>
            <li>
              Bạn có thể xem toàn văn luật tại các đường dẫn chính thức của
              Chính phủ nếu cần tham chiếu chi tiết.
            </li>
            <li>
              Hệ thống có thể được cập nhật bổ sung điều khoản mới và sẽ thông
              báo khi cần bạn chấp nhận lại.
            </li>
          </ul>
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-[#7fa5ff] to-[#5f73c7] text-white text-sm font-medium shadow-[8px_8px_16px_rgba(111,130,179,0.25),-6px_-6px_14px_rgba(255,255,255,0.95)] hover:brightness-105"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại đăng ký
          </button>
        </div>
      </div>
    </div>
  );
}


