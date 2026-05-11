import { useState } from "react";
import {
  deleteAllUserSongs,
  deleteUserAccount,
  downloadUserData,
  logoutUser,
} from "../../../Tools/Controllers";
import DeleteAccountModal from "../../../Pages/UserProfile/DeleteAccountModal";

function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-black">{title}</h3>
        <p className="mt-3 text-sm text-gray-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserData() {
  const [deleteSongsOpen, setDeleteSongsOpen] = useState(false);
  const [deleteAccountConfirmOpen, setDeleteAccountConfirmOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [songsLoading, setSongsLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);

  const handleDeleteSongs = async () => {
    try {
      setSongsLoading(true);
      const result = await deleteAllUserSongs();
      alert(result?.message || "Songs deleted successfully.");
      setDeleteSongsOpen(false);
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete songs.",
      );
    } finally {
      setSongsLoading(false);
    }
  };

  const handleDeleteAccount = async (password) => {
    try {
      setAccountLoading(true);
      await deleteUserAccount({ password });
      alert("Sua conta foi deletada com sucesso.");
      logoutUser();
      window.location.href = "/login";
    } catch (error) {
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Erro ao deletar a conta.",
      );
    } finally {
      setAccountLoading(false);
      setDeleteAccountOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-col justify-start">
        <div className="mt-5 flex flex-row justify-between neuphormism-b">
          <div className="flex flex-col p-5">
            <h2 className="mb-2 text-md font-bold">User Data</h2>
            <div className="flex flex-col">
              <h2 className="text-[10pt]">All user data</h2>
              <h5 className="text-[8pt]">
                This downloads a JSON file with all information currently stored
                for your account.
              </h5>
            </div>
          </div>
          <div className="flex flex-1 flex-row justify-end truncate p-5 text-right text-sm">
            <button
              className="mx-2 border-2 p-2 py-5 neuphormism-b-btn"
              onClick={() => downloadUserData()}
            >
              Download
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-row justify-between neuphormism-b">
          <div className="flex flex-col p-5">
            <h2 className="mb-2 text-md font-bold">Platform User Data</h2>
            <div className="flex flex-col">
              <h2 className="text-[10pt]">Delete all songs</h2>
              <h5 className="text-[8pt]">
                This deletes all songs from your account and preserves only the
                base profile shell.
              </h5>
            </div>
          </div>
          <div className="flex flex-1 flex-row justify-end truncate p-5 text-right text-sm">
            <button
              className="mx-2 border-2 p-5 neuphormism-b-btn-red font-semibold text-white"
              onClick={() => setDeleteSongsOpen(true)}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-row justify-between neuphormism-b">
          <div className="flex flex-col p-5">
            <h2 className="mb-2 text-md font-bold">User Account</h2>
            <div className="flex flex-col">
              <h2 className="text-[10pt]">Delete user account</h2>
              <h5 className="text-[8pt]">
                This deletes your account and all related data across the
                platform. This cannot be undone.
              </h5>
            </div>
          </div>
          <div className="flex flex-1 flex-row justify-end truncate p-5 text-right text-sm">
            <button
              className="mx-2 border-2 p-5 neuphormism-b-btn-red font-semibold text-white"
              onClick={() => setDeleteAccountConfirmOpen(true)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteSongsOpen}
        title="Delete all songs"
        description="Are you sure you want to delete all songs from your account?"
        confirmLabel="Delete songs"
        onCancel={() => setDeleteSongsOpen(false)}
        onConfirm={handleDeleteSongs}
        loading={songsLoading}
      />

      <ConfirmModal
        isOpen={deleteAccountConfirmOpen}
        title="Delete account"
        description="Are you sure you want to continue to the final account deletion step? This will remove all your platform data."
        confirmLabel="Continue"
        onCancel={() => setDeleteAccountConfirmOpen(false)}
        onConfirm={() => {
          setDeleteAccountConfirmOpen(false);
          setDeleteAccountOpen(true);
        }}
      />

      <DeleteAccountModal
        isOpen={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        onSubmit={handleDeleteAccount}
      />
    </>
  );
}
