import { getSessionFromCookies } from '@/lib/session';
import ProfileAvatar from '@/components/ProfileAvatar';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
    const session = await getSessionFromCookies();
    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#faf8f6] to-[#f5ebe0] flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#e8ddd3]">
                    <p className="text-[#6b4a4a]">Vui lòng đăng nhập.</p>
                </div>
            </div>
        );
    }

    const avatar = `/uploads/avatars/${session.maTk}.png`;
    const roleDisplayName = session.vaiTro === 'admin' ? 'Quản trị viên' : 'Nhân viên';
    const roleColor = session.vaiTro === 'admin' ? '#d47b8a' : '#b8956f';

    return (
        <div className="min-h-screen bg-[#faf8f6] py-10 px-4">
            <div className="mx-auto w-full max-w-3xl">
                <h1 className="text-2xl font-semibold text-[#6b4a4a] mb-4">Hồ sơ cá nhân</h1>

                <div className="rounded-2xl border border-[#e8ddd3] bg-white p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <ProfileAvatar src={avatar} />

                        <div className="flex-1 space-y-3">
                            <div>
                                <div className="text-sm text-[#a68476]">Tên đăng nhập</div>
                                <div className="text-lg font-semibold text-[#6b4a4a]">{session.tenDangNhap}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield size={16} color={roleColor} />
                                <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: roleColor }}>
                                    {roleDisplayName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}