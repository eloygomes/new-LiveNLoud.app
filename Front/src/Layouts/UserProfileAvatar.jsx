import { useEffect, useState } from "react";
import axios from "axios";

/* eslint-disable react/prop-types */
export default function UserProfileAvatar({ size = 40, alt = "User Avatar" }) {
  const [imageSrc, setImageSrc] = useState("/src/assets/userPerfil.jpg"); // Imagem padrão
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    console.log("useEffect chamado");
    console.log("userEmail:", userEmail);

    async function fetchProfileImage() {
      if (userEmail) {
        console.log("Buscando imagem de perfil do servidor...");
        try {
          const imageResponse = await axios.get(
            `https://api.live.eloygomes.com.br/api/profileImage/${encodeURIComponent(
              userEmail
            )}`,
            {
              responseType: "blob",
            }
          );
          console.log("Resposta da API:", imageResponse);

          if (imageResponse.status === 200) {
            const imageBlob = imageResponse.data;
            const imageObjectURL = URL.createObjectURL(imageBlob);
            console.log("URL da imagem criada:", imageObjectURL);
            setImageSrc(imageObjectURL);
          } else {
            console.warn("Status da resposta não é 200:", imageResponse.status);
          }
        } catch (error) {
          console.error("Erro ao buscar a imagem de perfil:", error);
        }
      } else {
        console.warn("userEmail não está disponível.");
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
        console.log("Revogando URL da imagem:", imageSrc);
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [userEmail]); // Removemos 'src' das dependências

  console.log("imageSrc atual:", imageSrc);

  size = 40;

  return (
    <div className="flex items-center space-x-2 my-0">
      <img
        className={`object-cover neuphormism-b-avatar rounded-full`}
        alt={alt}
        src={imageSrc}
        style={{ width: `${size}px`, height: `${size}px` }} // Garantir que a largura e a altura sejam iguais
        onError={(e) => {
          console.error("Erro ao carregar a imagem:", e);
          setImageSrc("/src/assets/userPerfil.jpg"); // Definir imagem padrão em caso de erro
        }}
      />
    </div>
  );
}
