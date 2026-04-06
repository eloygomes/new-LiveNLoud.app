import UserRegistrationForm from "./UserRegistrationForm";
import AuthShell from "../Auth/AuthShell";

function UserRegistration() {
  return (
    <AuthShell
      eyebrow="New Access"
      title="Create Account"
      subtitle="Build your profile"
      panelTitle="From first signup to first rehearsal."
      panelCopy="Create the account, keep your profile image defaulted, and enter the same workflow already used by the mobile experience."
    >
      <UserRegistrationForm />
    </AuthShell>
  );
}

export default UserRegistration;
