import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { getCroppedImageBlob } from "../lib/cropImage";

export default function AvatarCropModal({
  imageSrc,
  onCancel,
  onConfirm,
}: {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      onConfirm(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    } catch {
      setError("Could not process that image. Try a different photo.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded bg-white p-4">
        <h2 className="font-medium">Crop your photo</h2>

        <div className="relative h-64 w-full overflow-hidden rounded bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <label className="flex flex-col gap-1 text-sm">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || !croppedAreaPixels}
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {isProcessing ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
