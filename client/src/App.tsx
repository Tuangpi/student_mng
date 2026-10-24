import { useState } from "react";
import { burmeseTranslations, englishTranslations } from "./i18n/languages";

const translate = (key: string, language: "my" | "en") => {
  const translations = language === "my" ? burmeseTranslations : englishTranslations;
  return translations[key] || key;
};

export default function App() {
  const [language, setLanguage] = useState<"my" | "en">("en");

  return (
    <div className="min-h-screen bg-gray-50 p-4" lang={language} dir={language === "my" ? "rtl" : "ltr"}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{translate("bh_System", language)}</h1>
        <p className="text-gray-600">{translate("bh_School", language)}</p>
      </header>
      <main>
        <section className="max-w-md bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{translate("bh_Home", language)}</h2>
          <p className="text-sm text-gray-600">{translate("bh_Attendance", language)}</p>
        </section>
      </main>
      <div className="mt-6">
        <button
          onClick={() => setLanguage(language === "my" ? "en" : "my")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {language === "my" ? "Myanmar" : "English"}
        </button>
      </div>
    </div>
  );
}
