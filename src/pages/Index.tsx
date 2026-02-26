import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFeed, markPostAsSeen } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Heart, MessageCircle, Image as ImageIcon } from "lucide-react";

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
  size = 40,
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
      className={`rounded-full shrink-0 bg-neutral-200 dark:bg-neutral-800 overflow-hidden border border-neutral-200 dark:border-neutral-700 ${onClick ? "cursor-pointer" : ""}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
          <span
            className="font-medium text-neutral-500 dark:text-neutral-400"
            style={{ fontSize: size * 0.4 }}
          >
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Feed Post Component ───────────────────────────────────────
const FeedPost = ({
  post,
  onSeen,
}: {
  post: Post;
  onSeen: (id: string) => void;
}) => {
  const navigate = useNavigate();
  const postRef = useRef<HTMLDivElement>(null);
  const seenTimeout = useRef<NodeJS.Timeout | null>(null);
  const [hasBeenSeen, setHasBeenSeen] = useState(false);

  useEffect(() => {
    if (!window.IntersectionObserver || hasBeenSeen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry.isIntersecting) {
          seenTimeout.current = setTimeout(() => {
            setHasBeenSeen(true);
            onSeen(post._id);
            if (postRef.current) observer.unobserve(postRef.current);
          }, 2000);
        } else {
          if (seenTimeout.current) {
            clearTimeout(seenTimeout.current);
            seenTimeout.current = null;
          }
        }
      },
      { threshold: 0.6 },
    );

    if (postRef.current) observer.observe(postRef.current);

    return () => {
      if (seenTimeout.current) clearTimeout(seenTimeout.current);
      observer.disconnect();
    };
  }, [post._id, onSeen, hasBeenSeen]);

  return (
    <div
      ref={postRef}
      className="
        w-full max-w-[470px] mx-auto
        bg-white dark:bg-black
        sm:border sm:border-neutral-200 dark:sm:border-neutral-800
        sm:rounded-xl
        mb-6
        overflow-hidden
        transition-colors
      "
    >
      {/* Header */}
      <div className="flex items-center px-3 py-3 gap-3">
        <IGAvatar
          name={post.user?.name || "?"}
          src={post.user?.avatar}
          onClick={() => navigate(`/profile/${post.user._id}`)}
        />

        <div className="flex-1">
          <p
            onClick={() => navigate(`/profile/${post.user._id}`)}
            className="font-semibold text-sm cursor-pointer hover:opacity-70 transition"
          >
            {post.user?.name || "Username"}
          </p>
        </div>

        <p className="text-xs text-neutral-400">{timeAgo(post.createdAt)}</p>
      </div>

      {/* MEDIA (luôn vuông 1:1 tuyệt đối) */}
      <div className="relative w-full aspect-square overflow-hidden border-y border-neutral-100 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900">
        {post.image ? (
          <>
            {/* Skeleton tránh giật layout */}
            <div className="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-neutral-800" />

            <img
              src={post.image}
              alt="Post image"
              loading="lazy"
              className="
                absolute inset-0
                w-full h-full
                object-cover object-center
                transition-opacity duration-300
              "
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 bg-gradient-to-br from-neutral-50 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800">
            <IGAvatar
              name={post.user?.name || "?"}
              src={post.user?.avatar}
              size={60}
            />

            <p className="text-lg font-medium text-neutral-800 dark:text-neutral-200 text-center leading-relaxed max-w-[320px]">
              {post.content}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-5">
        <button className="hover:scale-110 active:scale-95 transition-transform">
          <Heart size={24} className="text-neutral-800 dark:text-white" />
        </button>

        <button className="hover:scale-110 active:scale-95 transition-transform">
          <MessageCircle
            size={24}
            className="text-neutral-800 dark:text-white"
          />
        </button>
      </div>

      {/* Caption */}
      {post.image && post.content && (
        <div className="px-3 pb-4">
          <p className="text-sm leading-snug">
            <span
              onClick={() => navigate(`/profile/${post.user._id}`)}
              className="font-semibold cursor-pointer hover:underline mr-2"
            >
              {post.user?.name || "Username"}
            </span>

            <span className="text-neutral-900 dark:text-neutral-100">
              {post.content}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────
const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Set lưu trữ các id đã được báo cáo với Server (tránh gọi API nhiều lần chung 1 post)
  const [reportedSeenIds, setReportedSeenIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    getFeed()
      .then((res: any) => setPosts(res?.result || []))
      .catch(() => toast({ title: "Lỗi tải bảng tin", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const handlePostSeen = useCallback((postId: string) => {
    setReportedSeenIds((prev) => {
      // Nếu đã báo cáo rồi thì không gọi API nữa
      if (prev.has(postId)) return prev;

      // Đánh dấu vào state để không gọi thêm
      const updated = new Set(prev);
      updated.add(postId);

      // Gọi ngầm API
      markPostAsSeen(postId).catch((err) => {
        console.error("Lỗi khi report bài đã xem: ", err);
      });

      return updated;
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-6 pb-20">
      <div className="w-full max-w-[470px] mx-auto px-4 sm:px-0">
        <div className="mb-6 animate-fade-in flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
            Dành cho bạn
          </h1>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-6">
              <ImageIcon
                className="text-neutral-300 dark:text-neutral-700"
                size={48}
              />
            </div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">
              Bạn đã xem hết!
            </h2>
            <p className="text-neutral-500 text-sm max-w-xs">
              Mọi bài viết mới nhất đều đã được bạn xem. Hãy quay lại sau để xem
              thêm bài đăng từ người khác nhé.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {posts.map((post) => (
              <FeedPost key={post._id} post={post} onSeen={handlePostSeen} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
