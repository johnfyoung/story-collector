export type ThemeTokens = {
  name: "light" | "dark";
  colors: {
    bg: string;
    bgBlack: string;
    bgWhite: string;
    surface: string;
    text: string;
    textMuted: string;
    textBlack: string;
    textWhite: string;
    primary: string;
    primaryText: string;
    border: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  spacing: (n: number) => string;
  fontSize: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
};

export const lightTheme: ThemeTokens = {
  name: "light",
  colors: {
    bg: "#ffffff",
    bgBlack: "#1f2937",
    bgWhite: "#ffffff",
    surface: "#f6f7f9",
    text: "#1f2937",
    textMuted: "#6b7280",
    textBlack: "#1f2937",
    textWhite: "#ffffff",
    primary: "#b884e0",
    primaryText: "#ffffff",
    border: "#e5e7eb",
  },
  radius: { sm: "6px", md: "10px", lg: "14px" },
  spacing: (n: number) => `${n * 8}px`,
  fontSize: { sm: "12px", md: "14px", lg: "16px", xl: "20px" },
};

export const darkTheme: ThemeTokens = {
  name: "dark",
  colors: {
    bg: "#0b1020",
    bgBlack: "#0b1020",
    bgWhite: "#ffffff",
    surface: "#88898cff",
    text: "#e5e7eb",
    textMuted: "#b7bbc0ff",
    textBlack: "#0b1020",
    textWhite: "#ffffff",
    primary: "#60a5fa",
    primaryText: "#0b1020",
    border: "#1f2937",
  },
  radius: { sm: "6px", md: "10px", lg: "14px" },
  spacing: (n: number) => `${n * 8}px`,
  fontSize: { sm: "12px", md: "14px", lg: "16px", xl: "20px" },
};
