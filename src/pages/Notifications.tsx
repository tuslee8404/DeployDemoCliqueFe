import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Heart, Bell } from "lucide-react";

interface NotificationUser {
  _id: string;
  name: string;
  avatar?: string;
}

interface NotificationItem {
  _id: string;
  sender: NotificationUser;
  type: "like" | "match";
  isRead: boolean;
  createdAt: string;
}

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
  size = 44,
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

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((res: any) => {
        setNotifications(res?.result || []);
      })
      .catch(() => {
        toast({ title: "Lỗi tải thông báo", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      {/* Card container */}
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Thông báo
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto w-full">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <Heart
                  className="text-neutral-300 dark:text-neutral-600"
                  size={48}
                />
              </div>

              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                Chưa có thông báo
              </h2>

              <p className="text-neutral-500 text-sm max-w-xs leading-relaxed">
                Khi ai đó thích hoặc tương hợp với bạn, bạn sẽ thấy thông báo ở
                đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {notifications.map((noti) => {
                const sender = noti.sender;
                const isMatch = noti.type === "match";

                return (
                  <div
                    key={noti._id}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition cursor-pointer ${
                      !noti.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                    onClick={() => navigate(`/profile/${sender._id}`)}
                  >
                    <IGAvatar name={sender?.name || "?"} src={sender?.avatar} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-snug">
                        <span className="font-semibold text-neutral-900 dark:text-white mr-1.5">
                          {sender?.name || "Một người dùng"}
                        </span>

                        {isMatch
                          ? "đã tương hợp với bạn 💖"
                          : "đã thích hồ sơ của bạn."}
                      </p>

                      <p className="text-xs text-neutral-500 mt-1">
                        {timeAgo(noti.createdAt)}
                      </p>
                    </div>

                    <div className="shrink-0">
                      {isMatch ? (
                        <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center">
                          <Heart
                            size={18}
                            className="fill-pink-500 text-pink-500"
                          />
                        </div>
                      ) : (
                        <button className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition">
                          Xem
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
