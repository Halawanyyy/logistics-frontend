import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react'
import { appConfig } from '../../app/config'

export interface BrandConfig {
  companyName: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor?: string
}

const paletteShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const

export type BrandShade = (typeof paletteShades)[number]
export type BrandPalette = Record<BrandShade, string>

interface BrandContextValue {
  brandConfig: BrandConfig
  updateBrandConfig: Dispatch<SetStateAction<BrandConfig>>
  isLoading: boolean
}

const DEFAULT_BRAND_CONFIG: BrandConfig = {
  companyName: appConfig.appName,
  logoUrl: null,
  primaryColor: '#6D4AFF',
}

export const BrandContext = createContext<BrandContextValue | null>(null)

function hexToRgb(hexColor: string) {
  const normalized = hexColor.trim().replace(/^#/, '')
  const expanded = normalized.length === 3
    ? normalized.split('').map((character) => character.repeat(2)).join('')
    : normalized

  if (!/^[\da-f]{6}$/i.test(expanded)) {
    throw new TypeError(`Invalid hex color: ${hexColor}`)
  }

  return {
    red: Number.parseInt(expanded.slice(0, 2), 16),
    green: Number.parseInt(expanded.slice(2, 4), 16),
    blue: Number.parseInt(expanded.slice(4, 6), 16),
  }
}

function rgbToHsl(red: number, green: number, blue: number) {
  const normalizedRed = red / 255
  const normalizedGreen = green / 255
  const normalizedBlue = blue / 255
  const maximum = Math.max(normalizedRed, normalizedGreen, normalizedBlue)
  const minimum = Math.min(normalizedRed, normalizedGreen, normalizedBlue)
  const delta = maximum - minimum
  const lightness = (maximum + minimum) / 2

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness: lightness * 100 }
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  let hue: number

  if (maximum === normalizedRed) {
    hue = 60 * (((normalizedGreen - normalizedBlue) / delta) % 6)
  } else if (maximum === normalizedGreen) {
    hue = 60 * ((normalizedBlue - normalizedRed) / delta + 2)
  } else {
    hue = 60 * ((normalizedRed - normalizedGreen) / delta + 4)
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation: saturation * 100,
    lightness: lightness * 100,
  }
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const normalizedSaturation = saturation / 100
  const normalizedLightness = lightness / 100
  const chroma = (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation
  const hueSegment = hue / 60
  const intermediate = chroma * (1 - Math.abs((hueSegment % 2) - 1))
  const offset = normalizedLightness - chroma / 2

  let red = 0
  let green = 0
  let blue = 0

  if (hueSegment < 1) {
    red = chroma
    green = intermediate
  } else if (hueSegment < 2) {
    red = intermediate
    green = chroma
  } else if (hueSegment < 3) {
    green = chroma
    blue = intermediate
  } else if (hueSegment < 4) {
    green = intermediate
    blue = chroma
  } else if (hueSegment < 5) {
    red = intermediate
    blue = chroma
  } else {
    red = chroma
    blue = intermediate
  }

  return [red, green, blue].map((channel) => Math.round((channel + offset) * 255)).join(' ')
}

function clampLightness(lightness: number) {
  return Math.min(100, Math.max(0, lightness))
}

export function generatePalette(hexColor: string): BrandPalette {
  const { red, green, blue } = hexToRgb(hexColor)
  const { hue, saturation, lightness } = rgbToHsl(red, green, blue)
  const lightnessByShade: Record<BrandShade, number> = {
    50: 95,
    100: 90,
    200: 80,
    300: 70,
    400: 60,
    500: lightness,
    600: lightness - 10,
    700: lightness - 20,
    800: lightness - 30,
    900: lightness - 40,
  }

  return paletteShades.reduce<BrandPalette>((palette, shade) => {
    palette[shade] = hslToRgb(hue, saturation, clampLightness(lightnessByShade[shade]))
    return palette
  }, {} as BrandPalette)
}

export function applyBrandColors(primaryHex: string) {
  if (typeof document === 'undefined') {
    return
  }

  const palette = generatePalette(primaryHex)
  const root = document.documentElement

  root.style.setProperty('--brand-primary', palette[500])
  root.style.setProperty('--brand-primary-dark', palette[600])
  root.style.setProperty('--brand-primary-light', palette[50])
}

export function BrandProvider({ children }: PropsWithChildren) {
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(DEFAULT_BRAND_CONFIG)
  const [hasBrandOverride, setHasBrandOverride] = useState(false)
  const updateBrandConfig = useCallback<Dispatch<SetStateAction<BrandConfig>>>((nextConfig) => {
    setBrandConfig(nextConfig)
    setHasBrandOverride(true)
  }, [])

  useEffect(() => {
    if (!hasBrandOverride) {
      return
    }

    applyBrandColors(brandConfig.primaryColor)
  }, [brandConfig.primaryColor, hasBrandOverride])

  const value = useMemo(
    () => ({ brandConfig, updateBrandConfig, isLoading: false }),
    [brandConfig, updateBrandConfig],
  )

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

export function useBrand() {
  const context = useContext(BrandContext)

  if (!context) {
    throw new Error('useBrand must be used within BrandProvider')
  }

  return context
}
