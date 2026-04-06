import { Link } from "react-router-dom";
import livePhotoIcon from "../../assets/logo-provisorio.svg";
import userIcon from "../../assets/user-logo.svg";

export default function AuthShell({
  title,
  subtitle,
  panelTitle,
  panelCopy,
  children,
}) {
  return (
    <div className="h-screen overflow-hidden px-4 py-4 lg:px-8">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-4">
        <div className="neuphormism-b flex items-center justify-between px-6 py-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
              # sustenido
            </div>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-tight sm:text-3xl">
              {title}
            </h1>
          </div>
          <div className="hidden text-right text-sm text-gray-500 md:block">
            Keep the same access flow.
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 items-center gap-4 lg:grid-cols-[0.85fr,0.9fr]">
          <section className="neuphormism-b flex max-h-full min-h-0 flex-col overflow-hidden">
            <div className="relative flex flex-1 flex-col overflow-hidden p-5 sm:p-6">
              <div className="absolute -right-16 top-16 h-48 w-48 rounded-full bg-[goldenrod]/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-black/5 blur-3xl" />

              <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-gray-500">
                  # sustenido
                </p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-none sm:text-4xl">
                  {panelTitle}
                </h2>
                <p className="mt-4 max-w-md text-sm leading-6 text-gray-600">
                  {panelCopy}
                </p>
              </div>

              <div className="relative mt-6 flex flex-col gap-3">
                <div className="rounded-[28px] border border-white/70 bg-white/65 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.07)] backdrop-blur">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-black/95">
                      <img
                        src={livePhotoIcon}
                        alt="Sustenido live icon"
                        className="h-8 w-8 invert"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[goldenrod]">
                        Live workflow
                      </div>
                      <div className="mt-2 text-base font-black uppercase leading-tight">
                        Charts, calendar and collaborators in one practice desk.
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[goldenrod]">
                        Rehearsals
                      </div>
                      <div className="mt-2 text-sm leading-5 text-gray-600">
                        Plan sessions and update events without leaving the app.
                      </div>
                    </div>
                    <div className="rounded-[20px] bg-white px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[goldenrod]/15">
                          <img
                            src={userIcon}
                            alt="User profile icon"
                            className="h-5 w-5"
                          />
                        </div>
                        <div className="text-sm font-bold uppercase">
                          Friends and invites
                        </div>
                      </div>
                      <div className="mt-3 text-xs leading-5 text-gray-600">
                        Keep access, recovery and onboarding connected to the same backend flow.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="neuphormism-b flex max-h-full min-h-0 flex-col justify-center p-5 sm:p-6">
            <div className="rounded-[28px] bg-gradient-to-br from-white to-gray-100 px-5 py-5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.8)] sm:px-7 sm:py-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[goldenrod]">
                Account access
              </div>
              <div className="mt-3 text-2xl font-black uppercase sm:text-3xl">
                {subtitle}
              </div>
              <div className="mt-2 text-sm leading-6 text-gray-600">
                Use the same routes and actions already connected to the backend.
              </div>

              <div className="mt-6">{children}</div>
              <div className="mt-6 flex flex-wrap gap-4 border-t border-gray-200 pt-5 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
                <Link to="/login" className="hover:text-black">
                  Login
                </Link>
                <Link to="/newpassword" className="hover:text-black">
                  Forgot Password
                </Link>
                <Link to="/userregistration" className="hover:text-black">
                  Create Account
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
