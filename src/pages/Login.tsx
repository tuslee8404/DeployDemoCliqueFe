import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/redux/authSlice";
import { toast } from "@/hooks/use-toast";
import { LogIn } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  const isLoading = useSelector((state: any) => state.auth?.login?.isLoading);
  const error = useSelector((state: any) => state.auth?.login?.error);
  const errorMessage = useSelector(
    (state: any) => state.auth?.login?.errorMessage,
  );
  const [form, setForm] = useState({ email: "", password: "" });

  const inputClass =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      toast({
        title: "Đăng nhập thành công! 👋",
        description: `Chào ${result.payload.user?.name ?? ""}`,
      });
      navigate("/");
    } else {
      toast({
        title: "Đăng nhập thất bại",
        description: (result.payload as string) || "Sai email hoặc mật khẩu",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="gradient-primary rounded-2xl p-3">
              <LogIn className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Đăng Nhập</h1>
            <p className="text-sm text-muted-foreground">
              Chào mừng trở lại 💖
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              placeholder="Mật khẩu"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full gradient-primary text-primary-foreground rounded-xl py-3 font-semibold hover-scale shadow-lg disabled:opacity-50 transition-all"
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <span
                onClick={() => navigate("/create-profile")}
                className="text-primary cursor-pointer hover:underline"
              >
                Đăng ký
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
