import { PHOTOS, type PhotoName } from './content'

type Props = {
  name: PhotoName
  className?: string
  /** above-the-fold images load eagerly with high priority */
  priority?: boolean
  sizes?: string
}

/** A real photograph with a small mobile variant; the browser picks the size it needs. */
export function Photo({ name, className, priority = false, sizes = '(max-width: 760px) 100vw, 50vw' }: Props) {
  return (
    <img
      className={className}
      src={`/photos/${name}.webp`}
      srcSet={`/photos/${name}-sm.webp 760w, /photos/${name}.webp 1400w`}
      sizes={sizes}
      alt={PHOTOS[name].alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}
