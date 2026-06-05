import { useState } from 'react'
import { Truck } from 'lucide-react'
import { cn } from '../../utils/cn'
import { getBrandInitials, isImageLikeValue } from '../../branding/useBranding'

type BrandMarkSize = 'sm' | 'md' | 'lg'

type BrandMarkProps = {
  name: string
  logoUrl?: string | null
  size?: BrandMarkSize
  className?: string
}

export function BrandMark({
  name,
  logoUrl,
  size = 'md',
  className,
}: BrandMarkProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(logoUrl && isImageLikeValue(logoUrl) && !imageFailed)

  return (
    <div className={cn('brand-mark', `brand-mark--${size}`, className)}>
      {showImage ? (
        <img
          alt={name}
          className="brand-mark__image"
          src={logoUrl ?? undefined}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="brand-mark__fallback" aria-hidden="true">
          {name.trim() ? getBrandInitials(name) : <Truck size={18} />}
        </span>
      )}
    </div>
  )
}
