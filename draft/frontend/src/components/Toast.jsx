import { useEffect } from "react";

const Toast = ({ message, type = "info", onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      default:
        return "ℹ";
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)",
          border: "#10b981",
          iconBg: "rgba(255, 255, 255, 0.2)",
        };
      case "error":
        return {
          bg: "linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)",
          border: "#ef4444",
          iconBg: "rgba(255, 255, 255, 0.2)",
        };
      case "warning":
        return {
          bg: "linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)",
          border: "#f59e0b",
          iconBg: "rgba(255, 255, 255, 0.2)",
        };
      default:
        return {
          bg: "linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%)",
          border: "#8B5CF6",
          iconBg: "rgba(255, 255, 255, 0.2)",
        };
    }
  };

  const colors = getColors();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 320,
        maxWidth: 420,
        padding: "14px 18px",
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 14,
        color: "#fff",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(10px)",
        animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: colors.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {getIcon()}
      </div>

      {/* Message */}
      <div
        style={{
          flex: 1,
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.4,
        }}
      >
        {message}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          background: "rgba(255, 255, 255, 0.2)",
          border: "none",
          borderRadius: 8,
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          fontSize: 16,
          fontWeight: 700,
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "rgba(255, 255, 255, 0.3)";
          e.target.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = "rgba(255, 255, 255, 0.2)";
          e.target.style.transform = "scale(1)";
        }}
      >
        ×
      </button>

      {/* Progress Bar */}
      {duration && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "rgba(255, 255, 255, 0.3)",
            animation: `toastProgress ${duration}ms linear`,
          }}
        />
      )}
    </div>
  );
};

export default Toast;
