"use client"

import { Languages } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage, type Language } from "@/lib/language-context"

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  const languages = [
    { code: "en" as Language, name: "English", flag: "🇺🇸" },
    { code: "rw" as Language, name: "Kinyarwanda", flag: "🇷🇼" },
    { code: "fr" as Language, name: "Français", flag: "🇫🇷" },
  ]

  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className="w-9 md:w-40 max-w-xs min-w-0 p-0 md:px-3">
        <div className="flex items-center gap-2 min-w-0 w-full">
          {(() => {
            const selected = languages.find(l => l.code === language)
            return (
              <>
                <span className="block md:hidden">{selected?.flag}</span>
                <span className="hidden md:flex items-center gap-2 min-w-0 w-full">
                  <span>{selected?.flag}</span>
                  <span className="truncate min-w-0 w-full"><SelectValue /></span>
                </span>
              </>
            )
          })()}
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              {/* <span>{lang.flag}</span> */}
              <span>{lang.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
