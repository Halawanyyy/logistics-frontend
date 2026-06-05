import type { HTMLAttributes, PropsWithChildren, TableHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

type TableVariant = 'default' | 'striped' | 'compact'

type TableProps = PropsWithChildren<
  TableHTMLAttributes<HTMLTableElement> & {
    variant?: TableVariant
  }
>

export function TableContainer({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={cn('ui-table__container', className)} {...props}>
      {children}
    </div>
  )
}

export function Table({
  children,
  className,
  variant = 'default',
  ...props
}: TableProps) {
  return (
    <table className={cn('ui-table', `ui-table--${variant}`, className)} {...props}>
      {children}
    </table>
  )
}

export function TableHead({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLTableCellElement>>) {
  return (
    <th className={cn('ui-table__head', className)} {...props}>
      {children}
    </th>
  )
}

export function TableCell({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLTableCellElement>>) {
  return (
    <td className={cn('ui-table__cell', className)} {...props}>
      {children}
    </td>
  )
}
