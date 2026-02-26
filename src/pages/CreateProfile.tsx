import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendRegisterOTP, verifyRegisterOTP } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Mail } from "lucide-react";

type Step = "form" | "otp";

const CreateProfile = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "male",
    bio: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const inputClass =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  // ── Bước 1: Gửi OTP ────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast({ title: "Mật khẩu không khớp!", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await sendRegisterOTP({
        ...form,
        age: Number(form.age),
      });
      toast({
        title: "OTP đã được gửi!",
        description: `Kiểm tra email ${form.email}`,
      });
      setStep("otp");
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.message || "Gửi OTP thất bại",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Bước 2: Xác thực OTP → Tạo tài khoản ─────────────────
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyRegisterOTP({
        ...form,
        age: Number(form.age),
        otp,
      });
      toast({
        title: "Đăng ký thành công! 🎉",
        description: "Đang chuyển đến trang đăng nhập...",
      });
      navigate("/login");
    } catch (err: any) {
      toast({
        title: "Xác thực thất bại",
        description:
          err?.response?.data?.message || "OTP không hợp lệ hoặc đã hết hạn",
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
              {step === "form" ? (
                <UserPlus className="h-7 w-7 text-primary-foreground" />
              ) : (
                <Mail className="h-7 w-7 text-primary-foreground" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {step === "form" ? "Tạo Tài Khoản" : "Xác Thực Email"}
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              {step === "form"
                ? "Tham gia Dating App và bắt đầu kết nối"
                : `Nhập mã OTP 6 số đã gửi tới ${form.email}`}
            </p>
          </div>

          {/* ── Step 1: Form thông tin ── */}
          {step === "form" && (
            <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
              <input
                className={inputClass}
                placeholder="Tên của bạn"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className={inputClass}
                type="number"
                placeholder="Tuổi (≥ 18)"
                min={18}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                required
              />
              <select
                className={inputClass}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
              <textarea
                className={`${inputClass} min-h-[80px] resize-none`}
                placeholder="Mô tả bản thân..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
              <input
                className={inputClass}
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                className={inputClass}
                type="password"
                placeholder="Mật khẩu (≥ 6 ký tự, có hoa, số, ký hiệu)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <input
                className={inputClass}
                type="password"
                placeholder="Xác nhận mật khẩu"
                value={form.confirm_password}
                onChange={(e) =>
                  setForm({ ...form, confirm_password: e.target.value })
                }
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full gradient-primary text-primary-foreground rounded-xl py-3 font-semibold hover-scale shadow-lg disabled:opacity-50 transition-all"
              >
                {loading ? "Đang gửi OTP..." : "Tiếp tục →"}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                Đã có tài khoản?{" "}
                <span
                  onClick={() => navigate("/login")}
                  className="text-primary cursor-pointer hover:underline"
                >
                  Đăng nhập
                </span>
              </p>
            </form>
          )}

          {/* ── Step 2: Nhập OTP ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
              <input
                className={`${inputClass} text-center text-2xl font-bold tracking-[0.5em]`}
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
              <p className="text-xs text-muted-foreground text-center">
                ⏰ OTP có hiệu lực trong 5 phút
              </p>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full gradient-primary text-primary-foreground rounded-xl py-3 font-semibold hover-scale shadow-lg disabled:opacity-50 transition-all"
              >
                {loading ? "Đang xác thực..." : "Xác nhận & Tạo tài khoản"}
              </button>
              <button
                type="button"
                onClick={() => setStep("form")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Quay lại chỉnh sửa thông tin
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
