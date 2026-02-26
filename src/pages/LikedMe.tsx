import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLikedMe, likeUser } from "@/services/api";
import { useSelector } from "react-redux";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import UserAvatar from "@/components/UserAvatar";
import MatchModal from "@/components/MatchModal";
import { HeartHandshake, Heart, HeartOff } from "lucide-react";

interface LikedUser {
  _id: string;
  name: string;
  age: number;
  gender: string;
  bio?: string;
  avatar?: string;
}

const LikedMePage = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(
    (state: any) => state.auth?.login?.currentUser,
  );
  const currentUserId: string | null = currentUser?._id ?? null;
  const [likedMe, setLikedMe] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchOpen, setMatchOpen] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    getLikedMe()
      .then((res: any) => setLikedMe(res?.result || []))
      .catch(() =>
        toast({ title: "Lỗi tải danh sách", variant: "destructive" }),
      )
      .finally(() => setLoading(false));
  }, [currentUserId]);

  const handleLike = async (targetId: string) => {
    try {
      setLikedIds((prev) => new Set(prev).add(targetId));
      const res: any = await likeUser(targetId);
      if (res?.isMatch) setMatchOpen(true);
      toast({ title: res?.isMatch ? "It's a Match! 💖" : "Đã tym! ❤️" });
    } catch (err: any) {
      setLikedIds((prev) => {
        const s = new Set(prev);
        s.delete(targetId);
        return s;
      });
      toast({
        title: err?.response?.data?.message || "Thất bại",
        variant: "destructive",
      });
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!currentUserId)
    return (
      <EmptyState
        icon={HeartOff}
        title="Chưa đăng nhập"
        description="Đăng nhập để xem ai đã tym bạn"
      />
    );
  if (!likedMe.length)
    return (
      <EmptyState
        icon={HeartHandshake}
        title="Chưa có ai tym bạn"
        description="Hãy chờ thêm nhé, hoặc tym người khác trước! 💪"
      />
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">
          Người Đã Tym Bạn 💝
        </h1>
        <p className="text-muted-foreground">
          Họ đang chờ bạn tym lại — tạo Match ngay!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {likedMe.map((user, i) => {
          const liked = likedIds.has(user._id);
          return (
            <div
              key={user._id}
              className="group animate-fade-in rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-xl transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start gap-4">
                <UserAvatar name={user.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-lg font-bold text-foreground truncate cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/profile/${user._id}`)}
                  >
                    {user.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user.age} ·{" "}
                    {user.gender === "male"
                      ? "Nam"
                      : user.gender === "female"
                        ? "Nữ"
                        : "Khác"}
                  </p>
                </div>
              </div>
              {user.bio && (
                <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
                  {user.bio}
                </p>
              )}
              <button
                onClick={() => handleLike(user._id)}
                disabled={liked}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-semibold transition-all duration-200 ${
                  liked
                    ? "bg-primary/10 text-primary"
                    : "gradient-primary text-primary-foreground hover-scale shadow-md"
                } disabled:opacity-60`}
              >
                <Heart
                  className={`h-4 w-4 ${liked ? "animate-heart-burst" : ""}`}
                  fill={liked ? "currentColor" : "none"}
                />
                {liked ? "Đã tym lại ✓" : "Tym lại 💖"}
              </button>
            </div>
          );
        })}
      </div>

      <MatchModal open={matchOpen} onClose={() => setMatchOpen(false)} />
    </div>
  );
};

export default LikedMePage;
