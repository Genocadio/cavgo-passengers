"use client"

import { useState, useEffect, useId } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { companies } from "@/lib/data"
import { useLanguage } from "@/lib/language-context"
import Downshift from "downshift"

export interface SearchFilters {
  origin: string
  destination: string
  company: string
  city_route: boolean | null
  departedCity: boolean
}

export default function RouteSearch({ onSearch }: { onSearch: (filters: SearchFilters) => void }) {
  const { t } = useLanguage()
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [company, setCompany] = useState("")
  const [departedCity, setDepartedCity] = useState(false)
  const [cityRoute, setCityRoute] = useState<boolean | null>(null)
  const [companyInput, setCompanyInput] = useState("")
  const downshiftId = useId()

  // Automatically trigger search on any filter change
  useEffect(() => {
    onSearch({ origin, destination, company, city_route: cityRoute, departedCity })
  }, [origin, destination, company, cityRoute, departedCity])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Origin */}
      <div>
        <Input
          type="text"
          placeholder={t("originPlaceholder")}
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
      </div>

      {/* Destination */}
      <div>
        <Input
          type="text"
          placeholder={t("destinationPlaceholder")}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
      </div>

      {/* Company - Downshift Autocomplete */}
      <div>
        <Downshift<typeof companies[0] | null>
          id={downshiftId}
          onChange={selection => {
            setCompany(selection && "name" in selection ? selection.name : "")
            setCompanyInput(selection && "name" in selection ? selection.name : "")
          }}
          itemToString={item => (item && "name" in item ? item.name : "")}
          selectedItem={companies.find(c => c.name === company) || null}
          inputValue={companyInput}
          onInputValueChange={value => setCompanyInput(value)}
        >
          {({ getInputProps, getItemProps, getMenuProps, isOpen, highlightedIndex, getLabelProps, inputValue, openMenu }) => {
            const inputProps = getInputProps({
              placeholder: `${t("companyPlaceholder")} (${t("selectCompany")})`,
              className: "w-full"
            })
            const originalOnFocus = (inputProps as any).onFocus
            return (
              <div className="relative">
                <Input
                  {...inputProps}
                  onFocus={e => {
                    if (originalOnFocus) originalOnFocus(e)
                    openMenu()
                  }}
                />
                <ul
                  {...getMenuProps()}
                  className={`absolute z-10 w-full bg-white border border-gray-200 rounded shadow-md mt-1 max-h-60 overflow-auto ${isOpen ? "block" : "hidden"}`}
                >
                  {isOpen && (
                    <>
                      {company && (
                        <li
                          {...getItemProps({
                            item: null as any,
                            index: -1 as any,
                            className: "px-4 py-2 cursor-pointer font-semibold text-gray-700 hover:bg-gray-100"
                          })}
                          onClick={() => {
                            setCompany("")
                            setCompanyInput("")
                          }}
                        >
                          {t("allCompanies")}
                        </li>
                      )}
                      {companies
                        .filter(companyItem =>
                          !companyInput || companyItem.name.toLowerCase().includes(companyInput.toLowerCase())
                        )
                        .map((companyItem, index) => (
                          <li
                            key={companyItem.id}
                            {...getItemProps({
                              item: companyItem,
                              index,
                              className:
                                "px-4 py-2 cursor-pointer " +
                                (highlightedIndex === index ? "bg-gray-100" : "")
                            })}
                          >
                            {companyItem.name}
                          </li>
                        ))}
                    </>
                  )}
                </ul>
              </div>
            )
          }}
        </Downshift>
      </div>

      {/* Filters */}
      <div className="md:col-span-3 flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={departedCity}
            onChange={(e) => {
              const checked = e.target.checked
              setDepartedCity(checked)
              if (checked) setCityRoute(true)
              if (!checked && cityRoute === true) setCityRoute(null)
            }}
            className="h-5 w-5"
          />
          <span>{t("departedCityRoutes")}</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={cityRoute === false}
            onChange={(e) => {
              const checked = e.target.checked
              if (checked) {
                setCityRoute(false)
                setDepartedCity(false)
              } else {
                setCityRoute(null)
              }
            }}
            className="h-5 w-5"
          />
          <span>{t("ruralRoutes")}</span>
        </label>
      </div>

      {/* Actions - removed search and reset buttons */}
    </div>
  )
}
