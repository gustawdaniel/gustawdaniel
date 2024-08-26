import dayjs from "dayjs";

import 'dayjs/locale/pl'
import 'dayjs/locale/es'

export function prettyDate(date: Date, locale: string): string {
    return dayjs(date).locale(locale).format(locale === 'pl' ? 'DD MMM YYYY' : 'MMM DD, YYYY')
}