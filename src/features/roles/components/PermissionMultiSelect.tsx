import { Check, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { GroupedPermissionsEntry } from '../types/role.types'
import { cn } from '../../../shared/utils/cn'

type PermissionMultiSelectProps = {
  disabled?: boolean
  groups: GroupedPermissionsEntry[]
  value: number[]
  onChange: (value: number[]) => void
}

type FlattenedPermission = GroupedPermissionsEntry['permissions'][number] & {
  module: string
}

export function PermissionMultiSelect({
  disabled = false,
  groups,
  onChange,
  value,
}: PermissionMultiSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const allPermissions = useMemo<FlattenedPermission[]>(
    () =>
      groups.flatMap((group) =>
        group.permissions.map((permission) => ({
          ...permission,
          module: group.module,
        })),
      ),
    [groups],
  )

  const selectedPermissions = useMemo(
    () => allPermissions.filter((permission) => value.includes(permission.id)),
    [allPermissions, value],
  )

  const filteredGroups = useMemo(() => {
    const searchTerm = query.trim().toLowerCase()

    return groups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) => {
          if (!searchTerm) {
            return true
          }

          return [group.module, permission.name, permission.slug, permission.description ?? '']
            .join(' ')
            .toLowerCase()
            .includes(searchTerm)
        }),
      }))
      .filter((group) => group.permissions.length > 0)
  }, [groups, query])

  useEffect(() => {
    if (!open) {
      return
    }

    inputRef.current?.focus()

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  function updateSelection(nextValues: number[]) {
    onChange(Array.from(new Set(nextValues)))
  }

  function togglePermission(permissionId: number) {
    updateSelection(
      value.includes(permissionId)
        ? value.filter((current) => current !== permissionId)
        : [...value, permissionId],
    )
  }

  function selectGroup(permissionIds: number[]) {
    updateSelection([...value, ...permissionIds])
  }

  function clearGroup(permissionIds: number[]) {
    updateSelection(value.filter((permissionId) => !permissionIds.includes(permissionId)))
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
    }
  }

  const summary = value.length
    ? t('{{count}} permissions selected', {
        count: value.length,
        defaultValue: `${value.length} permissions selected`,
      })
    : t('Select permissions', { defaultValue: 'Select permissions' })

  return (
    <div ref={containerRef} className="permission-multi-select">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn('permission-multi-select__trigger', disabled && 'permission-multi-select__trigger--disabled')}
        disabled={disabled}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false)
            setQuery('')
            return
          }

          setOpen(true)
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={cn('permission-multi-select__summary', !value.length && 'permission-multi-select__summary--placeholder')}>
          {summary}
        </span>
        <span className="table-meta">{selectedPermissions.length}/{allPermissions.length}</span>
      </button>

      {selectedPermissions.length ? (
        <div className="permission-multi-select__chips">
          {selectedPermissions.map((permission) => (
            <button
              key={permission.id}
              className="permission-multi-select__chip"
              type="button"
              onClick={() => togglePermission(permission.id)}
            >
              <span>{permission.name}</span>
              <X size={12} />
            </button>
          ))}
          <button
            className="permission-multi-select__clear"
            type="button"
            onClick={() => updateSelection([])}
          >
            {t('Clear all', { defaultValue: 'Clear all' })}
          </button>
        </div>
      ) : null}

      {open ? (
        <div className="permission-multi-select__content" role="dialog" aria-label={t('Permission selector', { defaultValue: 'Permission selector' })}>
          <div className="permission-multi-select__search">
            <Search size={14} />
            <input
              ref={inputRef}
              className="permission-multi-select__input"
              placeholder={t('Search permissions, slugs, or modules...', {
                defaultValue: 'Search permissions, slugs, or modules...',
              })}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="permission-multi-select__groups">
            {filteredGroups.length ? (
              filteredGroups.map((group) => {
                const groupPermissionIds = group.permissions.map((permission) => permission.id)
                const selectedInGroup = groupPermissionIds.filter((permissionId) => value.includes(permissionId)).length

                return (
                  <section className="permission-multi-select__group" key={group.module}>
                    <header className="permission-multi-select__group-header">
                      <div>
                        <h4>{group.module}</h4>
                        <p className="table-meta">
                          {t('{{count}} selected', {
                            count: selectedInGroup,
                            defaultValue: `${selectedInGroup} selected`,
                          })}
                        </p>
                      </div>
                      <div className="permission-multi-select__group-actions">
                        <button type="button" onClick={() => selectGroup(groupPermissionIds)}>
                          {t('Select group', { defaultValue: 'Select group' })}
                        </button>
                        <button type="button" onClick={() => clearGroup(groupPermissionIds)}>
                          {t('Clear group', { defaultValue: 'Clear group' })}
                        </button>
                      </div>
                    </header>
                    <div className="permission-multi-select__options">
                      {group.permissions.map((permission) => {
                        const isSelected = value.includes(permission.id)

                        return (
                          <button
                            key={permission.id}
                            className={cn(
                              'permission-multi-select__option',
                              isSelected && 'permission-multi-select__option--selected',
                            )}
                            type="button"
                            onClick={() => togglePermission(permission.id)}
                          >
                            <div>
                              <strong>{permission.name}</strong>
                              <p className="table-meta">{permission.slug}</p>
                            </div>
                            {isSelected ? <Check size={14} /> : null}
                          </button>
                        )
                      })}
                    </div>
                  </section>
                )
              })
            ) : (
              <div className="permission-multi-select__empty">
                {t('No permissions match this search.', { defaultValue: 'No permissions match this search.' })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
