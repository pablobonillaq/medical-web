import { requireSession } from '@/auth/guard'
import { Alert } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import type { Dictionary } from '@/i18n/dictionaries/es'
import { getMyProfile } from '@/patients/profile'
import type { Patient } from '@/patients/types'
import { ProfileForm } from './profile-form'

type ProfileDetailsProps = {
  labels: Dictionary['profilePage']
}

// The signed-in patient's profile, read on the server with their session, in a form to change
// it. It reads the session, so the page puts it behind <Suspense>
export async function ProfileDetails({ labels }: ProfileDetailsProps) {
  // Only patients have a profile; anyone else gets the 403 page
  await requireSession({ path: '/profile', roles: ['patient'] })

  let patient: Patient
  try {
    patient = await getMyProfile()
  } catch {
    return (
      <Alert variant="warning" title={labels.unavailableTitle}>
        {labels.unavailable}
      </Alert>
    )
  }

  // The key starts the form over when the saved profile comes back from the server
  return <ProfileForm key={patient.updatedAt} patient={patient} labels={labels} />
}

// aria-busy and a text for screen readers say that the profile is loading
export function ProfileDetailsFallback({ label }: { label: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <VisuallyHidden>{label}</VisuallyHidden>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-2/3" />
    </div>
  )
}
