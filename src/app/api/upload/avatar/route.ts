import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/session';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session = await getSessionFromCookies();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const form = await req.formData();
        const file = form.get('file');
        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'Thiếu file' }, { status: 400 });
        }
        const f = file as File;
        // Basic validation: mime and size (<= 2MB)
        const mime = f.type || '';
        if (!/^image\/(png|jpe?g|webp|gif)$/i.test(mime)) {
            return NextResponse.json({ error: 'Chỉ chấp nhận ảnh (png, jpg, webp, gif)' }, { status: 400 });
        }
        if (f.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'Kích thước ảnh tối đa 2MB' }, { status: 400 });
        }
        const arrayBuffer = await f.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        await fs.mkdir(dir, { recursive: true });
        const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
        const target = path.join(dir, `${session.maTk}.${ext}`);
        await fs.writeFile(target, buffer);

        const urlPath = `/uploads/avatars/${session.maTk}.${ext}`;
        return NextResponse.json({ url: urlPath });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Upload error' }, { status: 500 });
    }
}


