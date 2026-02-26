import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  HelpCircle,
  Send,
  X,
  Check,
  HelpCircle as QuestionMark,
  Clock,
} from "lucide-react";
import {
  submitAvailability,
  confirmAppointment,
  getScheduleStatus,
} from "@/services/api";
import { toast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";

// ─── Types ─────────────────────────────────────────────────────
type SlotStatus = "yes" | "no" | "empty";

interface TimeSlot {
  time: string;
  myStatus: SlotStatus;
  partnerStatus: SlotStatus;
}

interface DaySchedule {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  slots: TimeSlot[];
}

interface ApiSlot {
  date: string;
  startTime: string;
  endTime: string;
}

// ─── Constants ─────────────────────────────────────────────────
const TIME_SLOTS = ["09:00", "12:00", "15:00", "19:00", "21:00"];
// We calculate endTime easily by adding 2 hours for demo.

const DAY_NAMES = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];
const MONTH_NAMES = [
  "tháng 1",
  "tháng 2",
  "tháng 3",
  "tháng 4",
  "tháng 5",
  "tháng 6",
  "tháng 7",
  "tháng 8",
  "tháng 9",
  "tháng 10",
  "tháng 11",
  "tháng 12",
];

// Helper formatting YYYY-MM-DD
const formatDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dStr = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dStr}`;
};

const getEndTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":").map(Number);
  const addParams = h + 2;
  return `${String(addParams).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// ─── Helpers ───────────────────────────────────────────────────
function generateEmptySchedule(): DaySchedule[] {
  const days: DaySchedule[] = [];
  const today = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      dateStr: formatDateStr(d),
      slots: TIME_SLOTS.map((time) => ({
        time,
        myStatus: "empty",
        partnerStatus: "empty", // This should be fetched from API if needed, but per feature we only submit then let backend match.
      })),
    });
  }
  return days;
}

// ─── Status Button ─────────────────────────────────────────────
const StatusBtn = ({
  status,
  onClick,
  disabled = false,
}: {
  status: SlotStatus;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  const base =
    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 select-none";

  if (status === "yes")
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-green-500 hover:bg-green-600 active:scale-90 shadow-sm ${disabled ? "opacity-70 cursor-default" : "cursor-pointer"}`}
      >
        <Check size={18} className="text-white stroke-[3]" />
      </button>
    );
  if (status === "no")
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 active:scale-90 ${disabled ? "cursor-default" : "cursor-pointer"}`}
      >
        <X
          size={18}
          className="text-neutral-500 dark:text-neutral-400 stroke-[3]"
        />
      </button>
    );
  // empty
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-90 border border-neutral-200 dark:border-neutral-700 ${disabled ? "cursor-default" : "cursor-pointer"}`}
    >
      <QuestionMark size={16} className="text-neutral-400 stroke-[1.5]" />
    </button>
  );
};

// ─── Main Page ─────────────────────────────────────────────────
const DatePickerPage = () => {
  const navigate = useNavigate();
  const { id: targetUserId } = useParams();
  const location = useLocation();
  const currentUser = useSelector(
    (state: any) => state.auth?.login?.currentUser,
  );

  // We optionally passed match user data
  const matchUser = location.state?.matchUser;
  const partnerName = matchUser?.name || "Người ấy";

  const [schedule, setSchedule] = useState<DaySchedule[]>(() =>
    generateEmptySchedule(),
  );
  const [loading, setLoading] = useState(true);
  const [conflictData, setConflictData] = useState<{
    slot: ApiSlot;
    warnings: string[];
  } | null>(null);
  const [appointment, setAppointment] = useState<any>(null); // Lưu trữ nếu đã chốt lịch
  const [partnerStatusMsg, setPartnerStatusMsg] = useState("");

  useEffect(() => {
    if (!targetUserId) return;
    setLoading(true);
    getScheduleStatus(targetUserId)
      .then((res: any) => {
        const data = res?.result;
        if (!data) return;

        if (data.type === "appointment") {
          setAppointment(data.data);
        } else if (data.type === "pending_availability") {
          // Pre-fill myAvailability
          const savedSlots: ApiSlot[] = data.myAvailability || [];
          if (savedSlots.length > 0) {
            setSchedule((prev) => {
              const newSchedule = [...prev];
              savedSlots.forEach((savedSlot) => {
                const dayIndex = newSchedule.findIndex(
                  (d) => d.dateStr === savedSlot.date,
                );
                if (dayIndex !== -1) {
                  const slotIndex = newSchedule[dayIndex].slots.findIndex(
                    (s) => s.time === savedSlot.startTime,
                  );
                  if (slotIndex !== -1) {
                    newSchedule[dayIndex] = {
                      ...newSchedule[dayIndex],
                      slots: newSchedule[dayIndex].slots.map((s, i) =>
                        i === slotIndex ? { ...s, myStatus: "yes" } : s,
                      ),
                    };
                  }
                }
              });
              return newSchedule;
            });
          }

          if (data.partnerHasSubmitted && savedSlots.length > 0) {
            // Trường hợp chờ nhưng đối phương cũng đã nộp -> nghĩa là chưa chốt hoặc đang đợi họ chốt.
            setPartnerStatusMsg(
              "Đối phương đã chọn! Bấm Gửi lịch trống để kiểm tra nếu có khung giờ trùng.",
            );
          } else if (savedSlots.length > 0) {
            setPartnerStatusMsg("Đang chờ đối phương điền lịch...");
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch schedule status", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [targetUserId]);

  const toggleMyStatus = (dayIdx: number, slotIdx: number) => {
    setSchedule((prev) =>
      prev.map((day, di) =>
        di !== dayIdx
          ? day
          : {
              ...day,
              slots: day.slots.map((slot, si) =>
                si !== slotIdx
                  ? slot
                  : {
                      ...slot,
                      myStatus:
                        slot.myStatus === "empty"
                          ? "yes"
                          : slot.myStatus === "yes"
                            ? "no"
                            : "empty",
                    },
              ),
            },
      ),
    );
  };

  const getSelectedSlots = (): ApiSlot[] => {
    const apiSlots: ApiSlot[] = [];
    schedule.forEach((day) => {
      day.slots.forEach((slot) => {
        if (slot.myStatus === "yes") {
          apiSlots.push({
            date: day.dateStr,
            startTime: slot.time,
            endTime: getEndTime(slot.time),
          });
        }
      });
    });
    return apiSlots;
  };

  const handleSend = async () => {
    const slots = getSelectedSlots();
    if (slots.length === 0) {
      toast({ title: "Hãy chọn ít nhất 1 khung giờ rảnh" });
      return;
    }

    setLoading(true);
    try {
      const resp: any = await submitAvailability(targetUserId as string, slots);
      const data = resp.data || resp;

      if (data.isMatched) {
        if (data.conflictWarnings && data.conflictWarnings.length > 0) {
          // Show conflict modal
          setConflictData({
            slot: data.commonSlot,
            warnings: data.conflictWarnings,
          });
        } else {
          // Auto confirm if no conflicts
          await doConfirm(data.commonSlot);
        }
      } else {
        toast({ title: data.message });
        navigate("/matches"); // Quay về sau khi gửi
      }
    } catch (error: any) {
      toast({ title: "Đã có lỗi xảy ra", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const doConfirm = async (slot: ApiSlot) => {
    setLoading(true);
    try {
      await confirmAppointment({
        targetUserId: targetUserId as string,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
      toast({ title: "Đã thiết lập lịch hẹn thành công! 💖" });
      navigate("/notifications"); // Có thể dẫn qua 1 màn hiển thị lịch riêng
    } catch (e) {
      toast({ title: "Không thể chốt lịch hẹn.", variant: "destructive" });
    } finally {
      setLoading(false);
      setConflictData(null);
    }
  };

  const formatDate = (d: Date) =>
    `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        .dp-root { font-family: 'Nunito', sans-serif; }
      `}</style>

      {/* Conflict Modal */}
      {conflictData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold text-red-600 mb-2">
              Cảnh báo Trùng Lịch!
            </h3>
            <p className="text-neutral-600 text-sm mb-4">
              Bạn và đối phương có khoảng rảnh chung là{" "}
              <b>{conflictData.slot.startTime}</b> ngày{" "}
              <b>{conflictData.slot.date}</b>. Tuy nhiên:
            </p>
            <ul className="text-sm text-neutral-800 list-disc pl-5 space-y-2 mb-6">
              {conflictData.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
            <p className="text-neutral-500 text-sm mb-6">
              Bạn có chắc chắn muốn chốt lịch hẹn này không?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConflictData(null);
                  toast({
                    title: "Đã giữ lại khung giờ, đang chờ chọn lại",
                    variant: "default",
                  });
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                Huỷ
              </button>
              <button
                onClick={() => doConfirm(conflictData.slot)}
                disabled={loading}
                className="flex-1 py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600"
              >
                {loading ? "Đang xử lý..." : "Chốt luôn"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dp-root min-h-screen bg-[#fdf6f0] flex justify-center">
        <div className="w-full max-w-sm flex flex-col min-h-screen relative">
          {/* ── Top Bar ── */}
          <div className="flex items-center justify-between px-5 pt-12 pb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
            >
              <ArrowLeft size={22} className="text-neutral-800" />
            </button>
            <span className="text-[15px] font-bold text-neutral-800 tracking-tight">
              Chọn thời gian hẹn
            </span>
            <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
              <HelpCircle size={20} className="text-neutral-400" />
            </button>
          </div>

          {loading && !appointment ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : appointment ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-20">
              <div className="w-24 h-24 mb-6 relative">
                <div className="absolute inset-0 bg-pink-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-tr from-pink-500 to-rose-400 w-full h-full rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30 text-white">
                  <Clock fill="currentColor" size={48} className="text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-neutral-900 mb-2">
                Đã Chốt Hẹn! 🎉
              </h2>
              <p className="text-neutral-600 mb-8 leading-relaxed">
                Bạn và{" "}
                <span className="font-bold text-pink-500">{partnerName}</span>{" "}
                đã xác nhận lịch gặp mặt vào:
                <br />
                <span className="inline-block mt-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-neutral-100 text-lg font-bold text-neutral-900">
                  {appointment.date} lúc {appointment.startTime}
                </span>
              </p>
              <button
                onClick={() => navigate("/matches")}
                className="w-full py-4 rounded-2xl font-bold bg-neutral-900 text-white shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                Quay lại
              </button>
            </div>
          ) : (
            <>
              {/* ── Subtitle ── */}
              <div className="px-5 pb-4">
                <p className="text-[17px] font-bold text-neutral-900 leading-snug">
                  Khi nào bạn có thể đi hẹn hò với{" "}
                  <span className="text-orange-500">{partnerName}</span>?
                </p>
                <p className="text-xs text-neutral-400 mt-1 font-medium">
                  Lịch trống trong 3 tuần kể từ hôm nay
                </p>
                {partnerStatusMsg && (
                  <p className="text-sm text-pink-600 font-semibold mt-2 px-3 py-2 bg-pink-50 rounded-lg border border-pink-100">
                    {partnerStatusMsg}
                  </p>
                )}
              </div>

              {/* ── Legend ── */}
              <div className="px-5 pb-3 flex items-center gap-4">
                {[
                  { status: "no" as SlotStatus, label: "Bận" },
                  { status: "yes" as SlotStatus, label: "Rảnh" },
                  { status: "empty" as SlotStatus, label: "Chưa biết" },
                ].map(({ status, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <StatusBtn status={status} disabled />
                    <span className="text-xs text-neutral-500 font-semibold">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Schedule List ── */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {schedule.map((day, di) => {
                  return (
                    <div key={di} className="mb-1">
                      <div className="pt-3 pb-1 px-1">
                        <span className="text-[13px] font-extrabold text-neutral-700 uppercase tracking-wider">
                          {formatDate(day.date)}
                        </span>
                      </div>

                      {day.slots.map((slot, si) => {
                        return (
                          <div
                            key={si}
                            className="flex items-center rounded-2xl mb-1 px-3 py-2 transition-all duration-200 bg-white"
                          >
                            <span className="text-[15px] font-bold w-14 text-neutral-800">
                              {slot.time}
                            </span>
                            <div className="flex-1" />
                            <div className="mr-2">
                              <StatusBtn
                                status={slot.myStatus}
                                onClick={() => toggleMyStatus(di, si)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* ── Send Button ── */}
              <div className="px-5 pb-10 mt-3 bg-[#fdf6f0]">
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className={`w-full py-4 rounded-2xl font-extrabold text-[16px] flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-95 bg-neutral-900 text-white hover:bg-neutral-700 shadow-lg shadow-neutral-900/20`}
                >
                  {loading ? (
                    <>Đang xử lý...</>
                  ) : (
                    <>
                      <Send size={18} className="stroke-[2]" />
                      Gửi lịch trống
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DatePickerPage;
