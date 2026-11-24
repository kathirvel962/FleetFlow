import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
    ClipboardCheck, Camera, FileText, Upload, Trash2, Eye, X, CheckCircle, AlertCircle
} from "lucide-react";
import { deliveryService } from "../services/deliveryService";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
    PageHeader, Card, CardHeader, Table, StatusBadge, Select, Input, Button, Modal,
    ErrorState, EmptyState, SkeletonTable, formatDate, formatDateTime,
} from "../components/common/index";

function PodForm({ delivery, onSubmit, loading }) {
    const [form, setForm] = useState({
        recipientName: "",
        notes: "",
        photo: "",
        deliveredAt: new Date().toISOString().slice(0, 16),
    });
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);
    const toast = useToast();

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
        setCameraError("");
    };

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startCamera = async () => {
        setCameraError("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            streamRef.current = stream;
            setIsCameraOpen(true);
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.error("Video play error:", e));
                }
            }, 100);
        } catch (err) {
            console.error("Camera access error:", err);
            setCameraError("Unable to access camera. Please allow camera permissions or upload a photo file instead.");
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        const maxDim = 1200;
        let width = video.videoWidth || 640;
        let height = video.videoHeight || 480;

        if (width > maxDim || height > maxDim) {
            if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
            } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
            }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        set("photo", dataUrl);
        stopCamera();
        toast.success("Delivery photo captured!");
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file (JPEG, PNG, etc.)");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const maxDim = 1200;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
                set("photo", compressedDataUrl);
                toast.success("Photo attached successfully!");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.photo) {
            toast.error("Photo is required! Please capture or upload a photo of the delivered package.");
            return;
        }
        onSubmit(delivery._id, form);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-800">{delivery.deliveryNumber}</p>
                <p className="text-blue-600">{delivery.customerName}</p>
                <p className="text-xs text-blue-500">{delivery.deliveryAddress}</p>
            </div>

            <Input
                label="Recipient Name *"
                value={form.recipientName}
                onChange={e => set("recipientName", e.target.value)}
                required
                placeholder="Name of person who received the package"
            />

            {/* Photo Capture Section */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-blue-600" />
                        Package Photo (Proof of Delivery) <span className="text-red-500">*</span>
                    </span>
                    {form.photo && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Photo Captured
                        </span>
                    )}
                </label>

                {form.photo ? (
                    <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/60 bg-slate-900 group shadow-sm">
                        <img
                            src={form.photo}
                            alt="Proof of Delivery"
                            className="w-full h-52 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end justify-between p-3">
                            <span className="text-xs text-white bg-emerald-600/90 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Photo Attached
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { set("photo", ""); startCamera(); }}
                                    className="px-2.5 py-1 text-xs bg-white text-slate-800 hover:bg-slate-100 rounded font-medium shadow transition-colors flex items-center gap-1"
                                >
                                    <Camera className="w-3.5 h-3.5 text-blue-600" /> Retake
                                </button>
                                <button
                                    type="button"
                                    onClick={() => set("photo", "")}
                                    className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors flex items-center gap-1"
                                    title="Remove photo"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Remove
                                </button>
                            </div>
                        </div>
                    </div>
                ) : isCameraOpen ? (
                    <div className="rounded-xl overflow-hidden border-2 border-blue-500 bg-black relative shadow-lg">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-64 object-cover"
                        />
                        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={capturePhoto}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm shadow-xl flex items-center gap-2 transition-all active:scale-95"
                            >
                                <Camera className="w-4 h-4" /> Snap Photo
                            </button>
                            <button
                                type="button"
                                onClick={stopCamera}
                                className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl bg-slate-50 transition-colors text-center space-y-3">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <Camera className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Take a photo of the package</p>
                            <p className="text-xs text-slate-500 mt-0.5">Capture with camera or upload image from device</p>
                        </div>

                        {cameraError && (
                            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                {cameraError}
                            </p>
                        )}

                        <div className="flex items-center justify-center gap-2 pt-1">
                            <Button
                                type="button"
                                size="sm"
                                variant="primary"
                                onClick={startCamera}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Camera className="w-4 h-4 mr-1.5" /> Take Photo
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-4 h-4 mr-1.5" /> Upload Photo
                            </Button>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                )}
            </div>

            <Input
                label="Delivered At"
                type="datetime-local"
                value={form.deliveredAt}
                onChange={e => set("deliveredAt", e.target.value)}
            />

            <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Notes</label>
                <textarea
                    value={form.notes}
                    onChange={e => set("notes", e.target.value)}
                    placeholder="Any special notes about the delivery…"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
                />
            </div>

            <Button type="submit" loading={loading} className="w-full">
                <ClipboardCheck className="w-4 h-4 mr-1.5" />
                Submit Proof of Delivery
            </Button>
        </form>
    );
}

function ProofOfDelivery() {
    const location = useLocation();
    const [deliveries, setDeliveries] = useState([]);
    const [completedDeliveries, setCompletedDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(location.state?.delivery || null);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedLoading, setCompletedLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const { hasRole } = useAuth();
    const toast = useToast();

    useEffect(() => {
        if (location.state?.delivery) {
            setSelectedDelivery(location.state.delivery);
        }
    }, [location.state]);

    const fetchDeliveries = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch deliveries that can accept POD
            const [transitRes, outRes, pickedRes] = await Promise.all([
                deliveryService.getDeliveries({ status: "IN_TRANSIT", limit: 50 }),
                deliveryService.getDeliveries({ status: "OUT_FOR_DELIVERY", limit: 50 }),
                deliveryService.getDeliveries({ status: "PICKED_UP", limit: 50 }),
            ]);
            let combined = [
                ...(outRes.data.data || []),
                ...(transitRes.data.data || []),
                ...(pickedRes.data.data || [])
            ];
            if (location.state?.delivery && !combined.some(d => d._id === location.state.delivery._id)) {
                combined = [location.state.delivery, ...combined];
            }
            setDeliveries(combined);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load deliveries");
        } finally {
            setLoading(false);
        }
    }, [location.state]);

    const fetchCompleted = useCallback(async () => {
        setCompletedLoading(true);
        try {
            const res = await deliveryService.getDeliveries({ status: "DELIVERED", limit: 20 });
            setCompletedDeliveries(res.data.data);
        } catch {
            // Non-critical
        } finally {
            setCompletedLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDeliveries();
        fetchCompleted();
    }, [fetchDeliveries, fetchCompleted]);

    const handleSubmitPod = async (deliveryId, data) => {
        setSubmitting(true);
        try {
            await deliveryService.submitProofOfDelivery(deliveryId, data);
            toast.success("Proof of delivery submitted successfully!");
            setSelectedDelivery(null);
            fetchDeliveries();
            fetchCompleted();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit proof of delivery");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Proof of Delivery"
                subtitle="Submit and view delivery confirmations"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending POD */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader
                            title="Pending Confirmation"
                            subtitle="Deliveries awaiting proof of delivery"
                        />
                        {loading ? (
                            <SkeletonTable rows={4} cols={3} />
                        ) : error ? (
                            <ErrorState message={error} onRetry={fetchDeliveries} />
                        ) : deliveries.length === 0 ? (
                            <EmptyState
                                title="No pending deliveries"
                                description="All deliveries are up to date."
                                icon={ClipboardCheck}
                            />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {deliveries.map((d) => (
                                    <div
                                        key={d._id}
                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${selectedDelivery?._id === d._id ? "bg-blue-50 border-l-4 border-blue-500" : ""}`}
                                        onClick={() => setSelectedDelivery(d)}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                                                        {d.deliveryNumber}
                                                    </span>
                                                    <StatusBadge status={d.status} />
                                                </div>
                                                <p className="text-sm font-medium text-slate-800">{d.customerName}</p>
                                                <p className="text-xs text-slate-500 truncate">{d.deliveryAddress}</p>
                                                {d.assignedDriver && (
                                                    <p className="text-xs text-slate-400 mt-0.5">Driver: {d.assignedDriver.name}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedDelivery(d); }}
                                                className="shrink-0 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Submit POD
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* POD Form or completed list */}
                <div className="space-y-4">
                    {selectedDelivery ? (
                        <Card>
                            <CardHeader
                                title="Submit Proof of Delivery"
                                actions={
                                    <button
                                        onClick={() => setSelectedDelivery(null)}
                                        className="text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        Cancel
                                    </button>
                                }
                            />
                            <div className="p-5">
                                <PodForm
                                    delivery={selectedDelivery}
                                    onSubmit={handleSubmitPod}
                                    loading={submitting}
                                />
                            </div>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader
                                title="Recently Completed"
                                subtitle="Last 20 delivered"
                                actions={
                                    <span className="text-xs text-slate-400">{completedDeliveries.length} deliveries</span>
                                }
                            />
                            {completedLoading ? (
                                <SkeletonTable rows={4} cols={3} />
                            ) : completedDeliveries.length === 0 ? (
                                <EmptyState title="No completed deliveries" icon={ClipboardCheck} />
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {completedDeliveries.map((d) => (
                                                    <div key={d._id} className="px-4 py-3 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            {d.proofOfDelivery?.photo ? (
                                                                <img
                                                                    src={d.proofOfDelivery.photo}
                                                                    alt="Proof"
                                                                    onClick={() => setPreviewImage(d.proofOfDelivery.photo)}
                                                                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 hover:ring-2 hover:ring-blue-400 transition-all shadow-sm"
                                                                    title="Click to view full photo"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                                                                    <FileText className="w-5 h-5" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="font-mono text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold">
                                                                        {d.deliveryNumber}
                                                                    </span>
                                                                    <StatusBadge status={d.status} />
                                                                </div>
                                                                <p className="text-sm font-medium text-slate-700">{d.customerName}</p>
                                                                {d.proofOfDelivery?.deliveredAt && (
                                                                    <p className="text-xs text-slate-400">
                                                                        {formatDateTime(d.proofOfDelivery.deliveredAt)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {d.proofOfDelivery?.recipientName && (
                                                            <div className="text-right shrink-0">
                                                                <p className="text-xs text-slate-500">Received by</p>
                                                                <p className="text-xs font-medium text-slate-700">{d.proofOfDelivery.recipientName}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                    ))}
                                                </div>
                            )}
                                            </Card>
                    )}
                                        </div>
            </div>

            {/* Photo Lightbox Preview Modal */}
                            <Modal
                                open={!!previewImage}
                                onClose={() => setPreviewImage(null)}
                                title="Proof of Delivery Photo"
                                maxWidth="max-w-xl"
                            >
                                {previewImage && (
                                    <div className="space-y-3">
                                        <img
                                            src={previewImage}
                                            alt="Full Proof of Delivery"
                                            className="w-full max-h-[70vh] object-contain rounded-lg bg-black/5"
                                        />
                                        <div className="flex justify-end">
                                            <Button variant="secondary" size="sm" onClick={() => setPreviewImage(null)}>
                                                Close
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Modal>
                        </div>
                    );
}

                    export default ProofOfDelivery;
