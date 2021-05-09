import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionRow, StyledSmallFont } from './styled'
import { usePage } from '../../../lib/stores/pageStore'
import { PageStoreWithTeam } from '../../../interfaces/pageStore'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import SubscriptionForm from '../../molecules/SubscriptionForm'
import { useSettings } from '../../../lib/stores/settings'
import { useGlobalData } from '../../../lib/stores/globalData'
import ColoredBlock from '../../atoms/ColoredBlock'
import FreeTrialPopup from '../FreeTrialPopup'
import { stripePublishableKey } from '../../../lib/consts'
import CustomLink from '../../atoms/Link/CustomLink'
import PlanTables from '../Subscription/PlanTables'
import { UpgradePlans } from '../../../lib/stripe'
import styled from '../../../lib/styled'
import SettingTabContent from '../../../../shared/components/organisms/Settings/atoms/SettingTabContent'

const stripePromise = loadStripe(stripePublishableKey)

type UpgradeTabs = 'plans' | 'form'

const UpgradeTab = () => {
  const { t } = useTranslation()
  const {
    team,
    subscription,
    updateTeamSubscription,
    permissions = [],
  } = usePage<PageStoreWithTeam>()
  const [tabState, setTabState] = useState<UpgradeTabs>('plans')
  const { openSettingsTab } = useSettings()
  const {
    globalData: { currentUser },
  } = useGlobalData()
  const [showTrialPopup, setShowTrialPopup] = useState(false)
  const [initialPlan, setInitialPlan] = useState<UpgradePlans>('standard')

  useEffect(() => {
    if (subscription != null && subscription.status !== 'trialing') {
      openSettingsTab('teamSubscription')
    }
  }, [subscription, openSettingsTab])

  const onUpgradeCallback = useCallback((initialPlan: UpgradePlans) => {
    setInitialPlan(initialPlan)
    setTabState('form')
  }, [])

  const onSuccessCallback = useCallback(
    (sub) => {
      updateTeamSubscription(sub)
    },
    [updateTeamSubscription]
  )

  const onCancelCallback = useCallback(() => {
    setTabState('plans')
  }, [])

  const currentUserPermissions = useMemo(() => {
    return permissions.find(
      (permission) => permission.user.id === currentUser!.id
    )
  }, [currentUser, permissions])

  if (
    team == null ||
    (subscription != null && subscription.status === 'active') ||
    currentUserPermissions == null
  ) {
    return null
  }

  if (tabState === 'plans') {
    return (
      <SettingTabContent
        title={t('settings.teamUpgrade')}
        body={
          <>
            {showTrialPopup && (
              <FreeTrialPopup
                team={team}
                close={() => setShowTrialPopup(false)}
              />
            )}
            <section>
              <StyledSmallFont>
                <PlanTables
                  team={team}
                  subscription={subscription}
                  selectedPlan='free'
                  onStandardCallback={() => onUpgradeCallback('standard')}
                  onProCallback={() => onUpgradeCallback('pro')}
                  onTrialCallback={() => setShowTrialPopup(true)}
                />
                <StyledFYI>
                  * For larger businesses or those in highly regulated
                  industries, please{' '}
                  <CustomLink
                    href='https://forms.gle/LqzQ2Tcfd6noWH6b9'
                    target='_blank'
                    rel='noopener noreferrer'
                    isReactLink={false}
                  >
                    contact our sales department
                  </CustomLink>
                  .
                </StyledFYI>
              </StyledSmallFont>
            </section>
          </>
        }
      ></SettingTabContent>
    )
  }

  return (
    <SettingTabContent
      title={t('settings.teamUpgrade')}
      body={
        <section>
          <StyledSmallFont>
            {currentUserPermissions.role !== 'admin' ? (
              <ColoredBlock variant='danger'>
                Only admins can access this content.
              </ColoredBlock>
            ) : (
              !(subscription != null && subscription.status === 'active') && (
                <SectionRow>
                  <Elements stripe={stripePromise}>
                    <SubscriptionForm
                      team={team}
                      initialPlan={initialPlan}
                      ongoingTrial={
                        subscription != null &&
                        subscription.status === 'trialing'
                      }
                      onSuccess={onSuccessCallback}
                      onCancel={onCancelCallback}
                    />
                  </Elements>
                </SectionRow>
              )
            )}
          </StyledSmallFont>
        </section>
      }
    ></SettingTabContent>
  )
}

const StyledFYI = styled.p`
  .type-link {
    text-decoration: underline;

    &:hover,
    &:focus {
      color: ${({ theme }) => theme.primaryTextColor};
      text-decoration: none;
    }
  }
`

export default UpgradeTab
