"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

type FaceSignModalProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => Promise<void> | void;
};

export default function FaceSignModal({ open, onClose, onSuccess }: FaceSignModalProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const referenceDescriptorRef = useRef<Float32Array | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [status, setStatus] = useState<string>("Đang tải mô hình AI...");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadModelsAndStart() {
            try {
                setLoading(true);
                const MODEL_URL = "/models";
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
                if (cancelled) return;
                setModelsLoaded(true);
                setStatus("Sẵn sàng quét khuôn mặt");
                startCamera();
            } catch (e) {
                console.error(e);
                if (!cancelled) setStatus("Không tải được mô hình AI. Vui lòng kiểm tra thư mục /models.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        if (open) {
            if (!modelsLoaded) {
                loadModelsAndStart();
            } else {
                startCamera();
                setStatus("Sẵn sàng quét khuôn mặt");
            }
        }

        return () => {
            cancelled = true;
            stopCamera();
        };
    }, [open, modelsLoaded]);

    async function startCamera() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setStatus("Trình duyệt không hỗ trợ camera.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (e) {
            console.error(e);
            setStatus("Không mở được camera. Vui lòng kiểm tra quyền truy cập.");
        }
    }

    function stopCamera() {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }

    async function ensureReferenceDescriptor() {
        if (referenceDescriptorRef.current) return referenceDescriptorRef.current;
        const referenceImageUrl = "/face-auth/owner.jpg";
        const img = await faceapi.fetchImage(referenceImageUrl);
        const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
        if (!detection) {
            throw new Error("Không tìm thấy khuôn mặt trong ảnh tham chiếu.");
        }
        referenceDescriptorRef.current = detection.descriptor;
        return detection.descriptor;
    }

    async function handleScan() {
        if (!modelsLoaded) return;
        if (!videoRef.current) return;
        try {
            setLoading(true);
            setStatus("Đang xác thực khuôn mặt...");
            const referenceDescriptor = await ensureReferenceDescriptor();
            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
            if (!detection) {
                setStatus("Không tìm thấy khuôn mặt. Vui lòng thử lại.");
                return;
            }
            const distance = faceapi.euclideanDistance(referenceDescriptor, detection.descriptor);
            const threshold = 0.45;
            if (distance < threshold) {
                setStatus("Khuôn mặt trùng khớp. Đang ký hóa đơn...");
                await onSuccess();
                stopCamera();
                onClose();
            } else {
                setStatus("Khuôn mặt không khớp với người được ủy quyền.");
            }
        } catch (e: any) {
            console.error(e);
            setStatus(e.message || "Có lỗi xảy ra khi xác thực khuôn mặt.");
        } finally {
            setLoading(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold mb-2 text-gray-800 text-center">Xác thực khuôn mặt trước khi ký số</h2>
                <p className="text-xs text-gray-600 mb-4 text-center">Chỉ người được ủy quyền mới có thể thực hiện ký số hóa đơn.</p>
                <div className="mb-4 flex flex-col items-center">
                    <div className="relative w-72 h-52 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <p className="mt-3 text-xs text-gray-700 text-center min-h-[1.5rem]">{status}</p>
                </div>
                <div className="flex justify-center gap-3 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleScan}
                        disabled={loading || !modelsLoaded}
                        className={`px-4 py-2 text-xs rounded-lg font-semibold shadow-md inline-flex items-center justify-center min-w-[140px] ${
                            loading || !modelsLoaded
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                    >
                        {loading ? "Đang xử lý..." : "Quét khuôn mặt để ký"}
                    </button>
                </div>
            </div>
        </div>
    );
}
