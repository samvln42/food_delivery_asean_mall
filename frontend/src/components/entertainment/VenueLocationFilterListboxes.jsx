import React, { Fragment, useMemo } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { FaGlobe, FaMapMarkerAlt } from 'react-icons/fa';

function listboxOptionClasses(active, selected) {
  return [
    'relative cursor-pointer select-none py-2.5 pl-3 pr-9 text-sm',
    active ? 'bg-primary-50 text-primary-900' : 'text-gray-900',
    selected ? 'font-medium' : 'font-normal',
  ].join(' ');
}

/**
 * ตัวเลือกประเทศ/เมือง (Headless UI)
 * — ประเทศ: ไม่มี "ทั้งหมด" ต้องเลือกเสมอ
 * — เมือง: มีตัวเลือก "ทุกเมือง" (value = '') เพื่อแสดงทุกเมืองในประเทศและเรียงตามระยะใกล้
 */
export default function VenueLocationFilterListboxes({
  countriesList,
  filteredCities,
  locationCountry,
  locationCity,
  onCountryChange,
  onCityChange,
  translate,
}) {
  const countryOptions = countriesList;

  const selectedCountry = useMemo(() => {
    if (!countryOptions.length) return null;
    return (
      countryOptions.find((c) => String(c.country_id) === String(locationCountry)) || countryOptions[0]
    );
  }, [locationCountry, countryOptions]);

  const selectedCity = useMemo(() => {
    if (!locationCity) return null;
    return filteredCities.find((c) => String(c.city_id) === String(locationCity)) || null;
  }, [locationCity, filteredCities]);

  if (!countryOptions.length) {
    return null;
  }

  const countryValue = String(selectedCountry.country_id);

  return (
    <div className="grid grid-cols-2 gap-2 w-full min-w-0 sm:flex sm:items-center sm:gap-2">
      <Listbox
        value={countryValue}
        onChange={(v) => {
          onCountryChange(v ?? countryValue);
        }}
      >
        <div className="relative min-w-0 w-full sm:max-w-[11rem]">
          <ListboxButton
            className="relative w-full cursor-pointer rounded-xl border border-gray-200/90 bg-gradient-to-b from-white to-gray-50/80 py-1.5 pl-2 pr-8 text-left text-xs sm:text-sm shadow-sm outline-none transition hover:border-gray-300 hover:shadow focus:border-primary-400 focus:ring-2 focus:ring-primary-500/25"
            aria-label={translate('entertainment.filter_country') || 'ประเทศ'}
          >
            <span className="flex items-center gap-2 truncate">
              {selectedCountry?.flag_display_url ? (
                <img
                  src={selectedCountry.flag_display_url}
                  alt=""
                  className="h-4 w-6 sm:h-5 sm:w-7 shrink-0 rounded object-cover ring-1 ring-black/5"
                />
              ) : (
                <span className="flex h-4 w-6 sm:h-5 sm:w-7 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-400">
                  <FaGlobe className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden />
                </span>
              )}
              <span className="block truncate text-gray-800">{selectedCountry?.name || ''}</span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
              <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden />
            </span>
          </ListboxButton>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              modal={false}
              anchor="bottom start"
              transition
              className="z-[100] mt-1 max-h-60 w-[min(100vw-2rem,16rem)] overflow-auto rounded-xl border border-gray-200/80 bg-white py-1 shadow-lg shadow-gray-200/50 [--anchor-gap:4px] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
            >
              {countryOptions.map((c) => {
                const id = String(c.country_id);
                const isSel = countryValue === id;
                return (
                  <ListboxOption key={id} value={id} className="p-0">
                    {({ focus, selected: sel }) => (
                      <div className={listboxOptionClasses(focus, sel || isSel)}>
                        <span className="flex items-center gap-2.5">
                          {c.flag_display_url ? (
                            <img
                              src={c.flag_display_url}
                              alt=""
                              className="h-5 w-7 shrink-0 rounded object-cover ring-1 ring-black/5"
                            />
                          ) : (
                            <span className="flex h-5 w-7 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-400">
                              <FaGlobe className="h-3 w-3" aria-hidden />
                            </span>
                          )}
                          <span className="truncate">{c.name}</span>
                        </span>
                        {(sel || isSel) && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-primary-600">
                            <CheckIcon className="h-4 w-4" aria-hidden />
                          </span>
                        )}
                      </div>
                    )}
                  </ListboxOption>
                );
              })}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>

      {filteredCities.length === 0 ? (
        <div
          className="flex min-w-0 w-full sm:max-w-[11rem] items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-2 py-1.5 text-xs text-gray-500"
          title={translate('entertainment.no_cities_for_country') || 'ไม่มีเมืองในประเทศนี้'}
        >
          <FaMapMarkerAlt className="h-3 w-3 shrink-0 text-gray-400" aria-hidden />
          <span className="truncate">
            {translate('entertainment.no_cities_for_country') || 'ไม่มีเมือง'}
          </span>
        </div>
      ) : (
        <Listbox
          value={selectedCity ? String(selectedCity.city_id) : ''}
          onChange={(v) => onCityChange(v ?? '')}
        >
          <div className="relative min-w-0 w-full sm:max-w-[11rem]">
            <ListboxButton
              className="relative w-full cursor-pointer rounded-xl border border-gray-200/90 bg-gradient-to-b from-white to-gray-50/80 py-1.5 pl-2 pr-8 text-left text-xs sm:text-sm shadow-sm outline-none transition hover:border-gray-300 hover:shadow focus:border-primary-400 focus:ring-2 focus:ring-primary-500/25"
              aria-label={translate('entertainment.filter_city') || 'เมือง'}
            >
              <span className="flex items-center gap-2 truncate">
                <span className={[
                  'flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-md',
                  selectedCity ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-400',
                ].join(' ')}>
                  <FaMapMarkerAlt className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden />
                </span>
                {selectedCity ? (
                  <span className="block truncate text-gray-800">{selectedCity.name}</span>
                ) : (
                  <span className="block truncate text-gray-400 italic text-xs">
                    {translate('entertainment.pick_city') || 'เลือกเมือง...'}
                  </span>
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
                <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden />
              </span>
            </ListboxButton>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions
                modal={false}
                anchor="bottom end"
                transition
                className="z-[100] mt-1 max-h-60 w-[min(100vw-2rem,16rem)] overflow-auto rounded-xl border border-gray-200/80 bg-white py-1 shadow-lg shadow-gray-200/50 [--anchor-gap:4px] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75"
              >
                {filteredCities.map((c) => {
                  const id = String(c.city_id);
                  const isSel = selectedCity ? String(selectedCity.city_id) === id : false;
                  return (
                    <ListboxOption key={id} value={id} className="p-0">
                      {({ focus, selected: sel }) => (
                        <div className={listboxOptionClasses(focus, sel || isSel)}>
                          <span className="block truncate pl-1">{c.name}</span>
                          {(sel || isSel) && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-primary-600">
                              <CheckIcon className="h-4 w-4" aria-hidden />
                            </span>
                          )}
                        </div>
                      )}
                    </ListboxOption>
                  );
                })}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
      )}
    </div>
  );
}
