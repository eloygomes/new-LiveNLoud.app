import { useEffect, useRef, useState } from "react";
import userProfPic from "../../assets/userPerfil.jpg";
import { getProfileImageObjectURL } from "../../Tools/Controllers";

/* eslint-disable react/prop-types */
export default function UserProfileAvatarBig({
  src,
  size = 200,
  alt = "User Avatar",
  imageUpdated = 0,
}) {
  const [imageSrc, setImageSrc] = useState(src || userProfPic);
  const objectUrlRef = useRef(null);

  const cacheKey =
    (typeof window !== "undefined" &&
      localStorage.getItem("avatarUpdatedAt")) ||
    "0";

  useEffect(() => {
    async function loadImage() {
      // se veio src explícito, usa ele
      if (src) {
        setImageSrc(src);
        return;
      }

      // busca do backend com cache-buster
      const objUrl = await getProfileImageObjectURL(
        `${cacheKey}-${imageUpdated}`
      );

      if (objUrl) {
        // limpa URL anterior
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        objectUrlRef.current = objUrl;
        setImageSrc(objUrl);
      } else {
        setImageSrc(userProfPic);
      }
    }

    loadImage();

    // cleanup ao desmontar/trocar key
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [src, cacheKey, imageUpdated]); // não precisa do userEmail aqui

  return (
    <div
      className="w-[200px] aspect-square rounded-full overflow-hidden"
      style={{ width: `${size}px` }}
    >
      <img
        key={`${cacheKey}-${imageUpdated}`}
        className="w-full h-full object-cover"
        alt={alt}
        src={imageSrc}
        draggable={false}
      />
    </div>
  );
}
