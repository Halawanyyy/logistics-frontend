import { BrandLogo, type BrandLogoSize } from './BrandLogo'
import { cn } from '../../utils/cn'

type BrandMarkProps = {
  name?: string
  logoUrl?: string | null
  size?: BrandLogoSize
  className?: string
}

export function BrandMark({
  name,
  logoUrl,
  size = 'md',
  className,
}: BrandMarkProps) {
  return (
    <BrandLogo
      className={cn('brand-mark', className)}
      logoUrl={logoUrl}
      name={name}
      size={size}
      variant="icon"
    />
  )
}
