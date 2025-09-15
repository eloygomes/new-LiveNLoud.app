// import { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import userProfPic from "../assets/userPerfil.jpg";

// /* eslint-disable react/prop-types */
// export default function UserProfileAvatar({ size = 40, alt = "User Avatar" }) {
//   const [imageSrc, setImageSrc] = useState(userProfPic);
//   const [cacheKey, setCacheKey] = useState(
//     (typeof window !== "undefined" &&
//       localStorage.getItem("avatarUpdatedAt")) ||
//       "0"
//   );
//   const objectUrlRef = useRef(null);

//   const fetchProfileImage = async (currentKey) => {
//     const userEmail =
//       typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;

//     if (!userEmail) {
//       setImageSrc(userProfPic);
//       return;
//     }

//     try {
//       const url = `https://api.live.eloygomes.com.br/api/profileImage/${encodeURIComponent(
//         userEmail
//       )}?_v=${currentKey}`;

//       const imageResponse = await axios.get(url, {
//         responseType: "blob",
//         headers: { "Cache-Control": "no-cache" },
//       });

//       if (imageResponse.status === 200) {
//         if (objectUrlRef.current) {
//           URL.revokeObjectURL(objectUrlRef.current);
//           objectUrlRef.current = null;
//         }
//         const imageBlob = imageResponse.data;
//         const imageObjectURL = URL.createObjectURL(imageBlob);
//         objectUrlRef.current = imageObjectURL;
//         setImageSrc(imageObjectURL);
//       } else {
//         setImageSrc(userProfPic);
//       }
//     } catch (error) {
//       if (error.response?.status !== 404) {
//         console.error("Erro ao buscar a imagem de perfil:", error);
//       }
//       setImageSrc(userProfPic);
//     }
//   };

//   useEffect(() => {
//     fetchProfileImage(cacheKey);

//     return () => {
//       if (objectUrlRef.current) {
//         URL.revokeObjectURL(objectUrlRef.current);
//         objectUrlRef.current = null;
//       }
//     };
//   }, [cacheKey]);

//   // Observa mudanças no localStorage (entre abas e mesmo tab)
//   useEffect(() => {
//     const onStorage = (e) => {
//       if (e.key === "avatarUpdatedAt") {
//         setCacheKey(e.newValue || "0");
//       }
//     };
//     window.addEventListener("storage", onStorage);

//     const interval = setInterval(() => {
//       const newKey = localStorage.getItem("avatarUpdatedAt") || "0";
//       if (newKey !== cacheKey) {
//         setCacheKey(newKey);
//       }
//     }, 1000);

//     return () => {
//       window.removeEventListener("storage", onStorage);
//       clearInterval(interval);
//     };
//   }, [cacheKey]);

//   return (
//     <div className="flex items-center space-x-2 my-0 w-[40px]">
//       <img
//         key={cacheKey}
//         className="object-cover neuphormism-b-avatar rounded-full relative"
//         alt={alt}
//         src={imageSrc}
//         style={{ width: `${size}px`, height: `${size}px` }}
//         onError={() => setImageSrc(userProfPic)}
//         draggable={false}
//       />
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
import userProfPic from "../assets/userPerfil.jpg";
import {
  getProfileImageObjectURL,
  revokeObjectURLSafe,
} from "../Tools/Controllers";

/* eslint-disable react/prop-types */
export default function UserProfileAvatar({ size = 40, alt = "User Avatar" }) {
  const [imageSrc, setImageSrc] = useState(userProfPic);

  // cacheKey vem do localStorage para bust de cache quando o avatar muda
  const [cacheKey, setCacheKey] = useState(
    (typeof window !== "undefined" &&
      localStorage.getItem("avatarUpdatedAt")) ||
      "0"
  );

  // guarda o último ObjectURL para revogar quando trocar
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const objectUrl = await getProfileImageObjectURL(cacheKey);

      if (cancelled) return;

      if (objectUrl) {
        // libera o anterior antes de setar o novo
        if (objectUrlRef.current) {
          revokeObjectURLSafe(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        objectUrlRef.current = objectUrl;
        setImageSrc(objectUrl);
      } else {
        // sem imagem ou erro => fallback
        setImageSrc(userProfPic);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  // Observa mudanças do localStorage (outras abas) e também no mesmo tab
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "avatarUpdatedAt") {
        setCacheKey(e.newValue || "0");
      }
    };
    window.addEventListener("storage", onStorage);

    const interval = setInterval(() => {
      const newKey = localStorage.getItem("avatarUpdatedAt") || "0";
      if (newKey !== cacheKey) {
        setCacheKey(newKey);
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, [cacheKey]);

  // Cleanup do ObjectURL quando o componente desmontar
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        revokeObjectURLSafe(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex items-center space-x-2 my-0 w-[40px]">
      <img
        key={cacheKey}
        className="object-cover neuphormism-b-avatar rounded-full relative"
        alt={alt}
        src={imageSrc}
        style={{ width: `${size}px`, height: `${size}px` }}
        onError={() => setImageSrc(userProfPic)}
        draggable={false}
      />
    </div>
  );
}
