import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ProfileDetails, ProfileDetailsFallback } from '@/components/profile-details'
import { getDictionary } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const { profilePage } = await getDictionary()
  return { title: profilePage.title }
}

// Patients only. The heading is in the static shell; the profile reads the session, so it
// streams in. Without a session the Proxy already sent the visitor to sign in
export default async function ProfilePage() {
  const { profilePage } = await getDictionary()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{profilePage.title}</h1>
        <p className="text-lg text-muted-foreground">{profilePage.intro}</p>
      </div>
      <Suspense fallback={<ProfileDetailsFallback label={profilePage.loading} />}>
        <ProfileDetails labels={profilePage} />
      </Suspense>
    </div>
  )
}
