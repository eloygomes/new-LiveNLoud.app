/* eslint-disable react/prop-types */
export default function UserProfileAvatar({ src, size, alt = "User Avatar" }) {
  return (
    <div className="flex items-center space-x-2 my-5">
      <img
        className={`object-cover neuphormism-b-avatar rounded-full`}
        alt={alt}
        src={src}
        style={{ width: `${size}px`, height: `${size}px` }} // Garantir que a largura e a altura sejam iguais
      />
    </div>
  );
}
