import { useTranslation } from 'react-i18next'
import { EmptyState } from '../../../shared/components/states/EmptyState'
import { PageHeader } from '../../../shared/components/ui/PageHeader'

export function ComingSoonPage() {
  const { t } = useTranslation()

  return (
    <section className="page-section">
      <PageHeader
        eyebrow={t('Merchant Portal', { defaultValue: 'Merchant Portal' })}
        title={t('Feature Coming Soon', { defaultValue: 'Feature Coming Soon' })}
        description={t('This section is scheduled for implementation in a future phase.', { defaultValue: 'This section is scheduled for implementation in a future phase.' })}
      />

      <EmptyState
        title={t('Feature Coming Soon', { defaultValue: 'Feature Coming Soon' })}
        description={t('We are currently setting up this module. Please check back later.', {
          defaultValue: 'We are currently setting up this module. Please check back later.',
        })}
      />
    </section>
  )
}
