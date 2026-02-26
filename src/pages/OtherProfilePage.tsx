import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPosts, getProfile, likeUser } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Grid3X3,
  Tag,
  MoreHorizontal,
  Heart,
  MessageCircle,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────
interface PostUser {
  _id: string;
  name: string;
  avatar?: string;
}

interface Post {
  _id: string;
  user: PostUser;
  content?: string;
  image?: string;
  createdAt: string;
}

interface Profile {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  age?: number;
  gender?: string;
}

// ─── Helpers ───────────────────────────────────────────────────
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
};

// ─── Avatar ────────────────────────────────────────────────────
const IGAvatar = ({
  name,
  src,
  size = 77,
  onClick,
}: {
  name: string;
  src?: string;
  size?: number;
  onClick?: () => void;
}) => {
  const initials = name?.charAt(0)?.toUpperCase() || "?";
  return (
    <div
      onClick={onClick}
      className={`rounded-full shrink-0 bg-neutral-200 dark:bg-neutral-700 overflow-hidden border border-neutral-200 dark:border-neutral-700 ${onClick ? "cursor-pointer" : ""}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
          <span
            className="font-light text-neutral-500 dark:text-neutral-400"
            style={{ fontSize: size * 0.4 }}
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Post Modal ────────────────────────────────────────────────
const PostModal = ({
  post,
  profile,
  onClose,
}: {
  post: Post;
  profile: Profile | null;
  onClose: () => void;
}) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const displayName = profile?.name || post.user?.name || "?";
  const displayAvatar = profile?.avatar || post.user?.avatar;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors z-10"
        onClick={onClose}
      >
        <X size={28} />
      </button>

      <div
        className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden flex shadow-2xl"
        style={{
          width: "60vw",
          height: "60vh",
          animation: "scaleIn 0.2s ease both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ảnh */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
          {post.image ? (
            <img
              src={post.image}
              alt={post.content || "Post"}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-neutral-50 dark:bg-neutral-800 flex flex-col items-center justify-center gap-4 p-10">
              <IGAvatar name={displayName} src={displayAvatar} size={48} />
              <p className="text-base text-neutral-700 dark:text-neutral-200 leading-relaxed text-center max-w-xs">
                {post.content}
              </p>
              <p className="text-xs text-neutral-400">
                {timeAgo(post.createdAt)}
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="w-[260px] shrink-0 flex flex-col border-l border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <IGAvatar name={displayName} src={displayAvatar} size={32} />
            <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
              {displayName}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {post.content && (
              <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                <span className="font-semibold mr-2">{displayName}</span>
                {post.content}
              </p>
            )}
          </div>

          <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs text-neutral-400 uppercase tracking-wide">
              {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── View Avatar Modal ─────────────────────────────────────────
const AvatarModal = ({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors z-10"
        onClick={onClose}
      >
        <X size={28} />
      </button>
      <div
        className="rounded-xl overflow-hidden bg-black shadow-2xl"
        style={{
          width: "60vw",
          height: "60vh",
          animation: "scaleIn 0.2s ease both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img src={url} alt="Avatar" className="w-full h-full object-contain" />
      </div>
    </div>
  );
};

// ─── Main: Other User Profile ──────────────────────────────────
const OtherProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "tagged">("posts");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewingAvatar, setViewingAvatar] = useState(false);

  // ─── Tym state ───────────────────────────────────────────────
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    setLoading(true);
    Promise.all([
      getProfile(id).catch(() => null),
      getPosts(id).catch(() => ({ result: [] })),
    ])
      .then(([profileRes, postsRes]: [any, any]) => {
        if (profileRes?.result) {
          setProfile(profileRes.result);
          // Cập nhật trạng thái đã tym từ backend gửi lên
          if (profileRes.result.isLikedByMe) {
            setLiked(true);
          }
        }
        setPosts(postsRes?.result || []);
      })
      .catch(() => toast({ title: "Lỗi tải dữ liệu", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!id || likeLoading) return;

    setLikeLoading(true);
    try {
      const res: any = await likeUser(id);

      // Nếu backend trả về isMatch: true → It's a Match!
      if (res?.result?.isMatch || res?.isMatch) {
        toast({
          title: "💖 It's a Match!",
          description: `Bạn và ${profile?.name} đã tym nhau!`,
        });
      } else {
        toast({ title: `Đã tym ${profile?.name} 💕` });
      }

      setLiked(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg === "Bạn đã tym người này rồi") {
        setLiked(true);
        toast({ title: "Bạn đã tym người này rồi", variant: "destructive" });
      } else {
        toast({ title: "Không thể tym lúc này", variant: "destructive" });
      }
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        Không tìm thấy người dùng
      </div>
    );

  return (
    <>
      <style>{`
        @keyframes igFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes heartPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.35); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .heart-pop { animation: heartPop 0.4s ease both; }
        .grid-cell:hover .grid-overlay { opacity: 1; }
      `}</style>

      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-[935px] mx-auto px-4 sm:px-8">
          {/* ══ PROFILE HEADER ══════════════════════════════════ */}
          <section
            className="pt-8 pb-6"
            style={{ animation: "igFadeUp 0.35s ease both" }}
          >
            <div className="flex items-start gap-8 sm:gap-20">
              {/* Avatar — chỉ xem, không đổi */}
              <IGAvatar
                name={profile.name}
                src={profile.avatar}
                size={86}
                onClick={
                  profile.avatar ? () => setViewingAvatar(true) : undefined
                }
              />

              <div className="flex-1 min-w-0 pt-1">
                {/* Row 1: tên + options */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <h1 className="text-xl font-light text-neutral-900 dark:text-white tracking-wide">
                    {profile.name?.toLowerCase().replace(/\s+/g, "_")}
                  </h1>
                  <button className="p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors rounded-full">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                {/* Row 2: nút TYM */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <button
                    onClick={handleLike}
                    disabled={liked || likeLoading}
                    className={`flex items-center gap-2 px-5 py-[7px] text-sm font-semibold rounded-lg transition-all ${
                      liked
                        ? "bg-red-50 dark:bg-red-950 text-red-500 border border-red-200 dark:border-red-800 cursor-default"
                        : "bg-red-500 hover:bg-red-600 active:scale-95 text-white shadow-sm"
                    }`}
                  >
                    <Heart
                      size={15}
                      className={`transition-all ${liked ? "fill-red-500 text-red-500 heart-pop" : "fill-white"} ${likeLoading ? "animate-pulse" : ""}`}
                    />
                    {liked
                      ? "Đã Thích"
                      : likeLoading
                        ? "Đang Thích..."
                        : "Thích"}
                  </button>

                  {/* Hiển thị nếu người kia đã thích mình (nhưng chưa match) */}
                  {(profile as any).hasLikedMe && !liked && (
                    <span className="text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-md">
                      Người này đã thích bạn
                    </span>
                  )}
                  {/* Hiển thị nếu đã Match (Cả 2 thích nhau) */}
                  {(profile as any).isMatch && (
                    <span className="text-xs font-medium bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 px-3 py-1.5 rounded-md">
                      💖 Đã Tương Hợp
                    </span>
                  )}
                </div>

                {/* Row 3: stats */}
                <div className="hidden sm:flex items-center gap-10 mb-3">
                  {[
                    { value: posts.length, label: "bài viết" },
                    { value: 0, label: "người theo dõi" },
                    { value: 0, label: "đang theo dõi" },
                  ].map(({ value, label }) => (
                    <div
                      key={label}
                      className="text-sm text-neutral-900 dark:text-white"
                    >
                      <span className="font-semibold">{value}</span>{" "}
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Row 4: display name + bio */}
                <p className="hidden sm:block text-sm font-semibold text-neutral-900 dark:text-white">
                  {profile.name}
                </p>
                {profile.bio && (
                  <p className="hidden sm:block text-sm text-neutral-700 dark:text-neutral-300 mt-0.5 leading-snug">
                    {profile.bio}
                  </p>
                )}
                {profile.age && (
                  <p className="hidden sm:block text-sm text-neutral-400 mt-0.5">
                    {profile.age} tuổi ·{" "}
                    {profile.gender === "male"
                      ? "Nam"
                      : profile.gender === "female"
                        ? "Nữ"
                        : "Khác"}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile: name + bio */}
            <div className="sm:hidden mt-3">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {profile.name}
              </p>
              {profile.bio && (
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-snug">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Mobile: stats */}
            <div className="sm:hidden flex items-center justify-around border-t border-neutral-200 dark:border-neutral-800 mt-5 pt-3">
              {[
                { value: posts.length, label: "bài viết" },
                { value: 0, label: "theo dõi" },
                { value: 0, label: "đang theo" },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center">
                  <span className="text-base font-semibold text-neutral-900 dark:text-white">
                    {value}
                  </span>
                  <span className="text-xs text-neutral-500">{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ══ TABS ════════════════════════════════════════════ */}
          <div
            className="border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-center gap-12"
            style={{ animation: "igFadeUp 0.35s ease 0.1s both" }}
          >
            {(
              [
                { key: "posts", icon: Grid3X3, label: "Bài viết" },
                { key: "tagged", icon: Tag, label: "Được gắn thẻ" },
              ] as const
            ).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-widest border-t-2 -mt-px transition-colors ${
                  activeTab === key
                    ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                    : "border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* ══ GRID ════════════════════════════════════════════ */}
          {activeTab === "posts" && (
            <div
              className="grid grid-cols-3 gap-[3px]"
              style={{ animation: "igFadeUp 0.35s ease 0.15s both" }}
            >
              {posts.length === 0 ? (
                <div className="col-span-3 py-24 flex flex-col items-center gap-4">
                  <Grid3X3
                    size={48}
                    strokeWidth={0.8}
                    className="text-neutral-300 dark:text-neutral-700"
                  />
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">
                    Chưa có bài viết nào
                  </p>
                </div>
              ) : (
                posts.map((post, i) => (
                  <div
                    key={post._id}
                    className="grid-cell relative aspect-square bg-neutral-100 dark:bg-neutral-900 overflow-hidden cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                    style={{
                      animation: `igFadeUp 0.3s ease both`,
                      animationDelay: `${i * 35}ms`,
                    }}
                  >
                    {post.image ? (
                      <img
                        src={post.image}
                        alt={post.content || "post"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3 bg-neutral-50 dark:bg-neutral-800">
                        <p className="text-xs text-neutral-400 text-center line-clamp-4 leading-snug">
                          {post.content}
                        </p>
                      </div>
                    )}
                    <div className="grid-overlay absolute inset-0 bg-black/45 opacity-0 transition-opacity duration-150 flex items-center justify-center gap-6">
                      <div className="flex items-center gap-1.5 text-white font-semibold text-sm">
                        <Heart size={18} className="fill-white stroke-0" />
                        <span>0</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white font-semibold text-sm">
                        <MessageCircle
                          size={18}
                          className="fill-white stroke-0"
                        />
                        <span>0</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "tagged" && (
            <div className="py-24 flex flex-col items-center gap-4">
              <Tag
                size={48}
                strokeWidth={0.8}
                className="text-neutral-300 dark:text-neutral-700"
              />
              <p className="text-sm text-neutral-400 dark:text-neutral-500">
                Chưa có ảnh được gắn thẻ
              </p>
            </div>
          )}

          <div className="h-10" />
        </div>
      </div>

      {/* ══ MODALS ══════════════════════════════════════════════ */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          profile={profile}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {viewingAvatar && profile.avatar && (
        <AvatarModal
          url={profile.avatar}
          onClose={() => setViewingAvatar(false)}
        />
      )}
    </>
  );
};

export default OtherProfilePage;
