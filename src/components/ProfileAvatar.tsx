'use client';

export default function ProfileAvatar({ src }: { src: string }) {
    async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/upload/avatar', { method: 'POST', body: form });
        const body = await res.json();
        if (!res.ok) return alert(body.error || 'Upload thất bại');
        const img = document.getElementById('profile-avatar') as HTMLImageElement | null;
        if (img) img.src = body.url + '?t=' + Date.now();
        window.dispatchEvent(new CustomEvent('app:avatar-updated', { detail: { url: body.url } }));
    }
    return (
        <div className="space-y-3">
            <label className="block text-sm text-gray-500">Ảnh đại diện</label>
            <div className="flex items-center gap-4">
                <img id="profile-avatar" src={src} alt="avatar" className="h-20 w-20 rounded-full object-cover border" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/window.svg'; }} />
                <input type="file" accept="image/*" onChange={onChange} className="text-sm" />
            </div>
        </div>
    );
}


