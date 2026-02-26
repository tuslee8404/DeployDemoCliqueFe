import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { createPost, getUploadSignature } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { PenSquare, ImagePlus, X, Loader2 } from "lucide-react";

const CreatePostPage = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(
    (state: any) => state.auth?.login?.currentUser,
  );
  const currentUserId: string | null = currentUser?._id ?? null;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  // ─── Upload ảnh lên Cloudinary ────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);

    try {
      const sigRes: any = await getUploadSignature();
      // axiosInstance tự unwrap response.data nên sigRes chính là dữ liệu,
      // hoặc nếu backend bọc trong { result: ... } thì lấy từ sigRes.result
      const { signature, timestamp, cloudname, apikey } =
        sigRes.result || sigRes;

      // 👇 Thêm dòng này để xem signature trả về có đúng không
      console.log("Signature data:", {
        signature,
        timestamp,
        cloudname,
        apikey,
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apikey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudname}/image/upload`,
        { method: "POST", body: formData },
      );

      // 👇 Thêm dòng này để xem Cloudinary trả về lỗi gì
      const uploadData = await uploadRes.json();
      console.log("Cloudinary response:", uploadData);

      if (!uploadRes.ok)
        throw new Error(uploadData?.error?.message || "Upload thất bại");

      setImageUrl(uploadData.secure_url);
      toast({ title: "Tải ảnh thành công! ✅" });
    } catch (err: any) {
      console.error("Upload error:", err);
      setPreviewUrl("");
      setImageUrl("");
      toast({
        title: "Tải ảnh thất bại",
        description: err?.message, // 👈 hiện message lỗi cụ thể
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Submit post ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId) {
      toast({
        title: "Cần đăng nhập!",
        description: "Vui lòng đăng nhập để đăng bài",
      });
      navigate("/login");
      return;
    }
    if (!content && !imageUrl) {
      toast({
        title: "Bài viết cần có nội dung hoặc ảnh!",
        variant: "destructive",
      });
      return;
    }
    if (uploading) {
      toast({
        title: "Ảnh đang tải lên, vui lòng chờ...",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createPost({
        content: content || undefined,
        image: imageUrl || undefined,
      });
      toast({ title: "Đăng bài thành công! 📸" });
      navigate("/posts");
    } catch (err: any) {
      toast({
        title: "Đăng bài thất bại",
        description: err?.response?.data?.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          {/* Header */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="gradient-primary rounded-2xl p-3">
              <PenSquare className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Tạo bài viết</h1>
            <p className="text-sm text-muted-foreground">
              Chia sẻ khoảnh khắc của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Caption */}
            <textarea
              className={`${inputClass} min-h-[120px] resize-none`}
              placeholder="Bạn đang nghĩ gì?..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            {/* ─── Image Upload Area ─── */}
            {!previewUrl ? (
              // Chưa có ảnh → hiển thị vùng chọn file
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all py-8 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ImagePlus size={28} />
                <span className="text-sm font-medium">Thêm ảnh</span>
                <span className="text-xs">JPG, PNG, WEBP...</span>
              </button>
            ) : (
              // Đã có ảnh → hiển thị preview
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-72 object-cover"
                />

                {/* Overlay khi đang upload */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={28} className="text-white animate-spin" />
                    <span className="text-white text-sm font-medium">
                      Đang tải lên...
                    </span>
                  </div>
                )}

                {/* Nút xóa ảnh */}
                {!uploading && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Badge upload thành công */}
                {!uploading && imageUrl && (
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    ✅ Đã tải lên
                  </div>
                )}
              </div>
            )}

            {/* Input file ẩn */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || uploading}
              className="mt-2 w-full gradient-primary text-primary-foreground rounded-xl py-3 font-semibold hover-scale shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Đang đăng...
                </>
              ) : uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Ảnh đang tải...
                </>
              ) : (
                "Đăng bài 🚀"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
