interface UserAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
};

const UserAvatar = ({ name, size = "md" }: UserAvatarProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`gradient-primary flex items-center justify-center rounded-full font-bold text-primary-foreground ${sizeClasses[size]}`}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
