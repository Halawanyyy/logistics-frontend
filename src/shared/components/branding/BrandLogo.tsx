import { useState } from 'react'
import { Truck } from 'lucide-react'
import { cn } from '../../utils/cn'
import { getBrandInitials, isImageLikeValue, resolveBrandLogoUrl, useBranding } from '../../branding/useBranding'

export type BrandLogoSize = 'sm' | 'md' | 'lg'
export type BrandLogoVariant = 'icon' | 'full'

export type BrandLogoProps = {
  variant?: BrandLogoVariant
  size?: BrandLogoSize
  className?: string
  showName?: boolean
  logoUrl?: string | null
  name?: string
  alt?: string
}

export function BrandLogo({
  variant = 'icon',
  size = 'md',
  className,
  showName = false,
  logoUrl: propLogoUrl,
  name: propName,
  alt,
}: BrandLogoProps) {
  const branding = useBranding()
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  const rawLogoUrl = propLogoUrl !== undefined ? propLogoUrl : (branding.logoUrl || branding.companyLogo)
  const activeLogoUrl = resolveBrandLogoUrl(rawLogoUrl)
  const activeName = propName || branding.companyName || 'Fast Logistics'

  const hasFailed = Boolean(activeLogoUrl && failedUrl === activeLogoUrl)
  const showImage = Boolean(activeLogoUrl && isImageLikeValue(activeLogoUrl) && !hasFailed)

  const isFull = variant === 'full' || showName

  return (
    <div
      className={cn(
        'brand-logo',
        `brand-logo--${size}`,
        `brand-logo--${variant}`,
        isFull && 'brand-logo--with-name',
        className
      )}
      data-testid="brand-logo"
    >
      <div
        className={cn(
          'brand-logo__mark',
          `brand-logo__mark--${size}`,
          showImage && 'brand-logo__mark--has-image'
        )}
      >
        {showImage ? (
          <img
            key={activeLogoUrl}
            alt={alt || `${activeName} logo`}
            className="brand-logo__image"
            src={activeLogoUrl ?? undefined}
            onError={() => {
              if (activeLogoUrl) {
                setFailedUrl(activeLogoUrl)
              }
            }}
            loading="lazy"
          />
        ) : (
          <span className="brand-logo__fallback" aria-hidden="true">
            {activeName.trim() ? getBrandInitials(activeName) : <Truck size={size === 'sm' ? 14 : size === 'lg' ? 24 : 18} />}
          </span>
        )}
      </div>

      {isFull ? (
        <div className="brand-logo__details">
          <span className="brand-logo__name">{activeName}</span>
        </div>
      ) : null}
    </div>
  )
}
