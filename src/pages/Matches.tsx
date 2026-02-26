import { useState, useEffect } from "react";
import { getMatches, getAppointments } from "@/services/api";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import UserAvatar from "@/components/UserAvatar";
import { Heart, HeartOff } from "lucide-react";

interface MatchUser {
  _id: string;
  name: string;
  age: number;
  gender: string;
  bio?: string;
  avatar?: string;
}

const MatchesPage = () => {
  const currentUser = useSelector(
    (state: any) => state.auth?.login?.currentUser,
  );
  const currentUserId: string | null = currentUser?._id ?? null;
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    Promise.all([getMatches(), getAppointments()])
      .then(([matchesRes, apptsRes]: any) => {
        setMatches(matchesRes?.result || []);
        setAppointments(apptsRes?.result || []);
      })
      .catch(() => toast({ title: "Lỗi tải dữ liệu", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [currentUserId]);

  if (loading) return <LoadingSpinner />;
  if (!currentUserId)
    return (
      <EmptyState
        icon={HeartOff}
        title="Chưa đăng nhập"
        description="Đăng nhập để xem matches của bạn"
      />
    );
  if (!matches.length)
    return (
      <EmptyState
        icon={Heart}
        title="Chưa có match nào"
        description="Tiếp tục tym để tìm người phù hợp! 💪"
      />
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">
          Matches của bạn 💘
        </h1>
        <p className="text-muted-foreground">Những người đã kết nối với bạn</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {matches.map((user, i) => {
          const appt = appointments.find(
            (a) => a.user1._id === user._id || a.user2._id === user._id,
          );
          return (
            <div
              key={user._id}
              className="animate-fade-in flex flex-col h-full rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer"
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => navigate(`/profile/${user._id}`)}
            >
              <div className="flex flex-col flex-1 items-center text-center gap-3">
                <UserAvatar name={user.name} size="lg" />
                <div>
                  <h3 className="font-bold text-foreground">{user.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {user.age} ·{" "}
                    {user.gender === "male"
                      ? "Nam"
                      : user.gender === "female"
                        ? "Nữ"
                        : "Khác"}
                  </p>
                </div>
                {user.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {user.bio}
                  </p>
                )}

                <div className="flex-1"></div>

                <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium shadow-sm mb-1">
                  💖 Matched
                </span>

                {appt ? (
                  <div className="mt-2 w-full text-center bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-xl py-2 px-3 border border-pink-200 dark:border-pink-800">
                    <p className="text-xs font-semibold mb-0.5">
                      Lịch hẹn sắp tới:
                    </p>
                    <p className="font-bold text-sm">
                      {appt.date} • {appt.startTime}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/schedule/${user._id}`, {
                          state: { matchUser: user },
                        });
                      }}
                      className="mt-2 text-xs bg-white/70 hover:bg-white dark:bg-black/40 dark:hover:bg-black/60 text-pink-600 dark:text-pink-400 font-bold py-1 px-4 rounded-lg transition-colors"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/schedule/${user._id}`, {
                        state: { matchUser: user },
                      });
                    }}
                    className="mt-2 w-full text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 rounded-lg transition-colors"
                  >
                    Hẹn lịch
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchesPage;
