import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  getPosts,
  getProfile,
  getUploadSignature,
  updateProfile,
  logout,
} from "@/services/api";
import { setCurrentUser, logoutSuccess } from "@/redux/authSlice";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Grid3X3,
  Tag,
  MoreHorizontal,
  UserPlus,
  ChevronDown,
  Heart,
  MessageCircle,
  X,
  Loader2,
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

// ─── Post Modal — cố định 60vw × 60vh ─────────────────────────
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

      {/* ✅ Cố định 60vw × 60vh — không thay đổi theo nội dung */}
      <div
        className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden flex shadow-2xl"
        style={{
          width: "60vw",
          height: "60vh",
          animation: "scaleIn 0.2s ease both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cột trái: ảnh hoặc text-only */}
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

        {/* Cột phải: info — luôn hiển thị với width cố định */}
        <div className="w-[260px] shrink-0 flex flex-col border-l border-neutral-200 dark:border-neutral-700">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <IGAvatar name={displayName} src={displayAvatar} size={32} />
            <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
              {displayName}
            </span>
          </div>

          {/* Caption */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {post.content && (
              <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                <span className="font-semibold mr-2">{displayName}</span>
                {post.content}
              </p>
            )}
          </div>

          {/* Thời gian */}
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

// ─── Main Page ─────────────────────────────────────────────────
const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useSelector(
    (state: any) => state.auth?.login?.currentUser,
  );
  const currentUserId: string | null = currentUser?._id ?? null;
  const targetId = id || currentUserId;
  const isMe = !id || id === currentUserId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "tagged">("posts");
  const [following, setFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [viewingAvatarUrl, setViewingAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Lỗi khi gọi API logout:", err);
    } finally {
      dispatch(logoutSuccess());
      navigate("/login");
    }
  };

  const handleAvatarClick = () => {
    if (isMe) {
      setShowAvatarMenu(true);
    } else if (profile?.avatar) {
      setViewingAvatarUrl(profile.avatar);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowAvatarMenu(false);
    setUploadingAvatar(true);

    try {
      const sigRes: any = await getUploadSignature();
      const { signature, timestamp, cloudname, apikey } =
        sigRes.result || sigRes;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apikey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudname}/image/upload`,
        { method: "POST", body: formData },
      );

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok)
        throw new Error(uploadData?.error?.message || "Upload thất bại");

      const imageUrl = uploadData.secure_url;
      await updateProfile({ avatar: imageUrl });

      toast({ title: "Cập nhật ảnh đại diện thành công! ✅" });

      setProfile((prev) => (prev ? { ...prev, avatar: imageUrl } : prev));
      dispatch(setCurrentUser({ user: { ...currentUser, avatar: imageUrl } }));
    } catch (err: any) {
      toast({
        title: "Lỗi tải ảnh",
        description: err?.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    Promise.all([
      getProfile(targetId).catch(() => null),
      getPosts(targetId).catch(() => ({ result: [] })),
    ])
      .then(([profileRes, postsRes]: [any, any]) => {
        if (profileRes?.result) setProfile(profileRes.result);
        setPosts(postsRes?.result || []);
      })
      .catch(() => toast({ title: "Lỗi tải dữ liệu", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [targetId]);

  if (loading) return <LoadingSpinner />;

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
              <div className="relative">
                <IGAvatar
                  name={profile?.name || "?"}
                  src={profile?.avatar}
                  size={86}
                  onClick={handleAvatarClick}
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center pointer-events-none">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <h1 className="text-xl font-light text-neutral-900 dark:text-white tracking-wide">
                    {profile?.name?.toLowerCase().replace(/\s+/g, "_") ??
                      "username"}
                  </h1>

                  <div className="relative">
                    <button onClick={() => setShowMoreMenu(!showMoreMenu)}>
                      <MoreHorizontal size={20} />
                    </button>

                    {/* Dropdown Menu */}
                    {showMoreMenu && (
                      <>
                        {/* Overlay */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowMoreMenu(false)}
                        />

                        {/* Dropdown */}
                        <div
                          className="absolute top-8 right-2 z-50 w-40 
                     bg-white dark:bg-neutral-900 
                     rounded-xl shadow-lg 
                     border border-neutral-200 dark:border-neutral-800 
                     overflow-hidden"
                          style={{ animation: "scaleIn 0.15s ease both" }}
                        >
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-3 text-sm font-semibold 
                       text-red-500 hover:bg-neutral-100 
                       dark:hover:bg-neutral-800 transition-colors"
                          >
                            Đăng xuất
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {isMe ? (
                    <></>
                  ) : (
                    <>
                      <button
                        onClick={() => setFollowing((v) => !v)}
                        className={`flex items-center gap-1.5 px-4 py-[6px] text-sm font-semibold rounded-lg transition-colors ${
                          following
                            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
                            : "bg-sky-500 hover:bg-sky-600 text-white"
                        }`}
                      >
                        {following ? (
                          <>
                            <ChevronDown size={13} /> Following
                          </>
                        ) : (
                          "Follow"
                        )}
                      </button>
                      <button className="px-4 py-[6px] bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm font-semibold rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        Message
                      </button>
                      <button className="p-[6px] bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                        <UserPlus size={16} />
                      </button>
                    </>
                  )}
                </div>

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

                {profile?.name && (
                  <p className="hidden sm:block text-sm font-semibold text-neutral-900 dark:text-white">
                    {profile.name}
                  </p>
                )}
                {profile?.bio && (
                  <p className="hidden sm:block text-sm text-neutral-700 dark:text-neutral-300 mt-0.5 leading-snug">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:hidden mt-3">
              {profile?.name && (
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {profile.name}
                </p>
              )}
              {profile?.bio && (
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-snug">
                  {profile.bio}
                </p>
              )}
            </div>

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

      {selectedPost && (
        <PostModal
          post={selectedPost}
          profile={profile}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {/* ─── Avatar Menu Modal ─── */}
      {showAvatarMenu && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowAvatarMenu(false)}
        >
          <div
            className="bg-background dark:bg-neutral-900 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scaleIn 0.2s ease both" }}
          >
            <div className="py-5 text-center font-bold text-lg border-b border-border text-foreground">
              Ảnh đại diện
            </div>

            <button
              className="py-4 font-semibold hover:bg-muted/50 dark:hover:bg-neutral-800 transition-colors border-b border-border text-primary cursor-pointer w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              Thay đổi ảnh đại diện
            </button>

            {profile?.avatar && (
              <button
                className="py-4 font-medium hover:bg-muted/50 dark:hover:bg-neutral-800 transition-colors border-b border-border text-foreground cursor-pointer w-full"
                onClick={() => {
                  setShowAvatarMenu(false);
                  setViewingAvatarUrl(profile.avatar!);
                }}
              >
                Xem ảnh đại diện
              </button>
            )}

            <button
              className="py-4 font-medium hover:bg-muted/50 dark:hover:bg-neutral-800 transition-colors text-muted-foreground w-full cursor-pointer"
              onClick={() => setShowAvatarMenu(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* ─── View Avatar Modal (60vw x 60vh) ─── */}
      {viewingAvatarUrl && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center"
          onClick={() => setViewingAvatarUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors z-10"
            onClick={() => setViewingAvatarUrl(null)}
          >
            <X size={28} />
          </button>
          <div
            className="rounded-xl overflow-hidden flex items-center justify-center shadow-2xl bg-black"
            style={{
              width: "60vw",
              height: "60vh",
              animation: "scaleIn 0.2s ease both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewingAvatarUrl}
              alt="Avatar"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
      />
    </>
  );
};

export default ProfilePage;
