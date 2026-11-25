import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ProfileDetails, ProfileDetailsFallback } from '@/components/profile-details'
import { buttonVariants } from '@/components/ui/button'
import { getDictionary, getLocale } from '@/i18n/dictionaries'

export async function generateMetadata(): Promise<Metadata> {
  const { profilePage } = await getDictionary()
  return { title: profilePage.title }
}

// Patients only. The heading and the privacy section are in the static shell; the profile reads
// the session, so it streams in. Without a session the Proxy already sent the visitor to sign in
export default async function ProfilePage() {
  const locale = await getLocale()
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
      <section aria-labelledby="profile-privacy" className="mt-6 flex flex-col gap-3">
        <h2 id="profile-privacy" className="text-xl font-semibold tracking-tight">
          {profilePage.privacy}
        </h2>
        <p className="text-muted-foreground">{profilePage.privacyIntro}</p>
        <Link
          href={`/${locale}/profile/access-log`}
          className={buttonVariants({ variant: 'secondary', className: 'self-start' })}
        >
          {profilePage.accessLog}
        </Link>
      </section>
    </div>
  )
}
