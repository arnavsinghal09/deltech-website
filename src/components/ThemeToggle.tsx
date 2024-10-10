// ThemeToggle.js
import { useRecoilState } from "recoil";
import { themeState } from "@/atoms/themeState";
import { Switch } from "@radix-ui/react-switch";
import React from "react";
import { Moon, Sun } from "lucide-react";

const ThemeToggle = () => {
  const [theme, setTheme] = useRecoilState(themeState);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme); // Persist theme to local storage
  };

  return (
    <React.Fragment>
      <Switch
        checked={theme === "dark"}
        onCheckedChange={toggleTheme}
        className="data-[state=checked]:bg-primary"
      />
      {theme === "dark" ? (
        <Moon className="h-5 w-5 text-white" />
      ) : (
        <Sun className="h-5 w-5 text-black" />
      )}
    </React.Fragment>
  );
};

export default ThemeToggle;
