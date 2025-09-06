import { useEffect, useRef, useState } from "react";
import axios from "axios";
import userProfPic from "../../assets/userPerfil.jpg";

/* eslint-disable react/prop-types */
export default function UserProfileAvatarBig({
  src,
  size = 200,
  alt = "User Avatar",
  imageUpdated = 0, // novo: força recarregar quando muda
}) {
  const [imageSrc, setImageSrc] = useState(src || userProfPic);
  const objectUrlRef = useRef(null);
  const userEmail =
    typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
  const cacheKey =
    (typeof window !== "undefined" &&
      localStorage.getItem("avatarUpdatedAt")) ||
    "0";

  useEffect(() => {
    async function fetchProfileImage() {
      // Se o componente recebeu um src explícito, usa ele.
      if (src) {
        setImageSrc(src);
        return;
      }

      if (!userEmail) {
        setImageSrc(userProfPic);
        return;
      }

      try {
        // Adiciona cache-buster na URL para evitar cache do navegador
        const url = `https://api.live.eloygomes.com.br/api/profileImage/${encodeURIComponent(
          userEmail
        )}?_v=${cacheKey}-${imageUpdated}`;

        const imageResponse = await axios.get(url, {
          responseType: "blob",
          // header extra para desencorajar cache em alguns proxies
          headers: { "Cache-Control": "no-cache" },
        });

        // Revoga URL antigo (se houver) antes de criar um novo
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }

        const imageBlob = imageResponse.data;
        const imageObjectURL = URL.createObjectURL(imageBlob);
        objectUrlRef.current = imageObjectURL;
        setImageSrc(imageObjectURL);
      } catch (error) {
        setImageSrc(userProfPic);
        console.error("Erro ao buscar a imagem de perfil:", error);
      }
    }

    fetchProfileImage();

    // Cleanup ao desmontar
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    // Reexecuta quando trocar src, e-mail, versão de cache ou imageUpdated
  }, [src, userEmail, cacheKey, imageUpdated]);

  return (
    <div className="flex items-center space-x-2 my-5">
      <img
        key={`${cacheKey}-${imageUpdated}`} // força remount da imagem quando cacheKey muda
        className="object-cover neuphormism-b-avatar rounded-full"
        alt={alt}
        src={imageSrc}
        style={{ width: `${size}px`, height: `${size}px` }}
        draggable={false}
      />
    </div>
  );
}
