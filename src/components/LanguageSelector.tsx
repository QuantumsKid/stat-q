'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Language Selector Component
 * Allows users to switch between supported languages
 */
export function LanguageSelector() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;

    startTransition(() => {
      // Remove current locale prefix if it exists
      let newPathname = pathname;
      if (pathname.startsWith(`/${locale}`)) {
        newPathname = pathname.slice(locale.length + 1) || '/';
      }

      // Add new locale prefix only if it's not the default locale
      if (newLocale !== 'en') {
        newPathname = `/${newLocale}${newPathname}`;
      }

      router.push(newPathname);
      router.refresh();
    });
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange} disabled={isPending}>
      <SelectTrigger className="w-[140px]" aria-label="Select language">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{localeFlags[locale]}</span>
            <span>{localeNames[locale]}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="flex items-center gap-2">
              <span>{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Compact Language Selector (icon only)
 * Useful for mobile or space-constrained layouts
 */
export function CompactLanguageSelector() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: string) => {
    if (newLocale === locale) return;

    startTransition(() => {
      let newPathname = pathname;
      if (pathname.startsWith(`/${locale}`)) {
        newPathname = pathname.slice(locale.length + 1) || '/';
      }

      if (newLocale !== 'en') {
        newPathname = `/${newLocale}${newPathname}`;
      }

      router.push(newPathname);
      router.refresh();
    });
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange} disabled={isPending}>
      <SelectTrigger className="w-[70px]" aria-label="Select language">
        <SelectValue>
          <span className="text-xl">{localeFlags[locale]}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="flex items-center gap-2">
              <span className="text-xl">{localeFlags[loc]}</span>
              <span className="text-sm">{localeNames[loc]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
