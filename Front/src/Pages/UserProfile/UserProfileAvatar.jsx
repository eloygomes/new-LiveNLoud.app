import { useEffect, useState } from "react";
import axios from "axios";

/* eslint-disable react/prop-types */
export default function UserProfileAvatar({ src, size, alt = "User Avatar" }) {
  const [imageSrc, setImageSrc] = useState(src);
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    async function fetchProfileImage() {
      if (!src && userEmail) {
        try {
          const imageResponse = await axios.get(
            `https://api.live.eloygomes.com.br/api/profileImage/${userEmail}`,
            {
              responseType: "blob",
            }
          );
          const imageBlob = imageResponse.data;
          const imageObjectURL = URL.createObjectURL(imageBlob);
          setImageSrc(imageObjectURL);
        } catch (error) {
          console.error("Erro ao buscar a imagem de perfil:", error);
        }
      }
    }

    fetchProfileImage();

    // Limpar o URL do objeto quando o componente for desmontado
    return () => {
      if (
        imageSrc &&
        typeof imageSrc === "string" &&
        imageSrc.startsWith("blob:")
      ) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src, userEmail]);

  console.log(imageSrc);

  return (
    <div className="flex items-center space-x-2 my-5">
      <img
        className={`object-cover neuphormism-b-avatar rounded-full`}
        alt={alt}
        src={imageSrc}
        style={{ width: `${size}px`, height: `${size}px` }} // Garantir que a largura e a altura sejam iguais
      />
    </div>
  );
}
