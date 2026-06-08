import { addAdminLog } from "../services/adminLogs.js";
import { deleteAllUserSongs, deleteUserSong } from "../services/songs.js";
import { getUserWithData } from "../services/users.js";

export function registerSongRoutes(app, { authenticateJWT, requireAdmin, requireTargetDb, proxyAdminDataApi }) {
  app.get("/api/users/:userId/songs", authenticateJWT, requireAdmin, proxyAdminDataApi);

  app.delete("/api/users/:userId/songs", authenticateJWT, requireAdmin, requireTargetDb, async (req, res) => {
    const reason = String(req.body?.reason || "").trim();
    if (!reason) return res.status(400).json({ message: "Motivo obrigatorio." });

    const result = await getUserWithData(req.params.userId);
    if (!result) return res.status(404).json({ message: "Usuario nao encontrado." });

    const deletion = await deleteAllUserSongs(result.authUser.email);
    await addAdminLog({
      req,
      action: "user_songs_delete_all",
      targetType: "song",
      targetUser: result.authUser,
      metadata: deletion,
      reason,
    });

    return res.json(deletion);
  });

  app.delete("/api/users/:userId/songs/:songKey", authenticateJWT, requireAdmin, requireTargetDb, async (req, res) => {
    const reason = String(req.body?.reason || "").trim();
    const [artist = "", song = ""] = decodeURIComponent(req.params.songKey || "").split("::");
    if (!artist || !song) return res.status(400).json({ message: "songKey invalido." });
    if (!reason) return res.status(400).json({ message: "Motivo obrigatorio." });

    const result = await getUserWithData(req.params.userId);
    if (!result) return res.status(404).json({ message: "Usuario nao encontrado." });

    const deletion = await deleteUserSong(result.authUser.email, artist, song);
    if (!deletion.deletedCount) return res.status(404).json({ message: "Musica nao encontrada." });

    await addAdminLog({
      req,
      action: "user_song_deleted",
      targetType: "song",
      targetUser: result.authUser,
      metadata: { artist, song, ...deletion },
      reason,
    });

    return res.json(deletion);
  });
}
